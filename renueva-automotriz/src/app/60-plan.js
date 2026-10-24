/* =====================================================================
   AJUSTES (admin): catálogos editables, plan y suscripción, usuarios, notificaciones
   ===================================================================== */
const cloud = () => window.RV && RV.mode === 'cloud';
const ROL_TXT = { admin: 'Administrador', vendedor: 'Vendedor', lectura: 'Solo lectura' };
const NOTIF = { recordatorios: true, consultas: true, papeles: true, cobros: true, resumen: true };
const planUI = { ciclo: 'mensual' };
const nWorlds = () => Object.values(ENABLED).filter(Boolean).length;
const nUsers = () => USUARIOS.filter(u => u.activo).length;
const precioMes = p => planUI.ciclo === 'anual' ? Math.round(p.price * 10 / 12 / 10) * 10 : p.price;

/* ---------------- ajustes ---------------- */
// lo que ve un vendedor de sí mismo en Ajustes
function vendAjustesHtml(w) {
  const e = miEquipo(w.key);
  return `<div class="card"><span class="kicker">Tu perfil de vendedor · ${w.name}</span>${e ? drow('Comisión base', e.comTipo === 'pct' ? e.comVal + '%' : fmt(e.comVal)) + drow('Ventas este mes', ventasOf(w.key, CUR).length) : '<p style="font-size:13px;color:var(--fg2);margin-top:10px">Tu administrador aún no te asigna comisión en este mundo.</p>'}
    <p style="font-size:12px;color:var(--fg3);margin-top:10px">Ves tus ventas, tus clientes y el stock. Las cifras de la empresa las ve el administrador.</p></div>`;
}
function openAjustes() {
  const w = W(), p = planNow();
  pushScreen('Ajustes', `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px">
 <div style="display:flex;align-items:center;gap:16px"><span class="avatar xl">${initials(ME.nombre)}</span><div><h2 style="font:700 24px/1.05 var(--display);font-variation-settings:'wdth' 82">${ME.nombre}</h2><p style="font-size:13px;color:var(--fg3);margin-top:6px">${ROL_TXT[ME.rol]} · ${cloud() ? ORG.nombre : w.brand}</p>${ME.email ? `<p class="mono" style="font-size:11px;color:var(--fg3);margin-top:4px">${ME.email}</p>` : ''}</div></div>
    ${ME.plataforma ? `<button class="card pressable" data-act="plataforma" style="display:flex;align-items:center;gap:14px;text-align:left;width:100%;border-color:var(--accent)"><span class="thumb" style="background:var(--accent);color:var(--accent-ink)">${icon('crown', 22)}</span><span class="grow"><b style="font:700 15px var(--body)">Panel de la plataforma</b><br><span style="font-size:12px;color:var(--fg3)">Empresas, planes, pruebas y pagos</span></span>${icon('chevR', 16)}</button>` : ''}
    ${isVend() ? vendAjustesHtml(w) : ''}
    ${isVend() ? '' : `<button class="plan cur" data-act="plan" style="text-align:left;width:100%"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Tu plan</span>${planChip()}</div>
      <div style="display:flex;align-items:baseline;gap:10px;margin-top:12px"><span class="pn">${p.n}</span><span style="font-size:13px;color:var(--fg3)">${p.users + SUB.extraUsers} usuarios · ${p.worlds + SUB.extraWorlds} mundos</span></div>
      <div class="grid2" style="margin-top:16px;gap:14px"><div class="meter"><div class="mh"><span>Usuarios</span><b>${nUsers()}/${limUsers()}</b></div><div class="pbar" style="--w:${nUsers() / limUsers() * 100}%"><i></i></div></div><div class="meter"><div class="mh"><span>Mundos</span><b>${nWorlds()}/${limWorlds()}</b></div><div class="pbar" style="--w:${nWorlds() / limWorlds() * 100}%"><i></i></div></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;color:var(--accent);font:700 13px var(--body)">${enIOS() ? 'Ver detalle del plan' : 'Ver planes y precios'} ${icon('arrowR', 16)}</div></button>`}
    <div class="card tight">
      ${cloud() && isAdmin() ? `<button class="navrow" data-act="renombrarOrg"><span class="ni">${icon('building')}</span><span class="grow"><b style="font:600 14.5px var(--body)">Empresa</b><br><span style="font-size:12px;color:var(--fg3)">${ORG.nombre}</span></span>${icon('chevR')}</button>` : ''}
      ${isVend() ? '' : `<button class="navrow" data-act="usuarios"><span class="ni">${icon('people')}</span><span class="grow"><b style="font:600 14.5px var(--body)">Usuarios y permisos</b><br><span style="font-size:12px;color:var(--fg3)">${nUsers()} de ${limUsers()} usuarios</span></span>${icon('chevR')}</button>
      <button class="navrow" data-act="catalogos"><span class="ni">${icon('list')}</span><span class="grow"><b style="font:600 14.5px var(--body)">Catálogos</b><br><span style="font-size:12px;color:var(--fg3)">Portales, financieras, orígenes y motivos</span></span>${icon('chevR')}</button>`}
      <button class="navrow" data-act="notifs"><span class="ni">${icon('bell')}</span><span class="grow"><b style="font:600 14.5px var(--body)">Notificaciones</b><br><span style="font-size:12px;color:var(--fg3)">Recordatorios y avisos en tu celular</span></span>${icon('chevR')}</button>
    </div>
    ${!isAdmin() ? '' : `<div class="card"><span class="kicker">Color de tu mundo</span><div style="display:flex;gap:12px;margin-top:14px">${ACCENTS.map(c => `<button data-act="accent" data-c="${c}" aria-label="Color ${c}" style="width:40px;height:40px;border-radius:99px;background:${c};border:3px solid var(--s1);box-shadow:0 0 0 2px ${c}55;transition:transform .2s var(--spring)"></button>`).join('')}</div></div>`}
    <div class="card tight">
      <button class="navrow" data-act="legal" data-p="privacidad"><span class="ni">${icon('shield')}</span><span class="grow"><b style="font:600 14.5px var(--body)">Política de privacidad</b></span>${icon('chevR')}</button>
      <button class="navrow" data-act="legal" data-p="terminos"><span class="ni">${icon('doc')}</span><span class="grow"><b style="font:600 14.5px var(--body)">Términos del servicio</b></span>${icon('chevR')}</button>
      <button class="navrow" data-act="legal" data-p="soporte"><span class="ni">${icon('chat')}</span><span class="grow"><b style="font:600 14.5px var(--body)">Ayuda y soporte</b></span>${icon('chevR')}</button>
    </div>
    <button class="btn danger" data-act="logout">${icon('power')}Cerrar sesión</button>
    <button class="btn ghost small" data-act="borrarCuenta" style="width:100%;color:var(--bad)">${icon('trash', 15)}Eliminar mi cuenta</button></div>`);
}
function planChip() {
  if (!SUB.escribible) return `<span class="chip bad">${icon('lock', 12)}${SUB.trial ? 'Prueba terminada' : 'Vencido'}</span>`;
  if (SUB.trial) return `<span class="chip accent">${icon('clock', 12)}Prueba · ${SUB.trialLeft} días</span>`;
  return `<span class="chip good">Activo${SUB.pagadoHasta ? ' · hasta ' + fechaCorta(SUB.pagadoHasta) : ''}</span>`;
}
ACT.plataforma = () => window.RV && RV.openPlataforma && RV.openPlataforma();
ACT.plan = () => openPlan(); ACT.usuarios = () => openUsuarios(); ACT.catalogos = () => openCatalogos(); ACT.notifs = () => openNotifs();

/* ---------------- notificaciones ---------------- */
function openNotifs() {
  const row = (k, t, s) => `<div class="pickrow" style="padding:14px 16px"><span class="grow"><b style="font:600 14.5px var(--body)">${t}</b><br><span style="font-size:12px;color:var(--fg3)">${s}</span></span><button class="toggle ${NOTIF[k] ? 'on' : ''}" data-act="togNotif" data-k="${k}" aria-label="${t}"></button></div>`;
  pushScreen('Notificaciones', `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px">
    <div class="card tight">${row('recordatorios', 'Recordatorios', 'A la hora que elijas')}${row('consultas', 'Consultas nuevas', 'Cuando alguien escribe')}${row('papeles', 'Papeles por vencer', 'Permiso, revisión, SOAP, certificados')}${row('cobros', 'Cobros del día', 'Cheques y créditos por cobrar')}${row('resumen', 'Resumen de las 9:00', 'Qué requiere tu atención hoy')}</div>
    <button class="btn ghost" data-act="probarNotif">${icon('bell')}Probar notificación</button>
    <div class="card"><span class="kicker">Cómo llegan</span>
      <div class="pickrow" style="align-items:flex-start;border-top:none"><span class="thumb" style="width:38px;height:38px">${icon('bell', 18)}</span><span class="grow" style="font-size:13px;color:var(--fg2)"><b style="color:var(--fg);font-weight:600">Notificación en el celular.</b> Con la app abierta te avisamos a la hora del recordatorio. En iPhone, instálala en la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y acepta los permisos (iOS 16.4 o superior).</span></div>
      <div class="pickrow" style="align-items:flex-start"><span class="thumb" style="width:38px;height:38px;color:#25D366">${icon('whatsapp', 18)}</span><span class="grow" style="font-size:13px;color:var(--fg2)"><b style="color:var(--fg);font-weight:600">WhatsApp al cliente.</b> Se abre el chat con el mensaje ya escrito y tú lo envías con un toque. El envío automático sin abrir nada necesita la API de WhatsApp Business (con costo por mensaje); se puede sumar más adelante.</span></div></div></div>`);
}
ACT.togNotif = (d, el) => { NOTIF[d.k] = !NOTIF[d.k]; el.classList.toggle('on', NOTIF[d.k]); try { localStorage.setItem('renueva_notif', JSON.stringify(NOTIF)); } catch (e) { } if (NOTIF[d.k] && window.RV && RV.askNotif) RV.askNotif(); };
try { Object.assign(NOTIF, JSON.parse(localStorage.getItem('renueva_notif') || '{}')); } catch (e) { }

/* ---------------- catálogos ---------------- */
function catList(kind, w) { return kind === 'financieras' ? CAT.financieras : CAT[kind][w]; }
function catSection(kind, title, desc, extra = '') {
  const w = state.world, list = catList(kind, w);
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="kicker">${title}</span><span class="mono" style="font-size:10.5px;color:var(--accent)">${list.filter(x => x.on).length}/${list.length}</span></div>
    <p style="font-size:12.5px;color:var(--fg3);margin-top:8px">${desc}</p>
    <div class="optrow" style="margin-top:14px">${list.map(x => `<span class="opt ${x.on ? 'on' : 'off'}" style="padding-right:${x.k[0] === 'x' ? '8px' : '14px'}"><button data-act="catToggle" data-kind="${kind}" data-k="${x.k}" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:6px">${x.n}${x.tipo && kind === 'financieras' ? `<small style="font:500 9.5px var(--mono);opacity:.6">${x.tipo.slice(0, 3).toUpperCase()}</small>` : ''}</button>${x.k[0] === 'x' ? `<button class="x" data-act="catDel" data-kind="${kind}" data-k="${x.k}" aria-label="Quitar ${x.n}" style="all:unset;cursor:pointer;display:inline-flex;opacity:.7">${icon('close', 13)}</button>` : ''}</span>`).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:14px">${extra}<input id="cat-in-${kind}" placeholder="Agregar nueva…" autocomplete="off" style="min-height:44px"><button class="btn small primary" data-act="catAdd" data-kind="${kind}" style="min-width:56px;padding:0 14px" aria-label="Agregar">${icon('plus')}</button></div></div>`;
}
function catHtml() {
  const w = W(); let h = '';
  if (w.key !== 'tienda') h += catSection('portales', 'Dónde publicas', 'Aparecen en la ficha de cada ' + w.itemOne.toLowerCase() + '. Toca uno para activarlo o apagarlo.');
  else h += catSection('portales', 'Canales de venta', 'Dónde ofreces tus productos.');
  if (w.key === 'auto') h += catSection('financieras', 'Financieras y bancos', 'Opciones al registrar un pago con crédito automotriz. Incluye las principales de Chile; agrega las tuyas.', `<select id="cat-t-fin" style="width:112px;min-height:44px;padding:0 28px 0 12px"><option>Financiera</option><option>Banco</option><option>Caja</option><option>Otra</option></select>`);
  if (w.key === 'auto') h += `<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="kicker">Comisión que te pagan</span><span class="mono" style="font-size:10.5px;color:var(--accent)">% del monto financiado</span></div>
    <p style="font-size:12.5px;color:var(--fg3);margin-top:8px">Cuando registras un pago con crédito se calcula solo y queda en Caja → Comisiones de financieras hasta que confirmes que te pagaron.</p>
    <div style="margin-top:10px">${finsOn().map(f => `<div class="pickrow" style="padding:10px 0"><span class="grow" style="font:600 14px var(--body)">${f.n}</span><input inputmode="decimal" value="${f.com || ''}" placeholder="0" data-change="catFinCom" data-k="${f.k}" style="width:78px;min-height:40px;text-align:right"><span style="color:var(--fg3);font-size:13px">%</span></div>`).join('') || '<p style="font-size:13px;color:var(--fg3)">Activa financieras arriba.</p>'}</div></div>`;
  if (w.key !== 'tienda') { h += catSection('origenes', 'Cómo llegan tus clientes', 'Origen que eliges al registrar una consulta.'); h += catSection('motivos', 'Motivos de pérdida', 'Para entender por qué no se concreta una venta.'); }
  return `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px"><div class="tip good" style="margin:0">${icon('lock')}<span>Solo los administradores pueden editar los catálogos. Los demás usuarios solo eligen de las opciones activas.</span></div>${h}</div>`;
}
function openCatalogos() { const el = pushScreen('Catálogos', catHtml()); el.dataset.cat = '1'; }
function refreshCat() { const el = $$('.push').reverse().find(x => x.dataset.cat); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop; pb.innerHTML = catHtml(); pb.scrollTop = sc; }
ACT.catFinCom = (d, el) => { const f = CAT.financieras.find(x => x.k === d.k); if (!f) return; f.com = Math.min(100, Math.max(0, parseFloat(String(el.value).replace(',', '.')) || 0)); el.value = f.com || ''; toast(`${f.n}: ${f.com}% de comisión`, 'bank'); };
ACT.catToggle = d => { const x = catList(d.kind, state.world).find(i => i.k === d.k); x.on = !x.on; refreshCat(); };
ACT.catDel = d => { const l = catList(d.kind, state.world); l.splice(l.findIndex(i => i.k === d.k), 1); toast('Quitado de la lista', 'trash'); refreshCat(); };
ACT.catAdd = d => {
  const inp = $('#cat-in-' + d.kind), n = inp.value.trim(); if (!n) { toast('Escribe un nombre', 'warn'); return; }
  const l = catList(d.kind, state.world); if (l.some(x => x.n.toLowerCase() === n.toLowerCase())) { toast('Ya existe en la lista', 'warn'); return; }
  l.push({ k: 'x' + Date.now().toString(36), n, on: true, tipo: d.kind === 'financieras' ? ($('#cat-t-fin') || {}).value : undefined }); toast('Agregado: ' + n); refreshCat();
};
// alta rápida desde cualquier formulario (sin perder lo que estabas llenando)
ACT.catQuick = (d, el) => {
  const host = el.closest('.hscroll, .pubs, .optrow'); if (!host) return; if (host.nextElementSibling && host.nextElementSibling.classList.contains('inlineadd')) { host.nextElementSibling.remove(); return; }
  host.insertAdjacentHTML('afterend', `<div class="inlineadd" style="display:flex;gap:8px;margin-top:10px"><input class="qa-name" placeholder="Nombre de la nueva opción" autocomplete="off"><button class="btn small primary" data-act="catQuickSave" data-kind="${d.kind}" data-w="${d.w}" data-id="${d.id || ''}" style="min-width:56px;padding:0 14px" aria-label="Agregar">${icon('check')}</button></div>`);
  const i = host.nextElementSibling.querySelector('input'); i && i.focus();
};
ACT.catQuickSave = (d, el) => {
  const row = el.closest('.inlineadd'), n = $('.qa-name', row).value.trim(); if (!n) return; const l = CAT[d.kind][d.w];
  if (l.some(x => x.n.toLowerCase() === n.toLowerCase())) { toast('Ya existe en la lista', 'warn'); return; }
  const item = { k: 'x' + Date.now().toString(36), n, on: true }; l.push(item); toast('Agregado: ' + n); const host = row.previousElementSibling; row.remove();
  if (d.kind === 'portales') { const it = getItem(d.id); if (it) { it.pubs.push(item.k); refreshItem(it.id); } }
  else if (d.kind === 'origenes') { ncState.origen = item.k; host.innerHTML = CAT.origenes[d.w].filter(o => o.on).map(o => `<button class="opt ${o.k === ncState.origen ? 'on' : ''}" data-act="ncOrigen" data-k="${o.k}">${o.n}</button>`).join('') + `<button class="opt" data-act="catQuick" data-kind="origenes" data-w="${d.w}" style="border-style:dashed">${icon('plus')}Otro</button>`; }
  else if (d.kind === 'motivos') { window._lost = n; $('#lost-ok').disabled = false; host.innerHTML = CAT.motivos[d.w].filter(m => m.on).map(m => `<button class="opt ${m.n === n ? 'on' : ''}" data-act="lostPick" data-n="${m.n}">${m.n}</button>`).join('') + `<button class="opt" data-act="catQuick" data-kind="motivos" data-w="${d.w}" style="border-style:dashed">${icon('plus')}Otro</button>`; }
};

/* ---------------- plan y suscripción ---------------- */
// versión para iPhone: solo el estado del plan, sin precios ni botones de compra
function planHtmlIOS() {
  const cur = planNow();
  return `<div class="px" style="padding-top:8px;display:flex;flex-direction:column;gap:14px">
    <div class="plan cur"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Plan de tu empresa</span>${planChip()}</div>
      <div style="margin-top:12px"><span class="pn">${cur.n}</span></div>
      <div style="display:flex;flex-direction:column;gap:16px;margin-top:16px"><div class="meter"><div class="mh"><span>Usuarios</span><b>${nUsers()}/${limUsers()}</b></div><div class="pbar" style="--w:${Math.min(100, nUsers() / limUsers() * 100)}%"><i></i></div></div><div class="meter"><div class="mh"><span>Mundos</span><b>${nWorlds()}/${limWorlds()}</b></div><div class="pbar" style="--w:${Math.min(100, nWorlds() / limWorlds() * 100)}%"><i></i></div></div></div></div>
    <p style="font-size:12.5px;color:var(--fg3);text-align:center;padding:0 12px">El plan de la empresa lo administra su responsable.</p></div>`;
}
function planHtml() {
  if (enIOS()) return planHtmlIOS();
  const cur = planNow(), tr = SUB.trial;
  const meter = (t, v, max, ex = '') => `<div class="meter"><div class="mh"><span>${t}</span><b>${v}${max != null ? '/' + max : ''}${ex}</b></div>${max != null ? `<div class="pbar" style="--w:${Math.min(100, v / max * 100)}%"><i></i></div>` : ''}</div>`;
  return `<div class="px" style="padding-top:8px;display:flex;flex-direction:column;gap:14px">
    ${tr ? `<div class="hero" style="padding-bottom:18px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Prueba gratis de ${cur.n}</span><span class="chip accent">${icon('crown', 12)}${SUB.trialLeft} días</span></div><p style="font:700 22px/1.15 var(--display);font-variation-settings:'wdth' 82;margin-top:14px;max-width:20ch">Todo desbloqueado hasta que elijas un plan</p><div class="pbar" style="margin-top:16px;--w:${Math.max(0, Math.max(14, SUB.trialLeft) - SUB.trialLeft) / Math.max(14, SUB.trialLeft) * 100}%"><i></i></div><p style="font-size:12px;color:var(--fg3);margin-top:10px">Sin tarjeta. Al terminar, tu cuenta pasa a solo lectura hasta que elijas un plan. Tus datos no se borran.</p></div>` : ''}
    ${!isAdmin() ? `<div class="tip">${icon('lock')}<span>Solo el administrador puede cambiar el plan.</span></div>` : ''}
    <div class="card"><span class="kicker">Lo que usas</span><div style="display:flex;flex-direction:column;gap:16px;margin-top:16px">${meter('Usuarios', nUsers(), limUsers())}${meter('Mundos', nWorlds(), limWorlds())}</div></div>
    ${seg('seg-ciclo', [['mensual', 'Mensual'], ['anual', 'Anual · 2 meses gratis']], planUI.ciclo, 'ciclo')}
    ${PLANES.map(p => { const on = p.k === SUB.plan, pm = precioMes(p); return `<div class="plan ${on ? 'cur' : ''}">${p.tag ? `<span class="chip ${p.k === 'media' ? 'accent' : ''}" style="position:absolute;top:18px;right:18px">${p.tag}</span>` : ''}
      <span class="pn">${p.n}</span><div class="pp">${fmt(pm)}<small> /mes</small></div>${planUI.ciclo === 'anual' ? `<p style="font-size:12px;color:var(--fg3);margin-top:6px">${fmt(p.price * 10)} al año · ahorras ${fmt(p.price * 2)}</p>` : '<p style="font-size:12px;color:var(--fg3);margin-top:6px">IVA incluido</p>'}
      <ul>${p.feats.map(f => `<li>${icon('check', 16)}<span>${f}</span></li>`).join('')}</ul>
      <button class="btn ${on ? 'ghost' : 'primary'}" style="margin-top:18px" ${on && !tr ? 'disabled' : ''} data-act="planPick" data-k="${p.k}">${on ? (tr ? 'Quedarme con ' + p.n : 'Plan actual') : (PLANES.indexOf(p) > PLANES.indexOf(cur) ? 'Subir a ' : 'Cambiar a ') + p.n}</button></div>`; }).join('')}
    ${cloud() ? '' : `<div class="card"><span class="kicker">Extras</span>
      ${[['users', 'Usuario adicional', 4990, SUB.extraUsers, 'extraUsers'], ['worlds', 'Mundo adicional', 14990, SUB.extraWorlds, 'extraWorlds']].map(([k, t, pr, v]) => `<div class="pickrow"><span class="grow"><b style="font:600 14.5px var(--body)">${t}</b><br><span style="font-size:12px;color:var(--fg3)">${fmt(pr)} /mes cada uno</span></span><div class="stepper"><button data-act="addon" data-k="${k}" data-d="-1" aria-label="Quitar">${icon('minus', 16)}</button><b>${v}</b><button data-act="addon" data-k="${k}" data-d="1" aria-label="Agregar">${icon('plus', 16)}</button></div></div>`).join('')}</div>`}
    ${pagoHtml()}
    <p style="font-size:11.5px;color:var(--fg3);text-align:center;padding:0 12px">Precios en pesos chilenos, IVA incluido. Cobro automático a tu tarjeta cada mes o año; puedes cancelar cuando quieras.</p></div>`;
}
function pagoHtml() {
  if (!cloud()) return `<div class="card"><span class="kicker">Pago</span><p style="font-size:13px;color:var(--fg2);margin-top:10px">En la versión real el pago es con tarjeta (crédito o débito) a través de Flow, con cobro automático.</p></div>`;
  const s = SUB;
  return `<div class="card"><span class="kicker">Pago</span>
    ${s.flow ? `<div class="pickrow" style="border-top:none"><span class="thumb" style="width:38px;height:38px">${icon('card', 18)}</span><span class="grow"><b style="font:600 14px var(--body)">Tarjeta registrada en Flow</b><br><span style="font-size:12px;color:var(--fg3)">${s.pagadoHasta ? 'Pagado hasta ' + fechaCL(s.pagadoHasta) : 'Esperando el primer cobro'}${s.cancelado ? ' · se cancela al final del período' : ''}</span></span></div>
      ${isAdmin() && !s.cancelado ? `<button class="btn ghost small" data-act="cancelarPlan" style="width:100%;margin-top:10px">Cancelar suscripción</button>` : ''}`
    : `<p style="font-size:13px;color:var(--fg2);margin-top:10px">${s.pagadoHasta ? 'Plan pagado hasta ' + fechaCL(s.pagadoHasta) + '.' : 'Aún no registras un medio de pago.'} Al elegir un plan te llevamos a Flow para registrar tu tarjeta de forma segura.</p>`}
    ${(RV.pagos || []).length ? `<div style="margin-top:12px">${RV.pagos.slice(0, 6).map(p => drow(fechaCL(p.fecha), `${fmt(p.monto)} · ${p.estado}`)).join('')}</div>` : ''}</div>`;
}
ACT.cancelarPlan = async () => { if (!confirm('¿Cancelar la suscripción? Seguirás con acceso hasta el fin del período pagado.')) return; try { await RV.cancelPlan(); toast('Suscripción cancelada al final del período'); refreshPlan(); } catch (e) { toast(e.message || 'No se pudo cancelar', 'warn'); } };
function openPlan() { const el = pushScreen('Plan y suscripción', planHtml(), { onReady: () => moveSeg('seg-ciclo') }); el.dataset.plan = '1'; }
function refreshPlan() { const el = $$('.push').reverse().find(x => x.dataset.plan); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop; pb.innerHTML = planHtml(); pb.scrollTop = sc; moveSeg('seg-ciclo'); animateIn(el); }
ACT.ciclo = d => { planUI.ciclo = d.k; refreshPlan(); };
ACT.addon = d => { const key = d.k === 'users' ? 'extraUsers' : 'extraWorlds'; const nv = SUB[key] + +d.d; if (nv < 0 || nv > 10) return; if (nv < SUB[key]) { if (d.k === 'users' && nUsers() > planNow().users + nv) { toast('Desactiva usuarios antes de quitar el extra', 'warn'); return; } if (d.k === 'worlds' && nWorlds() > planNow().worlds + nv) { toast('Apaga un mundo antes de quitar el extra', 'warn'); return; } } SUB[key] = nv; refreshPlan(); };
let pickSel = [];
ACT.planPick = d => {
  if (enIOS()) return;
  const p = planOf(d.k); if (!cloud() && d.k === SUB.plan && SUB.trial) { SUB.trial = false; toast(`Plan ${p.n} activado`, 'crown'); refreshPlan(); renderLobby(); return; }
  pickSel = Object.keys(ENABLED).filter(k => ENABLED[k]).slice(0, p.worlds + SUB.extraWorlds);
  openSheet(`Cambiar a ${p.n}`, planSheet(p));
};
function planSheet(p) {
  const wl = p.worlds + SUB.extraWorlds, ul = p.users + SUB.extraUsers, overU = Math.max(0, nUsers() - ul), okW = pickSel.length <= wl && pickSel.length >= 1, down = PLANES.indexOf(p) < PLANES.indexOf(planNow());
  return `<div id="psheet" data-k="${p.k}" style="display:flex;flex-direction:column;gap:14px">
    <div class="card" style="background:var(--s2)"><div style="display:flex;justify-content:space-between;align-items:baseline"><b class="num" style="font-size:26px">${p.n}</b><span class="num" style="font-size:20px">${fmt(precioMes(p))}<small style="font:500 12px var(--body);color:var(--fg3)"> /mes</small></span></div><p style="font-size:12.5px;color:var(--fg3);margin-top:8px">${p.users + SUB.extraUsers} usuarios · ${wl} mundos${planUI.ciclo === 'anual' ? ' · facturado una vez al año' : ''}</p></div>
    <div><p class="kicker" style="margin-bottom:10px">Mundos activos (${pickSel.length}/${wl})</p><div class="optrow">${Object.values(WORLDS).map(x => `<button class="opt ${pickSel.includes(x.key) ? 'on' : ''}" data-act="pickWorld" data-w="${x.key}">${icon(x.icon)}${x.name}</button>`).join('')}</div>${pickSel.length > wl ? `<p style="font-size:12px;color:var(--warn);margin-top:10px">Este plan permite ${wl}. Apaga ${pickSel.length - wl}.</p>` : ''}</div>
    ${overU ? `<div class="tip">${icon('warn')}<span>Tienes ${nUsers()} usuarios activos y este plan permite ${ul}. Desactiva ${overU} en <b>Usuarios y permisos</b> para continuar.</span></div>` : ''}
    ${down ? `<p style="font-size:12.5px;color:var(--fg3)">Los datos de los mundos apagados se conservan. Puedes volver a activarlos cuando subas de plan.</p>` : ''}
    <button class="btn primary" data-act="planConfirm" data-k="${p.k}" ${okW && !overU ? '' : 'disabled'}>${icon(cloud() ? 'card' : 'check')}${cloud() ? (SUB.flow ? 'Confirmar cambio' : 'Ir a pagar con Flow') : 'Confirmar cambio'}</button>
    ${cloud() ? `<p style="font-size:12px;color:var(--fg3);text-align:center">${SUB.flow ? 'El nuevo valor se cobra desde tu próximo período.' : 'Registras tu tarjeta en Flow y el cobro queda automático. Puedes cancelar cuando quieras.'}</p>` : ''}</div>`;
}
ACT.pickWorld = d => { const i = pickSel.indexOf(d.w); if (i >= 0) pickSel.splice(i, 1); else pickSel.push(d.w); const sh = $('#psheet'); if (!sh) return; const p = planOf(sh.dataset.k); sh.outerHTML = planSheet(p); };
ACT.planConfirm = async (d, el) => {
  const p = planOf(d.k);
  if (cloud()) {
    el.disabled = true; el.textContent = 'Un momento…';
    try { const r = await RV.choosePlan({ plan: p.k, ciclo: planUI.ciclo, mundos: [...pickSel] }); if (r && r.redirect) { location.href = r.redirect; return; } closeSheet(); toast(r && r.msg || `Plan ${p.n} actualizado`, 'crown'); refreshPlan(); renderLobby(); }
    catch (e) { el.disabled = false; el.innerHTML = 'Reintentar'; toast(e.message || 'No se pudo cambiar el plan', 'warn'); }
    return;
  } SUB.plan = p.k; SUB.trial = false; SUB.ciclo = planUI.ciclo; Object.keys(ENABLED).forEach(k => ENABLED[k] = pickSel.includes(k));
  closeSheet(); toast(`Ahora estás en ${p.n}`, 'crown'); refreshPlan(); renderLobby();
  if (!ENABLED[state.world]) setTimeout(() => { while (pushes.length) popScreen(); ACT.toLobby(); }, 700);
};

/* ---------------- usuarios y permisos ---------------- */
function usuariosHtml() {
  const lim = limUsers(), full = nUsers() >= lim;
  return `<div class="px" style="padding-top:8px;display:flex;flex-direction:column;gap:14px">
    <div class="card"><div class="meter"><div class="mh"><span>Usuarios del plan ${planNow().n}</span><b>${nUsers()}/${lim}</b></div><div class="pbar" style="--w:${nUsers() / lim * 100}%"><i></i></div></div><p style="font-size:12px;color:var(--fg3);margin-top:12px">Siempre hay un administrador. El resto son vendedores (ven su mundo y sus ventas) o solo lectura.</p></div>
    ${full ? `<div class="tip">${icon('lock')}<span>Llegaste al límite de usuarios de tu plan.${enIOS() ? '' : ` <button data-act="plan" style="background:none;border:0;color:inherit;font:700 12.5px var(--body);text-decoration:underline;padding:0">Sube de plan</button> para invitar a más personas.`}</span></div>` : ''}
    <div class="card tight">${USUARIOS.map(u => `<button class="row" data-act="userEdit" data-id="${u.id}"><span class="avatar" style="width:44px;height:44px;border-radius:15px;font-size:15px;${u.activo ? '' : 'opacity:.4'}">${initials(u.nombre)}</span><span class="rm"><p class="rt">${u.nombre}${u.invitado ? ' <span class="chip warn" style="margin-left:6px">Invitación enviada</span>' : ''}</p><p class="rs" style="gap:6px">${u.mundos.map(m => `<span class="chip" style="padding:0 7px;height:22px">${icon(WORLDS[m].icon, 12)}${WORLDS[m].name}</span>`).join('')}</p></span><span class="rr"><span class="chip ${u.rol === 'admin' ? 'accent' : ''}">${({ admin: 'Admin', vendedor: 'Vendedor', lectura: 'Solo lectura' })[u.rol]}</span>${u.activo ? '' : '<span class="chip">Inactivo</span>'}</span></button>`).join('')}</div></div>`;
}
async function openUsuarios() {
  if (cloud()) { try { await RV.loadMembers(); } catch (e) { toast('No se pudo cargar la lista de usuarios', 'warn'); } } const el = pushScreen('Usuarios', usuariosHtml(), { cta: `<button class="btn primary" data-act="userInvite" ${nUsers() >= limUsers() ? 'disabled' : ''}>${icon('userplus')}Invitar usuario</button>` }); el.dataset.users = '1'; }
function refreshUsers() { const el = $$('.push').reverse().find(x => x.dataset.users); if (!el) return; $('.pbody', el).innerHTML = usuariosHtml(); const b = $('.cta-bar .btn', el); if (b) b.disabled = nUsers() >= limUsers(); animateIn(el); }
let ueState = {};
ACT.userInvite = () => {
  ueState = { rol: 'vendedor', mundos: [state.world] };
  openSheet('Invitar usuario', `<div id="uform" style="display:flex;flex-direction:column;gap:14px"><label class="field"><span>Correo</span><input id="ui-e" inputmode="email" placeholder="persona@empresa.cl" autocomplete="off"></label><label class="field"><span>Nombre (opcional)</span><input id="ui-n" placeholder="Nombre y apellido"></label>${userFormBits()}<button class="btn primary" data-act="userInviteSave">${icon('send')}Enviar invitación</button></div>`);
};
function userFormBits() {
  const act = Object.values(WORLDS).filter(w => ENABLED[w.key]);
  return `<div><p class="kicker" style="margin-bottom:10px">Rol</p><div class="optrow" id="ue-rol">${[['vendedor', 'Vendedor'], ['lectura', 'Solo lectura']].map(([k, t]) => `<button class="opt ${ueState.rol === k ? 'on' : ''}" data-act="ueRol" data-k="${k}">${t}</button>`).join('')}</div></div>
  <div><p class="kicker" style="margin-bottom:10px">Mundos a los que accede</p><div class="optrow" id="ue-m">${act.map(w => `<button class="opt ${ueState.mundos.includes(w.key) ? 'on' : ''}" data-act="ueMundo" data-w="${w.key}">${icon(w.icon)}${w.name}</button>`).join('')}</div></div>`;
}
ACT.ueRol = (d, el) => { ueState.rol = d.k; $$('#ue-rol .opt').forEach(b => b.classList.toggle('on', b === el)); };
ACT.ueMundo = (d, el) => { const i = ueState.mundos.indexOf(d.w); if (i >= 0) { if (ueState.mundos.length > 1) ueState.mundos.splice(i, 1); } else ueState.mundos.push(d.w); $$('#ue-m .opt').forEach(b => b.classList.toggle('on', ueState.mundos.includes(b.dataset.w))); };
ACT.userInviteSave = async (d, el) => {
  const e = $('#ui-e').value.trim().toLowerCase(); if (!/.+@.+\..+/.test(e)) { toast('Escribe un correo válido', 'warn'); return; }
  if (nUsers() >= limUsers()) { toast('Llegaste al límite de tu plan', 'lock'); return; }
  if (cloud()) {
    el.disabled = true;
    const nombre = $('#ui-n').value.trim();
    try { const link = await RV.invite({ email: e, nombre, rol: ueState.rol, mundos: [...ueState.mundos] }); fichaVendedor(e, nombre, ueState.rol, ueState.mundos); closeSheet(); refreshUsers(); setTimeout(() => shareInvite(e, link), 400); }
    catch (x) { el.disabled = false; toast(x.message || 'No se pudo invitar', 'warn'); }
    return;
  }
  fichaVendedor(e, $('#ui-n').value.trim(), ueState.rol, ueState.mundos);
  USUARIOS.push({ id: nuevoId('u'), nombre: $('#ui-n').value.trim() || e.split('@')[0], email: e, rol: ueState.rol, mundos: [...ueState.mundos], activo: true, invitado: true });
  closeSheet(); toast('Invitación enviada a ' + e, 'send'); refreshUsers();
};
// al invitar a un vendedor se crea (o enlaza por correo) su ficha en Equipo de cada mundo, para su comisión
function fichaVendedor(email, nombre, rol, mundos) {
  if (rol !== 'vendedor') return;
  mundos.forEach(w => {
    const e = EQUIPO.find(x => x.w === w && (lc(x.email) === lc(email) || (nombre && x.nombre.toLowerCase() === nombre.toLowerCase())));
    if (e) { e.email = lc(email); e.activo = true; return; }
    EQUIPO.push({ id: nuevoId('e'), w, nombre: nombre || email.split('@')[0], fono: '', email: lc(email), comTipo: 'pct', comVal: w === 'prop' ? 40 : w === 'tienda' ? 3 : 2, activo: true });
  });
  saved(); if (state.world) { renderEquipo(); }
}
function shareInvite(email, link) {
  const txt = `Te invito a usar Renueva con ${ORG.nombre}. Entra aquí y crea tu cuenta con este correo (${email}): ${link}`;
  openSheet('Invitación lista', `<div style="display:flex;flex-direction:column;gap:14px"><p style="font-size:13.5px;color:var(--fg2)">Envíale este enlace a <b style="color:var(--fg)">${email}</b>. Al crear su cuenta con ese correo entra directo a tu empresa.</p>
    <div class="card" style="background:var(--s2);word-break:break-all;font:500 12px var(--mono)">${link}</div>
    <div class="grid2"><button class="btn ghost" data-act="copyInvite" data-l="${link}">${icon('copy')}Copiar</button><a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">${icon('whatsapp')}WhatsApp</a></div>
    <a class="btn ghost" href="mailto:${email}?subject=${encodeURIComponent('Invitación a Renueva')}&body=${encodeURIComponent(txt)}">${icon('send')}Enviar por correo</a></div>`);
}
ACT.reshareInv = d => { const u = USUARIOS.find(x => x.id === d.id); closeSheet(); setTimeout(() => shareInvite(u.email, location.origin + location.pathname + '?inv=' + u.token), 350); };
ACT.copyInvite = d => { navigator.clipboard && navigator.clipboard.writeText(d.l).then(() => toast('Enlace copiado', 'copy'), () => toast('No se pudo copiar', 'warn')); };
ACT.userEdit = d => {
  const u = USUARIOS.find(x => x.id === d.id); ueState = { rol: u.rol, mundos: [...u.mundos], id: u.id };
  openSheet(u.nombre, `<div id="uform" style="display:flex;flex-direction:column;gap:14px"><div class="card" style="background:var(--s2)">${drow('Correo', u.email)}</div>
    ${u.invitado ? `<div class="tip" style="margin:0">${icon('send')}<span>Invitación pendiente como ${ROL_TXT[u.rol]}. Aún no crea su cuenta.</span></div>${u.token ? `<button class="btn ghost" data-act="reshareInv" data-id="${u.id}">${icon('link')}Ver enlace de invitación</button>` : ''}<button class="btn danger" data-act="userDel" data-id="${u.id}">${icon('trash')}Cancelar invitación</button>` : u.rol === 'admin' ? `<div class="tip good" style="margin:0">${icon('shield')}<span>Es el administrador de la cuenta. Ve todos los mundos y no se puede desactivar.</span></div>` : userFormBits() + `<div style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 14px var(--body)">Usuario activo</span><button class="toggle ${u.activo ? 'on' : ''}" id="ue-act" data-act="togSimple" aria-label="Activo"></button></div><button class="btn primary" data-act="userSave" data-id="${u.id}">${icon('check')}Guardar</button><button class="btn danger" data-act="userDel" data-id="${u.id}">${icon('trash')}Quitar de la cuenta</button>`}</div>`);
};
ACT.userSave = async d => {
  const u = USUARIOS.find(x => x.id === d.id), act = $('#ue-act').classList.contains('on');
  if (act && !u.activo && nUsers() >= limUsers()) { toast('Llegaste al límite de tu plan', 'lock'); return; }
  if (cloud()) { try { await RV.updateMember(u, { rol: ueState.rol, mundos: [...ueState.mundos], activo: act }); closeSheet(); toast('Permisos actualizados', 'shield'); refreshUsers(); } catch (e) { toast(e.message || 'No se pudo guardar', 'warn'); } return; }
  u.rol = ueState.rol; u.mundos = [...ueState.mundos]; u.activo = act; closeSheet(); toast('Permisos actualizados', 'shield'); refreshUsers();
};
ACT.userDel = async d => {
  const u = USUARIOS.find(x => x.id === d.id); if (!confirm(`¿Quitar a ${u.nombre} de la cuenta?`)) return;
  if (cloud()) { try { await RV.removeMember(u); closeSheet(); toast('Usuario quitado', 'trash'); refreshUsers(); } catch (e) { toast(e.message || 'No se pudo quitar', 'warn'); } return; }
  USUARIOS.splice(USUARIOS.findIndex(x => x.id === d.id), 1); closeSheet(); toast('Usuario quitado', 'trash'); refreshUsers(); };

/* ---------------- privacidad, términos, soporte y eliminar cuenta ---------------- */
// páginas públicas (también se enlazan en App Store Connect)
const LEGAL_BASE = () => (window.RV && RV.appUrl) || location.origin;
ACT.legal = d => { const u = `${LEGAL_BASE()}/${d.p}.html`; if (window.RV && RV.openExternal) RV.openExternal(u); else window.open(u, '_blank', 'noopener'); };
ACT.borrarCuenta = () => {
  if (!cloud()) { toast('En la demo no hay una cuenta que eliminar', 'warn'); return; }
  const admin = isAdmin();
  openSheet('Eliminar mi cuenta', `<div style="display:flex;flex-direction:column;gap:14px">
    <div class="tip" style="margin:0">${icon('warn')}<span>${admin
      ? `Eres el administrador de <b>${ORG.nombre}</b>. Se eliminará la empresa completa: ${Object.values(WORLDS).filter(w => ENABLED[w.key]).map(w => w.name.toLowerCase()).join(', ')}, ventas, clientes, caja, fotos, comprobantes y el acceso de todos sus usuarios.${SUB.flow ? ' La suscripción se cancela de inmediato.' : ''}`
      : 'Se eliminará tu usuario y no podrás volver a entrar. Las ventas y clientes que registraste quedan en la empresa, porque son registros de ella.'}</span></div>
    <p style="font-size:13px;color:var(--fg2)">Esto no se puede deshacer. La eliminación es inmediata; las copias de seguridad del proveedor se borran solas en un máximo de 30 días.</p>
    <label class="field"><span>Escribe ELIMINAR para confirmar</span><input id="del-c" autocomplete="off" autocapitalize="characters" data-live="delLive"></label>
    <button class="btn danger" id="del-ok" data-act="borrarCuentaOk" disabled>${icon('trash')}Eliminar definitivamente</button>
    <button class="btn ghost" data-act="closeSheet">Cancelar</button></div>`);
};
ACT.delLive = () => { const b = $('#del-ok'); if (b) b.disabled = $('#del-c').value.trim().toUpperCase() !== 'ELIMINAR'; };
ACT.borrarCuentaOk = async (d, el) => {
  if ($('#del-c').value.trim().toUpperCase() !== 'ELIMINAR') return;
  el.disabled = true; el.textContent = 'Eliminando…';
  try {
    const r = await RV.deleteAccount();
    closeSheet(); while (pushes.length) popScreen();
    gate.info = r && r.empresa_eliminada ? 'Tu cuenta y tu empresa fueron eliminadas.' : 'Tu cuenta fue eliminada.';
    state.world = null; renderGate('login');
  } catch (e) { el.disabled = false; el.innerHTML = 'Reintentar'; toast(e.message || 'No se pudo eliminar la cuenta', 'warn'); }
};
