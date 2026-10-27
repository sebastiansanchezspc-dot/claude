/* =====================================================================
   LOBBY (elige tu mundo) + pantallas principales por mundo
   ===================================================================== */
const hoyTxt = () => dateOf(TODAY).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '').replace(',', '');

function renderLobby() {
  const art = { auto: 'car', prop: 'building', tienda: 'bag' };
  const sample = { auto: plate('KLPR·90'), prop: rolTag('004-112'), tienda: skuTag('NK-AM-42') };
  const stat = { auto: () => `<b>${activos('auto').length}</b> vehículos`, prop: () => `<b>${activos('prop').length}</b> propiedades`, tienda: () => `<b>${activos('tienda').length}</b> productos` };
  $('#lobby').innerHTML = `
    <div class="brandbar">${logo(34, 'var(--fg)')}<span class="wordmark">gestix</span></div>
    <h1>¿Dónde trabajamos hoy?</h1>
    <p class="sub">Cada mundo es un espacio separado: su inventario, su caja y su equipo. Nada se mezcla.</p>
    <div class="worlds">${Object.values(WORLDS).map((w, i) => `
      <button class="wcard${puedeMundo(w.key) ? '' : ' locked'}" data-act="${puedeMundo(w.key) ? 'enter' : 'lockedWorld'}" data-world="${w.key}" style="--wc:${w.accent};--wink:${w.ink};animation-delay:${i * 90 + 120}ms" aria-label="Entrar a ${w.brand}">
        <div class="art">${icon(art[w.key], 150, 1)}</div>
        <div class="go">${icon(puedeMundo(w.key) ? 'arrowR' : 'lock', 16, 2.2)}</div>
        ${sample[w.key]}
        <div class="wname">${w.name}</div>
        <div class="wdesc">${w.desc}</div>
        <div class="wstats"><span>${stat[w.key]()}</span><span><b>${alertsFor(w.key).length}</b> alertas</span></div>
      </button>`).join('')}</div>
    ${lobbyBanner()}
    <div class="lobby-foot"><button data-act="ajustesLobby" style="all:unset;cursor:pointer">${ME.nombre} · Plan ${planNow().n}${!SUB.escribible ? ' · solo lectura' : SUB.trial ? ` · prueba ${SUB.trialLeft} día${SUB.trialLeft === 1 ? '' : 's'}` : ''}</button><span class="mono" style="font-size:10.5px;letter-spacing:.1em">${window.RV && RV.mode === 'cloud' ? ORG.nombre.toUpperCase().slice(0, 22) : 'DEMO'}</span></div>`;
}

function lobbyBanner() {
  if (window.RV && RV.mode === 'demo') return `<div class="tip good" style="margin-top:18px">${icon('sparkle')}<span>Estás viendo la demo con datos de ejemplo. Nada se guarda. <button data-act="crearCuenta" style="background:none;border:0;color:inherit;font:700 12.5px var(--body);text-decoration:underline;padding:0">Crear mi cuenta</button></span></div>`;
  if (enIOS()) return !SUB.escribible ? `<div class="tip" style="margin-top:18px">${icon('lock')}<span>La cuenta de tu empresa está en solo lectura. Puedes ver toda tu información.</span></div>` : '';
  if (!SUB.escribible) return `<div class="tip" style="margin-top:18px">${icon('lock')}<span>${SUB.trial ? 'Tu prueba gratis terminó' : 'Tu plan está vencido'}. Puedes ver todo, pero para seguir registrando ${isAdmin() ? '<button data-act="planLobby" style="background:none;border:0;color:inherit;font:700 12.5px var(--body);text-decoration:underline;padding:0">elige un plan</button>' : 'pide al administrador que elija un plan'}.</span></div>`;
  if (SUB.trial && SUB.trialLeft <= 5 && isAdmin()) return `<div class="tip" style="margin-top:18px">${icon('clock')}<span>Quedan ${SUB.trialLeft} días de prueba. <button data-act="planLobby" style="background:none;border:0;color:inherit;font:700 12.5px var(--body);text-decoration:underline;padding:0">Elegir plan</button></span></div>`;
  return '';
}
// desde el inicio: entra al primer mundo disponible y abre la pantalla pedida
function lobbyOpen(fn) {
  const k = (state.world && puedeMundo(state.world)) ? state.world : Object.keys(WORLDS).find(puedeMundo) || Object.keys(WORLDS).find(k => ENABLED[k]);
  if (!k) return toast('No tienes mundos asignados', 'lock');
  enterWorld(k, innerWidth / 2, innerHeight / 2); setTimeout(fn, 520);
}
ACT.ajustesLobby = () => lobbyOpen(openAjustes);
ACT.planLobby = () => lobbyOpen(openPlan);
ACT.crearCuenta = () => { location.href = location.pathname + '?registro=1'; };
function enterWorld(key, x, y) {
  const iris = $('#iris'), shell = $('#shell'), r = shell.getBoundingClientRect();
  iris.style.background = WORLDS[key].accent;
  iris.style.setProperty('--ix', (x - r.left) + 'px'); iris.style.setProperty('--iy', (y - r.top) + 'px');
  iris.classList.remove('go'); void iris.offsetWidth; iris.classList.add('go');
  setTimeout(() => {
    state.world = key; state.tab = 'panel'; state.fFilter = 'todos'; state.fSort = 'rec'; state.q = ''; state.fBucket = null; state.fVend = null;
    shell.dataset.world = key; $('#app').hidden = false; renderAll();
    $('#lobby').classList.add('out'); $('#app').classList.remove('quieto'); go('panel', true, true);
    setTimeout(() => $('#app').classList.add('quieto'), 1800);
    try { localStorage.setItem('renueva_world', key); } catch (e) { }
    if (PREFS.accent[key]) setAccent(PREFS.accent[key]); else resetAccent();
    if (window.RV && RV.mode === 'demo' && key === 'auto' && !window._notified) { window._notified = 1; setTimeout(() => { const r = REMS.find(x => /Daniela Cort/.test(x.titulo)); notify('Recordatorio vencido', 'Enviar fotos del interior a Daniela Cortés', r ? () => abrirRecordatorio(r.id) : null); }, 4500); }
  }, 330);
  setTimeout(() => iris.classList.remove('go'), 900);
}
// mundo no activado: el administrador lo activa si su plan tiene cupo
ACT.lockedWorld = d => {
  const w = WORLDS[d.world]; if (!w) return;
  if (!isAdmin()) { toast(ENABLED[d.world] ? 'Pídele al administrador que te dé acceso a ' + w.name : 'Este mundo no está activo en tu empresa', 'lock'); return; }
  const cupo = nWorlds() < limWorlds();
  openSheet(`${w.brand}`, `<div style="display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;gap:14px;align-items:center"><span class="thumb" style="width:52px;height:52px;background:${w.accent};color:${w.ink}">${icon(w.icon, 24, 2)}</span><p style="font-size:14px;color:var(--fg2);line-height:1.45">${w.desc}. Tiene su propio stock, ventas, caja y equipo, separados de los demás mundos.</p></div>
    ${cupo ? `<p style="font-size:13px;color:var(--fg3)">Tu plan ${planNow().n} incluye ${limWorlds()} mundo${limWorlds() > 1 ? 's' : ''} y usas ${nWorlds()}.</p><button class="btn primary" data-act="activarMundo" data-world="${w.key}">${icon('check')}Activar ${w.name}</button>`
      : `<p style="font-size:13px;color:var(--fg3)">Tu plan ${planNow().n} incluye ${limWorlds()} mundo${limWorlds() > 1 ? 's' : ''} y ya los usas.${enIOS() ? '' : ' Para sumar este, cambia de plan o desactiva otro mundo.'}</p>${enIOS() ? '' : `<button class="btn ghost" data-act="planLobby">${icon('crown')}Ver planes</button>`}`}</div>`);
};
ACT.activarMundo = async (d, el) => {
  el.disabled = true; el.textContent = 'Activando…';
  try {
    if (window.RV && RV.mode === 'cloud') await RV.activarMundo(d.world); else ENABLED[d.world] = true;
    closeSheet(); toast(WORLDS[d.world].name + ' activado'); renderLobby();
    setTimeout(() => enterWorld(d.world, innerWidth / 2, innerHeight / 2), 350);
  } catch (e) { toast(e.message, 'warn'); el.disabled = false; el.textContent = 'Activar ' + WORLDS[d.world].name; }
};
ACT.enter = (d, el, e) => enterWorld(d.world, e.clientX || 215, e.clientY || 400);
ACT.worlds = () => openSheet('Cambiar de mundo', `
  <div class="stack" style="display:flex;flex-direction:column;gap:10px">${Object.values(WORLDS).map(w => `
    <button class="card pressable" data-act="${puedeMundo(w.key) ? 'switchWorld' : 'lockedWorld'}" data-world="${w.key}" style="display:flex;align-items:center;gap:14px;text-align:left;border-color:${state.world === w.key ? w.accent : 'var(--line)'};--wc:${w.accent}">
      <span class="thumb" style="background:${w.accent};color:${w.ink}">${icon(w.icon, 22, 2)}</span>
      <span class="grow"><b style="font:700 16px var(--display);font-variation-settings:'wdth' 85">${w.brand}</b><br><span style="font-size:12.5px;color:var(--fg3)">${w.desc}</span></span>
      ${state.world === w.key ? `<span class="chip accent">Aquí</span>` : puedeMundo(w.key) ? icon('chevR', 16) : `<span class="chip">${icon('lock', 12)}${isAdmin() ? 'Activar' : 'Sin acceso'}</span>`}
    </button>`).join('')}
  </div>
  <button class="btn ghost" data-act="toLobby">${icon('gauge')}Volver al inicio</button>`);
