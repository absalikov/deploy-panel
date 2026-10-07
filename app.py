"""Deploy panel for prod-nue.

Thin web UI over the `deploy` / `deploy-info` commands. Runs as the unprivileged
`deploypanel` user; the only root actions it can take are those two commands
(narrow sudoers rule), which validate their own arguments.
"""
import asyncio
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import shutil
import time
from collections import deque
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

USERS_FILE = Path(os.getenv("PANEL_USERS", "/etc/deploypanel/users.json"))
HISTORY_FILE = Path("/var/log/deploy-history.jsonl")
STATIC = Path(__file__).parent / "static"
SESSION_TTL = 12 * 3600
SECURE_COOKIE = os.getenv("PANEL_SECURE_COOKIE", "0") == "1"
PROJECT_RE = re.compile(r"^[a-z0-9-]+$")
REF_RE = re.compile(r"^[A-Za-z0-9/._-]{1,100}$")

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
sessions: dict[str, dict] = {}          # token -> {user, exp}
failed_logins: dict[str, list[float]] = {}
jobs: dict[str, dict] = {}              # job id -> {project, lines, done, result, listeners, ...}
status_cache: dict[str, dict] = {}


# ---------------------------------------------------------------- helpers
async def run(*args: str, timeout: float = 60) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
    )
    try:
        out, _ = await asyncio.wait_for(proc.communicate(), timeout)
    except asyncio.TimeoutError:
        proc.kill()
        return 124, "timeout"
    return proc.returncode, out.decode("utf-8", "replace")


async def info(*args: str, timeout: float = 60) -> tuple[int, str]:
    return await run("sudo", "-n", "/usr/local/bin/deploy-info", *args, timeout=timeout)


_known: dict = {"ids": [], "at": 0.0}


async def known_projects() -> list[str]:
    # /etc/deploy is root-only, so the project list comes from deploy-info
    if time.time() - _known["at"] > 60:
        code, out = await info("list")
        if code == 0:
            _known["ids"], _known["at"] = json.loads(out), time.time()
    return _known["ids"]


async def check_project(p: str) -> str:
    if not PROJECT_RE.match(p) or p not in await known_projects():
        raise HTTPException(404, "unknown project")
    return p


def verify_password(stored: str, password: str) -> bool:
    # format: scrypt$n$r$p$salt_hex$hash_hex
    try:
        _, n, r, p, salt, digest = stored.split("$")
        calc = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=int(n), r=int(r), p=int(p), dklen=32)
        return hmac.compare_digest(calc.hex(), digest)
    except Exception:
        return False


def current_user(request: Request) -> str:
    tok = request.cookies.get("dp_session", "")
    s = sessions.get(tok)
    if not s or s["exp"] < time.time():
        sessions.pop(tok, None)
        raise HTTPException(401, "login required")
    return s["user"]


def mutation_guard(request: Request) -> str:
    # SameSite=Strict cookie + custom header → no cross-site form posts
    if request.headers.get("x-panel") != "1":
        raise HTTPException(403, "bad request origin")
    return current_user(request)


def read_history(project: str | None = None, limit: int = 50) -> list[dict]:
    if not HISTORY_FILE.exists():
        return []
    rows = []
    for line in HISTORY_FILE.read_text("utf-8", "replace").splitlines()[-2000:]:
        try:
            row = json.loads(line)
        except ValueError:
            continue
        if project is None or row.get("project") == project:
            rows.append(row)
    return rows[-limit:][::-1]


# ---------------------------------------------------------------- auth
@app.post("/api/login")
async def login(request: Request, response: Response):
    body = await request.json()
    user, pw = str(body.get("username", ""))[:64], str(body.get("password", ""))[:256]
    now = time.time()
    fails = [t for t in failed_logins.get(user, []) if now - t < 600]
    if len(fails) >= 5:
        raise HTTPException(429, "Слишком много попыток, подождите 10 минут")
    users = json.loads(USERS_FILE.read_text()) if USERS_FILE.exists() else {}
    if user not in users or not verify_password(users[user], pw):
        failed_logins[user] = fails + [now]
        await asyncio.sleep(1)
        raise HTTPException(401, "Неверный логин или пароль")
    failed_logins.pop(user, None)
    tok = secrets.token_urlsafe(32)
    sessions[tok] = {"user": user, "exp": now + SESSION_TTL}
    response.set_cookie("dp_session", tok, max_age=SESSION_TTL, httponly=True, samesite="strict", secure=SECURE_COOKIE)
    return {"user": user}


@app.post("/api/logout")
async def logout(request: Request, response: Response):
    sessions.pop(request.cookies.get("dp_session", ""), None)
    response.delete_cookie("dp_session")
    return {"ok": True}


