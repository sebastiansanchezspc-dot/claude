/* =====================================================================
   ENTRADA: iniciar sesión, crear cuenta, crear empresa, invitaciones,
   estado de guardado y panel de la plataforma (dueño de Renueva)
   ===================================================================== */
const gate = { view: 'login', busy: false, err: '', info: '', ctx: null, user: null };

function gateShell(inner) {
  return `<div class="brandbar">${logo(34, 'var(--fg)')}<span class="wordmark">renueva</span></div>${inner}
    <div class="lobby-foot" style="margin-top:auto;padding-top:26px"><span>Hecho en Chile · Auto · Propiedades · Tienda</span><a href="?demo" style="color:var(--accent);font-weight:700;text-decoration:none">Ver demo</a></div>`;
}
const gErr = () => gate.err ? `<div class="tip" style="margin:0">${icon('warn')}<span>${clean(gate.err)}</span></div>` : '';
const gInfo = () => gate.info ? `<div class="tip good" style="margin:0">${icon('check')}<span>${clean(gate.info)}</span></div>` : '';
const gField = (id, label, type = 'text', ph = '', extra = '') => `<label class="field"><span>${label}</span><input id="${id}" type="${type}" placeholder="${ph}" ${extra}></label>`;
const gBtn = (act, txt, ic = 'arrowR') => `<button type="button" class="btn primary" data-act="${act}" ${gate.busy ? 'disabled' : ''}>${gate.busy ? 'Un momento…' : icon(ic) + txt}</button>`;
const gLink = (act, txt) => `<button type="button" data-act="${act}" style="background:none;border:0;color:var(--accent);font:700 13px var(--body);padding:6px 0">${txt}</button>`;