ACT.switchWorld = (d, el, e) => { if (!puedeMundo(d.world)) { ACT.lockedWorld(d); return; } closeSheet(); if (d.world === state.world) return; while (pushes.length) popScreen(); enterWorld(d.world, e.clientX || 215, e.clientY || 700); };
ACT.toLobby = () => { closeSheet(); while (pushes.length) popScreen(); renderLobby(); $('#lobby').classList.remove('out'); setTimeout(() => { $('#app').hidden = true; }, 500); };

/* ---------------- cabecera y dock ---------------- */
function hdr(title, kicker, extra = '') {
  const w = W(), n = alertsFor(w.key).filter(a => a.sev === 'bad' || a.sev === 'warn').length;
  return `<header class="hd px"><div class="hd-row">
    <button class="worldchip" data-act="worlds" aria-label="Cambiar de mundo"><span class="mk">${icon(w.icon, 16, 2)}</span>${w.name}${icon('chevD', 14)}</button>
    <span class="hd-title">${title}</span>
    <div class="hd-actions">${extra}<button class="ibtn" data-act="alerts" aria-label="Alertas">${icon('bell')}${n ? `<span class="badge">${n}</span>` : ''}</button><button class="ibtn" data-act="ajustes" aria-label="Ajustes" style="font:700 12px var(--display)">${initials(ME.nombre)}</button></div>
  </div></header><div class="hd-large px"><p class="kicker">${kicker}</p><h1>${title}</h1></div>`;
}
function sec(label, count = '', more = '') { return `<div class="sec"><span class="kicker">${label}</span>${count !== '' ? `<span class="count">${count}</span>` : ''}${more}</div>`; }
const TABS_ALL = () => [{ k: 'panel', l: 'Panel', i: 'gauge' }, { k: 'stock', l: W().tabs.stock, i: W().icon }, { k: 'ventas', l: W().tabs.ventas, i: 'dollar' }, { k: 'caja', l: 'Caja', i: 'calc' }, { k: 'equipo', l: 'Equipo', i: 'people' }];
const TABS = () => isVend() ? TABS_ALL().filter(t => ['panel', 'stock', 'ventas'].includes(t.k)) : TABS_ALL();
function renderDock() {
  $('#dock').innerHTML = `<div class="dock-brand">${logo(26, 'var(--fg)')}gestix</div><span class="pill" id="pill"></span>` + TABS().map(t => `<button data-act="tab" data-tab="${t.k}" class="${state.tab === t.k ? 'active' : ''}" aria-label="${t.l}">${icon(t.i, 22)}<span>${t.l}</span></button>`).join('');
  movePill(true);
}
function movePill(instant) {
  const b = $('#dock button.active'), p = $('#pill'); if (!b || !p) return;
  if (instant) p.style.transition = 'none';
  // en el computador el menú es vertical (a la izquierda)
  if (getComputedStyle($('#dock')).flexDirection === 'column') { p.style.width = ''; p.style.height = b.offsetHeight + 'px'; p.style.transform = `translateY(${b.offsetTop}px)`; }
  else { p.style.height = ''; p.style.width = b.offsetWidth + 'px'; p.style.transform = `translateX(${b.offsetLeft - 5}px)`; }
  if (instant) { void p.offsetWidth; p.style.transition = ''; }
}
let animHasta = 0; // mientras corre la animación de una pestaña, los refrescos de datos esperan
function go(tab, instant, animar) {
  state.tab = tab;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + tab));
  $$('#dock button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  movePill(instant);
  // al tocar la pestaña la animación sale una sola vez; al refrescarse los datos solos, todo aparece en su valor
  const s = $('#scr-' + tab); if (!s) return;
  if (!animar) { sinAnimar(s); return; }
  // al tocar la pestaña: todas las animaciones de entrada, una sola vez (y después no se toca nada)
  const els = $$('.reveal,.row,.alert,.qa button', s); els.forEach(e => { e.style.animation = 'none'; }); void s.offsetWidth; els.forEach(e => { e.style.animation = ''; });
  reanimar(s); animHasta = Date.now() + 1800;
}
ACT.tab = d => go(d.tab, false, true);
window.addEventListener('resize', () => movePill(true));

