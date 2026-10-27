/* =====================================================================
   ENTRADA: iniciar sesión, crear cuenta, crear empresa, invitaciones,
   estado de guardado y panel de la plataforma (dueño de Gestix)
   ===================================================================== */
const gate = { view: 'login', busy: false, err: '', info: '', ctx: null, user: null };

function gateShell(inner) {
  return `<div class="brandbar">${logo(34, 'var(--fg)')}<span class="wordmark">gestix</span></div>${inner}
    <div class="lobby-foot" style="margin-top:auto;padding-top:26px"><span><button type="button" data-act="legal" data-p="privacidad" style="all:unset;cursor:pointer">Privacidad</button> · <button type="button" data-act="legal" data-p="terminos" style="all:unset;cursor:pointer">Términos</button> · <button type="button" data-act="legal" data-p="soporte" style="all:unset;cursor:pointer">Soporte</button></span><a href="?demo" style="color:var(--accent);font-weight:700;text-decoration:none">Ver demo</a></div>`;
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
    <form class="gform">${gErr()}${gInfo()}${gField('g-e', 'Correo', 'email', 'tu@empresa.cl', 'autocomplete="email" inputmode="email"')}${gField('g-p', 'Contraseña', 'password', '••••••••', 'autocomplete="current-password"')}
    ${gBtn('gLogin', 'Entrar')}<div style="display:flex;justify-content:space-between">${gLink('gToRegistro', 'Crear cuenta')}${gLink('gToRecuperar', 'Olvidé mi contraseña')}</div></form>`;
  else if (v === 'registro') h = `<h1>${pendingInv() || enIOS() ? 'Únete a tu equipo' : 'Prueba Gestix 14 días'}</h1><p class="sub">${pendingInv() || enIOS() ? 'Crea tu cuenta con el mismo correo al que te llegó la invitación de tu empresa.' : 'Sin tarjeta. Todos los mundos y hasta 7 usuarios durante la prueba.'}</p>
    <form class="gform">${gErr()}${gField('g-n', 'Tu nombre', 'text', 'Nombre y apellido', 'autocomplete="name"')}${gField('g-e', 'Correo', 'email', 'tu@empresa.cl', 'autocomplete="email" inputmode="email"')}${gField('g-p', 'Contraseña', 'password', 'Mínimo 8 caracteres', 'autocomplete="new-password"')}
    ${gBtn('gRegistro', 'Crear cuenta')}<div>${gLink('gToLogin', 'Ya tengo cuenta')}</div>
    <p style="font-size:11.5px;color:var(--fg3)">Al crear tu cuenta aceptas los <button type="button" data-act="legal" data-p="terminos" style="all:unset;color:var(--accent);cursor:pointer">términos del servicio</button> y la <button type="button" data-act="legal" data-p="privacidad" style="all:unset;color:var(--accent);cursor:pointer">política de privacidad</button>.</p></form>`;
  else if (v === 'verifica') h = `<h1>Revisa tu correo</h1><p class="sub">Te enviamos un enlace para confirmar tu cuenta. Ábrelo desde este mismo dispositivo y vuelves aquí.</p>
    <div class="gform">${gInfo()}${gLink('gToLogin', 'Ya confirmé, entrar')}</div>`;
  else if (v === 'recuperar') h = `<h1>Recupera tu acceso</h1><p class="sub">Te enviamos un enlace para crear una contraseña nueva.</p>
    <form class="gform">${gErr()}${gInfo()}${gField('g-e', 'Correo', 'email', 'tu@empresa.cl', 'autocomplete="email" inputmode="email"')}${gBtn('gRecuperar', 'Enviar enlace', 'send')}<div>${gLink('gToLogin', 'Volver')}</div></form>`;
  else if (v === 'nueva-clave') h = `<h1>Nueva contraseña</h1><p class="sub">Elige una contraseña nueva para tu cuenta.</p>
    <form class="gform">${gErr()}${gField('g-p', 'Contraseña nueva', 'password', 'Mínimo 8 caracteres', 'autocomplete="new-password"')}${gBtn('gNuevaClave', 'Guardar y entrar', 'check')}</form>`;
  else if (v === 'onboarding') {
    const invs = (gate.ctx && gate.ctx.invitaciones) || [], nombre = (gate.user && gate.user.user_metadata && gate.user.user_metadata.nombre) || '';
    h = `<h1>${invs.length ? 'Te están esperando' : enIOS() ? 'Casi listo' : 'Crea tu empresa'}</h1><p class="sub">${invs.length > 1 ? 'Te invitaron de más de una empresa. Elige a cuál quieres entrar: cada cuenta pertenece a una sola empresa.' : invs.length ? 'Tienes una invitación pendiente.' : enIOS() ? 'Para entrar necesitas una invitación de tu empresa.' : 'Elige con qué mundos partes. Puedes cambiarlo después.'}</p>
    <div class="gform">${gErr()}
      ${gate.ctx && gate.ctx.inactivo ? `<div class="tip" style="margin:0">${icon('lock')}<span>Tu usuario fue desactivado por el administrador de tu empresa. Pídele que te vuelva a activar.</span></div>` : ''}
      ${invs.map(i => `<button class="card pressable" data-act="gAceptar" data-t="${clean(i.token)}" style="display:flex;align-items:center;gap:14px;text-align:left;width:100%;border-color:var(--accent)"><span class="thumb" style="background:var(--accent);color:var(--accent-ink)">${icon('people', 22)}</span><span class="grow"><b style="font:700 15px var(--body)">${clean(i.org)}</b><br><span style="font-size:12px;color:var(--fg3)">Te invitaron como ${ROL_TXT[i.rol] || i.rol}</span></span>${icon('arrowR', 16)}</button>`).join('')}
      ${!invs.length && enIOS() && !(gate.ctx && gate.ctx.inactivo) ? `<div class="card" style="font-size:13.5px;color:var(--fg2);line-height:1.5">Tu correo todavía no tiene una invitación. Pide al administrador de tu empresa que te invite desde <b style="color:var(--fg)">Ajustes → Usuarios y permisos</b>, usando este mismo correo.</div><button type="button" class="btn ghost" data-act="gReload">${icon('history')}Ya me invitaron, revisar</button>` : ''}
      ${gate.ctx && gate.ctx.inactivo || enIOS() || invs.length ? '' : `${gField('g-o', 'Nombre de tu empresa', 'text', 'Ej: Automotora Los Andes')}
      <div class="glogo"><label class="addshot mini" id="g-logo">${gate.logo ? `<img src="${gate.logo}" alt="">` : `${icon('camera')}<span>Logo</span>`}<input type="file" accept="image/*" hidden data-change="gLogo"></label><span><b style="font:600 14px var(--body)">Logo de tu empresa</b><br><span style="font-size:12px;color:var(--fg3)">Opcional. Aparece en la app de todo tu equipo.</span></span></div>
      <label class="field"><span>Tu nombre</span><input id="g-n" value="${clean(nombre)}" placeholder="Nombre y apellido"></label>
      <div><p class="kicker" style="margin-bottom:10px">¿En qué trabajas?</p><div class="optrow" id="g-m">${Object.values(WORLDS).map(w => `<button class="opt ${gate.mundos.includes(w.key) ? 'on' : ''}" data-act="gMundo" data-w="${w.key}">${icon(w.icon)}${w.name}</button>`).join('')}</div></div>
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px"><span><b style="font:600 14px var(--body)">Partir con datos de ejemplo</b><br><span style="font-size:12px;color:var(--fg3)">Para conocer la app. Los borras cuando quieras.</span></span><button class="toggle ${gate.ejemplo ? 'on' : ''}" data-act="gEjemplo" aria-label="Datos de ejemplo"></button></div>
      ${gBtn('gCrearOrg', 'Crear empresa y empezar', 'check')}`}
      <div>${gLink('gSalir', 'Cerrar sesión')}</div></div>`;
  }
  else if (v === 'setup') h = `<h1>Falta un paso</h1><p class="sub">La app ya está conectada a Supabase, pero la base de datos aún no tiene las tablas de Gestix.</p>
    <div class="gform"><div class="card" style="font-size:13px;color:var(--fg2);line-height:1.5">En Supabase abre <b style="color:var(--fg)">SQL Editor</b>, pega el contenido del archivo <span class="mono" style="font-size:11.5px">supabase/migrations/20261023000000_renueva.sql</span> y presiona <b style="color:var(--fg)">Run</b>. Luego recarga esta página.</div>
    <button type="button" class="btn primary" data-act="gReload">${icon('history')}Ya lo hice, recargar</button><div>${gLink('gSalir', 'Cerrar sesión')}</div></div>`;
  else if (v === 'error') h = `<h1>No pudimos conectar</h1><p class="sub">${clean(gate.err || 'Revisa tu conexión a internet.')}</p><div class="gform"><button type="button" class="btn primary" data-act="gReload">${icon('history')}Reintentar</button><div>${gLink('gSalir', 'Cerrar sesión')}</div></div>`;
  L.innerHTML = gateShell(h); L.classList.remove('out'); $('#app').hidden = true;
  const f = $('input', L); if (f && !('ontouchstart' in window)) f.focus();
}
const pendingInv = () => window.RV && RV.pendingInvite && RV.pendingInvite();
gate.mundos = ['auto']; gate.ejemplo = false;
const gv = id => ($('#' + id) || { value: '' }).value.trim();
async function gRun(fn) {
  if (gate.busy) return;
  const vals = {}; $$('#lobby input').forEach(i => { if (i.id && i.type !== 'file') vals[i.id] = i.value; });
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
ACT.gLogo = async (d, el) => { const f = el.files[0]; el.value = ''; if (!f) return; try { gate.logo = await readLogo(f); $$('#g-logo > :not(input)').forEach(x => x.remove()); $('#g-logo').insertAdjacentHTML('afterbegin', `<img src="${gate.logo}" alt="">`); } catch (e) { toast('No se pudo leer la imagen. Prueba con otra (JPG o PNG).', 'warn'); } };
ACT.gEjemplo = (d, el) => { gate.ejemplo = !gate.ejemplo; el.classList.toggle('on', gate.ejemplo); };
ACT.gCrearOrg = () => gRun(async v => {
  const o = clean(v['g-o'] || '').trim(); if (!o) throw new Error('Escribe el nombre de tu empresa');
  await RV.createOrg(o, gate.mundos, clean(v['g-n'] || '').trim());
  gate.seed = gate.ejemplo; await afterAuth();
});
ACT.gAceptar = d => gRun(async () => { await RV.acceptInvite(d.t); await afterAuth(); });
ACT.gSalir = () => RV.logout();
ACT.gReload = () => location.reload();
// los formularios de entrada nunca se envían solos (todo pasa por los botones)
document.addEventListener('submit', e => e.preventDefault());
RV.onRecovery = () => renderGate('nueva-clave');

async function afterAuth() {
  const st = await RV.enter();
  if (st.gate) { gate.ctx = st.ctx || null; gate.user = st.user || null; gate.err = st.error || RV.lastError || ''; RV.lastError = null; gate.view = st.gate; return; }
  gate.view = 'app'; startCloud(st);
}

/* ---------------------------------------------------------------- aplicar contexto y datos */
function applyCtx(ctx) {
  ctx = deepClean(ctx);
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
    // si la animación de la pestaña está corriendo, se espera a que termine (si no, los números saltaban al final)
    if (Date.now() < animHasta) { clearTimeout(rrTimer); rrTimer = setTimeout(rerender, animHasta - Date.now()); return; }
    // no rehacer la pantalla mientras alguien escribe en un formulario
    if ($('#sb') || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) { rerender(); return; }
    const sc = $('#scr-' + state.tab) && $('#scr-' + state.tab).scrollTop;
    renderPanel(); renderStock(); renderVentas(); renderCaja(); renderEquipo(); renderDock(); quietas();
    go(state.tab, true); if ($('#scr-' + state.tab)) $('#scr-' + state.tab).scrollTop = sc;
  }, 250);
}
// avisos del flujo de aprobación de ventas
function avisoAprobacion(antes, v) {
  if (isAdmin() && v.aprob === 'pendiente' && antes !== 'pendiente') notify('Venta por aprobar', `${v.vend} · ${v.cliente} · ${fmtM(v.ingreso)}`);
  if (isVend() && antes === 'pendiente' && v.aprob === 'aprobada') notify('Venta aprobada', `${v.cliente} · tu comisión ${fmt(comision(v))}`);
  if (isVend() && antes === 'pendiente' && v.aprob === 'rechazada') notify('Venta rechazada', v.motivo || 'Revisa con el administrador');
}
function avisoItem(antes, it, nuevo) {
  if (isAdmin() && it.aprob === 'pendiente' && antes !== 'pendiente') notify(`${WORLDS[it.w] ? WORLDS[it.w].itemOne : 'Ítem'} por aprobar`, `${it.creadoPor ? it.creadoPor.nombre : 'Un vendedor'} ingresó ${it.nombre}${(it.w === 'tienda' ? it.costoU : it.costo) ? ' · compra ' + fmtM(it.w === 'tienda' ? it.costoU : it.costo) : it.precioSug ? ' · sugiere ' + fmtM(it.precioSug) : ''}`, () => openItem(it.id));
  if (isVend() && antes === 'pendiente' && !it.aprob && !nuevo) notify('Precio listo', `${it.nombre} quedó a la venta en ${fmtM(it.precio)}`, () => openItem(it.id));
}
function applyRemote(col, id, data) {
  if (col === 'config') { if (data && id === 'cat') Object.keys(CAT).forEach(k => { if (data[k]) CAT[k] = deepClean(data[k]); }); if (data && id === 'prefs') { PREFS.accent = data.accent || {}; PREFS.logo = data.logo || null; } rerender(); return; }
  const arr = COLS[col]; if (!arr) return; const i = arr.findIndex(x => String(x.id) === String(id));
  if (col === 'ventas' && data) avisoAprobacion(i >= 0 ? arr[i].aprob : null, deepClean(data));
  if (col === 'items' && data) avisoItem(i >= 0 ? arr[i].aprob : null, deepClean(data), i < 0);
  if (!data) { if (i >= 0) arr.splice(i, 1); } else if (i >= 0) arr[i] = deepClean(data); else arr.push(deepClean(data));
  rerender();
}
RV.bind({ COLS, CAT, PREFS, USUARIOS, isAdmin, duenoOf, deepClean, applyCtx, applyData, applyRemote, rerender });

async function startCloud(st) {
  applyCtx(st.ctx);
  if (gate.seed) {
    gate.seed = false; const d = demoData();
    const keep = k => ENABLED[k];
    Object.keys(d).forEach(k => { if (Array.isArray(d[k])) d[k] = d[k].filter(x => keep(x.w)); });
    loadData(d); RV.dirty(); toast('Cargamos datos de ejemplo para que explores', 'sparkle');
  } else loadData(deepClean(st.data));
  // el logo elegido al crear la empresa se sube apenas existe la empresa
  if (gate.logo && isAdmin()) { const l = gate.logo; gate.logo = null; storeImage(l).then(p => { PREFS.logo = p; saved(); rerender(); }).catch(() => toast('No se pudo subir el logo. Súbelo desde Ajustes → Tu empresa.', 'warn')); }
  renderLobby(); $('#lobby').classList.remove('out'); $('#app').hidden = true;
  const only = Object.keys(WORLDS).filter(puedeMundo);
  if (only.length === 1) setTimeout(() => enterWorld(only[0], innerWidth / 2, innerHeight / 2), 300);
  if (!SUB.escribible) setTimeout(() => toast(ME.rol === 'admin' ? 'Tu cuenta está en solo lectura: elige un plan' : 'La cuenta está en solo lectura', 'lock'), 900);
  if (RV.lastError) { const m = RV.lastError; RV.lastError = null; setTimeout(() => toast(m, 'warn'), 1200); }
  RV.dailySync(st.ctx);
  startReminders();
  if (RV.syncReminders) RV.syncReminders(REMS.filter(r => puedeMundo(r.w)));
  if (RV.pushRefrescar) RV.pushRefrescar();
  // se abrió desde una notificación: ir directo al recordatorio
  const q = new URLSearchParams(location.search), rem = q.get('rem');
  if (rem) { q.delete('rem'); q.delete('w'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); setTimeout(() => abrirRecordatorio(rem), 700); }
}
// con la app ya abierta, la notificación tocada llega como mensaje del service worker
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => {
  const u = e.data && e.data.abrir; if (!u) return;
  const rem = new URL(u, location.origin).searchParams.get('rem'); if (rem && REMS.some(r => r.id === rem)) abrirRecordatorio(rem);
});

/* ---------------------------------------------------------------- estado de guardado */
RV.onStatus = (s, msg) => {
  let el = $('#savechip');
  if (!el) { el = document.createElement('div'); el.id = 'savechip'; el.className = 'savechip'; $('#shell').appendChild(el); }
  // el guardado es automático: solo se avisa cuando algo NO se guardó (queda visible hasta que se resuelve)
  el.className = 'savechip' + (s === 'error' ? ' error' : ''); el.textContent = s === 'error' ? (navigator.onLine === false ? 'Sin conexión' : 'Sin guardar') : '';
  if (s === 'error' && msg) toast(msg, 'warn');
};

/* ---------------------------------------------------------------- recordatorios a la hora */
function startReminders() {
  const fired = new Set(); try { JSON.parse(localStorage.getItem('renueva_fired') || '[]').forEach(x => fired.add(x)); } catch (e) { }
  const check = () => {
    if (!NOTIF.recordatorios) return; const now = nowISO();
    REMS.filter(r => !r.hecho && r.cuando <= now && minsAgo(r.cuando) < 120 && !fired.has(r.id + '@' + r.cuando) && puedeMundo(r.w)).forEach(r => {
      fired.add(r.id + '@' + r.cuando); try { localStorage.setItem('renueva_fired', JSON.stringify([...fired].slice(-200))); } catch (e) { }
      if (document.visibilityState !== 'visible' && RV.systemNotify('Recordatorio · ' + WORLDS[r.w].name, r.titulo)) return;
      notify('Recordatorio', r.titulo, () => abrirRecordatorio(r.id));
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
  try {
    await RV.platformSet(id, cambios); platList = await RV.platformOrgs(); closeSheet(); renderPlat(); toast(msg);
    if (id === ORG.id) await RV.refreshContext(); // si es tu propia empresa, la app se actualiza al tiro
  } catch (e) { toast(e.message, 'warn'); }
}
// al volver a la app se relee el plan (pruebas extendidas, pagos registrados por transferencia)
let ctxAt = Date.now();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !window.RV || RV.mode !== 'cloud' || !ORG.id || Date.now() - ctxAt < 60000) return;
  ctxAt = Date.now(); RV.refreshContext().catch(() => { });
});
ACT.platSave = () => platDo({ plan: $('#pf-plan').value, ciclo: $('#pf-ciclo').value, extra_usuarios: Math.max(0, +$('#pf-eu').value || 0), extra_mundos: Math.max(0, +$('#pf-em').value || 0), notas: $('#pf-n').value }, 'Empresa actualizada');
ACT.platPago = () => { const h = $('#pf-h').value; if (!h) return toast('Elige la fecha', 'warn'); platDo({ plan: $('#pf-plan').value, ciclo: $('#pf-ciclo').value, pagado_hasta: h + 'T23:59:59-03:00', pago_manual: money($('#pf-m').value) }, 'Pago registrado: cuenta activa'); };
ACT.platTrial = () => { const o = platList.find(x => x.id === $('#plat-f').dataset.id), base = new Date(Math.max(Date.now(), new Date(o.trial_hasta))); base.setDate(base.getDate() + 7); platDo({ trial_hasta: base.toISOString() }, 'Prueba extendida 7 días'); };
ACT.platSusp = () => { const o = platList.find(x => x.id === $('#plat-f').dataset.id); if (!o.suspendida && !confirm('¿Suspender esta empresa? Quedará en solo lectura.')) return; platDo({ suspendida: !o.suspendida }, o.suspendida ? 'Empresa reactivada' : 'Empresa suspendida'); };

/* ---------------------------------------------------------------- nombre de la empresa */
ACT.renombrarOrg = () => openSheet('Tu empresa', `<div style="display:flex;flex-direction:column;gap:16px">
  <div class="orgedit"><span id="ro-prev">${orgLogo(84)}</span><div style="display:flex;flex-direction:column;gap:8px;flex:1"><label class="btn ghost small">${icon('camera', 15)}${PREFS.logo ? 'Cambiar logo' : 'Subir logo'}<input type="file" accept="image/*" hidden data-change="orgLogo"></label>${PREFS.logo ? `<button class="btn ghost small" data-act="orgLogoRm">${icon('trash', 15)}Quitar</button>` : ''}</div></div>
  <p style="font-size:12px;color:var(--fg3);margin-top:-6px">Tu logo aparece en el inicio, en el panel y en la versión de computador de todo tu equipo. Ideal cuadrado y con fondo transparente (PNG).</p>
  <label class="field"><span>Nombre</span><input id="ro-n" value="${clean(ORG.nombre)}"></label><button class="btn primary" data-act="renombrarOk">${icon('check')}Guardar</button></div>`);
ACT.orgLogo = async (d, el) => {
  const f = el.files[0]; el.value = ''; if (!f) return; toast('Subiendo logo…', 'camera');
  let img; try { img = await readLogo(f); } catch (e) { toast('No se pudo leer la imagen. Prueba con otra (JPG o PNG).', 'warn'); return; }
  try { PREFS.logo = await storeImage(img); saved(); rerender(); renderDock(); closeSheet(); ACT.renombrarOrg(); toast('Logo actualizado'); }
  catch (e) { console.error(e); toast('No se pudo subir el logo. Revisa tu conexión e inténtalo de nuevo.', 'warn'); }
};
ACT.orgLogoRm = () => { PREFS.logo = null; saved(); rerender(); renderDock(); closeSheet(); ACT.renombrarOrg(); };
ACT.renombrarOk = async () => {
  const n = clean($('#ro-n').value.trim()); if (!n) return;
  if (n === ORG.nombre) { closeSheet(); return; }
  try { if (window.RV && RV.mode === 'cloud') await RV.renameOrg(n); else ORG.nombre = n; closeSheet(); rerender(); renderDock(); toast('Nombre actualizado'); } catch (e) { toast(e.message, 'warn'); }
};
['renombrarOrg', 'renombrarOk', 'orgLogo', 'orgLogoRm'].forEach(a => ADMIN_ACTS.add(a));
