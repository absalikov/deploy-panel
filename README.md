# Deploy panel (prod-nue)

Web panel for deploying projects on the netcup server: project list, deploy/rollback,
logs, metrics, security (fail2ban bans). FastAPI + vanilla JS, no build step.

| Path | What | Installed to |
|---|---|---|
| `app.py`, `static/` | the panel (runs as user `deploypanel`, 127.0.0.1:9100, via SSH tunnel) | `/opt/deploypanel/app` (this repo) |
| `server/bin/deploy` | pull → build → migrate → restart → health check → rollback | `/usr/local/bin/` |
| `server/bin/deploy-info` | read-only status/metrics/logs for the panel | `/usr/local/bin/` |
| `server/bin/security-info` | fail2ban status / ban / unban | `/usr/local/bin/` |
| `server/bin/pg-local-dump` | 30-min and pre-migration PostgreSQL dumps (48 h) | `/usr/local/bin/` |
| `server/bin/deploypanel-passwd` | set a panel login | `/usr/local/bin/` |
| `server/systemd/`, `server/sudoers/` | panel service and its sudo rights | `/etc/systemd/system/`, `/etc/sudoers.d/` |

## Workflow

1. Edit, `git commit`, `git push` to `main`.
2. In the panel press **«Выложить»** on the «Deploy panel» card (or `sudo deploy deploypanel`).

Deploy restarts the panel (the page reconnects in a few seconds). If anything under
`server/` changed, `server/install.sh` syntax-checks every file and installs only the changed
ones. If the panel doesn't come back up, deploy rolls back to the previous commit,
including the server tools.

Per-project settings live on the server in `/etc/deploy/<project>.conf` (not in this repo).

## Rules

- `deploy` deploys itself: keep it working. Test changes to it on a quiet project first
  (`sudo deploy apisum --force`).
- The panel may only run `deploy`, `deploy-info`, `security-info` as root (see sudoers);
  anything new it needs must be added there explicitly, with argument validation.
- No secrets in this repo: logins are in `/etc/deploypanel/users.json` on the server.