/* ---------------- PANEL ---------------- */
function cumSeries(w) {
  const mk = MK(), vs = ventasOf(w, mk), gs = gastosMes(w, mk), out = []; let acc = 0;
  const hasta = esMesActual() ? +TODAY.slice(8, 10) : diasMes(mk);
  for (let d = 1; d <= hasta; d++) { const ds = `${mk}-${pad2(d)}`; acc += sum(vs.filter(v => v.fecha === ds), utilidad) - sum(gs.filter(g => g.fecha === ds), g => g.monto); out.push(acc); }
  return out.length > 1 ? out : [0, ...out, ...(out.length ? [] : [0])];
}
// honorarios probables: cada propiedad activa vale según la mejor etapa de sus consultas
const PROB = [[4, 'Promesa por firmar', 0.8], [3, 'En negociación', 0.35], [2, 'Con visitas', 0.25], [1, 'Con interesados', 0.12], [0, 'Consulta nueva', 0.06]];
function forecastProps() {
  const rows = activos('prop').map(it => {
    const best = it.estado === 'reservado' ? 4 : Math.max(-1, ...LEADS.filter(l => l.itemId === it.id && RANK[l.etapa] >= 0 && RANK[l.etapa] <= 4).map(l => RANK[l.etapa]));
    const p = PROB.find(x => x[0] === best); if (!p) return null;
    const hon = it.op === 'Arriendo' ? it.precio : Math.round(it.precio * 0.04);
    return { id: it.id, it, etapa: p[1], prob: p[2], hon, pond: Math.round(hon * p[2]) };
  }).filter(Boolean).sort((a, b) => b.pond - a.pond).slice(0, 5);
  return { rows, total: sum(rows, r => r.pond) };
}
function heroHtml(w) {
  const st = monthStats(w.key, MK()), pv = monthStats(w.key, MKP()), series = cumSeries(w.key);
  const be = series.findIndex(v => v >= 0);
  const dl = st.neta - pv.neta;
  const p = Math.max(0, st.neta) / (PREFS.meta && PREFS.meta[w.key] || w.meta);
  let s3;
  if (w.key === 'auto') {
    const per = st.n ? st.bruta / st.n : 0;
    s3 = [['Ventas', `${st.n} un.`], ['Margen/un.', fmtM(per)], ['Comisiones', fmtM(st.com)]];
  } else if (w.key === 'prop') {
    s3 = [['Operaciones', `${st.n}`], ['Cerrado', fmtM(st.volumen)], esMesActual() ? ['Proyectado', fmtM(forecastProps().total)] : ['Honorarios', fmtM(st.ingreso)]];
  } else {
    const hoy = ventasOf('tienda').filter(v => v.fecha === TODAY);
    s3 = [esMesActual() ? ['Ventas hoy', fmtM(sum(hoy, v => v.ingreso))] : ['Vendido', fmtM(st.ingreso)], ['Margen', `${st.ingreso ? Math.round(st.bruta / st.ingreso * 100) : 0}%`], ['Ticket prom.', fmtM(st.n ? st.ingreso / st.n : 0)]];
  }
  return `<div class="hero reveal">
    <div class="hero-top"><div class="grow"><span class="kicker">Utilidad neta · ${mesDe(MK())}</span>
      <span class="big">${odo(st.neta)}</span>
      <span class="delta ${dl < 0 ? 'neg' : ''}"><span class="l1">${icon(dl < 0 ? 'arrowDn' : 'arrowUp', 13, 2.4)}${fmtM(Math.abs(dl))}<span>vs ${mesDe(MKP()).toLowerCase()}</span></span>${be > 0 && be < series.length - 1 ? `<span class="l2">Equilibrio el ${be + 1} ${mesDe(MK()).slice(0, 3).toLowerCase()}</span>` : ''}</span></div>
      ${ring(p, 'META')}</div>
    ${spark(series)}
    <div class="stat3">${s3.map(([k, v]) => `<div><span class="kicker">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
  </div>`;
}
function atencionHtml(w) {
  const al = alertsFor(w.key), top = al.slice(0, 4);
  return sec('Atención hoy', al.length, al.length > 4 ? `<button class="more" data-act="alerts">Ver todas</button>` : '') + `
  <div class="card tight reveal" style="animation-delay:.08s">${top.length ? '' : `<div class="empty">${icon('check', 30)}<p>Nada pendiente por ahora. Aquí aparecen consultas sin responder, papeles por vencer y cobros.</p></div>`}${top.map((a, i) => `
    <button class="alert" data-act="alert" data-i="${i}" style="animation-delay:${.12 + i * .07}s">
      <span class="ai ${a.sev}">${icon(a.icon)}</span>
      <span class="grow"><p class="at">${a.title}</p><p class="as">${a.sub}</p></span><span class="ar">${icon('chevR')}</span>
    </button>`).join('')}</div>`;
}
function saludHtml(w) {
  let rows, B, cells, m3, tip, title;
  if (w.key === 'tienda') {
    B = BUCKETS_T; title = 'Inventario · días sin venta';
    rows = activos('tienda').map(i => ({ b: bucketT(daysSince(i.ultimaVenta)), cap: i.costoU * i.stock, it: i }));
    const val = sum(rows, r => r.cap), muerto = sum(rows.filter(r => r.b >= 2), r => r.cap);
    cells = B.map((b, k) => { const rs = rows.filter(r => r.b === k); return { l: b.l, c: b.c, n: rs.length, sub: fmtM(sum(rs, r => r.cap)) }; });
    const v30 = sum(itemsOf('tienda'), ventas30);
    m3 = [['Inventario', fmtM(val)], ['Cobertura', v30 ? `${Math.round(sum(itemsOf('tienda'), i => i.stock) / (v30 / 30))} días` : '—'], ['Quiebres', `${itemsOf('tienda').filter(i => i.stock < i.minimo).length}`]];
    tip = muerto > 0 ? { c: '', t: `${fmtM(muerto)} están en productos con más de 30 días sin venderse. Cada semana parado es plata que no rota.` } : { c: 'good', t: 'Todo tu inventario está rotando.' };
  } else {
    B = BUCKETS; title = w.key === 'auto' ? 'Salud del stock' : 'Salud de la cartera';
    rows = activos(w.key).map(i => ({ b: bucketIdx(diasStock(i)), cap: i.costo + i.recon, it: i }));
    const n = rows.length, viejo = rows.filter(r => diasStock(r.it) > 45).length, pct = n ? Math.round(viejo / n * 100) : 0;
    cells = B.map((b, k) => { const rs = rows.filter(r => r.b === k); return { l: b.l, c: b.c, n: rs.length, sub: w.key === 'auto' ? fmtM(sum(rs, r => r.cap)) : `${rs.length ? Math.round(sum(rs, r => visitasDe(r.it)) / rs.length) : 0} visitas` }; });
    if (w.key === 'auto') {
      m3 = [['Días prom.', `${n ? Math.round(sum(rows, r => diasStock(r.it)) / n) : 0}d`], ['Margen prom.', fmtM(ventasOf('auto').length ? sum(ventasOf('auto'), utilidad) / ventasOf('auto').length : 0)], ['Congelado', fmtM(sum(rows.filter(r => r.b >= 2), r => r.cap))]];
      tip = !n ? { c: 'good', t: 'Ingresa tu primer vehículo con el botón + en Stock.' } : pct >= 30 ? { c: '', t: `El ${pct}% de tu stock supera 45 días (lo sano es menos de 30%). Revisa precio y frena compras de ese segmento.` } : { c: 'good', t: `Solo el ${pct}% supera 45 días. Buen ritmo de rotación.` };
    } else {
      m3 = [['Días prom.', `${n ? Math.round(sum(rows, r => diasStock(r.it)) / n) : 0}d`], ['Visitas / prop.', `${n ? Math.round(sum(rows, r => visitasDe(r.it)) / n) : 0}`], ['Exclusividad', `${n ? Math.round(rows.filter(r => r.it.mandato).length / n * 100) : 0}%`]];
      const viejas = rows.filter(r => diasStock(r.it) > 60).length;
      tip = !viejas ? { c: 'good', t: n ? 'Ninguna propiedad lleva más de 60 días sin cierre.' : 'Capta tu primera propiedad con el botón + en Cartera.' } : { c: '', t: `${rows.filter(r => diasStock(r.it) > 60).length} propiedades llevan más de 60 días sin cierre. Una baja de precio o nuevas fotos suele reactivar visitas.` };
    }
  }
  const total = rows.length || 1;
  return sec(title, rows.length) + `<div class="card reveal" style="animation-delay:.14s">
    <div class="agebar" style="margin-top:2px">${cells.map((c, i) => `<span style="flex:${c.n || 0.0001};background:${c.c};--i:${i}"></span>`).join('')}</div>
    <div class="agegrid">${cells.map((c, i) => `<button class="agecell" data-act="agecell" data-b="${i}"><span class="h"><i style="background:${c.c}"></i>${c.l} DÍAS</span><span class="n">${c.n}<small>${w.key === 'tienda' ? 'prod.' : w.key === 'auto' ? 'un.' : 'prop.'} · ${c.sub}</small></span></button>`).join('')}</div>
    <div class="metrics3">${m3.map(([k, v]) => `<div><span class="kicker">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
    <div class="tip ${tip.c}">${icon(tip.c ? 'check' : 'warn')}<span>${tip.t}</span></div></div>`;
}
function accionHtml(w) {
  let list, label;
  if (w.key === 'tienda') { label = 'Para liquidar'; list = itemsOf('tienda').filter(i => i.stock > 0 && daysSince(i.ultimaVenta) >= 30).sort((a, b) => daysSince(b.ultimaVenta) - daysSince(a.ultimaVenta)).slice(0, 3); }
  else { label = w.key === 'auto' ? 'Autos que piden acción' : 'Propiedades que piden acción'; list = activos(w.key).filter(i => i.estado === 'disponible').sort((a, b) => diasStock(b) - diasStock(a)).slice(0, 3); }
  if (!list.length) return '';
  return sec(label, list.length, `<button class="more" data-act="tab" data-tab="stock">Ver ${w.tabs.stock.toLowerCase()}</button>`) + `<div class="card tight reveal" style="animation-delay:.2s">${list.map((i, k) => rowItem(i, k)).join('')}</div>`;
}
// embudo del mes: consultas que entraron este mes y hasta dónde llegaron
function funnelFor(w) {
  const mk = MK(), ls = LEADS.filter(l => l.w === w.key && (l.creado || l.ts || '').startsWith(mk)), hit = (l, r) => RANK[l.etapa] >= r || (l.etapa === 'perdido' && (l.log || []).some(e => e.tipo === 'visita') && r <= 2);
  const ventas = monthStats(w.key, mk).n;
  if (w.key === 'auto') return [['Consultas', ls.length], ['Visitas', ls.filter(l => hit(l, 2)).length], ['Reservas', ls.filter(l => hit(l, 4)).length], ['Ventas', ventas]];
  return [['Captaciones', itemsOf('prop').filter(i => (i.ingreso || '').startsWith(mk)).length], ['Consultas', ls.length], ['Visitas', ls.filter(l => hit(l, 2)).length], ['Ofertas', ls.filter(l => hit(l, 3)).length], ['Cierres', ventas]];
}
function funnelHtml(w) {
  const f = funnelFor(w), max = Math.max(1, ...f.map(x => x[1])), ls = LEADS.filter(l => l.w === w.key), sr = ls.filter(l => l.etapa === 'nuevo' && leadMin(l) > 10).length;
  const base = w.key === 'prop' ? f[1][1] : f[0][1];
  const n = e => ls.filter(l => l.etapa === e).length;
  return sec(w.key === 'auto' ? 'Embudo de ventas' : 'Pipeline del mes', '', `<button class="more" data-act="leads">Ver clientes</button>`) + `<div class="card reveal" style="animation-delay:.22s">
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 13.5px var(--body)">${mesDe(MK())}</span>${sr ? `<button class="chip bad" data-act="hubEtapa" data-e="nuevo" style="border:0">${icon('chat', 12)}${sr} sin responder</button>` : '<span class="chip good">Al día</span>'}</div>
    <div class="funnel">${f.map(([l, v], i) => { const wv = Math.max(0.06, v / max); return `<div class="frow"><span class="fl">${l}</span><div class="fb"><div class="ff" style="--w:${wv.toFixed(3)};--i:${i}"></div><b class="fv ${wv > 0.22 ? 'in' : 'out'}" style="--w:${wv.toFixed(3)};--i:${i}">${v}</b></div></div>`; }).join('')}</div>
    <p style="font-size:12px;color:var(--fg3);margin-top:12px">Conversión consulta → ${f[f.length - 1][0].toLowerCase()}: <b style="color:var(--fg)">${base ? (f[f.length - 1][1] / base * 100).toFixed(1).replace('.', ',') : '0'}%</b></p>
    <div class="hscroll" style="margin-top:12px"><button class="opt warm" data-act="hubEtapa" data-e="trato">${icon('flame')}En trato · ${n('trato')}</button><button class="opt on" data-act="hubEtapa" data-e="ganado">${icon('trophy')}Ganadas · ${n('ganado')}</button><button class="opt" data-act="hubEtapa" data-e="perdido">${icon('close')}Perdidas · ${n('perdido')}</button></div></div>`;
}
function creditoTxt(p) { return p.fin ? `${finName(p.fin)} · ${({ evaluacion: 'En evaluación', aprobado: 'Aprobado', cursado: 'Cursado' })[p.cr]}` : ''; }
function cobrarHtml(w) {
  const rows = []; ventasOf(w.key).forEach(v => v.pagos.filter(p => p.s === 'pendiente').forEach(p => rows.push({ v, p })));
  rows.sort((a, b) => diffDays(a.p.v) - diffDays(b.p.v));
  if (!rows.length) return '';
  return sec('Por cobrar', fmtM(sum(rows, r => r.p.a))) + `<div class="card tight reveal" style="animation-delay:.26s">${rows.map(({ v, p }, k) => `
    <button class="row" data-act="venta" data-id="${v.id}" style="animation-delay:${.3 + k * .06}s"><span class="thumb">${icon(p.fin ? 'bank' : METODO_ICON[p.m] || 'receipt', 20)}</span>
    <span class="rm"><p class="rt">${p.m}</p><p class="rs">${p.fin ? creditoTxt(p) + ' · ' : ''}${v.cliente}</p></span>
    <span class="rr"><span class="p">${fmtM(p.a)}</span><span class="chip ${diffDays(p.v) <= 5 ? 'warn' : ''}">${!p.v ? 'Sin fecha' : diffDays(p.v) < 0 ? 'Vencido' : `en ${diffDays(p.v)}d`}</span></span></button>`).join('')}</div>`;
}
function forecastHtml() {
  const f = forecastProps(); if (!f.rows.length) return '';
  return sec('Honorarios proyectados', '') + `<div class="card reveal" style="animation-delay:.12s">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><span class="kicker">Ponderado por probabilidad</span><div class="num" style="font-size:34px;margin-top:8px;line-height:1">${fmt(f.total)}</div></div><span class="chip accent">${icon('target', 12)}próx. 60 días</span></div>
    <div style="margin-top:14px;display:flex;flex-direction:column;gap:2px">${f.rows.map(r => `<button class="row" data-act="item" data-id="${r.id}" style="padding:12px 0;border-top:1px solid var(--line)"><span class="rm"><p class="rt">${shortName(r.it.nombre)}</p><p class="rs">${r.etapa}</p></span><span class="rr"><span class="p">${fmtM(r.hon)}</span><span class="chip mono">${Math.round(r.prob * 100)}%</span></span></button>`).join('')}</div></div>`;
}
function pulsoHtml() {
  const hoy = ventasOf('tienda').filter(v => v.fecha === TODAY), ayer = ventasOf('tienda').filter(v => v.fecha === addDays(TODAY, -1));
  const horas = Array.from({ length: 10 }, (_, k) => 9 + k).map(h => sum(hoy.filter(v => v.hora === h), v => v.ingreso)), mx = Math.max(1, ...horas);
  const tot = sum(hoy, v => v.ingreso), tAy = sum(ayer, v => v.ingreso), d = tAy ? Math.round((tot / tAy - 1) * 100) : 0;
  return sec('Pulso de hoy', `${hoy.length} tickets`) + `<div class="card reveal" style="animation-delay:.12s">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><span class="kicker">Vendido hoy</span><div class="num" style="font-size:34px;margin-top:8px;line-height:1">${fmt(tot)}</div></div><span class="chip ${d >= 0 ? 'good' : 'bad'}">${icon(d >= 0 ? 'arrowUp' : 'arrowDn', 12, 2.4)}${Math.abs(d)}% vs ayer</span></div>
    <div class="pulse">${horas.map((v, i) => `<i style="height:${Math.max(6, v / mx * 100)}%;--i:${i}" class="${v === mx && v ? 'hot' : ''}" title="${9 + i}h"></i>`).join('')}</div>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font:500 9.5px var(--mono);color:var(--fg3)"><span>9h</span><span>12h</span><span>15h</span><span>18h</span></div></div>`;
}
function equipoHtml(w) {
  const eq = EQUIPO.filter(e => e.w === w.key && e.activo), ut = e => sum(ventasOf(w.key, MK()).filter(v => v.vend === e.nombre), utilidad), mx = Math.max(1, ...eq.map(ut));
  if (!eq.length) return '';
  return sec('Equipo del mes', '', `<button class="more" data-act="tab" data-tab="equipo">Ver equipo</button>`) + `<div class="card tight reveal" style="animation-delay:.3s">${eq.sort((a, b) => ut(b) - ut(a)).map((e, k) => `
    <button class="row" data-act="vendor" data-id="${e.id}" style="animation-delay:${.34 + k * .06}s"><span class="avatar" style="width:40px;height:40px;border-radius:13px;font-size:14px">${initials(e.nombre)}</span>
    <span class="rm"><p class="rt">${k === 0 ? icon('trophy', 14) + ' ' : ''}${e.nombre}</p><div class="pbar" style="margin-top:8px;--w:${Math.max(4, ut(e) / mx * 100)}%"><i></i></div></span>
    <span class="rr"><span class="p">${fmtM(ut(e))}</span><span class="rs" style="margin:0">${(() => { const n = ventasOf(w.key, MK()).filter(v => v.vend === e.nombre).length; return n + ' ' + (w.key === 'tienda' ? (n === 1 ? 'ticket' : 'tickets') : (n === 1 ? 'cierre' : 'cierres')); })()}</span></span></button>`).join('')}</div>`;
}
function qaHtml(w) {
  const b = w.key === 'tienda' ? [['nuevaVenta', 'dollar', 'Venta', 1], ['nuevoItem', 'box', 'Producto'], ['nuevoRecordatorio', 'bell', 'Recordar'], ['leads', 'people', 'Contactos']]
    : [['nuevaConsulta', 'userplus', 'Consulta', 1], ['nuevoRecordatorio', 'bell', 'Recordar'], ['nuevaVenta', 'dollar', w.key === 'prop' ? 'Operación' : 'Venta'], ['leads', 'people', 'Clientes']];
  return `<div class="qa">${b.map(([a, i, l, m], k) => `<button class="${m ? 'main' : ''}" data-act="${a}" style="animation-delay:${.1 + k * .05}s"><span class="ic">${icon(i)}</span>${l}</button>`).join('')}</div>`;
}
function renderPanel() {
  const w = W(), h = new Date().getHours(), saludo = `${h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'}, ${firstName(ME.nombre)}`;
  const mods = isVend() ? [heroVendHtml, qaHtml, atencionHtml, ...(w.key === 'tienda' ? [] : [funnelHtml]), cobrarHtml, accionHtml]
    : w.key === 'auto' ? [heroHtml, qaHtml, atencionHtml, saludHtml, accionHtml, funnelHtml, cobrarHtml, equipoHtml]
    : w.key === 'prop' ? [heroHtml, qaHtml, atencionHtml, forecastHtml, saludHtml, funnelHtml, cobrarHtml, equipoHtml]
      : [heroHtml, qaHtml, atencionHtml, pulsoHtml, saludHtml, accionHtml, equipoHtml];
  $('#scr-panel').innerHTML = hdr('Panel', `${hoyTxt()} · Torre de control`) .replace('<h1>Panel</h1>', `<h1>${saludo}</h1>`) + `<div class="body px">${mesBar()}${mods.map(m => `<div class="mod">${m(w)}</div>`).join('')}</div>`;
}
ACT.alert = d => { const a = alertsFor(state.world)[+d.i]; if (a) runAlert(a); };
function runAlert(a) { closeSheet(); if (a.act === 'item') openItem(a.id, a.tab); else if (a.act === 'leads') openLeads(); else if (a.act === 'venta') openVenta(a.id); else if (a.act === 'reminder') openReminder(a.id); else if (a.act === 'fincom') openFinCom(); else if (a.act === 'ventas') { while (pushes.length) popScreen(); go('ventas'); } else if (a.act === 'caja') { while (pushes.length) popScreen(); go('caja'); } }
ACT.agecell = d => { state.fBucket = +d.b; state.fFilter = 'todos'; renderStock(); go('stock'); };

/* ---------------- STOCK ---------------- */
// resumen arriba del stock (con la misma animación de números que el panel)
function stockResumen(w) {
  const act = activos(w.key), valor = sum(act, i => w.key === 'tienda' ? i.precio * i.stock : i.precio);
  const tercero = w.key === 'tienda' ? ['Unidades', odo(sum(act, i => i.stock), false)] : ['Días prom.', odo(act.length ? Math.round(sum(act, diasStock) / act.length) : 0, false)];
  return `<div class="card reveal" style="padding:14px 16px"><div class="grid3" style="gap:10px">${[[w.key === 'tienda' ? 'Productos' : 'En stock', odo(act.length, false)], ['Valor publicado', odo(valor)], tercero].map(([k, v]) => `<div><span class="kicker" style="font-size:9px">${k}</span><div class="num" style="font-size:19px;margin-top:8px;white-space:nowrap">${v}</div></div>`).join('')}</div></div>`;
}
function rowItem(it, k = 0) {
  const w = WORLDS[it.w], thumb = it.fotos && it.fotos[0] ? `<img src="${fotoSrc(it.fotos[0])}" alt="" loading="lazy">` : icon(w.icon, 22);
  let sub, right;
  if (it.w === 'auto') {
    const dc = docsOf(it).map(d => `<i class="${d.est}"></i>`).join('');
    sub = `${plate(it.sku)}<span class="dots3" title="Permiso · Revisión · SOAP">${dc}</span>${['reservado', 'taller'].includes(it.estado) ? `<span class="chip ${it.estado === 'reservado' ? 'warn' : ''}">${it.estado === 'reservado' ? 'Reservado' : 'En taller'}</span>` : ''}`;
    right = it.estado === 'vendido' ? `<span class="p">${fmtM(it.precio)}</span><span class="chip">Vendido</span>` : `<span class="p">${fmtM(it.precio)}</span><span class="days d${bucketIdx(diasStock(it))}">${diasStock(it)}<small>DÍAS</small></span>`;
  } else if (it.w === 'prop') {
    sub = `${rolTag(it.sku)}<span style="display:inline-flex;align-items:center;gap:4px">${icon('eye', 12)}${visitasDe(it)}</span>`;
    const cerr = ['vendido', 'arrendado'].includes(it.estado);
    right = cerr ? `<span class="p">${fmtM(it.precio)}</span><span class="chip">${it.estado === 'vendido' ? 'Vendida' : 'Arrendada'}</span>` : `<span class="p">${fmtM(it.precio)}${it.op === 'Arriendo' ? '<small style="font:500 10px var(--body);color:var(--fg3)">/mes</small>' : ''}</span>${it.estado === 'reservado' ? '<span class="chip warn">Promesa</span>' : `<span class="days d${bucketIdx(diasStock(it))}">${diasStock(it)}<small>DÍAS</small></span>`}`;
  } else {
    sub = `${skuTag(it.sku)}<span class="chip ${it.stock === 0 ? 'bad' : it.stock < it.minimo ? 'warn' : ''}">${it.stock} un.</span>`;
    right = `<span class="p">${fmt(it.precio)}</span>${daysSince(it.ultimaVenta) >= 45 && it.stock ? `<span class="days d3">${daysSince(it.ultimaVenta)}<small>S/VENTA</small></span>` : it.stock < it.minimo ? '<span class="chip bad">Reponer</span>' : '<span class="chip good">OK</span>'}`;
  }
  if (it.aprob === 'pendiente') right = `<span class="p" style="color:var(--fg3)">${it.precioSug ? fmtM(it.precioSug) : 'Sin precio'}</span><span class="chip warn">Por aprobar</span>`;
  return `<button class="row" data-act="item" data-id="${it.id}" style="animation-delay:${Math.min(k, 8) * 0.045}s"><span class="thumb">${thumb}</span><span class="rm"><p class="rt">${it.nombre}</p><p class="rs">${sub}</p></span><span class="rr">${right}</span></button>`;
}
const FILTERS = {
  auto: [['todos', 'Todos'], ['disp', 'Disponibles'], ['res', 'Reservados'], ['vend', 'Vendidos']],
  prop: [['todos', 'Todas'], ['disp', 'Disponibles'], ['res', 'En promesa'], ['cerr', 'Cerradas']],
  tienda: [['todos', 'Todos'], ['ok', 'En stock'], ['bajo', 'Bajo mínimo'], ['agot', 'Agotados']],
};
function filterItems() {
  const w = state.world; let l = itemsOf(w);
  const f = state.fFilter, q = state.q.trim().toLowerCase();
  if (f !== 'todos') l = l.filter(i => ({
    disp: i.estado === 'disponible' || i.estado === 'taller', res: i.estado === 'reservado', vend: i.estado === 'vendido', cerr: ['vendido', 'arrendado'].includes(i.estado),
    ok: i.stock > 0, bajo: i.stock > 0 && i.stock < i.minimo, agot: i.stock === 0
  }[f]));
  if (state.fBucket != null) l = l.filter(i => w === 'tienda' ? i.stock > 0 && bucketT(daysSince(i.ultimaVenta)) === state.fBucket : activos(w).includes(i) && bucketIdx(diasStock(i)) === state.fBucket);
  if (q) l = l.filter(i => (i.nombre + ' ' + i.sku + ' ' + Object.values(i.specs).join(' ')).toLowerCase().includes(q));
  const dias = i => w === 'tienda' ? daysSince(i.ultimaVenta) : diasStock(i);
  if (state.fSort === 'dias') l = [...l].sort((a, b) => dias(b) - dias(a)); else if (state.fSort === 'precio') l = [...l].sort((a, b) => b.precio - a.precio); else l = [...l].sort((a, b) => (b.ingreso || '').localeCompare(a.ingreso || ''));
  return l;
}
function renderStock() {
  const w = W(), fl = FILTERS[w.key], l = filterItems();
  const bl = state.fBucket != null ? (w.key === 'tienda' ? BUCKETS_T : BUCKETS)[state.fBucket].l : null;
  $('#scr-stock').innerHTML = hdr(w.tabs.stock, `${itemsOf(w.key).length} ${w.itemMany.toLowerCase()} · ${w.name}`, `<button class="ibtn solid" data-act="nuevoItem" aria-label="Ingresar ${w.itemOne.toLowerCase()}">${icon('plus', 20, 2.2)}</button>`) + `
  <div class="body px">
    ${stockResumen(w)}
    <div class="search">${icon('search')}<input id="q" placeholder="Buscar ${w.itemMany.toLowerCase()}, ${w.idLabel.toLowerCase()}…" value="${state.q}" data-live="liveQ" autocomplete="off"></div>
    <div class="seg" id="seg-f">${fl.map(([k, t]) => `<button data-act="fFilter" data-k="${k}" class="${state.fFilter === k ? 'active' : ''}">${t}</button>`).join('')}<span class="ind"></span></div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div style="display:flex;gap:6px">${[['rec', 'Recientes'], ['dias', w.key === 'tienda' ? 'Sin venta' : 'Más días'], ['precio', 'Precio']].map(([k, t]) => `<button class="chip ${state.fSort === k ? 'accent' : ''}" data-act="fSort" data-k="${k}" style="height:30px;padding:0 12px;border:0">${t}</button>`).join('')}</div>
      <span class="mono" style="font-size:11px;color:var(--fg3)">${l.length} resultados</span></div>
    ${bl ? `<button class="chip accent" data-act="clearBucket" style="align-self:flex-start;height:30px;border:0">${icon('filter', 12)}Filtro ${bl} días ${icon('close', 12)}</button>` : ''}
    <div class="card tight" id="stock-list">${l.map((i, k) => rowItem(i, k)).join('') || `<div class="empty">${icon(w.icon, 30)}<p>Nada coincide con tu búsqueda</p></div>`}</div>
  </div>`;
  moveSeg('seg-f');
}
ICONS.filter = '<path d="M4 6h16M7 12h10M10 18h4"/>';
function moveSeg(id) {
  const s = $('#' + id); if (!s) return; const b = $('button.active', s), ind = $('.ind', s); if (!b || !ind) return;
  ind.style.transition = 'none'; ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft - 3}px)`; void ind.offsetWidth; ind.style.transition = '';
}
ACT.fFilter = d => { state.fFilter = d.k; const s = $('#seg-f'); $$('button', s).forEach(b => b.classList.toggle('active', b.dataset.k === d.k)); const b = $('button.active', s), ind = $('.ind', s); ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft - 3}px)`; refreshList(); };
ACT.fSort = d => { state.fSort = d.k; const sc = $('#scr-stock').scrollTop; renderStock(); $('#scr-stock').scrollTop = sc; };
ACT.clearBucket = () => { state.fBucket = null; renderStock(); };
ACT.liveQ = (d, el, e) => { state.q = e.target.value; refreshList(); };
function refreshList() { const l = filterItems(); $('#stock-list').innerHTML = l.map((i, k) => rowItem(i, k)).join('') || `<div class="empty">${icon(W().icon, 30)}<p>Nada coincide con tu búsqueda</p></div>`; }