function renderGate(view) {
  if (view) { gate.view = view; gate.err = ''; }
  const v = gate.view, L = $('#lobby'); let h = '';
  if (v === 'cargando') h = `<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--fg3)"><div class="spin"></div></div>`;
  else if (v === 'login') h = `<h1>Hola de nuevo</h1><p class="sub">Entra para ver tu stock, tus ventas y tu caja.</p>
    <form class="gform" data-act="noop" onsubmit="return false">${gErr()}${gInfo()}${gField('g-e', 'Correo', 'email', 'tu@empresa.cl', 'autocomplete="email" inputmode="email"')}${gField('g-p', 'Contraseña', 'password', '••••••••', 'autocomplete="current-password"')}
    ${gBtn('gLogin', 'Entrar')}<div style="display:flex;justify-content:space-between">${gLink('gToRegistro', 'Crear cuenta')}${gLink('gToRecuperar', 'Olvidé mi contraseña')}</div></form>`;
  else if (v === 'registro') h = `<h1>${pendingInv() ? 'Únete a tu equipo' : 'Prueba Renueva 14 días'}</h1><p class="sub">${pendingInv() ? 'Crea tu cuenta con el mismo correo al que te llegó la invitación.' : 'Sin tarjeta. Todos los mundos y hasta 7 usuarios durante la prueba.'}</p>
    <form class="gform" onsubmit="return false">${gErr()}${gField('g-n', 'Tu nombre', 'text', 'Nombre y apellido', 'autocomplete="name"')}${gField('g-e', 'Correo', 'email', 'tu@empresa.cl', 'autocomplete="email" inputmode="email"')}${gField('g-p', 'Contraseña', 'password', 'Mínimo 8 caracteres', 'autocomplete="new-password"')}
    ${gBtn('gRegistro', 'Crear cuenta')}<div>${gLink('gToLogin', 'Ya tengo cuenta')}</div>
    <p style="font-size:11.5px;color:var(--fg3)">Al crear tu cuenta aceptas los términos del servicio y el tratamiento de tus datos para operar la plataforma.</p></form>`;
  else if (v === 'verifica') h = `<h1>Revisa tu correo</h1><p class="sub">Te enviamos un enlace para confirmar tu cuenta. Ábrelo desde este mismo dispositivo y vuelves aquí.</p>
    <div class="gform">${gInfo()}${gLink('gToLogin', 'Ya confirmé, entrar')}</div>`;
  else if (v === 'recuperar') h = `<h1>Recupera tu acceso</h1><p class="sub">Te enviamos un enlace para crear una contraseña nueva.</p>
    <form class="gform" onsubmit="return false">${gErr()}${gInfo()}${gField('g-e', 'Correo', 'email', 'tu@empresa.cl', 'autocomplete="email" inputmode="email"')}${gBtn('gRecuperar', 'Enviar enlace', 'send')}<div>${gLink('gToLogin', 'Volver')}</div></form>`;
  else if (v === 'nueva-clave') h = `<h1>Nueva contraseña</h1><p class="sub">Elige una contraseña nueva para tu cuenta.</p>
    <form class="gform" onsubmit="return false">${gErr()}${gField('g-p', 'Contraseña nueva', 'password', 'Mínimo 8 caracteres', 'autocomplete="new-password"')}${gBtn('gNuevaClave', 'Guardar y entrar', 'check')}</form>`;
  else if (v === 'onboarding') {
    const invs = (gate.ctx && gate.ctx.invitaciones) || [], nombre = (gate.user && gate.user.user_metadata && gate.user.user_metadata.nombre) || '';
    h = `<h1>${invs.length ? 'Te están esperando' : 'Crea tu empresa'}</h1><p class="sub">${invs.length ? 'Tienes una invitación pendiente.' : 'Elige con qué mundos partes. Puedes cambiarlo después.'}</p>
    <div class="gform">${gErr()}
      ${gate.ctx && gate.ctx.inactivo ? `<div class="tip" style="margin:0">${icon('lock')}<span>Tu usuario fue desactivado por el administrador de tu empresa. Pídele que te vuelva a activar.</span></div>` : ''}
      ${invs.map(i => `<button class="card pressable" data-act="gAceptar" data-t="${clean(i.token)}" style="display:flex;align-items:center;gap:14px;text-align:left;width:100%;border-color:var(--accent)"><span class="thumb" style="background:var(--accent);color:var(--accent-ink)">${icon('people', 22)}</span><span class="grow"><b style="font:700 15px var(--body)">${clean(i.org)}</b><br><span style="font-size:12px;color:var(--fg3)">Te invitaron como ${ROL_TXT[i.rol] || i.rol}</span></span>${icon('arrowR', 16)}</button>`).join('')}
      ${gate.ctx && gate.ctx.inactivo ? '' : `${invs.length ? '<p class="kicker" style="margin-top:8px">O crea tu propia empresa</p>' : ''}
      ${gField('g-o', 'Nombre de tu empresa', 'text', 'Ej: Automotora Los Andes')}
      <label class="field"><span>Tu nombre</span><input id="g-n" value="${clean(nombre)}" placeholder="Nombre y apellido"></label>
      <div><p class="kicker" style="margin-bottom:10px">¿En qué trabajas?</p><div class="optrow" id="g-m">${Object.values(WORLDS).map(w => `<button class="opt ${gate.mundos.includes(w.key) ? 'on' : ''}" data-act="gMundo" data-w="${w.key}">${icon(w.icon)}${w.name}</button>`).join('')}</div></div>
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px"><span><b style="font:600 14px var(--body)">Partir con datos de ejemplo</b><br><span style="font-size:12px;color:var(--fg3)">Para conocer la app. Los borras cuando quieras.</span></span><button class="toggle ${gate.ejemplo ? 'on' : ''}" data-act="gEjemplo" aria-label="Datos de ejemplo"></button></div>
      ${gBtn('gCrearOrg', 'Crear empresa y empezar', 'check')}`}
      <div>${gLink('gSalir', 'Cerrar sesión')}</div></div>`;
  }
  else if (v === 'setup') h = `<h1>Falta un paso</h1><p class="sub">La app ya está conectada a Supabase, pero la base de datos aún no tiene las tablas de Renueva.</p>
    <div class="gform"><div class="card" style="font-size:13px;color:var(--fg2);line-height:1.5">En Supabase abre <b style="color:var(--fg)">SQL Editor</b>, pega el contenido del archivo <span class="mono" style="font-size:11.5px">supabase/migrations/20261023000000_renueva.sql</span> y presiona <b style="color:var(--fg)">Run</b>. Luego recarga esta página.</div>
    <button class="btn primary" onclick="location.reload()">${icon('history')}Ya lo hice, recargar</button><div>${gLink('gSalir', 'Cerrar sesión')}</div></div>`;
  else if (v === 'error') h = `<h1>No pudimos conectar</h1><p class="sub">${clean(gate.err || 'Revisa tu conexión a internet.')}</p><div class="gform"><button class="btn primary" onclick="location.reload()">${icon('history')}Reintentar</button><div>${gLink('gSalir', 'Cerrar sesión')}</div></div>`;
  L.innerHTML = gateShell(h); L.classList.remove('out'); $('#app').hidden = true;
  const f = $('input', L); if (f && !('ontouchstart' in window)) f.focus();
}
const pendingInv = () => window.RV && RV.pendingInvite && RV.pendingInvite();
gate.mundos = ['auto']; gate.ejemplo = false;
const gv = id => ($('#' + id) || { value: '' }).value.trim();
async function gRun(fn) {
  if (gate.busy) return;
  const vals = {}; $$('#lobby input').forEach(i => vals[i.id] = i.value);
  gate.busy = true; gate.err = ''; renderGate(); Object.entries(vals).forEach(([k, v]) => { const i = $('#' + k); if (i) i.value = v; });
  try { await fn(vals); } catch (e) { gate.err = traducir(e.message); }
  gate.busy = false; if (gate.view !== 'app') { renderGate(); Object.entries(vals).forEach(([k, v]) => { const i = $('#' + k); if (i && i.type !== 'password') i.value = v; }); }
}
function traducir(m) {
  m = String(m || '');
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(m)) return 'Confirma tu correo: revisa tu bandeja (y spam).';
  if (/User already registered/i.test(m)) return 'Ese correo ya tiene cuenta. Entra o recupera tu contraseña.';
  if (/Password should be|at least/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.';
  if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Espera un minuto y vuelve a probar.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sin conexión. Revisa tu internet.';
  return m;
}
ACT.gToLogin = () => renderGate('login'); ACT.gToRegistro = () => renderGate('registro'); ACT.gToRecuperar = () => renderGate('recuperar');
ACT.gLogin = () => gRun(async v => { if (!v['g-e'] || !v['g-p']) throw new Error('Escribe tu correo y contraseña'); await RV.signIn(v['g-e'].trim(), v['g-p']); await afterAuth(); });
ACT.gRegistro = () => gRun(async v => {
  const n = v['g-n'].trim(), e = v['g-e'].trim(), p = v['g-p'];
  if (!n || !/.+@.+\..+/.test(e)) throw new Error('Completa tu nombre y un correo válido'); if (p.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
  const r = await RV.signUp(e, p, clean(n)); if (r.needsConfirm) { gate.info = 'Enviamos el enlace a ' + e; gate.view = 'verifica'; return; } await afterAuth();
});
ACT.gRecuperar = () => gRun(async v => { if (!v['g-e']) throw new Error('Escribe tu correo'); await RV.resetPassword(v['g-e'].trim()); gate.info = 'Listo. Revisa tu correo para crear una contraseña nueva.'; });
ACT.gNuevaClave = () => gRun(async v => { if ((v['g-p'] || '').length < 8) throw new Error('Mínimo 8 caracteres'); await RV.updatePassword(v['g-p']); await afterAuth(); });
ACT.gMundo = d => { const i = gate.mundos.indexOf(d.w); if (i >= 0) { if (gate.mundos.length > 1) gate.mundos.splice(i, 1); } else gate.mundos.push(d.w); $$('#g-m .opt').forEach(b => b.classList.toggle('on', gate.mundos.includes(b.dataset.w))); };
ACT.gEjemplo = (d, el) => { gate.ejemplo = !gate.ejemplo; el.classList.toggle('on', gate.ejemplo); };
ACT.gCrearOrg = () => gRun(async v => {
  const o = clean(v['g-o'] || '').trim(); if (!o) throw new Error('Escribe el nombre de tu empresa');
  await RV.createOrg(o, gate.mundos, clean(v['g-n'] || '').trim());
  gate.seed = gate.ejemplo; await afterAuth();
});
ACT.gAceptar = d => gRun(async () => { await RV.acceptInvite(d.t); await afterAuth(); });
ACT.gSalir = () => RV.logout();
RV.onRecovery = () => renderGate('nueva-clave');

async function afterAuth() {
  const st = await RV.enter();
  if (st.gate) { gate.ctx = st.ctx || null; gate.user = st.user || null; gate.err = st.error || RV.lastError || ''; RV.lastError = null; gate.view = st.gate; return; }
  gate.view = 'app'; startCloud(st);
}

/* ---------------------------------------------------------------- aplicar contexto y datos */
function applyCtx(ctx) {
  const o = ctx.org, m = ctx.miembro;
  Object.assign(ORG, { id: o.id, nombre: o.nombre });
  Object.assign(ME, { nombre: m.nombre || m.email, email: m.email, rol: m.rol, mundos: m.mundos, plataforma: !!ctx.plataforma });
  const trialLeft = Math.ceil((new Date(o.trial_hasta) - Date.now()) / MS), pagado = o.pagado_hasta && new Date(o.pagado_hasta) > new Date(Date.now() - 5 * MS);
  Object.assign(SUB, { plan: o.plan, ciclo: o.ciclo, extraUsers: o.extra_usuarios, extraWorlds: o.extra_mundos, trial: !pagado && !o.flow, trialLeft: Math.max(0, trialLeft), escribible: !!ctx.escribible, pagadoHasta: o.pagado_hasta, flow: !!o.flow, cancelado: !!o.flow_cancelada });
  Object.keys(ENABLED).forEach(k => ENABLED[k] = o.mundos.includes(k));
  planUI.ciclo = o.ciclo;
  if (ctx.usuarios != null && !USUARIOS.length) for (let i = 0; i < ctx.usuarios; i++) USUARIOS.push({ id: 'x' + i, nombre: '', email: '', rol: 'vendedor', mundos: [], activo: true });
  if (state.world && !puedeMundo(state.world)) { while (pushes.length) popScreen(); ACT.toLobby(); } else if (!$('#lobby').classList.contains('out')) renderLobby();
}
function applyData(data) {
  loadData(deepClean(data));
  if (state.world) rerender(); else renderLobby();
}
let rrTimer = null;
function rerender() {
  clearTimeout(rrTimer);
  rrTimer = setTimeout(() => {
    if (!state.world) { renderLobby(); return; }
    // no rehacer la pantalla mientras alguien escribe en un formulario
    if ($('#sb') || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) { rerender(); return; }
    const sc = $('#scr-' + state.tab) && $('#scr-' + state.tab).scrollTop;
    renderPanel(); renderStock(); renderVentas(); renderCaja(); renderEquipo(); renderDock();
    go(state.tab, true); if ($('#scr-' + state.tab)) $('#scr-' + state.tab).scrollTop = sc;
  }, 250);
}
function applyRemote(col, id, data) {
  if (col === 'config') { if (data && id === 'cat') Object.keys(CAT).forEach(k => { if (data[k]) CAT[k] = deepClean(data[k]); }); if (data && id === 'prefs') PREFS.accent = data.accent || {}; rerender(); return; }
  const arr = COLS[col]; if (!arr) return; const i = arr.findIndex(x => String(x.id) === String(id));
  if (!data) { if (i >= 0) arr.splice(i, 1); } else if (i >= 0) arr[i] = deepClean(data); else arr.push(deepClean(data));
  rerender();
}
RV.bind({ COLS, CAT, PREFS, USUARIOS, isAdmin, duenoOf, applyCtx, applyData, applyRemote, rerender });

async function startCloud(st) {
  applyCtx(st.ctx);
  if (gate.seed) {
    gate.seed = false; const d = demoData();
    const keep = k => ENABLED[k];
    Object.keys(d).forEach(k => { if (Array.isArray(d[k])) d[k] = d[k].filter(x => keep(x.w)); });
    loadData(d); RV.dirty(); toast('Cargamos datos de ejemplo para que explores', 'sparkle');
  } else loadData(deepClean(st.data));
  renderLobby(); $('#lobby').classList.remove('out'); $('#app').hidden = true;
  const only = Object.keys(WORLDS).filter(puedeMundo);
  if (only.length === 1) setTimeout(() => enterWorld(only[0], innerWidth / 2, innerHeight / 2), 300);
  if (!SUB.escribible) setTimeout(() => toast(ME.rol === 'admin' ? 'Tu cuenta está en solo lectura: elige un plan' : 'La cuenta está en solo lectura', 'lock'), 900);
  if (RV.lastError) { const m = RV.lastError; RV.lastError = null; setTimeout(() => toast(m, 'warn'), 1200); }
  RV.dailySync(st.ctx);
  startReminders();
}

/* ---------------------------------------------------------------- estado de guardado */
RV.onStatus = (s, msg) => {
  let el = $('#savechip');
  if (!el) { el = document.createElement('div'); el.id = 'savechip'; el.className = 'savechip'; $('#shell').appendChild(el); }
  el.className = 'savechip ' + s; el.textContent = s === 'guardando' ? 'Guardando…' : s === 'guardado' ? 'Guardado' : s === 'error' ? (msg || 'Sin conexión') : '';
  clearTimeout(el._t); if (s === 'guardado') el._t = setTimeout(() => { el.className = 'savechip'; }, 1400);
  if (s === 'error' && msg) toast(msg, 'warn');
};

/* ---------------------------------------------------------------- recordatorios a la hora */
function startReminders() {
  const fired = new Set(); try { JSON.parse(localStorage.getItem('renueva_fired') || '[]').forEach(x => fired.add(x)); } catch (e) { }
  const check = () => {
    if (!NOTIF.recordatorios) return; const now = nowISO();
    REMS.filter(r => !r.hecho && r.cuando <= now && minsAgo(r.cuando) < 120 && !fired.has(r.id) && puedeMundo(r.w)).forEach(r => {
      fired.add(r.id); try { localStorage.setItem('renueva_fired', JSON.stringify([...fired].slice(-200))); } catch (e) { }
      if (document.visibilityState !== 'visible' && RV.systemNotify('Recordatorio · ' + WORLDS[r.w].name, r.titulo)) return;
      notify('Recordatorio', r.titulo);
    });
  };
  check(); setInterval(check, 30000);
  // cambio de día con la app abierta
  setInterval(() => { const t = isoD(new Date()); if (t !== TODAY) { TODAY = t; CUR = TODAY.slice(0, 7); PREV = monthKey(TODAY, -1); rerender(); } }, 60000);
}

/* ---------------------------------------------------------------- panel de la plataforma */
let platList = [];
async function openPlataformaPanel() {
  const el = pushScreen('Plataforma', `<div class="px" style="padding-top:10px"><div class="empty"><div class="spin" style="margin:0 auto"></div></div></div>`); el.dataset.plat = '1';
  try { platList = await RV.platformOrgs(); } catch (e) { $('.pbody', el).innerHTML = `<div class="px"><div class="tip">${icon('warn')}<span>${clean(e.message)}</span></div></div>`; return; }
  renderPlat();
}
RV.openPlataforma = openPlataformaPanel;
function orgEstado(o) {
  if (o.suspendida) return ['bad', 'Suspendida'];
  if (o.pagado_hasta && new Date(o.pagado_hasta) > new Date()) return ['good', o.flow ? 'Pagando (Flow)' : 'Pagada'];
  if (new Date(o.trial_hasta) > new Date()) return ['accent', 'En prueba'];
  if (o.escribible) return ['warn', 'En gracia'];
  return ['bad', 'Vencida'];
}
function renderPlat() {
  const el = $$('.push').reverse().find(x => x.dataset.plat); if (!el) return;
  const pay = platList.filter(o => o.pagado_hasta && new Date(o.pagado_hasta) > new Date() && !o.suspendida);
  const mrr = sum(pay, o => { const p = planOf(o.plan); return o.ciclo === 'anual' ? Math.round(p.price * 10 / 12) : p.price; });
  const trial = platList.filter(o => !o.suspendida && new Date(o.trial_hasta) > new Date() && !(o.pagado_hasta && new Date(o.pagado_hasta) > new Date()));
  $('.pbody', el).innerHTML = `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px">
    <div class="card" style="background:linear-gradient(160deg,color-mix(in srgb,var(--accent) 12%,var(--s1)),var(--s1) 70%)"><span class="kicker">Ingreso mensual recurrente</span><div class="num" style="font-size:34px;margin-top:10px;line-height:1">${fmt(mrr)}</div><p style="font-size:12px;color:var(--fg3);margin-top:8px">Estimado según plan de cada empresa pagada, IVA incluido.</p></div>
    <div class="grid3" style="gap:10px">${[['Empresas', platList.length], ['Pagando', pay.length], ['En prueba', trial.length]].map(([t, v]) => `<div class="card" style="padding:14px 12px"><span class="kicker" style="font-size:9px">${t}</span><div class="num" style="font-size:28px;margin-top:9px">${v}</div></div>`).join('')}</div>
    <div class="search">${icon('search')}<input placeholder="Buscar empresa o correo…" data-live="platQ" id="plat-q" autocomplete="off"></div>
    <div class="card tight" id="plat-list">${platRows(platList)}</div>
    <p style="font-size:12px;color:var(--fg3);text-align:center">Solo tú ves este panel. Aquí activas planes pagados por transferencia, extiendes pruebas o suspendes cuentas.</p></div>`;
}
function platRows(l) {
  return l.map(o => { const [c, t] = orgEstado(o); return `<button class="row" data-act="platOrg" data-id="${o.id}"><span class="avatar" style="width:44px;height:44px;border-radius:15px;font-size:15px">${initials(o.nombre)}</span><span class="rm"><p class="rt">${clean(o.nombre)}</p><p class="rs"><span style="font-size:11.5px">${o.admin ? clean(o.admin.email) : '—'}</span></p><p class="rs" style="margin-top:5px"><span class="chip">${planOf(o.plan).n}</span><span class="chip">${o.usuarios} usr</span><span class="chip">${o.registros} reg.</span></p></span><span class="rr"><span class="chip ${c}">${t}</span><span class="rs" style="margin:0;font-size:11px">${o.ultimo_uso ? 'uso ' + fechaCorta(o.ultimo_uso) : 'sin uso'}</span></span></button>`; }).join('') || `<div class="empty">${icon('building', 30)}<p>Aún no hay empresas</p></div>`;
}
ACT.platQ = (d, el, e) => { const q = e.target.value.trim().toLowerCase(); $('#plat-list').innerHTML = platRows(platList.filter(o => (o.nombre + ' ' + (o.admin ? o.admin.email : '')).toLowerCase().includes(q))); };
ACT.platOrg = d => {
  const o = platList.find(x => x.id === d.id); if (!o) return; const [c, t] = orgEstado(o);
  openSheet(clean(o.nombre), `<div style="display:flex;flex-direction:column;gap:14px" id="plat-f" data-id="${o.id}">
    <div class="card" style="background:var(--s2)">${drow('Estado', `<span class="chip ${c}">${t}</span>`)}${drow('Administrador', o.admin ? clean(o.admin.nombre) + '<br><span style="font-size:12px;color:var(--fg3)">' + clean(o.admin.email) + '</span>' : '—')}${drow('Creada', fechaCL(o.created_at))}${drow('Prueba hasta', fechaCL(o.trial_hasta))}${drow('Pagado hasta', o.pagado_hasta ? fechaCL(o.pagado_hasta) : '—')}${drow('Cobrado total', fmt(o.cobrado))}${drow('Mundos', o.mundos.map(m => WORLDS[m].name).join(', '))}</div>
    <div class="grid2"><label class="field"><span>Plan</span><select id="pf-plan">${PLANES.map(p => `<option value="${p.k}" ${p.k === o.plan ? 'selected' : ''}>${p.n}</option>`).join('')}</select></label><label class="field"><span>Ciclo</span><select id="pf-ciclo"><option value="mensual" ${o.ciclo === 'mensual' ? 'selected' : ''}>Mensual</option><option value="anual" ${o.ciclo === 'anual' ? 'selected' : ''}>Anual</option></select></label></div>
    <div class="grid2"><label class="field"><span>Usuarios extra</span><input id="pf-eu" type="number" min="0" value="${o.extra_usuarios}"></label><label class="field"><span>Mundos extra</span><input id="pf-em" type="number" min="0" value="${o.extra_mundos}"></label></div>
    <label class="field"><span>Notas internas</span><textarea id="pf-n" placeholder="Contacto, acuerdos, forma de pago…">${clean(o.notas || '')}</textarea></label>
    <button class="btn ghost" data-act="platSave">${icon('check')}Guardar plan y notas</button>
    <p class="kicker" style="margin-top:4px">Pago por transferencia</p>
    <div class="grid2"><label class="field"><span>Monto recibido</span><input id="pf-m" data-money inputmode="numeric" value="${fmt(o.ciclo === 'anual' ? planOf(o.plan).price * 10 : planOf(o.plan).price)}"></label><label class="field"><span>Activo hasta</span><input id="pf-h" type="date" value="${addDays(o.pagado_hasta && o.pagado_hasta.slice(0, 10) > TODAY ? o.pagado_hasta.slice(0, 10) : TODAY, o.ciclo === 'anual' ? 365 : 30)}"></label></div>
    <button class="btn primary" data-act="platPago">${icon('receipt')}Registrar pago y activar</button>
    <div class="grid2"><button class="btn ghost" data-act="platTrial">${icon('clock')}+7 días de prueba</button><button class="btn ${o.suspendida ? 'ghost' : 'danger'}" data-act="platSusp">${icon(o.suspendida ? 'power' : 'lock')}${o.suspendida ? 'Reactivar' : 'Suspender'}</button></div></div>`);
};
async function platDo(cambios, msg) {
  const id = $('#plat-f').dataset.id;
  try { await RV.platformSet(id, cambios); platList = await RV.platformOrgs(); closeSheet(); renderPlat(); toast(msg); } catch (e) { toast(e.message, 'warn'); }
}
ACT.platSave = () => platDo({ plan: $('#pf-plan').value, ciclo: $('#pf-ciclo').value, extra_usuarios: Math.max(0, +$('#pf-eu').value || 0), extra_mundos: Math.max(0, +$('#pf-em').value || 0), notas: $('#pf-n').value }, 'Empresa actualizada');
ACT.platPago = () => { const h = $('#pf-h').value; if (!h) return toast('Elige la fecha', 'warn'); platDo({ plan: $('#pf-plan').value, ciclo: $('#pf-ciclo').value, pagado_hasta: h + 'T23:59:59-03:00', pago_manual: money($('#pf-m').value) }, 'Pago registrado: cuenta activa'); };
ACT.platTrial = () => { const o = platList.find(x => x.id === $('#plat-f').dataset.id), base = new Date(Math.max(Date.now(), new Date(o.trial_hasta))); base.setDate(base.getDate() + 7); platDo({ trial_hasta: base.toISOString() }, 'Prueba extendida 7 días'); };
ACT.platSusp = () => { const o = platList.find(x => x.id === $('#plat-f').dataset.id); if (!o.suspendida && !confirm('¿Suspender esta empresa? Quedará en solo lectura.')) return; platDo({ suspendida: !o.suspendida }, o.suspendida ? 'Empresa reactivada' : 'Empresa suspendida'); };

/* ---------------------------------------------------------------- nombre de la empresa */
ACT.renombrarOrg = () => openSheet('Nombre de la empresa', `<div style="display:flex;flex-direction:column;gap:14px"><label class="field"><span>Nombre</span><input id="ro-n" value="${ORG.nombre}"></label><button class="btn primary" data-act="renombrarOk">${icon('check')}Guardar</button></div>`);
ACT.renombrarOk = async () => { const n = $('#ro-n').value.trim(); if (!n) return; try { await RV.renameOrg(n); closeSheet(); toast('Nombre actualizado'); } catch (e) { toast(e.message, 'warn'); } };
ADMIN_ACTS.add('renombrarOrg'); ADMIN_ACTS.add('renombrarOk');