@app.get("/api/me")
async def me(request: Request):
    return {"user": current_user(request)}


# ---------------------------------------------------------------- data
@app.get("/api/system")
async def system(request: Request):
    current_user(request)
    load = os.getloadavg()
    mem = {}
    for line in Path("/proc/meminfo").read_text().splitlines():
        k, v = line.split(":", 1)
        mem[k] = int(v.split()[0]) * 1024
    du = shutil.disk_usage("/")
    uptime = float(Path("/proc/uptime").read_text().split()[0])
    return {
        "host": os.uname().nodename,
        "cpus": os.cpu_count(),
        "load": load,
        "mem_total": mem["MemTotal"], "mem_used": mem["MemTotal"] - mem["MemAvailable"],
        "disk_total": du.total, "disk_used": du.used,
        "uptime": uptime,
    }


async def project_status(p: str, fetch: bool) -> dict:
    code, out = await info(p, "status", *(["--fetch"] if fetch else []), timeout=40)
    try:
        data = json.loads(out)
    except ValueError:
        data = {"id": p, "title": p, "error": out[-500:]}
    running = next((j for j in jobs.values() if j["project"] == p and not j["done"]), None)
    data["job"] = running["id"] if running else None
    data["metrics"] = list(metrics.get(p, ()))
    status_cache[p] = data
    return data


# ---------------------------------------------------------------- resource history
# one sample per minute per service, 2 hours kept in memory: [ts, cpu % of one core, memory bytes]
METRICS_FILE = Path(os.getenv("PANEL_METRICS", "/opt/deploypanel/metrics.json"))
metrics: dict[str, deque] = {}
_last_cpu: dict[str, tuple[float, int]] = {}


def load_metrics():
    try:
        for p, rows in json.loads(METRICS_FILE.read_text()).items():
            metrics[p] = deque([r for r in rows if r[0] > time.time() - 7200], maxlen=120)
    except (OSError, ValueError):
        pass


def save_metrics():
    tmp = METRICS_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps({p: list(d) for p, d in metrics.items()}))
    tmp.replace(METRICS_FILE)


async def sample_once():
    code, out = await info("metrics", timeout=30)
    try:
        all_states = json.loads(out)
    except ValueError:
        return
    for p, st in all_states.items():
        now, cpu_ns = time.time(), int(st.get("cpu_ns") or 0)
        prev = _last_cpu.get(p)
        _last_cpu[p] = (now, cpu_ns)
        if not prev or cpu_ns < prev[1] or st.get("active") != "active":
            continue  # first sample or the service restarted: no valid delta yet
        cpu = (cpu_ns - prev[1]) / 1e9 / max(1.0, now - prev[0]) * 100
        metrics.setdefault(p, deque(maxlen=120)).append([round(now), round(cpu, 2), int(st.get("memory") or 0)])


async def sampler():
    while True:
        try:
            await sample_once()
            save_metrics()
        except Exception:
            pass
        await asyncio.sleep(60)


@app.on_event("startup")
async def start_sampler():
    load_metrics()
    asyncio.create_task(sampler())


@app.get("/api/projects")
async def projects(request: Request, fetch: int = 0):
    current_user(request)
    code, out = await info("list")
    ids = json.loads(out) if code == 0 else []
    order = ["exchange", "trxbot", "upbot", "tonwexcc", "fitness", "timeapp", "apisum"]
    ids.sort(key=lambda x: order.index(x) if x in order else 99)
    return await asyncio.gather(*(project_status(p, bool(fetch)) for p in ids))


@app.get("/api/projects/{p}")
async def project(p: str, request: Request, fetch: int = 0):
    current_user(request)
    data = await project_status(await check_project(p), bool(fetch))
    data["history"] = read_history(p, 30)
    return data


@app.get("/api/projects/{p}/diff")
async def diff(p: str, request: Request, ref: str = "origin/main"):
    current_user(request)
    await check_project(p)
    if not REF_RE.match(ref):
        raise HTTPException(400, "bad ref")
    code, out = await info(p, "diff", ref)
    stat, _, patch = out.partition("@@@PATCH@@@\n")
    return {"stat": stat, "patch": patch, "truncated": len(patch) >= 400000}


@app.get("/api/projects/{p}/logs")
async def logs(p: str, request: Request, n: int = 150):
    current_user(request)
    code, out = await info(await check_project(p), "logs", str(max(10, min(n, 1000))))
    return {"lines": out.splitlines()}


@app.post("/api/projects/{p}/restart")
async def restart(p: str, request: Request):
    mutation_guard(request)
    code, out = await info(await check_project(p), "restart", timeout=60)
    return {"ok": code == 0 and out.strip().endswith("active"), "output": out.strip()}