/* ---------------- VENTAS ---------------- */
function ventaRow(v, k) {
  const it = getItem(v.itemId) || { nombre: 'Ítem eliminado' }, w = WORLDS[v.w], u = utilidad(v), pend = v.pagos.some(p => p.s === 'pendiente');
  const nm = v.w === 'tienda' ? `${it.nombre} ×${v.q}` : it.nombre;
  return `<button class="row" data-act="venta" data-id="${v.id}" style="animation-delay:${Math.min(k, 8) * 0.045}s"><span class="thumb">${icon(w.icon, 22)}</span>
    <span class="rm"><p class="rt">${nm}</p><p class="rs">${v.w === 'tienda' ? `${v.vend.split(' ')[0]} · ${v.hora}:00` : v.cliente} · ${fechaCorta(v.fecha)}${pend ? `<span class="chip warn">Por cobrar</span>` : ''}${v.tramite === 'pendiente' && aprobada(v) ? `<span class="chip">Traspaso</span>` : ''}</p></span>
    <span class="rr"><span class="p">${fmtM(v.ingreso)}</span>${v.aprob === 'pendiente' ? '<span class="chip warn">Por aprobar</span>' : v.aprob === 'rechazada' ? '<span class="chip bad">Rechazada</span>' : `<span class="chip good">+${fmtM(isVend() ? comision(v) : u)}</span>`}</span></button>`;
}
// el administrador puede ver las ventas de un vendedor en particular
function vendFiltro(w) {
  if (isVend()) return '';
  const nombres = [...new Set(ventasOf(w.key, MK()).map(v => v.vend))]; if (nombres.length < 2) return '';
  return `<div class="hscroll">${[['', 'Todos'], ...nombres.map(n => [n, n])].map(([k, t]) => `<button class="opt ${(state.fVend || '') === k ? 'on' : ''}" data-act="fVend" data-k="${k}">${k ? icon('user2') : ''}${t}${k ? ' · ' + ventasOf(w.key, MK()).filter(v => v.vend === k).length : ''}</button>`).join('')}</div>`;
}
ACT.fVend = d => { state.fVend = d.k || null; const sc = $('#scr-ventas').scrollTop; renderVentas(); $('#scr-ventas').scrollTop = sc; };
// panel del vendedor: sus comisiones, sin costos ni gastos de la empresa
function heroVendHtml(w) {
  const vs = ventasOf(w.key, MK()), pv = ventasOf(w.key, MKP()), com = sum(vs, comision), dl = com - sum(pv, comision), e = miEquipo(w.key);
  const mk = MK(), hasta = esMesActual() ? +TODAY.slice(8, 10) : diasMes(mk), serie = []; let acc = 0;
  for (let d = 1; d <= hasta; d++) { acc += sum(vs.filter(v => v.fecha === `${mk}-${pad2(d)}`), comision); serie.push(acc); }
  return `<div class="hero reveal">
    <div class="hero-top"><div class="grow"><span class="kicker">Mis comisiones · ${mesDe(mk)}</span>
      <span class="big">${odo(com)}</span>
      <span class="delta ${dl < 0 ? 'neg' : ''}"><span class="l1">${icon(dl < 0 ? 'arrowDn' : 'arrowUp', 13, 2.4)}${fmtM(Math.abs(dl))}<span>vs ${mesDe(MKP()).toLowerCase()}</span></span></span></div></div>
    ${spark(serie.length > 1 ? serie : [0, ...serie, 0].slice(0, 2))}
    <div class="stat3">${[[w.key === 'tienda' ? 'Tickets' : 'Ventas', vs.length], ['Vendido', fmtM(sum(vs, v => w.key === 'prop' ? v.precio : v.ingreso))], ['Mi comisión base', e ? (e.comTipo === 'pct' ? e.comVal + '%' : fmt(e.comVal)) : '—']].map(([k, v]) => `<div><span class="kicker">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
  </div>`;
}
function renderVentas() {
  const w = W(), vs = ventasOf(w.key, MK()).filter(v => !state.fVend || v.vend === state.fVend).sort((a, b) => (b.fecha + pad2(b.hora || 0)).localeCompare(a.fecha + pad2(a.hora || 0))), st = monthStats(w.key, MK());
  $('#scr-ventas').innerHTML = hdr(w.tabs.ventas, `${mesDe(MK())} ${MK().slice(0, 4)} · ${vs.length} ${w.key === 'tienda' ? 'tickets' : 'cierres'}`, `<button class="ibtn solid" data-act="nuevaVenta" aria-label="Registrar">${icon('plus', 20, 2.2)}</button>`) + `
  <div class="body px">
    ${mesBar()}
    <div class="card reveal" style="background:linear-gradient(160deg,color-mix(in srgb,var(--accent) 10%,var(--s1)),var(--s1) 70%)"><span class="kicker">${w.key === 'prop' ? 'Volumen de operaciones' : 'Vendido en ' + mesDe(MK()).toLowerCase()}</span><span class="big" style="display:block;font-size:38px;margin-top:10px;line-height:1">${odo(st.volumen || st.ingreso)}</span></div>
    <div class="grid2">${(isVend() ? [['Mi comisión', st.com, 'var(--good)'], [w.key === 'tienda' ? 'Tickets' : 'Ventas', st.n, '', 1]] : [['Utilidad', st.bruta, 'var(--good)'], ['Comisiones', st.com, '']]).map(([k, v, c, n], i) => `<div class="card reveal" style="padding:14px 16px;animation-delay:${(i + 1) * .06}s"><span class="kicker" style="font-size:9.5px">${k}</span><div class="num" style="font-size:21px;margin-top:9px;white-space:nowrap;${c ? 'color:' + c : ''}">${odo(v, !n)}</div></div>`).join('')}</div>
    ${(() => { const pa = VENTAS.filter(v => v.w === w.key && (v.aprob === 'pendiente' || (v.aprob === 'rechazada' && isVend()))).sort((a, b) => b.fecha.localeCompare(a.fecha)); return pa.length ? sec(isAdmin() ? 'Por aprobar' : 'Enviadas al administrador', pa.length) + `<div class="card tight" style="border-color:var(--warn)">${pa.map(ventaRow).join('')}</div>` : ''; })()}
    ${vendFiltro(w)}
    ${sec(w.key === 'tienda' ? 'Tickets recientes' : w.tabs.ventas, vs.length)}
    <div class="card tight">${vs.slice(0, 18).map(ventaRow).join('') || `<div class="empty">${icon('dollar', 30)}<p>Aún no hay registros este mes</p></div>`}</div>
    ${vs.length > 18 ? `<p style="text-align:center;font-size:12px;color:var(--fg3)">Mostrando 18 de ${vs.length} · usa Caja para ver el detalle por método</p>` : ''}
  </div>`;
}

/* ---------------- CAJA ---------------- */
function cajaData(w, per) {
  const vs = ventasOf(w).filter(v => per === 'sem' ? v.fecha >= addDays(TODAY, -6) : per === 'mes' ? v.fecha.startsWith(MK()) : true);
  const ent = {}, pen = {}; let rows = [];
  vs.forEach(v => v.pagos.forEach(p => { const t = p.s === 'cobrado' ? ent : pen; t[p.m] = (t[p.m] || 0) + p.a; if (p.s !== 'cobrado') rows.push({ v, p }); }));
  return { vs, ent, pen, total: sum(Object.values(ent), x => x), pend: sum(Object.values(pen), x => x), rows };
}
function finCajaHtml(c) {
  const m = {}; c.vs.forEach(v => v.pagos.filter(p => p.fin).forEach(p => { const o = m[p.fin] || (m[p.fin] = { cob: 0, pen: 0, n: 0 }); if (p.s === 'cobrado') o.cob += p.a; else o.pen += p.a; o.n++; }));
  const rows = Object.entries(m).sort((a, b) => (b[1].cob + b[1].pen) - (a[1].cob + a[1].pen)); if (!rows.length) return '';
  const mx = Math.max(...rows.map(r => r[1].cob + r[1].pen));
  return sec('Con qué financiera vendes', rows.length) + `<div class="card tight">${rows.map(([k, o], i) => `<div class="row" style="flex-direction:column;align-items:stretch;gap:10px;cursor:default"><span style="display:flex;align-items:center;gap:12px"><span class="thumb" style="width:38px;height:38px;border-radius:11px">${icon('bank', 18)}</span><span class="rm"><p class="rt">${finName(k)}</p><p class="rs">${o.n} crédito${o.n > 1 ? 's' : ''}</p></span><span class="rr"><span class="p">${fmtM(o.cob + o.pen)}</span>${o.pen ? `<span class="chip warn">${fmtM(o.pen)} pend.</span>` : ''}</span></span><span class="pbar" style="--w:${(o.cob + o.pen) / mx * 100}%"><i></i></span></div>`).join('')}</div>`;
}
/* ---------------- comisiones que pagan las financieras ---------------- */
function finComHtml() {
  const pend = finComRows('auto', 'pend'), pag = finComRows('auto', 'pagada');
  if (!pend.length && !pag.length) return '';
  const tp = sum(pend, r => r.p.fcm), tc = sum(pag.filter(r => (r.p.fcf || '').startsWith(MK())), r => r.p.fcm);
  const porFin = {}; pend.forEach(r => { const o = porFin[r.p.fin] || (porFin[r.p.fin] = { m: 0, n: 0 }); o.m += r.p.fcm; o.n++; });
  return sec('Comisiones de financieras', '', `<button class="more" data-act="fincom">Ver detalle</button>`) + `<button class="card pressable reveal" data-act="fincom" style="text-align:left;width:100%">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px"><div><span class="kicker">Te deben las financieras</span><div class="num" style="font-size:30px;margin-top:9px;line-height:1;color:var(--warn)">${fmt(tp)}</div></div><div style="text-align:right"><span class="kicker" style="font-size:9px">Cobrado en ${mesDe(MK()).toLowerCase()}</span><div class="num" style="font-size:17px;margin-top:7px;color:var(--good)">${fmt(tc)}</div></div></div>
    ${Object.keys(porFin).length ? `<div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:6px">${Object.entries(porFin).sort((a, b) => b[1].m - a[1].m).map(([k, o]) => `<span class="chip">${finName(k)} · ${fmt(o.m)}</span>`).join('')}</div>` : ''}</button>`;
}
const fcState = { f: 'pend' };
function finComListHtml() {
  const rows = finComRows('auto', fcState.f), tot = sum(rows, r => r.p.fcm);
  const porFin = {}; rows.forEach(r => { const o = porFin[r.p.fin] || (porFin[r.p.fin] = { m: 0, n: 0 }); o.m += r.p.fcm; o.n++; });
  return `<div class="px" style="padding-top:8px;display:flex;flex-direction:column;gap:14px">
    ${seg('seg-fc', [['pend', 'Pendientes'], ['pagada', 'Pagadas'], ['todas', 'Todas']], fcState.f, 'fcF')}
    <div class="card"><span class="kicker">${fcState.f === 'pend' ? 'Por cobrar' : fcState.f === 'pagada' ? 'Cobrado' : 'Total generado'}</span><span class="big" style="display:block;margin-top:10px;font-size:42px">${odo(tot)}</span><p style="font-size:12px;color:var(--fg3);margin-top:8px">${rows.length} crédito${rows.length === 1 ? '' : 's'}</p></div>
    ${Object.keys(porFin).length ? sec('Por financiera', Object.keys(porFin).length) + `<div class="card tight">${Object.entries(porFin).sort((a, b) => b[1].m - a[1].m).map(([k, o]) => `<div class="row" style="cursor:default"><span class="thumb" style="width:38px;height:38px;border-radius:11px">${icon('bank', 18)}</span><span class="rm"><p class="rt">${finName(k)}</p><p class="rs">${o.n} crédito${o.n > 1 ? 's' : ''} · ${finCom(k)}% actual</p></span><span class="rr"><span class="p">${fmt(o.m)}</span></span></div>`).join('')}</div>` : ''}
    ${sec('Detalle por auto', rows.length)}
    <div class="card tight">${rows.map(({ v, p, i }) => { const it = getItem(v.itemId) || { nombre: 'Ítem eliminado' }; return `<div class="row"><button data-act="venta" data-id="${v.id}" style="all:unset;display:flex;align-items:center;gap:12px;flex:1;min-width:0;cursor:pointer"><span class="thumb">${icon('car', 20)}</span><span class="rm"><p class="rt">${it.nombre}</p><p class="rs">${finName(p.fin)} · ${p.fcp}% de ${fmt(p.a)} · ${fechaCorta(v.fecha)}${p.cr !== 'cursado' ? '<span class="chip">Crédito por cursar</span>' : ''}</p></span></button><span class="rr"><span class="p">${fmt(p.fcm)}</span>${p.fcs === 'pagada' ? `<span class="chip good">Pagada${p.fcf ? ' ' + fechaCorta(p.fcf) : ''}</span>` : `<button class="chip warn" style="border:0" data-act="crFcs" data-id="${v.id}" data-i="${i}" data-list="1">Me la pagaron</button>`}</span></div>`; }).join('') || `<div class="empty">${icon('bank', 30)}<p>${fcState.f === 'pend' ? 'No tienes comisiones pendientes' : 'Sin registros'}</p></div>`}</div>
    <p style="font-size:12px;color:var(--fg3);text-align:center;padding:0 10px">El % de cada financiera se configura en Ajustes → Catálogos. Al registrar una venta con crédito se propone ese % y lo puedes cambiar.</p></div>`;
}
function openFinCom() { const el = pushScreen('Comisiones financieras', finComListHtml(), { onReady: () => moveSeg('seg-fc') }); el.dataset.fincom = '1'; }
function refreshFinCom() { const el = $$('.push').reverse().find(x => x.dataset.fincom); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop; pb.innerHTML = finComListHtml(); pb.scrollTop = sc; moveSeg('seg-fc'); animateIn(el); }
ACT.fincom = () => openFinCom();
ACT.fcF = d => { fcState.f = d.k; refreshFinCom(); };

function renderCaja() {
  const w = W(), c = cajaData(w.key, state.cajaP), gs = sum(gastosMes(w.key), g => g.monto);
  const metodos = w.metodos.map(m => [m, c.ent[m] || 0]).sort((a, b) => b[1] - a[1]), mx = Math.max(1, ...metodos.map(m => m[1]));
  $('#scr-caja').innerHTML = hdr('Caja', `${state.cajaP === 'sem' ? 'Últimos 7 días' : state.cajaP === 'mes' ? mesDe(MK()) + ' ' + MK().slice(0, 4) : 'Histórico'} · ${w.name}`) + `
  <div class="body px">
    ${state.cajaP === 'mes' ? mesBar() : ''}
    <div class="seg" id="seg-c">${[['sem', 'Semana'], ['mes', 'Mes'], ['todo', 'Todo']].map(([k, t]) => `<button data-act="cajaP" data-k="${k}" class="${state.cajaP === k ? 'active' : ''}">${t}</button>`).join('')}<span class="ind"></span></div>
    <div class="card reveal" style="background:linear-gradient(160deg,color-mix(in srgb,var(--accent) 14%,var(--s1)),var(--s1) 65%)">
      <span class="kicker">Entró a caja</span><span class="big" style="display:block;margin-top:10px;font-size:46px">${odo(c.total)}</span>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><span class="chip warn">${icon('clock', 12)}Por cobrar ${fmtM(c.pend)}</span><span class="chip">${c.vs.length} ${w.key === 'tienda' ? 'tickets' : 'cierres'}</span></div></div>
    ${sec('Por método de pago', '')}
    <div class="card tight">${metodos.map(([m, v], i) => `<button class="row" data-act="metodo" data-m="${m}" style="animation-delay:${i * .05}s;flex-direction:column;align-items:stretch;gap:10px">
      <span style="display:flex;align-items:center;gap:12px"><span class="thumb" style="width:38px;height:38px;border-radius:11px">${icon(METODO_ICON[m] || 'dollar', 18)}</span><span class="rm"><p class="rt">${m}</p></span><span class="p num" style="font-size:16px">${fmtM(v)}</span>${c.pen[m] ? `<span class="chip warn" style="margin-left:6px">+${fmtM(c.pen[m])} pend.</span>` : ''}</span>
      <span class="pbar" style="--w:${Math.max(2, v / mx * 100)}%"><i></i></span></button>`).join('')}</div>
    ${w.key === 'auto' ? finComHtml() + finCajaHtml(c) : ''}
    ${c.rows.length ? sec('Por cobrar', fmtM(c.pend)) + `<div class="card tight">${c.rows.map(({ v, p }, k) => `<button class="row" data-act="venta" data-id="${v.id}"><span class="thumb">${icon(METODO_ICON[p.m] || 'receipt', 20)}</span><span class="rm"><p class="rt">${p.m} · ${v.cliente}</p><p class="rs">Vence ${fechaCorta(p.v)}</p></span><span class="rr"><span class="p">${fmtM(p.a)}</span></span></button>`).join('')}</div>` : ''}
    ${sec('Gastos', '')}
    <button class="card pressable" data-act="gastos" style="display:flex;align-items:center;gap:14px;text-align:left;width:100%"><span class="thumb">${icon('receipt', 22)}</span><span class="grow"><p class="rt">Gastos de ${mesDe(MK()).toLowerCase()}</p><p class="rs">${gastosMes(w.key).length} registros · ${gastosMes(w.key).filter(g => g.fijo).length} fijos</p></span><span class="num" style="font-size:19px">${fmtM(gs)}</span>${icon('chevR', 16)}</button>
  </div>`;
  moveSeg('seg-c');
}
ACT.cajaP = d => { state.cajaP = d.k; const sc = $('#scr-caja').scrollTop; renderCaja(); $('#scr-caja').scrollTop = sc; animateIn($('#scr-caja')); };

/* ---------------- EQUIPO ---------------- */
function vendStats(e) {
  const vs = ventasOf(e.w, MK()).filter(v => v.vend === e.nombre), all = ventasOf(e.w, MK());
  const ing = sum(vs, v => v.ingreso), tot = sum(all, v => v.ingreso) || 1;
  return { n: vs.length, ut: sum(vs, utilidad), com: sum(vs, comision), part: Math.round(ing / tot * 100) };
}
function renderEquipo() {
  const w = W(), eq = EQUIPO.filter(e => e.w === w.key), tot = sum(eq, e => vendStats(e).com);
  $('#scr-equipo').innerHTML = hdr('Equipo', `${eq.filter(e => e.activo).length} activos · ${w.name}`, `<button class="ibtn solid" data-act="nuevoVendedor" aria-label="Agregar vendedor">${icon('plus', 20, 2.2)}</button>`) + `
  <div class="body px">
    ${mesBar()}
    <div class="card reveal"><span class="kicker">Comisiones${esMesActual() ? ' por pagar' : ''} · ${mesDe(MK())}</span><span class="big" style="display:block;font-size:38px;margin-top:10px;line-height:1">${odo(tot)}</span></div>
    ${eq.length ? '' : `<div class="card"><div class="empty">${icon('people', 30)}<p>Agrega a tus vendedores para calcular sus comisiones en cada venta.</p></div><button class="btn primary" data-act="nuevoVendedor">${icon('userplus')}Agregar vendedor</button></div>`}
    ${eq.map((e, i) => { const s = vendStats(e); return `<button class="card pressable reveal" data-act="vendor" data-id="${e.id}" style="text-align:left;animation-delay:${i * .07 + .06}s;width:100%">
      <div style="display:flex;align-items:center;gap:13px"><span class="avatar">${initials(e.nombre)}</span><span class="grow"><p class="rt" style="font-size:15px">${e.nombre}</p><p class="rs">${e.comTipo === 'pct' ? e.comVal + '%' : fmt(e.comVal)} comisión base ${e.activo ? '' : '<span class="chip">Inactivo</span>'}</p></span>${icon('chevR', 16)}</div>
      <div style="display:grid;grid-template-columns:.7fr 1.6fr 1fr;gap:10px;margin-top:14px;text-align:left"><div><span class="kicker" style="font-size:9px">Cierres</span><b class="num" style="display:block;font-size:20px;margin-top:6px">${s.n}</b></div><div><span class="kicker" style="font-size:9px">Comisión</span><b class="num" style="display:block;font-size:19px;margin-top:6px;color:var(--good);white-space:nowrap">${fmtM(s.com)}</b></div><div><span class="kicker" style="font-size:9px">Participación</span><b class="num" style="display:block;font-size:20px;margin-top:6px">${s.part}%</b></div></div></button>`; }).join('')}
  </div>`;
}

/* ---------------- selector de mes ---------------- */
// el primer mes con datos de este mundo (para no retroceder al vacío)
function primerMes(w) {
  const f = [...ventasOf(w).map(v => v.fecha), ...GASTOS.filter(g => g.w === w).map(g => g.fecha)].sort()[0];
  return f ? f.slice(0, 7) : CUR;
}
function mesBar() {
  const mk = MK(), first = primerMes(state.world), act = esMesActual();
  return `<div class="mesbar reveal">
    <button class="ibtn" data-act="mesMove" data-d="-1" ${mk <= first ? 'disabled' : ''} aria-label="Mes anterior">${icon('chevL', 18, 2.2)}</button>
    <button class="mesl" data-act="mesAnio" aria-label="Elegir mes"><b>${mesDe(mk)} ${mk.slice(0, 4)}</b><small>${act ? 'Este mes' : 'Toca para ver el año'}</small></button>
    ${act ? `<button class="ibtn" disabled aria-label="Mes siguiente">${icon('chevR', 18, 2.2)}</button>` : `<button class="chip accent" data-act="mesHoy" style="border:0;height:34px">Hoy</button><button class="ibtn" data-act="mesMove" data-d="1" aria-label="Mes siguiente">${icon('chevR', 18, 2.2)}</button>`}
  </div>`;
}
function setMes(mk) {
  MES_SEL = !mk || mk >= CUR ? null : mk;
  renderPanel(); renderVentas(); renderCaja(); renderEquipo();
  $$('.screen').forEach(s => s.scrollTop = 0); animateIn($('#scr-' + state.tab));
  const g = $$('.push').reverse().find(x => x.dataset.gastos); if (g) { popScreen(); setTimeout(openGastos, 200); }
}
ACT.mesMove = d => setMes(monthKey(MK(), +d.d));
ACT.mesHoy = () => setMes(null);
ACT.mesAnio = () => openAnio(+MK().slice(0, 4));
// el año completo: barras por mes, toca un mes para verlo
function openAnio(y) {
  const w = W(), meses = Array.from({ length: 12 }, (_, i) => `${y}-${pad2(i + 1)}`), first = primerMes(w.key);
  const st = meses.map(mk => mk > CUR || mk < first ? null : monthStats(w.key, mk));
  const vals = st.map(s => s ? s.neta : 0), mx = Math.max(1, ...vals.map(Math.abs));
  const ok = st.filter(Boolean), tot = sum(ok, s => s.neta), nV = sum(ok, s => s.n), mejor = ok.length ? meses[vals.indexOf(Math.max(...st.map((s, i) => s ? s.neta : -Infinity)))] : null;
  openSheet(`${y}`, `<div style="display:flex;flex-direction:column;gap:14px" id="anio">
    <div style="display:flex;justify-content:space-between;align-items:center"><button class="ibtn" data-act="anioMove" data-y="${y - 1}" ${`${y - 1}-12` < first ? 'disabled' : ''} aria-label="Año anterior">${icon('chevL', 18, 2.2)}</button><span class="kicker">Utilidad neta por mes · ${w.name}</span><button class="ibtn" data-act="anioMove" data-y="${y + 1}" ${y + 1 > +CUR.slice(0, 4) ? 'disabled' : ''} aria-label="Año siguiente">${icon('chevR', 18, 2.2)}</button></div>
    <div class="yearbars">${meses.map((mk, i) => { const s = st[i], v = vals[i]; return `<button class="yb ${mk === MK() ? 'on' : ''} ${v < 0 ? 'neg' : ''}" data-act="anioPick" data-mk="${mk}" ${s ? '' : 'disabled'} aria-label="${mesDe(mk)}"><span class="ybv">${s ? (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + 'M' : Math.round(v / 1e3) + 'k') : ''}</span><i style="height:${s ? Math.max(4, Math.abs(v) / mx * 100) : 2}%"></i><span>${mesDe(mk).slice(0, 3)}</span></button>`; }).join('')}</div>
    <div class="grid3" style="gap:10px">${[['Utilidad del año', fmt(tot)], [w.key === 'tienda' ? 'Tickets' : 'Cierres', nV], ['Mejor mes', mejor ? mesDe(mejor) : '—']].map(([k, v]) => `<div class="card" style="padding:12px"><span class="kicker" style="font-size:8.5px">${k}</span><div class="num" style="font-size:${String(v).length > 10 ? 14 : 18}px;margin-top:8px;white-space:nowrap">${v}</div></div>`).join('')}</div>
    <p style="font-size:12px;color:var(--fg3);text-align:center">Toca un mes para ver su panel, ventas, caja y comisiones.</p></div>`);
}
ACT.anioMove = d => openAnio(+d.y);
ACT.anioPick = d => { closeSheet(); setMes(d.mk); };

function renderAll() { renderPanel(); renderStock(); renderVentas(); renderCaja(); renderEquipo(); renderDock(); if ($('#app').classList.contains('quieto')) quietas(); else animateIn($('#scr-panel')); }
