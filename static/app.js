'use strict';
/* Deploy panel — vanilla JS, no build step. */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TZ = 'Asia/Tbilisi';

/* ---------------- icons ---------------- */
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ic = {
  rocket: I('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'),
  refresh: I('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  chevR: I('<path d="m9 18 6-6-6-6"/>'),
  bot: I('<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 14h.01M16 14h.01M9 18h6"/>'),
  globe: I('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/>'),
  hook: I('<path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>'),
  phone: I('<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 18h.01"/>'),
  restart: I('<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'),
  ext: I('<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: I('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>'),
  logout: I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
  code: I('<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>'),
  github: I('<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>'),
  check: I('<path d="M20 6 9 17l-5-5"/>'),
  shield: I('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'),
  alert: I('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>'),
  info: I('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
  more: I('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
  clock: I('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  cpu: I('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>'),
  commit: I('<circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6"/>'),
  branch: I('<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),
  history: I('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>'),
  terminal: I('<path d="m4 17 6-6-6-6M12 19h8"/>'),
  layers: I('<path d="m12.83 2.18 8.58 3.9a1 1 0 0 1 0 1.83l-8.58 3.9a2 2 0 0 1-1.66 0L2.6 7.91a1 1 0 0 1 0-1.83l8.58-3.9a2 2 0 0 1 1.66 0Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'),
  undo: I('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>'),
  heart: I('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
  zap: I('<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>'),
};
const kindIcon = (k) => ({ bot: ic.bot, web: ic.globe, webhook: ic.hook, app: ic.phone }[k] || ic.code);
const kindName = (k) => ({ bot: 'Telegram-бот', web: 'Веб-сайт', webhook: 'Вебхук', app: 'Mini App + API' }[k] || 'Сервис');

/* ---------------- formatting ---------------- */
const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
function ago(tsSec) {
  if (!tsSec) return '—';
  const d = Date.now() / 1000 - tsSec;
  if (d < 45) return 'только что';
  const u = [[3600, 'minute', 60], [86400, 'hour', 3600], [2592000, 'day', 86400], [31536000, 'month', 2592000], [Infinity, 'year', 31536000]];
  for (const [lim, unit, div] of u) if (d < lim) return rtf.format(-Math.max(1, Math.floor(d / div)), unit);
}
const isoSec = (iso) => (iso ? Date.parse(iso) / 1000 : 0);
const fmtDate = (s) => new Intl.DateTimeFormat('ru', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(s * 1000);
function bytes(n, dec) { if (!n) return '—'; const u = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']; let i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return `${n.toFixed(dec ?? (n < 10 && i ? 1 : 0))} ${u[i]}`; }
function dur(sec) {
  if (!sec || sec < 0) return '—';
  const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
  return d ? `${d} д ${h} ч` : h ? `${h} ч ${m} мин` : `${Math.max(1, m)} мин`;
}
const plural = (n, a, b, c) => { const x = n % 10, y = n % 100; return x === 1 && y !== 11 ? a : x >= 2 && x <= 4 && (y < 12 || y > 14) ? b : c; };
const commits = (n) => `${n} ${plural(n, 'коммит', 'коммита', 'коммитов')}`;
const initials = (name) => (name || '?').trim().slice(0, 2).toUpperCase();
const level = (pct) => (pct > 90 ? 'bad' : pct > 75 ? 'warn' : '');

function statusOf(p) {
  const s = p.state || {};
  if (p.job) return { cls: 'warn', text: 'Идёт деплой' };
  if (s.active === 'active') return { cls: 'ok', text: 'Работает' };
  if (s.active === 'activating' || s.sub === 'auto-restart') return { cls: 'warn', text: 'Перезапуск' };
  if (s.active === 'failed') return { cls: 'bad', text: 'Упал' };
  return { cls: 'bad', text: s.active ? 'Остановлен' : 'Нет данных' };
}

/* ---------------- api ---------------- */
async function api(path, opts = {}) {
  const init = { credentials: 'same-origin', headers: { 'x-panel': '1' } };
  if (opts.json !== undefined) { init.method = 'POST'; init.body = JSON.stringify(opts.json); init.headers['content-type'] = 'application/json'; }
  const r = await fetch(path, init);
  if (r.status === 401 && !path.endsWith('/login')) { showLogin(); throw new Error('login'); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || `Ошибка ${r.status}`);
  return data;
}

/* ---------------- ui helpers ---------------- */
function toast(msg, kind = 'ok') {
  const t = document.createElement('div');
  t.className = `toast ${kind}`; t.innerHTML = `${kind === 'bad' ? ic.alert : ic.check}<span>${esc(msg)}</span>`;
  $('#toasts').append(t); setTimeout(() => t.remove(), 4500);
}
function theme(set) {
  const cur = set || localStorage.getItem('dp-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = cur;
  $('meta[name="theme-color"]').content = cur === 'light' ? '#f7f7f9' : '#09090b';
  if (set) localStorage.setItem('dp-theme', set);
}
function nav(right = '') {
  const t = document.documentElement.dataset.theme;
  return `<header class="nav"><div class="in">
    <a class="brand" href="#/"><span class="logo">${ic.rocket}</span><span class="hide-sm">Деплой</span></a>
    <span class="slash hide-sm">/</span><span class="server-chip"><span class="dot ok"></span>${esc(state.host || 'prod-nue')}</span>
    <nav class="navlinks"><a href="#/" class="${route().view !== 'security' ? 'on' : ''}">${ic.layers}<span>Проекты</span></a><a href="#/security" class="${route().view === 'security' ? 'on' : ''}">${ic.shield}<span>Защита</span></a></nav>
    <span class="spacer"></span>${right}
    <button class="btn ghost icon" id="themeBtn" title="Тема">${t === 'light' ? ic.moon : ic.sun}</button>
    <div class="menu-wrap"><button class="avatar" id="meBtn" title="${esc(state.user || '')}">${esc(initials(state.user))}</button></div>
  </div></header>`;
}
function bindNav() {
  $('#themeBtn').onclick = () => { theme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'); render(); };
  $('#meBtn').onclick = (e) => menu(e.currentTarget.parentElement, [
    { icon: ic.logout, t: 'Выйти', d: `Вы вошли как ${state.user}`, fn: async () => { await api('/api/logout', { json: {} }).catch(() => {}); showLogin(); } },
  ]);
}
function menu(anchor, items) {
  document.querySelectorAll('.menu').forEach((m) => m.remove());
  const m = document.createElement('div'); m.className = 'menu';
  m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : it.href
    ? `<a href="${esc(it.href)}" target="_blank" rel="noopener">${it.icon}<div><div class="mt">${esc(it.t)}</div>${it.d ? `<div class="md">${esc(it.d)}</div>` : ''}</div></a>`
    : `<button data-i="${i}">${it.icon}<div><div class="mt">${esc(it.t)}</div>${it.d ? `<div class="md">${esc(it.d)}</div>` : ''}</div></button>`).join('');
  anchor.append(m);
  m.querySelectorAll('button[data-i]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); m.remove(); items[+b.dataset.i].fn(); }));
  setTimeout(() => document.addEventListener('click', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', off); } }), 0);
}
function openSheet(html, { onClose } = {}) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); onClose && onClose(); };
  document.addEventListener('keydown', onKey);
  $('.overlay', root).addEventListener('click', (e) => { if (e.target.classList.contains('overlay')) close(); });
  $$('[data-close]', root).forEach((b) => (b.onclick = close));
  return { root: $('.sheet', root), close };
}
const ring = (pct, cls) => {
  const C = 2 * Math.PI * 26, v = Math.max(0, Math.min(100, pct));
  return `<div class="ring ${cls}"><svg viewBox="0 0 64 64"><circle class="track" cx="32" cy="32" r="26"/><circle class="val" cx="32" cy="32" r="26" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - v / 100)}"/></svg><div class="pct">${Math.round(v)}%</div></div>`;
};

/* ---------------- charts ---------------- */
// area sparkline in a 100×H viewBox; values scaled to [min(0), max*1.15]
function spark(vals, H = 34, autoRange = false) {
  if (vals.length < 2) return '';
  let lo = 0, hi = Math.max(...vals) * 1.15 || 1;
  if (autoRange) {  // show the variation, not the distance from zero
    const mn = Math.min(...vals), mx = Math.max(...vals), pad = Math.max((mx - mn) * 0.35, mx * 0.02, 1);
    lo = Math.max(0, mn - pad); hi = mx + pad;
  }
  const n = vals.length - 1;
  const pts = vals.map((v, i) => [(i / n) * 100, H - ((v - lo) / (hi - lo)) * (H - 3) - 1.5]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('');
  return `<svg viewBox="0 0 100 ${H}" preserveAspectRatio="none"><path class="spark-area" d="${line}L100,${H}L0,${H}Z"/><path class="spark-line" d="${line}"/></svg>`;
}
const cpuFmt = (v) => (v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v)) + '%';
function minis(p) {
  const m = p.metrics || [], s = p.state || {};
  const cpu = m.map((r) => r[1]), mem = m.map((r) => r[2]);
  const empty = '<div class="spark-empty">сбор данных…</div>';
  return `<div class="minis">
    <div class="mini cpu"><div class="top"><span>CPU · 2 ч</span><b>${cpu.length ? cpuFmt(cpu[cpu.length - 1]) : '—'}</b></div>${spark(cpu) || empty}</div>
    <div class="mini mem"><div class="top"><span>Память · 2 ч</span><b>${bytes(s.memory)}</b></div>${spark(mem, 34, true) || empty}</div>
  </div>`;
}
function sslInfo(p) {
  if (!p.ssl_expires) return null;
  const days = Math.floor((p.ssl_expires - Date.now() / 1000) / 86400);
  return { days, cls: days < 3 ? 'bad' : days < 14 ? 'warn' : 'ok' };
}
function backupInfo(p) {
  const b = p.backups || [];
  if (!b.length) return null;
  const failed = b.filter((x) => x.result && x.result !== 'success');
  const last = Math.max(0, ...b.map((x) => x.last || 0));
  return { failed, last, cls: failed.length ? 'bad' : !last || Date.now() / 1000 - last > 36 * 3600 ? 'warn' : 'ok' };
}
function chips(p) {
  const out = [], ssl = sslInfo(p), bk = backupInfo(p);
  if (ssl) out.push(`<span class="chip ${ssl.cls}" title="SSL-сертификат">${ic.shield}SSL ${ssl.days} дн</span>`);
  if (bk) out.push(`<span class="chip ${bk.cls}" title="Последний бэкап">${ic.layers}${bk.failed.length ? 'бэкап: ошибка' : `бэкап ${bk.last ? ago(bk.last) : '—'}`}</span>`);
  else out.push(`<span class="chip" title="Для этого проекта бэкап не настроен">${ic.layers}без бэкапа</span>`);
  return `<div class="chips">${out.join('')}</div>`;
}
function bigChart(title, icon, vals, fmt, cls, sub, autoRange = false) {
  const last = vals.length ? vals[vals.length - 1] : null;
  const peak = vals.length ? Math.max(...vals) : null;
  return `<div class="panel chart ${cls}"><div class="top"><span class="ttl">${icon}${title}</span><span class="sub">пик ${peak == null ? '—' : fmt(peak)}</span></div>
    <div class="now">${last == null ? '—' : fmt(last)}</div><div class="sub">${sub}</div>
    ${vals.length > 1 ? spark(vals, 60, autoRange).replace('<svg', '<svg class="big"') : '<div class="spark-empty" style="height:86px">История появится через пару минут</div>'}
    <div class="axis"><span>${vals.length > 1 ? `${Math.round(vals.length)} мин назад` : ''}</span><span>сейчас</span></div></div>`;
}
function maintenance(p) {
  const rows = [], ssl = sslInfo(p), s = p.state || {};
  if (p.domain) rows.push(ssl
    ? `<div class="mrow"><div class="ic ${ssl.cls}">${ic.shield}</div><div class="grow"><div class="t">SSL действует ${ssl.days} ${plural(ssl.days, 'день', 'дня', 'дней')}</div><div class="d">до ${fmtDate(p.ssl_expires)} · продлевается автоматически</div></div></div>`
    : `<div class="mrow"><div class="ic warn">${ic.shield}</div><div class="grow"><div class="t">Сертификат не найден</div><div class="d">${esc(p.domain)}</div></div></div>`);
  (p.backups || []).forEach((b) => {
    const ok = b.result === 'success', cls = !ok ? 'bad' : !b.last || Date.now() / 1000 - b.last > 36 * 3600 ? 'warn' : 'ok';
    rows.push(`<div class="mrow"><div class="ic ${cls}">${ic.layers}</div><div class="grow"><div class="t">${esc(/files/.test(b.unit) ? 'Бэкап файлов' : 'Бэкап базы')}: ${ok ? (b.last ? ago(b.last) : 'ещё не было') : 'ошибка'}</div>
      <div class="d">${b.next ? `следующий ${fmtDate(b.next)}` : 'расписание не найдено'} · в Telegram</div></div></div>`);
  });
  if (!(p.backups || []).length) rows.push(`<div class="mrow"><div class="ic">${ic.layers}</div><div class="grow"><div class="t">Бэкап не настроен</div><div class="d">данных в базе нет или они не критичны</div></div></div>`);
  rows.push(`<div class="mrow"><div class="ic ${s.restarts ? 'warn' : 'ok'}">${ic.restart}</div><div class="grow"><div class="t">${s.restarts ? `${s.restarts} ${plural(s.restarts, 'падение', 'падения', 'падений')} с запуска` : 'Без падений'}</div><div class="d">служба работает ${s.since ? dur(Date.now() / 1000 - s.since) : '—'}</div></div></div>`);
  return `<div class="panel maint"><h4>${ic.heart}Обслуживание</h4>${rows.join('')}</div>`;
}

/* ---------------- state / routing ---------------- */
const state = { user: null, host: '', projects: [], system: null, timer: null, lastFetch: 0 };
const route = () => {
  if (location.hash.startsWith('#/security')) return { view: 'security' };
  const m = location.hash.match(/^#\/p\/([a-z0-9-]+)(?:\/(\w+))?/);
  return m ? { view: 'project', id: m[1], tab: m[2] || 'changes' } : { view: 'home' };
};
function render() { clearInterval(state.timer); const r = route(); r.view === 'project' ? renderProject(r.id, r.tab) : r.view === 'security' ? renderSecurity() : renderHome(); }
window.addEventListener('hashchange', render);

/* ---------------- login ---------------- */
function showLogin() {
  clearInterval(state.timer); $('#sheet-root').innerHTML = '';
  $('#app').innerHTML = `<div class="login"><form class="login-card panel" id="loginForm">
    <div class="logo">${ic.rocket}</div>
    <h1>Панель деплоя</h1><div class="t2" style="margin-top:4px">Сервер prod-nue · вход для администратора</div>
    <label class="field"><span>Логин</span><input name="username" autocomplete="username" required autofocus></label>
    <label class="field"><span>Пароль</span><input name="password" type="password" autocomplete="current-password" required></label>
    <button class="btn primary lg" type="submit">Войти</button><div class="error" id="loginErr"></div>
  </form></div>`;
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), btn = $('button', e.target);
    btn.disabled = true; $('#loginErr').textContent = '';
    try { const r = await api('/api/login', { json: { username: f.get('username'), password: f.get('password') } }); state.user = r.user; render(); }
    catch (err) { $('#loginErr').textContent = err.message; btn.disabled = false; }
  };
}

/* ---------------- home ---------------- */
function overview() {
  const P = state.projects, s = state.system;
  const down = P.filter((p) => !p.job && p.state && p.state.active !== 'active');
  const pending = P.filter((p) => (p.ahead || []).length);
  const running = P.filter((p) => p.job);
  const all = P.length, ok = all - down.length;
  const cls = down.length ? 'bad' : running.length ? 'warn' : '';
  const title = !all ? 'Загрузка…' : down.length ? `Не работает: ${down.map((p) => p.title).join(', ')}` : running.length ? `Идёт деплой: ${running.map((p) => p.title).join(', ')}` : 'Все сервисы работают';
  const lastDeploy = state.lastDeploy;
  const health = `<div class="panel health ${cls}"><div class="health-icon">${down.length ? ic.alert : running.length ? ic.rocket : ic.shield}</div>
    <div class="grow"><h2>${esc(title)}</h2><div class="meta">
      <span><b>${ok} из ${all}</b> онлайн</span>
      <span>${pending.length ? `<b style="color:var(--accent-text)">${pending.length}</b> ${plural(pending.length, 'проект ждёт', 'проекта ждут', 'проектов ждут')} деплоя` : 'Обновлений нет'}</span>
      <span>Последний деплой: <b>${lastDeploy ? `${ago(lastDeploy.ts)}` : '—'}</b></span>
    </div></div></div>`;
  const g = s ? (() => {
    const cpu = (s.load[0] / s.cpus) * 100, mem = (s.mem_used / s.mem_total) * 100, disk = (s.disk_used / s.disk_total) * 100;
    return `<div class="panel gauges">
      <div class="gauge">${ring(cpu, level(cpu))}<div class="lbl">CPU</div><div class="sub">${s.load[0].toFixed(2)} · ${s.cpus} ядер</div></div>
      <div class="gauge">${ring(mem, level(mem))}<div class="lbl">Память</div><div class="sub">${bytes(s.mem_used, 1)} из ${bytes(s.mem_total, 0)}</div></div>
      <div class="gauge">${ring(disk, level(disk))}<div class="lbl">Диск</div><div class="sub">${bytes(s.disk_used, 0)} из ${bytes(s.disk_total, 0)}</div></div>
    </div>`;
  })() : '<div class="panel skel" style="height:118px"></div>';
  return `<div class="overview">${health}${g}</div>`;
}
function pcard(p) {
  const st = statusOf(p), n = (p.ahead || []).length, h = p.head || {}, s = p.state || {};
  const down = !p.job && s.active && s.active !== 'active';
  const foot = n
    ? `<span class="badge accent">${ic.branch}${commits(n)}</span><span class="spacer"></span><button class="btn primary sm" data-deploy="${esc(p.id)}">${ic.rocket}Выложить</button>`
    : `<span class="i">${ic.clock}${s.since ? dur(Date.now() / 1000 - s.since) : '—'}</span><span class="i" title="Автоперезапусков">${ic.restart}${s.restarts ?? 0}</span><span class="spacer"></span><span class="badge ok">${ic.check}Актуально</span>`;
  return `<article class="pcard ${n ? 'has-update' : ''} ${down ? 'is-down' : ''}">
    <a class="stretch" href="#/p/${esc(p.id)}" aria-label="${esc(p.title)}"></a>
    <div class="body">
      <div class="head"><div class="tile ${esc(p.kind)}">${kindIcon(p.kind)}</div>
        <div class="grow"><h3 class="ellipsis">${esc(p.title)}</h3><div class="dom ellipsis">${esc(p.domain || kindName(p.kind))}</div></div>
        <span class="state"><span class="dot ${st.cls}"></span>${st.text}</span></div>
      <div class="commitline"><span class="sha">${esc(h.short || '—')}</span><span class="msg">${esc(h.subject || '')}</span><span class="when">${ago(isoSec(h.date))}</span></div>
      ${minis(p)}
      ${chips(p)}
    </div>
    <div class="foot">${foot}</div>
  </article>`;
}
async function renderHome() {
  $('#app').innerHTML = `${nav(`<button class="btn ghost" id="fetchBtn" title="Проверить GitHub">${ic.refresh}<span class="hide-sm">Проверить GitHub</span></button>`)}
    <main class="wrap">
      <div class="page-title"><div><h1>Обзор</h1><div class="sub">Проекты на сервере и их версии в GitHub</div></div></div>
      <div id="ov">${overview()}</div>
      <div class="toolbar"><h2>Проекты</h2><span class="count" id="pcount">${state.projects.length || '…'}</span><span class="spacer" style="flex:1"></span><span class="fetched" id="fetched"></span></div>
      <div class="grid" id="cards">${state.projects.length ? state.projects.map(pcard).join('') : '<div class="skel" style="height:260px"></div>'.repeat(3)}</div>
      <div class="toolbar"><h2>Последние деплои</h2></div>
      <div id="feed">${feed()}</div>
    </main>`;
  bindNav();
  $('#fetchBtn').onclick = () => loadHome(true);
  bindCards();
  await loadHome(Date.now() - state.lastFetch > 5 * 60e3);
  state.timer = setInterval(() => loadHome(Date.now() - state.lastFetch > 5 * 60e3), 30e3);
}
function feed() {
  const h = state.history || [];
  if (!h.length) return `<div class="panel empty"><div class="ico neutral">${ic.history}</div><h4>Деплоев пока не было</h4><p>После первого деплоя здесь появится лента: какой проект, какая версия, кто и чем закончилось.</p></div>`;
  const title = (id) => (state.projects.find((p) => p.id === id) || {}).title || id;
  const meta = { success: ['Выложено', ic.check], rolled_back: ['Откат', ic.undo], rollback_failed: ['Откат не удался', ic.alert] };
  return `<div class="panel"><div class="tl">${h.map((e) => {
    const [label, icon] = meta[e.result] || [e.result, ic.info];
    return `<a class="tl-item" href="#/p/${esc(e.project)}/history"><div class="tl-dot ev-dot ${esc(e.result)}">${icon}</div>
      <div class="tl-body"><div class="tl-title">${esc(title(e.project))} — ${esc(e.subject || e.to.slice(0, 7))}</div>
      <div class="tl-meta"><span>${label}</span><span>${esc(e.by)}</span><span class="sha">${esc(e.to.slice(0, 7))}</span><span>${e.duration} с</span></div></div>
      <span class="when">${ago(e.ts)}</span></a>`;
  }).join('')}</div></div>`;
}
function bindCards() {
  $$('[data-deploy]').forEach((b) => (b.onclick = async (e) => {
    e.preventDefault(); e.stopPropagation();
    location.hash = `#/p/${b.dataset.deploy}/changes`;
    await waitFor(() => cur && cur.id === b.dataset.deploy); confirmDeploy();
  }));
}
const waitFor = (fn) => new Promise((res) => { const t = setInterval(() => { if (fn()) { clearInterval(t); res(); } }, 100); });
async function loadHome(fetchGit) {
  const btn = $('#fetchBtn'); if (fetchGit && btn) btn.classList.add('spin');
  try {
    const [sys, projects, hist] = await Promise.all([api('/api/system'), api(`/api/projects?fetch=${fetchGit ? 1 : 0}`), api('/api/history?limit=8')]);
    Object.assign(state, { system: sys, host: sys.host, projects, lastDeploy: hist[0], history: hist });
    if (fetchGit) state.lastFetch = Date.now();
    if (route().view !== 'home') return;
    $('#ov').innerHTML = overview();
    $('#feed').innerHTML = feed();
    $('#cards').innerHTML = projects.map(pcard).join('');
    $('#pcount').textContent = projects.length;
    bindCards();
    const f = Math.max(0, ...projects.map((p) => p.fetched_at || 0));
    $('#fetched').textContent = f ? `GitHub проверен ${ago(f)}` : '';
  } catch (e) { if (e.message !== 'login') toast(e.message, 'bad'); }
  finally { btn && btn.classList.remove('spin'); }
}

/* ---------------- project ---------------- */
let cur = null;
async function renderProject(id, tab) {
  cur = null;
  $('#app').innerHTML = `${nav()}<main class="wrap"><nav class="crumbs"><a href="#/">Обзор</a>${ic.chevR}<span id="crumb">${esc(id)}</span></nav><div id="pv"><div class="skel" style="height:230px"></div></div></main>`;
  bindNav();
  try { cur = await api(`/api/projects/${id}?fetch=1`); } catch (e) { if (e.message !== 'login') $('#pv').innerHTML = `<div class="panel empty"><p>${esc(e.message)}</p></div>`; return; }
  $('#crumb').textContent = cur.title;
  paintProject(tab);
  if (cur.job) openJob(cur.job);
  state.timer = setInterval(async () => {
    if ($('.sheet')) return;
    try { const fresh = await api(`/api/projects/${id}`); if (route().id !== id) return; cur = fresh; paintHero(); if (route().tab === 'history') paintTab('history'); } catch (_) {}
  }, 20e3);
}
function paintProject(tab) {
  const n = cur.ahead.length;
  $('#pv').innerHTML = `<section class="panel phero" id="hero"></section>
    <div class="pgrid" id="pgrid"></div>
    <nav class="tabs">
      <button class="tab" data-tab="changes">${ic.branch}Изменения${n ? `<span class="n">${n}</span>` : ''}</button>
      <button class="tab" data-tab="versions">${ic.layers}Версии</button>
      <button class="tab" data-tab="history">${ic.history}История</button>
      <button class="tab" data-tab="logs">${ic.terminal}Логи</button>
    </nav><div id="tabBody"></div>`;
  paintHero();
  $$('.tab').forEach((b) => (b.onclick = () => { history.replaceState(null, '', `#/p/${cur.id}/${b.dataset.tab}`); paintTab(b.dataset.tab); }));
  paintTab(tab);
}
function paintCharts() {
  const g = $('#pgrid'); if (!g) return;
  const m = cur.metrics || [], s = cur.state || {};
  g.innerHTML = bigChart('CPU', ic.cpu, m.map((r) => r[1]), cpuFmt, 'cpu', '% одного ядра, за 2 часа')
    + bigChart('Память', ic.layers, m.map((r) => r[2]), (v) => bytes(v), 'mem', s.memory_max ? `лимит ${bytes(s.memory_max, 0)}` : 'без лимита', true)
    + maintenance(cur);
}
function paintHero() {
  paintCharts();
  const st = statusOf(cur), s = cur.state, h = cur.head || {}, n = cur.ahead.length;
  const memPct = s.memory_max ? (s.memory / s.memory_max) * 100 : 0;
  const last = (cur.history || [])[0];
  const main = cur.job ? `<button class="btn primary lg" id="jobBtn">${ic.rocket}Деплой идёт…</button>`
    : n ? `<button class="btn primary lg" id="deployBtn">${ic.rocket}Выложить ${commits(n)}</button>`
      : `<span class="badge ok" style="height:36px;padding:0 12px;font-size:13px">${ic.check}Актуальная версия</span>`;
  $('#hero').innerHTML = `<div class="top">
      <div class="tile lg ${esc(cur.kind)}">${kindIcon(cur.kind)}</div>
      <div class="grow"><div class="row"><h1>${esc(cur.title)}</h1><span class="state"><span class="dot ${st.cls}"></span>${st.text}</span></div>
        <div class="links"><span>${esc(kindName(cur.kind))}</span>
          ${cur.domain ? `<a href="https://${esc(cur.domain)}" target="_blank" rel="noopener">${ic.globe}${esc(cur.domain)}</a>` : ''}
          ${cur.repo ? `<a href="${esc(cur.repo)}" target="_blank" rel="noopener">${ic.github}${esc(cur.repo.replace('https://github.com/', ''))}</a>` : ''}</div></div>
      <div class="acts">${main}
        <button class="btn icon lg" id="restartBtn" title="Перезапустить службу">${ic.restart}</button>
        <div class="menu-wrap"><button class="btn icon lg" id="moreBtn" title="Ещё">${ic.more}</button></div></div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="k">${ic.commit}На сервере</div><div class="v"><span class="sha">${esc(h.short)}</span><span class="ellipsis">${ago(isoSec(h.date))}</span></div></div>
      <div class="kpi"><div class="k">${ic.github}GitHub</div><div class="v">${n ? `<span style="color:var(--accent-text)">+${commits(n)}</span>` : '<span style="color:var(--ok-text)">актуально</span>'}</div></div>
      <div class="kpi"><div class="k">${ic.cpu}Память</div><div class="v">${bytes(s.memory)}<span class="t3" style="font-weight:500;font-size:13px">${s.memory_max ? `из ${bytes(s.memory_max, 0)}` : ''}</span></div>${s.memory_max ? `<div class="track ${level(memPct)}"><i style="width:${Math.max(2, memPct).toFixed(1)}%"></i></div>` : ''}</div>
      <div class="kpi"><div class="k">${ic.heart}Аптайм · падения</div><div class="v">${s.since ? dur(Date.now() / 1000 - s.since) : '—'}<span class="t3" style="font-weight:500;font-size:13px">· ${s.restarts ?? 0}</span></div></div>
    </div>
    ${last ? `<div class="alert ${last.result === 'success' ? 'accent' : 'warn'}">${last.result === 'success' ? ic.info : ic.alert}<div>Последний деплой ${ago(last.ts)} — ${esc(last.by)}: «${esc(last.subject)}»${last.result === 'success' ? '' : ' — не прошёл проверку, был откат'}</div></div>` : ''}
    ${cur.fetch_error ? `<div class="alert bad">${ic.alert}<div>GitHub недоступен: ${esc(cur.fetch_error)}</div></div>` : ''}
    ${cur.dirty ? `<div class="alert warn">${ic.alert}<div>На сервере есть ручные правки в ${cur.dirty} ${plural(cur.dirty, 'файле', 'файлах', 'файлах')} — следующий деплой их перезапишет.</div></div>` : ''}`;
  const d = $('#deployBtn'); if (d) d.onclick = () => confirmDeploy();
  const j = $('#jobBtn'); if (j) j.onclick = () => openJob(cur.job);
  $('#restartBtn').onclick = restartService;
  $('#moreBtn').onclick = (e) => menu(e.currentTarget.parentElement, [
    { icon: ic.rocket, t: 'Перевыложить текущую версию', d: 'Заново применить код и настройки из GitHub, перезапустить и проверить. Нужно после смены .env или если сервис «залип».', fn: () => confirmDeploy(null, false, true) },
    { icon: ic.restart, t: 'Перезапустить службу', d: 'Просто рестарт без обновления кода.', fn: restartService },
    '-',
    ...(cur.domain ? [{ icon: ic.ext, t: 'Открыть сайт', d: cur.domain, href: `https://${cur.domain}` }] : []),
    ...(cur.repo ? [{ icon: ic.github, t: 'Открыть в GitHub', d: cur.repo.replace('https://github.com/', ''), href: cur.repo }] : []),
  ]);
}
function paintTab(tab) {
  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  const body = $('#tabBody'); if (!body) return;
  ({ changes: tabChanges, versions: tabVersions, history: tabHistory, logs: tabLogs }[tab] || tabChanges)(body);
}
const tlItem = (c, { cls = '', tag = '', act = '', dot = '' } = {}) => `<div class="tl-item ${cls}">
  <div class="tl-dot ${dot}">${cls === 'current' ? ic.check : esc(initials(c.author))}</div>
  <div class="tl-body"><div class="tl-title">${esc(c.subject)}</div>
    <div class="tl-meta"><span class="sha">${esc(c.short)}</span><span>${esc(c.author)}</span><span>${ago(isoSec(c.date))}</span>${tag}</div></div>
  <div class="tl-act">${act}</div></div>`;

function tabChanges(body) {
  if (!cur.ahead.length) {
    body.innerHTML = `<div class="panel empty"><div class="ico">${ic.check}</div><h4>Всё выложено</h4>
      <p>На сервере последняя версия из GitHub. Сделайте <code>git push</code> с ноутбука — новые коммиты появятся здесь, и можно будет выложить их одной кнопкой.</p></div>`;
    return;
  }
  body.innerHTML = `<div class="panel"><div class="card-h"><h3>Будет выложено</h3><button class="btn sm" id="diffBtn">${ic.code}Код</button><button class="btn primary sm" id="deployBtn2">${ic.rocket}Выложить</button></div>
    <div class="tl">${cur.ahead.map((c) => tlItem(c, { cls: 'new', tag: '<span class="badge accent" style="height:20px">новый</span>' })).join('')}</div></div>
    <div id="diffBox" style="margin-top:12px"></div>`;
  $('#diffBtn').onclick = () => showDiff('origin/main', $('#diffBox'));
  $('#deployBtn2').onclick = () => confirmDeploy();
}
function tabVersions(body) {
  const headSha = cur.head.sha, idx = cur.recent.findIndex((c) => c.sha === headSha);
  body.innerHTML = `<div class="panel"><div class="card-h"><h3>Версии в GitHub</h3><span class="t3" style="font-size:12.5px">любую можно выложить</span></div><div class="tl">${cur.recent.map((c, i) => {
    const on = c.sha === headSha, newer = idx === -1 || i < idx;
    return tlItem(c, {
      cls: on ? 'current' : newer ? 'new' : '',
      tag: on ? '<span class="badge ok" style="height:20px">на сервере</span>' : newer ? '<span class="badge accent" style="height:20px">новее</span>' : '',
      act: on ? '' : `<button class="btn sm" data-ref="${esc(c.sha)}" data-old="${newer ? 0 : 1}">${newer ? ic.rocket + 'Выложить' : ic.undo + 'Откатить'}</button>`,
    });
  }).join('')}</div></div>`;
  $$('[data-ref]', body).forEach((b) => (b.onclick = () => confirmDeploy(b.dataset.ref, b.dataset.old === '1')));
}
function tabHistory(body) {
  const h = cur.history || [];
  const meta = { success: ['Выложено', ic.check], rolled_back: ['Не прошло проверку — откат', ic.undo], rollback_failed: ['Откат не удался', ic.alert] };
  body.innerHTML = `<div class="panel"><div class="card-h"><h3>История деплоев</h3></div>${h.length ? `<div class="tl">${h.map((e) => {
    const [label, icon] = meta[e.result] || [e.result, ic.info];
    return `<div class="tl-item"><div class="tl-dot ev-dot ${esc(e.result)}">${icon}</div><div class="tl-body">
      <div class="tl-title">${esc(e.subject || e.to.slice(0, 7))}</div>
      <div class="tl-meta"><span>${label}</span><span>${esc(e.by)}</span><span>${fmtDate(e.ts)}</span><span class="sha">${esc(e.from.slice(0, 7))} → ${esc(e.to.slice(0, 7))}</span><span>${e.duration} с</span></div></div><div></div></div>`;
  }).join('')}</div>` : `<div class="empty"><div class="ico neutral">${ic.history}</div><h4>Деплоев ещё не было</h4><p>Здесь появится каждый деплой: кто, когда, какая версия и чем закончился.</p></div>`}</div>`;
}
async function tabLogs(body) {
  body.innerHTML = `<div class="panel"><div class="logbar">
    <select class="select" id="logN"><option value="100">100 строк</option><option value="200" selected>200 строк</option><option value="500">500 строк</option><option value="1000">1000 строк</option></select>
    <button class="btn sm" id="logRefresh">${ic.refresh}Обновить</button>
    <label class="chk"><input type="checkbox" id="logAuto">авто</label><label class="chk"><input type="checkbox" id="logErr">только ошибки</label></div>
    <div class="console" id="logBox"><div class="dim">Загрузка…</div></div></div>`;
  let t = null;
  const fmtT = new Intl.DateTimeFormat('ru', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const load = async () => {
    try {
      const r = await api(`/api/projects/${cur.id}/logs?n=${$('#logN').value}`);
      const box = $('#logBox'); if (!box) return;
      const only = $('#logErr').checked, atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
      box.innerHTML = r.lines.map((l) => {
        const m = l.match(/^(\d{4}-\d\d-\d\dT[\d:]+[+-]\d\d:?\d\d)\s+\S+\s+[^:]+:\s?(.*)$/);
        const msg = m ? m[2] : l, ts = m ? fmtT.format(new Date(m[1])) : '';
        const cls = /error|exception|traceback|fail|critical/i.test(msg) ? 'err' : /warn/i.test(msg) ? 'warn' : /started|✅|success/i.test(msg) ? 'ok' : '';
        return only && !cls.match(/err|warn/) ? '' : `<div class="${cls}">${ts ? `<span class="ts">${ts}</span>` : ''}${esc(msg)}</div>`;
      }).join('') || '<div class="dim">Пусто</div>';
      if (atBottom || !box.dataset.init) { box.scrollTop = box.scrollHeight; box.dataset.init = 1; }
    } catch (_) {}
  };
  $('#logRefresh').onclick = load; $('#logN').onchange = load; $('#logErr').onchange = load;
  $('#logAuto').onchange = (e) => { clearInterval(t); if (e.target.checked) t = setInterval(() => ($('#logBox') ? load() : clearInterval(t)), 4000); };
  load();
}
async function showDiff(ref, box) {
  box.innerHTML = '<div class="skel" style="height:120px"></div>';
  try {
    const d = await api(`/api/projects/${cur.id}/diff?ref=${encodeURIComponent(ref)}`);
    const files = d.patch.split(/^diff --git /m).filter(Boolean).map((chunk) => {
      const name = (chunk.match(/^a\/(\S+)/) || [])[1] || '?';
      const lines = chunk.split('\n'), start = lines.findIndex((l) => l.startsWith('@@'));
      const body = start < 0 ? [] : lines.slice(start);
      return { name, body, add: body.filter((l) => l.startsWith('+')).length, del: body.filter((l) => l.startsWith('-')).length };
    });
    const tA = files.reduce((a, f) => a + f.add, 0), tD = files.reduce((a, f) => a + f.del, 0);
    box.innerHTML = `<div class="panel"><div class="card-h"><h3>Изменения в коде</h3><span class="t2" style="font-size:12.5px">${files.length} ${plural(files.length, 'файл', 'файла', 'файлов')} · <span class="plus">+${tA}</span> <span class="minus">−${tD}</span></span></div>
      ${files.map((f, i) => `<details class="file" ${files.length <= 4 || i < 2 ? 'open' : ''}><summary>${ic.chevR.replace('<svg', '<svg class="chev"')}<span class="name">${esc(f.name)}</span><span class="plus">+${f.add}</span><span class="minus">−${f.del}</span></summary>
        <div class="code">${f.body.map((l) => `<div class="${l.startsWith('@@') ? 'h' : l.startsWith('+') ? 'a' : l.startsWith('-') ? 'd' : ''}">${esc(l) || ' '}</div>`).join('')}</div></details>`).join('')
      || '<div class="empty"><p>Изменений в коде нет — только служебные файлы.</p></div>'}
      ${d.truncated ? '<div class="note" style="margin:12px">Показана часть изменений — полностью смотрите в GitHub.</div>' : ''}</div>`;
  } catch (e) { box.innerHTML = `<div class="panel empty"><p>${esc(e.message)}</p></div>`; }
}
async function restartService() {
  if (!confirm(`Перезапустить «${cur.title}»? Сервис будет недоступен несколько секунд.`)) return;
  const b = $('#restartBtn'); b.disabled = true; b.classList.add('spin');
  try { const r = await api(`/api/projects/${cur.id}/restart`, { json: {} }); toast(r.ok ? 'Служба перезапущена' : `Не поднялась: ${r.output}`, r.ok ? 'ok' : 'bad'); cur = await api(`/api/projects/${cur.id}`); paintHero(); }
  catch (e) { toast(e.message, 'bad'); } finally { const bb = $('#restartBtn'); if (bb) { bb.disabled = false; bb.classList.remove('spin'); } }
}

/* ---------------- deploy flow ---------------- */
function confirmDeploy(ref, isRollback = false, redeploy = false) {
  const target = ref ? cur.recent.find((c) => c.sha === ref) : null, n = cur.ahead.length;
  const list = ref ? (target ? tlItem(target, { cls: isRollback ? '' : 'new' }) : '') : (!redeploy && n) ? cur.ahead.map((c) => tlItem(c, { cls: 'new' })).join('') : '';
  const title = isRollback ? 'Откатить на эту версию?' : ref ? 'Выложить эту версию?' : (redeploy || !n) ? 'Перевыложить текущую версию?' : `Выложить ${commits(n)}?`;
  const explain = redeploy || (!ref && !n)
    ? `<div class="note">${ic.info}<div>Код не меняется: заново применятся настройки из GitHub, служба перезапустится и пройдёт проверку.</div></div>` : '';
  const warn = cur.id === 'fitness' ? `<div class="note warn">${ic.alert}<div>Если в изменениях есть миграции базы данных, они применятся до перезапуска и откатом не отменяются.</div></div>` : '';
  const s = openSheet(`<div class="sh-head"><div class="tile ${esc(cur.kind)}">${kindIcon(cur.kind)}</div><div class="grow"><h3>${title}</h3><div class="t3">${esc(cur.title)} · служба ${esc(cur.service)}</div></div><button class="btn ghost icon" data-close>${ic.x}</button></div>
    <div class="sh-body">${list ? `<div class="box"><div class="tl">${list}</div></div>` : ''}${explain}
      <div class="note">${ic.shield}<div>После запуска — автоматическая проверка: служба работает, не падает${cur.domain ? ', сайт отвечает' : ''}. Если что-то не так — вернём текущую версию <span class="sha">${esc(cur.head.short)}</span> сами.</div></div>${warn}</div>
    <div class="sh-foot"><button class="btn" data-close>Отмена</button><button class="btn primary" id="goDeploy">${isRollback ? ic.undo : ic.rocket}${isRollback ? 'Откатить' : 'Выложить'}</button></div>`);
  $('#goDeploy', s.root).onclick = async () => {
    $('#goDeploy', s.root).disabled = true;
    try { const r = await api(`/api/projects/${cur.id}/deploy`, { json: { ref: ref || null, force: redeploy || (!ref && !n) } }); s.close(); openJob(r.job); }
    catch (e) { toast(e.message, 'bad'); s.close(); }
  };
}
const STEPS = [['fetch', 'GitHub', /fetching/], ['env', 'Настройки', /^env:|^deps:|^build:|health:|✅ deploy|rolling back|already at/], ['deps', 'Сборка', /^deps:|^build:|health:|✅ deploy|rolling back/], ['restart', 'Запуск', /health:|✅ deploy|rolling back/], ['check', 'Проверка', /✅ deploy|rolled back|rollback also|already at/]];
function openJob(jobId) {
  const s = openSheet(`<div class="sh-head"><div class="tile ${esc(cur.kind)}">${kindIcon(cur.kind)}</div><div class="grow"><h3>Деплой</h3><div class="t3">${esc(cur.title)}</div></div><button class="btn ghost icon" data-close>${ic.x}</button></div>
    <div class="stepper">${STEPS.map(([k, l]) => `<div class="st" data-s="${k}"><div class="c"></div><span>${l}</span></div>`).join('')}</div>
    <div id="jobResult"></div><div class="console" id="jobLog"></div>
    <div class="sh-foot"><button class="btn" data-close id="jobClose">Свернуть</button><a class="btn" href="#/p/${esc(cur.id)}/logs" id="jobLogs">${ic.terminal}Логи службы</a></div>`,
  { onClose: async () => { try { cur = await api(`/api/projects/${cur.id}`); if (route().view === 'project') paintProject(route().tab); } catch (_) {} } });
  const log = $('#jobLog', s.root), seen = new Set(), order = STEPS.map(([k]) => k);
  $('#jobLogs', s.root).onclick = () => s.close();
  const paint = (final) => {
    const last = Math.max(-1, ...[...seen].map((k) => order.indexOf(k)));
    // steps before the latest reached one are done; the latest is in progress (or failed)
    $$('.st', s.root).forEach((el) => {
      const i = order.indexOf(el.dataset.s);
      const st = final === 'ok' || i < last ? 'done' : i === last ? (final === 'fail' ? 'fail' : 'active') : '';
      el.className = 'st' + (st ? ` ${st}` : '');
      $('.c', el).innerHTML = st === 'done' ? ic.check : st === 'fail' ? ic.x : '';
    });
  };
  const mark = (line) => { STEPS.forEach(([k, , re]) => { if (re.test(line)) seen.add(k); }); paint(); };
  const es = new EventSource(`/api/jobs/${jobId}/stream`);
  es.onopen = () => { log.innerHTML = ''; seen.clear(); paint(); };
  es.onmessage = (ev) => {
    const line = JSON.parse(ev.data);
    const cls = /✖|‼|failed|error|Traceback/i.test(line) ? 'err' : /✅|✔|↩/.test(line) ? 'ok' : /health:|warn/i.test(line) ? 'warn' : /^\s{3}/.test(line) ? 'dim' : '';
    log.insertAdjacentHTML('beforeend', `<div class="${cls}">${esc(line)}</div>`); log.scrollTop = log.scrollHeight; mark(line);
  };
  es.addEventListener('done', (ev) => {
    es.close();
    const r = JSON.parse(ev.data);
    const map = { success: ['success', ic.check, 'Выложено и работает'], uptodate: ['uptodate', ic.info, 'Уже актуальная версия — выкладывать нечего'], rolled_back: ['rolled_back', ic.undo, 'Новая версия не прошла проверку — вернули прежнюю, сервис работает'], failed: ['failed', ic.alert, 'Ошибка деплоя — подробности в логе ниже'] };
    const [cls, icon, text] = map[r] || ['uptodate', ic.info, 'Готово'];
    $('#jobResult', s.root).innerHTML = `<div class="result ${cls}">${icon}${text}</div>`;
    paint(r === 'success' || r === 'uptodate' ? 'ok' : 'fail');
    $('#jobClose', s.root).textContent = 'Готово';
    toast(text, r === 'success' || r === 'uptodate' ? 'ok' : 'bad');
  });
}

/* ---------------- security ---------------- */
const JAIL_RULES = {
  'nginx-scan': '3 запроса к wp-login, .env, .git, phpmyadmin… за час → бан на сутки',
  'nginx-flood': 'лимит 20 запросов/с (всплеск до 60) → ответ 429; 50 таких отказов за минуту → бан на час',
  'nginx-4xx': '60 ошибочных запросов (400–404, 444) за минуту → бан на час',
  'sshd': '5 неудачных входов по SSH за 10 минут → бан на час',
  'manual': 'заблокированы вами из панели → на неделю, все порты',
};
const until = (ts) => { const d = ts - Date.now() / 1000; return d <= 0 ? 'истекает' : d < 3600 ? `ещё ${Math.ceil(d / 60)} мин` : d < 86400 ? `ещё ${Math.round(d / 3600)} ч` : `ещё ${Math.round(d / 86400)} дн`; };
async function renderSecurity() {
  $('#app').innerHTML = `${nav(`<button class="btn ghost" id="secRefresh" title="Обновить">${ic.refresh}<span class="hide-sm">Обновить</span></button>`)}
    <main class="wrap"><div class="page-title"><div><h1>Защита</h1><div class="sub">Лимиты запросов nginx и автоматические блокировки fail2ban</div></div></div>
    <div id="sec"><div class="skel" style="height:320px"></div></div></main>`;
  bindNav();
  $('#secRefresh').onclick = () => loadSecurity(true);
  await loadSecurity();
  state.timer = setInterval(() => { if (!$('.sheet')) loadSecurity(); }, 30e3);
}
async function loadSecurity(spin) {
  const b = $('#secRefresh'); if (spin && b) b.classList.add('spin');
  try { paintSecurity(await api('/api/security')); } catch (e) { if (e.message !== 'login') toast(e.message, 'bad'); }
  finally { b && b.classList.remove('spin'); }
}
function paintSecurity(d) {
  const box = $('#sec'); if (!box) return;
  const st = d.stats || {}, bans = d.jails.flatMap((j) => j.banned.map((b) => ({ ...b, jail: j.name, reason: j.description })));
  const kpi = (icon, label, value, sub, cls = '') => `<div class="panel skpi ${cls}"><div class="k">${icon}${label}</div><div class="v">${value}</div><div class="s">${sub}</div></div>`;
  box.innerHTML = `
    <div class="skpis">
      ${kpi(ic.globe, 'Запросов за час', (st.requests || 0).toLocaleString('ru'), 'все сайты вместе')}
      ${kpi(ic.zap, 'Отбито лимитом', (st.limited || 0).toLocaleString('ru'), 'ответ 429 «слишком часто»', st.limited ? 'warn' : '')}
      ${kpi(ic.alert, 'Сканеры за час', (st.scans || 0) + (st.blocked_host || 0), `${st.scans || 0} уязвимости · ${st.blocked_host || 0} по голому IP`, (st.scans || 0) ? 'warn' : '')}
      ${kpi(ic.shield, 'Заблокировано сейчас', bans.length, `всего с запуска: ${d.jails.reduce((a, j) => a + j.total, 0)}`, bans.length ? 'accent' : 'ok')}
    </div>
    <div class="panel" style="margin-top:12px"><div class="card-h"><h3>Заблокированные IP</h3><span class="t3" style="font-size:12.5px">снимаются сами по истечении срока</span></div>
      ${bans.length ? `<div class="stable">${bans.sort((a, b) => b.since - a.since).map((b) => `<div class="srow">
          <div class="ipcell"><span class="ip">${esc(b.ip)}</span><span class="t3">${ago(b.since)}</span></div>
          <div class="grow"><div class="t">${esc(b.reason)}</div><div class="t3" style="font-size:12px">до ${fmtDate(b.until)} · ${until(b.until)}</div></div>
          <button class="btn sm" data-unban="${esc(b.ip)}">${ic.undo}Разблокировать</button></div>`).join('')}</div>`
        : `<div class="empty"><div class="ico">${ic.shield}</div><h4>Никто не заблокирован</h4><p>Как только сканер или флудер нарушит правила ниже — он появится здесь, и его можно будет разблокировать одной кнопкой.</p></div>`}
    </div>
    <div class="panel" style="margin-top:12px"><div class="card-h"><h3>Самые активные IP · 15 минут</h3></div>
      ${d.top.length ? `<div class="stable">${d.top.map((t) => `<div class="srow">
          <div class="ipcell"><span class="ip">${esc(t.ip)}</span>${t.whitelisted ? '<span class="chip ok">белый список</span>' : t.banned ? '<span class="chip bad">заблокирован</span>' : ''}</div>
          <div class="grow"><div class="t">${t.count} ${plural(t.count, 'запрос', 'запроса', 'запросов')}${t.limited ? ` · <span style="color:var(--warn-text)">${t.limited} отбито</span>` : ''}${t.scans ? ` · <span style="color:var(--bad-text)">${t.scans} ${plural(t.scans, "сканирование", "сканирования", "сканирований")}</span>` : ''}</div>
            <div class="t3 ellipsis mono" style="font-size:11.5px">${esc(t.last)}</div></div>
          ${t.whitelisted || t.banned ? '' : `<button class="btn sm danger" data-ban="${esc(t.ip)}">${ic.x}Заблокировать</button>`}</div>`).join('')}</div>`
        : '<div class="empty"><p>За 15 минут запросов не было.</p></div>'}
    </div>
    <div class="sgrid">
      <div class="panel"><div class="card-h"><h3>Правила</h3></div><div class="rules">${d.jails.map((j) => `<div class="mrow"><div class="ic ${j.banned.length ? 'warn' : 'ok'}">${ic.shield}</div>
        <div class="grow"><div class="t">${esc(j.description)} <span class="t3" style="font-weight:500">· сейчас ${j.banned.length}, всего ${j.total}</span></div><div class="d">${esc(JAIL_RULES[j.name] || '')}</div></div></div>`).join('')}
        <div class="note">${ic.info}<div>Повторным нарушителям срок бана каждый раз растёт — до недели. Обычные посетители до лимитов не доходят: открытие страницы — это 5–15 запросов.</div></div></div></div>
      <div class="panel"><div class="card-h"><h3>Белый список</h3></div><div class="rules">
        <div class="chips">${d.whitelist.map((w) => `<span class="chip ok mono">${esc(w)}</span>`).join('')}</div>
        <div class="note">${ic.info}<div>Эти адреса никогда не блокируются и не ограничиваются: сам сервер, твой ноутбук, старый сервер и сети Telegram (вебхуки). Если у тебя сменился IP — скажи, добавлю новый.</div></div>
        <div class="note">${ic.alert}<div>Это защита уровня приложения. От объёмной DDoS-атаки (гигабиты трафика) помогает базовая защита netcup, а для серьёзной — Cloudflare перед сайтами.</div></div></div></div>
    </div>`;
  $$('[data-unban]', box).forEach((b) => (b.onclick = async () => {
    if (!confirm(`Разблокировать ${b.dataset.unban}?`)) return;
    b.disabled = true;
    try { await api('/api/security/unban', { json: { ip: b.dataset.unban } }); toast(`${b.dataset.unban} разблокирован`); loadSecurity(); } catch (e) { toast(e.message, 'bad'); b.disabled = false; }
  }));
  $$('[data-ban]', box).forEach((b) => (b.onclick = async () => {
    if (!confirm(`Заблокировать ${b.dataset.ban} на неделю (все порты)?`)) return;
    b.disabled = true;
    try { await api('/api/security/ban', { json: { ip: b.dataset.ban } }); toast(`${b.dataset.ban} заблокирован`); loadSecurity(); } catch (e) { toast(e.message, 'bad'); b.disabled = false; }
  }));
}

/* ---------------- boot ---------------- */
theme();
(async () => { try { const me = await api('/api/me'); state.user = me.user; render(); } catch (e) { if (e.message !== 'login') showLogin(); } })();