@app.get("/api/history")
async def history(request: Request, limit: int = 50):
    current_user(request)
    return read_history(None, max(1, min(limit, 500)))


# ---------------------------------------------------------------- security (fail2ban + nginx limits)
async def sec(*args: str) -> dict:
    code, out = await run("sudo", "-n", "/usr/local/bin/security-info", *args, timeout=30)
    try:
        return json.loads(out)
    except ValueError:
        raise HTTPException(500, out[-300:] or "security-info failed")


def check_ip(ip: str) -> str:
    try:
        return str(ipaddress.ip_address(str(ip).strip()))
    except ValueError:
        raise HTTPException(400, "Некорректный IP")


@app.get("/api/security")
async def security(request: Request):
    current_user(request)
    return await sec("status")


@app.post("/api/security/{action}")
async def security_action(action: str, request: Request):
    mutation_guard(request)
    if action not in ("ban", "unban"):
        raise HTTPException(404, "unknown action")
    body = await request.json()
    r = await sec(action, check_ip(body.get("ip", "")))
    if not r.get("ok"):
        raise HTTPException(400, r.get("error") or "Не получилось")
    return r


# ---------------------------------------------------------------- deploy jobs
async def run_job(job: dict, args: list[str]):
    proc = await asyncio.create_subprocess_exec(
        "sudo", "-n", "/usr/local/bin/deploy", *args,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
    )
    assert proc.stdout
    async for raw in proc.stdout:
        line = re.sub(r"\x1b\[[0-9;]*m", "", raw.decode("utf-8", "replace").rstrip("\n"))
        job["lines"].append(line)
        for q in list(job["listeners"]):
            q.put_nowait(line)
    rc = await proc.wait()
    job["done"], job["rc"], job["finished"] = True, rc, time.time()
    text = "\n".join(job["lines"])
    job["result"] = ("success" if "✅ deploy" in text else "uptodate" if "already at" in text else "ok") if rc == 0 \
        else ("rolled_back" if "rolled back" in text else "failed")
    for q in list(job["listeners"]):
        q.put_nowait(None)


@app.post("/api/projects/{p}/deploy")
async def deploy(p: str, request: Request):
    user = mutation_guard(request)
    await check_project(p)
    body = await request.json() if request.headers.get("content-length") not in (None, "0") else {}
    if any(j["project"] == p and not j["done"] for j in jobs.values()):
        raise HTTPException(409, "Деплой этого проекта уже идёт")
    args = [p, "--by", user]
    ref = body.get("ref")
    if ref:
        if not REF_RE.match(ref):
            raise HTTPException(400, "bad ref")
        args += ["--ref", ref]
    if body.get("force"):
        args.append("--force")
    jid = secrets.token_hex(6)
    job = {"id": jid, "project": p, "user": user, "ref": ref or "origin/main", "started": time.time(),
           "lines": [], "listeners": set(), "done": False, "rc": None, "result": None}
    jobs[jid] = job
    # keep the last 50 jobs only
    for old in sorted(jobs.values(), key=lambda j: j["started"])[:-50]:
        if old["done"]:
            jobs.pop(old["id"], None)
    asyncio.create_task(run_job(job, args))
    return {"job": jid}


@app.get("/api/jobs/{jid}")
async def job_state(jid: str, request: Request):
    current_user(request)
    job = jobs.get(jid) or {}
    if not job:
        raise HTTPException(404, "no such job")
    return {k: job[k] for k in ("id", "project", "user", "ref", "started", "done", "rc", "result")} | {"lines": job["lines"]}


@app.get("/api/jobs/{jid}/stream")
async def job_stream(jid: str, request: Request):
    current_user(request)
    job = jobs.get(jid)
    if not job:
        raise HTTPException(404, "no such job")
    q: asyncio.Queue = asyncio.Queue()
    backlog = list(job["lines"])
    if not job["done"]:
        job["listeners"].add(q)

    async def gen():
        try:
            for line in backlog:
                yield f"data: {json.dumps(line)}\n\n"
            if job["done"]:
                yield f"event: done\ndata: {json.dumps(job['result'])}\n\n"
                return
            while True:
                try:
                    line = await asyncio.wait_for(q.get(), 15)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
                    continue
                if line is None:
                    yield f"event: done\ndata: {json.dumps(job['result'])}\n\n"
                    return
                yield f"data: {json.dumps(line)}\n\n"
        finally:
            job["listeners"].discard(q)

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})


# ---------------------------------------------------------------- static
@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "no-referrer"
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"
    )
    if request.url.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
async def index():
    return FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})
