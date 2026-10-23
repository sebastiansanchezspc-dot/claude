/* =====================================================================
   CLIENTES: consultas (leads), contactos, recordatorios, etapas
   ===================================================================== */
const hub = { tab: 'consultas', etapa: 'todas', q: '' };
const TEMPS = [['caliente', 'Muy interesado', 'flame', 'hot'], ['tibio', 'Interesado', 'thermo', 'warm'], ['frio', 'Frío', 'clock', 'cold']];
const ETAPA_TXT = { nuevo: 'Nuevo', contactado: 'Contactado', visita: 'Visita', trato: 'En trato', reserva: 'Reserva', ganado: 'Ganado', perdido: 'Perdido' };
const ETAPA_CHIP = { nuevo: 'accent', contactado: '', visita: '', trato: 'warn', reserva: 'warn', ganado: 'good', perdido: 'bad' };
const waLink = (fono, text) => `https://wa.me/${String(fono).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
const telLink = fono => 'tel:' + String(fono).replace(/[^\d+]/g, '');
function relTxt(ts) {
  const m = minsAgo(ts); if (m < 1) return 'ahora'; if (m < 60) return `hace ${m} min`; if (m < 1440) return `hace ${Math.round(m / 60)} h`;
  const d = Math.round(m / 1440); return d === 1 ? `ayer ${hhmm(ts)}` : `hace ${d} días`;
}
const leadsOf = w => LEADS.filter(l => l.w === w);
const contactoOf = l => CONTACTOS.find(c => c.w === l.w && (c.fono === l.fono || c.nombre === l.nombre));
const waText = l => { const it = getItem(l.itemId); return `Hola ${firstName(l.nombre)}, soy ${firstName(l.vend)} de ${W().brand}. Vi que te interesó ${it ? 'el ' + shortName(it.nombre) : 'nuestra oferta'}. ¿Te puedo ayudar con algo?`; };
function logLead(l, tipo, txt) { l.log.push({ ts: tick(), tipo, txt }); }
function touchLead(l) { l.ts = nowISO(); if (l.etapa === 'nuevo') { l.etapa = 'contactado'; } }
const refreshAll = () => { renderPanel(); renderStock(); renderVentas(); renderCaja(); renderEquipo(); animateIn($('#scr-panel')); };

/* ---------------- hub ---------------- */
function hubTabs() { return W().key === 'tienda' ? [['contactos', 'Contactos'], ['recordatorios', 'Recordatorios']] : [['consultas', 'Consultas'], ['contactos', 'Contactos'], ['recordatorios', 'Recordatorios']]; }
function openClientes(tab) {
  hub.tab = tab || (W().key === 'tienda' ? 'contactos' : 'consultas'); if (W().key === 'tienda' && hub.tab === 'consultas') hub.tab = 'contactos';
  const el = pushScreen('Clientes', hubHtml(), { right: `<button class="ibtn solid" data-act="hubAdd" aria-label="Agregar">${icon('plus', 20, 2.2)}</button>`, onReady: () => moveSeg('seg-hub') });
  el.dataset.hub = '1';
}
function refreshHub() { const el = $$('.push').reverse().find(x => x.dataset.hub); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop; pb.innerHTML = hubHtml(); pb.scrollTop = sc; moveSeg('seg-hub'); animateIn(el); }
function hubHtml() {
  const w = W(), tabs = hubTabs();
  return `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:14px">${seg('seg-hub', tabs, hub.tab, 'hubTab')}${hub.tab === 'consultas' ? consultasHtml(w) : hub.tab === 'contactos' ? contactosHtml(w) : recordatoriosHtml(w)}</div>`;
}
ACT.hubTab = d => { hub.tab = d.k; refreshHub(); };
ACT.hubAdd = () => hub.tab === 'recordatorios' ? openNuevoRecordatorio() : hub.tab === 'contactos' ? openNuevoContacto() : openNuevaConsulta();
ACT.hubEtapa = d => { hub.tab = 'consultas'; hub.etapa = d.e; const open = $$('.push').find(x => x.dataset.hub); if (open) refreshHub(); else openClientes('consultas'); };
ACT.leads = () => openClientes();
ACT.clientes = () => openClientes();
function openLeads() { openClientes('consultas'); }

/* ---- consultas ---- */
function leadRow(l, k = 0) {
  const it = getItem(l.itemId), late = l.etapa === 'nuevo' && leadMin(l) > 10, t = TEMPS.find(x => x[0] === l.temp);
  return `<button class="row" data-act="lead" data-id="${l.id}" style="animation-delay:${Math.min(k, 8) * .04}s">
    <span class="avatar" style="width:44px;height:44px;border-radius:15px;font-size:15px;position:relative">${initials(l.nombre)}${['caliente'].includes(l.temp) && !['ganado', 'perdido'].includes(l.etapa) ? `<span style="position:absolute;right:-3px;bottom:-3px;width:18px;height:18px;border-radius:99px;background:var(--bad);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px var(--s1)">${icon('flame', 11, 2.4)}</span>` : ''}</span>
    <span class="rm"><p class="rt">${l.nombre}</p><p class="rs">${it ? shortName(it.nombre) : 'Sin vehículo'}<span class="chip">${l.origen}</span></p>${l.etapa === 'perdido' && l.motivo ? `<p class="rs" style="margin-top:5px;color:var(--bad)">${icon('close', 12)}${l.motivo}</p>` : ''}</span>
    <span class="rr"><span class="chip ${ETAPA_CHIP[l.etapa]}">${ETAPA_TXT[l.etapa]}</span>${['ganado', 'perdido'].includes(l.etapa) ? '' : `<span class="chip ${late ? 'bad' : ''}" style="background:none;padding:0">${late ? icon('clock', 12) : ''}${minTxt(leadMin(l))}</span>`}</span></button>`;
}
function consultasHtml(w) {
  const ls = leadsOf(w.key), n = e => ls.filter(l => l.etapa === e).length, sr = ls.filter(l => l.etapa === 'nuevo' && leadMin(l) > 10).length;
  const filtros = [['todas', 'Todas'], ['nuevo', 'Nuevas'], ['contactado', 'Contactadas'], ['visita', 'Visita'], ['trato', 'En trato'], ['reserva', 'Reserva'], ['ganado', 'Ganadas'], ['perdido', 'Perdidas']];
  let list = hub.etapa === 'todas' ? ls.filter(l => !['ganado', 'perdido'].includes(l.etapa)) : ls.filter(l => l.etapa === hub.etapa);
  list = [...list].sort((a, b) => (RANK[b.etapa] === -1 ? -1 : 0) - (RANK[a.etapa] === -1 ? -1 : 0) || leadMin(a) - leadMin(b));
  const cierre = n('ganado') + n('perdido'), tasa = cierre ? Math.round(n('ganado') / cierre * 100) : 0;
  return `<div class="grid3" style="gap:10px">${[['Sin responder', sr, sr ? 'var(--bad)' : 'var(--good)', 'nuevo'], ['En trato', n('trato') + n('reserva'), 'var(--warn)', 'trato'], ['Ganadas', n('ganado'), 'var(--good)', 'ganado']].map(([t, v, c, e], i) => `<button class="card pressable" data-act="hubEtapa" data-e="${e}" style="padding:14px 12px;text-align:left;animation:rise .6s var(--spring) ${i * .06}s backwards"><span class="kicker" style="font-size:9px">${t}</span><div class="num" style="font-size:30px;margin-top:9px;line-height:1;color:${c}">${v}</div></button>`).join('')}</div>
  <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:13px 16px"><span style="font-size:13px;color:var(--fg2)">De las consultas cerradas, <b style="color:var(--fg)">${tasa}%</b> terminó en venta</span><span class="chip">${n('perdido')} perdidas</span></div>
  <div class="hscroll">${filtros.map(([k, t]) => `<button class="opt ${hub.etapa === k ? 'on' : ''}" data-act="hubEtapa" data-e="${k}">${t}${k !== 'todas' ? ` · ${n(k)}` : ''}</button>`).join('')}</div>
  <div class="card tight">${list.map(leadRow).join('') || `<div class="empty">${icon('chat', 30)}<p>No hay consultas en esta etapa</p></div>`}</div>
  <button class="btn primary" data-act="nuevaConsulta">${icon('userplus')}Nueva consulta</button>`;
}

/* ---- contactos ---- */
function tagsContacto(c) {
  const ls = LEADS.filter(l => l.w === c.w && (l.fono === c.fono || l.nombre === c.nombre)), t = [];
  if (c.proveedor) t.push(['', 'Proveedor']);
  if (ls.some(l => l.etapa === 'ganado') || VENTAS.some(v => v.w === c.w && v.cliente === c.nombre)) t.push(['good', 'Cliente']);
  if (ls.some(l => !['ganado', 'perdido'].includes(l.etapa))) t.push(['warn', 'Interesado']);
  if (ls.length && ls.every(l => l.etapa === 'perdido')) t.push(['bad', 'Perdido']);
  return t;
}
function contactosHtml(w) {
  const q = hub.q.trim().toLowerCase(), cs = CONTACTOS.filter(c => c.w === w.key && (!q || (c.nombre + c.fono).toLowerCase().includes(q))).sort((a, b) => a.nombre.localeCompare(b.nombre));
  return `<div class="search">${icon('search')}<input placeholder="Buscar por nombre o teléfono…" value="${hub.q}" data-live="liveContactoQ" autocomplete="off" id="cq"></div>
  <div class="card tight" id="clist">${contactoRows(cs)}</div>
  <button class="btn primary" data-act="nuevoContacto">${icon('userplus')}Agregar contacto</button>`;
}
function contactoRows(cs) {
  return cs.map((c, k) => `<div class="row" style="animation-delay:${Math.min(k, 8) * .03}s"><button data-act="contacto" data-id="${c.id}" style="all:unset;display:flex;align-items:center;gap:12px;flex:1;min-width:0;cursor:pointer"><span class="avatar" style="width:44px;height:44px;border-radius:15px;font-size:15px">${initials(c.nombre)}</span><span class="rm"><p class="rt">${c.nombre}</p><p class="rs"><span class="mono" style="font-size:11px">${c.fono || 'Sin teléfono'}</span>${tagsContacto(c).map(([t, x]) => `<span class="chip ${t}">${x}</span>`).join('')}</p></span></button>
    ${c.fono ? `<a class="iconlink" href="${telLink(c.fono)}" data-act="llamarContacto" data-id="${c.id}" aria-label="Llamar a ${c.nombre}">${icon('phone')}</a><a class="iconlink wa" href="${waLink(c.fono, 'Hola ' + firstName(c.nombre) + ', soy ' + firstName(ME.nombre) + ' de ' + W().brand + '.')}" target="_blank" rel="noopener" data-act="waContacto" data-id="${c.id}" aria-label="WhatsApp a ${c.nombre}">${icon('whatsapp')}</a>` : ''}</div>`).join('') || `<div class="empty">${icon('people', 30)}<p>Sin contactos todavía</p></div>`;
}
ACT.liveContactoQ = (d, el, e) => { hub.q = e.target.value; const q = hub.q.trim().toLowerCase(); $('#clist').innerHTML = contactoRows(CONTACTOS.filter(c => c.w === state.world && (!q || (c.nombre + c.fono).toLowerCase().includes(q))).sort((a, b) => a.nombre.localeCompare(b.nombre))); };
ACT.llamarContacto = d => toast('Llamando a ' + firstName(CONTACTOS.find(c => c.id === d.id).nombre), 'phone');
ACT.waContacto = d => toast('Abriendo WhatsApp con el mensaje listo', 'whatsapp');
ACT.contacto = d => openContacto(d.id);
function openContacto(id) {
  const c = CONTACTOS.find(x => x.id === id), ls = LEADS.filter(l => l.w === c.w && (l.fono === c.fono || l.nombre === c.nombre)), vs = VENTAS.filter(v => v.w === c.w && v.cliente === c.nombre);
  pushScreen('Contacto', `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;align-items:center;gap:16px"><span class="avatar xl">${initials(c.nombre)}</span><div class="grow"><h2 style="font:700 24px/1.05 var(--display);font-variation-settings:'wdth' 82;letter-spacing:-.02em">${c.nombre}</h2><div style="margin-top:9px;display:flex;gap:6px;flex-wrap:wrap">${tagsContacto(c).map(([t, x]) => `<span class="chip ${t}">${x}</span>`).join('') || '<span class="chip">Contacto</span>'}</div></div></div>
    ${c.fono ? `<div class="grid2"><a class="btn ghost" href="${telLink(c.fono)}" data-act="llamarContacto" data-id="${c.id}">${icon('phone')}Llamar</a><a class="btn wa" href="${waLink(c.fono, 'Hola ' + firstName(c.nombre) + ', soy de ' + W().brand + '.')}" target="_blank" rel="noopener" data-act="waContacto" data-id="${c.id}">${icon('whatsapp')}WhatsApp</a></div>` : ''}
    <div class="card">${drow('Teléfono', c.fono || '—')}${drow('Email', c.email || '—')}${c.nota ? drow('Nota', c.nota) : ''}</div>
    ${ls.length ? `<div><div class="sec" style="margin:0 0 10px"><span class="kicker">Consultas</span><span class="count">${ls.length}</span></div><div class="card tight">${ls.map(leadRow).join('')}</div></div>` : ''}
    ${vs.length ? `<div><div class="sec" style="margin:0 0 10px"><span class="kicker">Compras</span><span class="count">${vs.length}</span></div><div class="card tight">${vs.map(ventaRow).join('')}</div></div>` : ''}
    <button class="btn danger small" data-act="delContacto" data-id="${c.id}" style="width:100%">${icon('trash', 15)}Eliminar contacto</button>
  </div>`, { cta: `<button class="btn ghost" data-act="recContacto" data-id="${c.id}" style="width:auto;padding:0 20px">${icon('bell')}</button><button class="btn primary" data-act="consultaContacto" data-id="${c.id}">${icon('userplus')}Nueva consulta</button>` });
}
ACT.delContacto = d => { const i = CONTACTOS.findIndex(x => x.id === d.id); if (i < 0 || !confirm('¿Eliminar este contacto?')) return; CONTACTOS.splice(i, 1); popScreen(); refreshHub(); toast('Contacto eliminado', 'trash'); };
ACT.recContacto = d => openNuevoRecordatorio({ contactoId: d.id });
ACT.consultaContacto = d => openNuevaConsulta({ contactoId: d.id });
ACT.nuevoContacto = () => openNuevoContacto();
function openNuevoContacto() {
  openSheet('Agregar contacto', `<div style="display:flex;flex-direction:column;gap:14px">
    <label class="field"><span>Nombre</span><input id="nc-n" placeholder="Nombre y apellido" autocomplete="off"></label>
    <div class="grid2"><label class="field"><span>Teléfono</span><input id="nc-f" inputmode="tel" placeholder="+56 9 …"></label><label class="field"><span>Email (opcional)</span><input id="nc-e" inputmode="email" placeholder="correo@…"></label></div>
    <label class="field"><span>Nota (opcional)</span><input id="nc-t" placeholder="Ej: busca SUV hasta $15.000.000"></label>
    <div class="grid2"><button class="btn ghost" data-act="saveContacto" data-then="">Guardar</button><button class="btn primary" data-act="saveContacto" data-then="consulta">Guardar + consulta</button></div></div>`);
}
ACT.saveContacto = d => {
  const n = $('#nc-n').value.trim(); if (!n) { toast('Falta el nombre', 'warn'); return; }
  const c = { id: nuevoId('c'), w: state.world, nombre: n, fono: $('#nc-f').value.trim(), email: $('#nc-e').value.trim(), nota: $('#nc-t').value.trim() }; CONTACTOS.push(c);
  closeSheet(); toast('Contacto agregado', 'userplus'); refreshHub(); if (d.then === 'consulta') setTimeout(() => openNuevaConsulta({ contactoId: c.id }), 450);
};


/* ---- alta rápida de consulta ---- */
let ncState = {};
function openNuevaConsulta(opt = {}) {
  const w = W(), c = opt.contactoId ? CONTACTOS.find(x => x.id === opt.contactoId) : null, items = activos(w.key).filter(i => i.estado !== 'taller' || true);
  ncState = { origen: opt.origen || (CAT.origenes[w.key].find(o => o.on) || {}).k, temp: 'tibio', contactoId: c ? c.id : null, itemId: opt.itemId || '' , rec: true };
  openSheet('Nueva consulta', `<div id="ncq" style="display:flex;flex-direction:column;gap:14px">
    <div><label class="field"><span>Nombre</span><input id="nq-n" placeholder="Empieza a escribir…" autocomplete="off" value="${c ? c.nombre : ''}" data-live="liveSug"></label><div class="sugg" id="nq-sug"></div></div>
    <label class="field"><span>Teléfono</span><input id="nq-f" inputmode="tel" placeholder="+56 9 …" value="${c ? c.fono : ''}"></label>
    <label class="field"><span>Le interesa</span><select id="nq-i"><option value="">Aún no sabe</option>${items.map(i => `<option value="${i.id}" ${i.id === ncState.itemId ? 'selected' : ''}>${i.nombre}</option>`).join('')}</select></label>
    <div><p class="kicker" style="margin-bottom:10px">¿Por dónde llegó?</p><div class="hscroll">${CAT.origenes[w.key].filter(o => o.on).map(o => `<button class="opt ${o.k === ncState.origen ? 'on' : ''}" data-act="ncOrigen" data-k="${o.k}">${o.n}</button>`).join('')}<button class="opt" data-act="catQuick" data-kind="origenes" data-w="${w.key}" style="border-style:dashed">${icon('plus')}Otro</button></div></div>
    <div><p class="kicker" style="margin-bottom:10px">Qué tan interesado está</p><div class="optrow">${TEMPS.map(([k, t, ic, cl]) => `<button class="opt ${cl} ${k === 'tibio' ? 'on' : ''}" data-act="ncTemp" data-k="${k}">${icon(ic)}${t}</button>`).join('')}</div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0"><span style="font:600 14px var(--body)">Recordarme llamarle en 1 hora</span><button class="toggle on" id="nq-rec" data-act="togSimple" aria-label="Recordatorio"></button></div>
    <button class="btn primary" data-act="saveConsulta">${icon('check')}Guardar consulta</button>
    <p style="font-size:12px;color:var(--fg3);text-align:center;margin-top:-4px">Solo nombre y teléfono son necesarios. El resto lo completas después.</p></div>`);
}
ACT.ncOrigen = (d, el) => { ncState.origen = d.k; $$('[data-act="ncOrigen"]').forEach(b => b.classList.toggle('on', b === el)); };
ACT.ncTemp = (d, el) => { ncState.temp = d.k; $$('[data-act="ncTemp"]').forEach(b => b.classList.toggle('on', b === el)); };
ACT.liveSug = (d, el, e) => {
  const q = e.target.value.trim().toLowerCase(), box = $('#nq-sug'); if (!box) return; if (q.length < 2) { box.innerHTML = ''; return; }
  const m = CONTACTOS.filter(c => c.w === state.world && c.nombre.toLowerCase().includes(q)).slice(0, 3);
  box.innerHTML = m.map(c => `<button class="opt on" data-act="useContacto" data-id="${c.id}">${icon('user2')}${c.nombre}</button>`).join('') + (m.length ? '<span style="font-size:11.5px;color:var(--fg3);align-self:center">¿Es alguno de ellos?</span>' : '');
};
ACT.useContacto = d => { const c = CONTACTOS.find(x => x.id === d.id); ncState.contactoId = c.id; $('#nq-n').value = c.nombre; $('#nq-f').value = c.fono; $('#nq-sug').innerHTML = ''; };
ACT.saveConsulta = () => {
  const w = W(), nombre = $('#nq-n').value.trim(), fono = $('#nq-f').value.trim(); if (!nombre) { toast('Falta el nombre', 'warn'); return; }
  let c = ncState.contactoId ? CONTACTOS.find(x => x.id === ncState.contactoId) : CONTACTOS.find(x => x.w === w.key && fono && x.fono === fono);
  if (!c) { c = { id: nuevoId('c'), w: w.key, nombre, fono, email: '', nota: '' }; CONTACTOS.push(c); }
  const vend = ME.rol === 'vendedor' ? ME.nombre : (EQUIPO.find(e => e.w === w.key && e.activo) || { nombre: ME.nombre }).nombre, origenN = (CAT.origenes[w.key].find(o => o.k === ncState.origen) || { n: 'Directo' }).n;
  const l = L(nuevoId('l'), w.key, c.nombre, c.fono, $('#nq-i').value || null, origenN, 'nuevo', nowISO(), vend, '', { temp: ncState.temp, nueva: true, log: [{ ts: tick(), tipo: 'entrada', txt: `Consulta registrada · ${origenN}` }] });
  LEADS.push(l);
  if ($('#nq-rec').classList.contains('on')) { const d = new Date(nowISO() + ':00'); d.setHours(d.getHours() + 1); const p = n => String(n).padStart(2, '0'); REMS.push({ id: nuevoId('r'), w: w.key, titulo: `Llamar a ${c.nombre}`, cuando: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`, canal: 'push', tpl: 'llamar', ref: { t: 'lead', id: l.id }, hecho: false }); }
  closeSheet(); toast('Consulta agregada', 'userplus'); refreshAll(); renderDock(); refreshHub();
  if (!$$('.push').some(x => x.dataset.hub)) setTimeout(() => openLead(l.id), 420);
};
ACT.nuevaConsulta = () => openNuevaConsulta();

/* ---------------- ficha de consulta ---------------- */
ACT.lead = d => openLead(d.id);
function leadHtml(l) {
  const it = getItem(l.itemId), cerr = ['ganado', 'perdido'].includes(l.etapa), r = RANK[l.etapa];
  const stages = `<div class="stagebar">${ETAPAS.map(([k, t], i) => `<button class="stg ${r > i ? 'done' : r === i ? 'now' : ''}" data-act="leadStage" data-id="${l.id}" data-k="${k}"><i>${icon('check', 13, 3)}</i>${t}</button>`).join('')}</div>`;
  return `<div class="px" style="padding-top:8px;display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;align-items:center;gap:16px"><span class="avatar xl">${initials(l.nombre)}</span><div class="grow"><h2 style="font:700 24px/1.05 var(--display);font-variation-settings:'wdth' 82;letter-spacing:-.02em">${l.nombre}</h2><div style="margin-top:9px;display:flex;gap:6px;flex-wrap:wrap"><span class="chip ${ETAPA_CHIP[l.etapa]}">${ETAPA_TXT[l.etapa]}</span><span class="chip">${l.origen}</span></div></div></div>
    ${l.etapa === 'perdido' ? `<div class="tip">${icon('close')}<span><b>No se concretó:</b> ${l.motivo || 'sin motivo'}. Si cambia de opinión, puedes reabrirla.</span></div>` : ''}
    ${l.etapa === 'ganado' ? `<div class="tip good">${icon('trophy')}<span><b>Venta cerrada.</b> Buen trabajo con ${firstName(l.nombre)}.</span></div>` : ''}
    <div class="grid2"><a class="btn ghost" href="${telLink(l.fono)}" data-act="leadCall" data-id="${l.id}">${icon('phone')}Llamar</a><a class="btn wa" href="${waLink(l.fono, waText(l))}" target="_blank" rel="noopener" data-act="leadWa" data-id="${l.id}">${icon('whatsapp')}WhatsApp</a></div>
    ${it ? `<button class="card pressable" data-act="item" data-id="${it.id}" style="display:flex;align-items:center;gap:14px;text-align:left;width:100%"><span class="thumb">${icon(WORLDS[it.w].icon, 22)}</span><span class="grow"><p class="rt" style="white-space:normal">${it.nombre}</p><p class="rs" style="margin-top:7px">${idChip(it)}</p></span><span class="p num" style="font-size:16px">${fmtM(it.precio)}</span></button>` : ''}
    ${!cerr ? `<div class="card"><span class="kicker">Etapa</span><div style="margin-top:12px">${stages}</div></div>
    <div class="card"><span class="kicker">Nivel de interés</span><div class="optrow" style="margin-top:12px">${TEMPS.map(([k, t, ic, cl]) => `<button class="opt ${cl} ${l.temp === k ? 'on' : ''}" data-act="leadTemp" data-id="${l.id}" data-k="${k}">${icon(ic)}${t}</button>`).join('')}</div></div>` : ''}
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Historial</span><button class="chip accent" data-act="recLead" data-id="${l.id}" style="border:0">${icon('bell', 12)}Recordatorio</button></div>
      <div style="display:flex;gap:8px;margin-top:14px"><input id="ln-t" placeholder="Agregar nota…" autocomplete="off"><button class="btn small primary" data-act="leadNote" data-id="${l.id}" style="min-width:56px;padding:0 14px">${icon('plus')}</button></div>
      <div class="tl" style="margin-top:18px">${[...l.log].reverse().map(e => `<div class="tl-i"><p class="a">${({ entrada: 'Consulta', llamada: 'Llamada', whatsapp: 'WhatsApp', nota: 'Nota', visita: 'Visita', etapa: 'Etapa', recordatorio: 'Recordatorio' })[e.tipo] || 'Nota'}</p><p class="b">${e.txt}</p><p class="c">${relTxt(e.ts)}</p></div>`).join('') || '<p style="font-size:13px;color:var(--fg3)">Sin movimientos</p>'}</div></div>
  </div>`;
}
function leadCta(l) {
  if (l.etapa === 'ganado') return `<button class="btn ghost" data-act="back">Cerrar</button>`;
  if (l.etapa === 'perdido') return `<button class="btn primary" data-act="leadReopen" data-id="${l.id}">${icon('history')}Reabrir consulta</button>`;
  return `<button class="btn danger" data-act="leadLost" data-id="${l.id}" style="width:auto;padding:0 18px">${icon('close')}No le interesó</button><button class="btn primary" data-act="leadWon" data-id="${l.id}">${icon('dollar')}Cerrar venta</button>`;
}
function openLead(id) { const l = LEADS.find(x => x.id === id); pushScreen('Consulta', leadHtml(l), { cta: leadCta(l) }); }
function refreshLead(id) { const top = topPush(), l = LEADS.find(x => x.id === id); if (!top || !l) return; const pb = $('.pbody', top), sc = pb.scrollTop; pb.innerHTML = leadHtml(l); pb.scrollTop = sc; const cta = $('.cta-bar', top); if (cta) cta.innerHTML = leadCta(l); animateIn(top); refreshHub(); refreshAll(); }
ACT.leadCall = d => { const l = LEADS.find(x => x.id === d.id); if (!canWrite()) return; touchLead(l); logLead(l, 'llamada', 'Llamada registrada'); toast('Llamando a ' + firstName(l.nombre), 'phone'); refreshLead(l.id); };
ACT.leadWa = d => { const l = LEADS.find(x => x.id === d.id); if (!canWrite()) return; touchLead(l); logLead(l, 'whatsapp', 'Mensaje de WhatsApp enviado'); toast('Abriendo WhatsApp con el mensaje listo', 'whatsapp'); refreshLead(l.id); };
ACT.leadStage = d => { const l = LEADS.find(x => x.id === d.id); if (l.etapa === d.k) return; l.etapa = d.k; l.ts = nowISO(); logLead(l, 'etapa', 'Pasó a ' + ETAPA_TXT[d.k]); toast('Etapa: ' + ETAPA_TXT[d.k]); refreshLead(l.id); };
ACT.leadTemp = d => { const l = LEADS.find(x => x.id === d.id); l.temp = d.k; toast(TEMPS.find(t => t[0] === d.k)[1]); refreshLead(l.id); };
ACT.leadNote = d => { const l = LEADS.find(x => x.id === d.id), v = $('#ln-t').value.trim(); if (!v) return; logLead(l, 'nota', v); refreshLead(l.id); };
ACT.recLead = d => { const l = LEADS.find(x => x.id === d.id); openNuevoRecordatorio({ contactoId: (contactoOf(l) || {}).id, leadId: l.id }); };
ACT.leadWon = d => { const l = LEADS.find(x => x.id === d.id); openNuevaVenta(l.itemId || undefined, l.id); };
ACT.leadReopen = d => { const l = LEADS.find(x => x.id === d.id); l.etapa = 'contactado'; l.motivo = null; logLead(l, 'etapa', 'Consulta reabierta'); toast('Consulta reabierta'); refreshLead(l.id); };
ACT.leadLost = d => {
  const l = LEADS.find(x => x.id === d.id), ms = CAT.motivos[l.w].filter(m => m.on); let sel = null;
  openSheet('¿Por qué no se concretó?', `<div style="display:flex;flex-direction:column;gap:14px"><p style="font-size:13.5px;color:var(--fg2)">Anotar el motivo te ayuda a ver qué pasa: precio, crédito, competencia…</p>
    <div class="optrow" id="lost-opts">${ms.map(m => `<button class="opt" data-act="lostPick" data-n="${m.n}">${m.n}</button>`).join('')}<button class="opt" data-act="catQuick" data-kind="motivos" data-w="${l.w}" style="border-style:dashed">${icon('plus')}Otro</button></div>
    <label class="field"><span>Detalle (opcional)</span><input id="lost-t" placeholder="Ej: compró un Tucson en otra automotora"></label>
    <button class="btn danger" id="lost-ok" data-act="lostSave" data-id="${l.id}" disabled>${icon('close')}Marcar como perdida</button></div>`);
};
ACT.lostPick = (d, el) => { $$('[data-act="lostPick"]').forEach(b => b.classList.toggle('on', b === el)); window._lost = d.n; $('#lost-ok').disabled = false; };
ACT.lostSave = d => {
  const l = LEADS.find(x => x.id === d.id), det = $('#lost-t').value.trim(); l.etapa = 'perdido'; l.motivo = window._lost; logLead(l, 'etapa', `Marcado como perdido: ${l.motivo}${det ? ' · ' + det : ''}`);
  closeSheet(); toast('Consulta marcada como perdida', 'close'); refreshLead(l.id);
};

/* ---------------- recordatorios ---------------- */
const REC_TPL = {
  auto: [['llamar', 'phone', 'Llamar'], ['wa', 'whatsapp', 'WhatsApp'], ['visita', 'calendar', 'Test drive'], ['cobrar', 'receipt', 'Cobrar'], ['papeles', 'doc', 'Papeles'], ['otro', 'bell', 'Otro']],
  prop: [['llamar', 'phone', 'Llamar'], ['wa', 'whatsapp', 'WhatsApp'], ['visita', 'calendar', 'Visita'], ['cobrar', 'receipt', 'Cobrar'], ['papeles', 'doc', 'Certificados'], ['otro', 'bell', 'Otro']],
  tienda: [['llamar', 'phone', 'Llamar'], ['reponer', 'box', 'Reponer'], ['cobrar', 'receipt', 'Cobrar'], ['otro', 'bell', 'Otro']],
};
const TPL_TXT = { llamar: 'Llamar a ', wa: 'Enviar WhatsApp a ', visita: 'Visita con ', cobrar: 'Cobrar a ', papeles: 'Revisar papeles de ', reponer: 'Reponer stock de ', otro: '' };
const cuandoTxt = ts => { const d = ts.slice(0, 10), h = hhmm(ts); const n = diffDays(d); return (n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n < 0 ? 'Venció ' + fechaCorta(d) : fechaCorta(d)) + ' · ' + h; };
function recordatoriosHtml(w) {
  const rs = REMS.filter(r => r.w === w.key), now = nowISO(), act = rs.filter(r => !r.hecho).sort((a, b) => a.cuando.localeCompare(b.cuando));
  const late = act.filter(r => r.cuando < now), hoy = act.filter(r => r.cuando >= now && r.cuando.slice(0, 10) === TODAY), prox = act.filter(r => r.cuando.slice(0, 10) > TODAY), hechos = rs.filter(r => r.hecho);
  const grupo = (t, l, c) => l.length ? `${sec(t, l.length)}<div class="card tight">${l.map(recRow).join('')}</div>` : '';
  return `<div class="card" style="display:flex;gap:12px;align-items:center;padding:14px 16px"><span class="thumb" style="width:40px;height:40px;border-radius:12px;background:var(--accent-soft)">${icon('bell', 18)}</span><span class="grow" style="font-size:13px;color:var(--fg2)">Te avisamos en tu celular a la hora que elijas. <button class="link" data-act="probarNotif" style="background:none;border:0;color:var(--accent);font:700 13px var(--body);padding:0">Ver cómo llega</button></span></div>
  ${grupo('Vencidos', late)}${grupo('Hoy', hoy)}${grupo('Próximos', prox)}${grupo('Hechos', hechos)}
  ${!rs.length ? `<div class="card"><div class="empty">${icon('bell', 30)}<p>Sin recordatorios. Crea el primero.</p></div></div>` : ''}
  <button class="btn primary" data-act="nuevoRecordatorio">${icon('bell')}Nuevo recordatorio</button>`;
}
function recRow(r) {
  const late = !r.hecho && r.cuando < nowISO(), tp = (REC_TPL[r.w].find(t => t[0] === r.tpl) || REC_TPL[r.w][5] || REC_TPL[r.w][0])[1];
  return `<div class="row" style="cursor:default"><button data-act="recDone" data-id="${r.id}" aria-label="Marcar hecho" style="width:30px;height:30px;border-radius:99px;border:2px solid ${r.hecho ? 'var(--accent)' : 'var(--line2)'};background:${r.hecho ? 'var(--accent)' : 'none'};color:var(--accent-ink);display:flex;align-items:center;justify-content:center;flex:none;transition:all .3s var(--spring)">${r.hecho ? icon('check', 15, 3) : ''}</button>
    <button data-act="reminder" data-id="${r.id}" style="all:unset;display:flex;flex-direction:column;gap:5px;flex:1;min-width:0;cursor:pointer"><span class="rt" style="${r.hecho ? 'text-decoration:line-through;color:var(--fg3)' : ''};white-space:normal">${r.titulo}</span><span class="rs" style="margin:0"><span class="chip ${late ? 'bad' : ''}">${icon(late ? 'clock' : tp, 12)}${cuandoTxt(r.cuando)}</span><span class="chip">${r.canal === 'wa' ? 'WhatsApp' : r.canal === 'ambos' ? 'Celular + WhatsApp' : 'Notificación'}</span></span></button></div>`;
}
ACT.recDone = d => { const r = REMS.find(x => x.id === d.id); r.hecho = !r.hecho; if (r.hecho) toast('Recordatorio hecho'); refreshHub(); refreshAll(); };
ACT.reminder = d => openReminder(d.id);
function openReminder(id) {
  const r = REMS.find(x => x.id === id); if (!r) return; const ref = r.ref;
  const lead = ref && ref.t === 'lead' ? LEADS.find(l => l.id === ref.id) : null, canWa = lead && lead.fono;
  openSheet('Recordatorio', `<div style="display:flex;flex-direction:column;gap:14px">
    <div class="card" style="background:var(--s2)"><p style="font:700 16px/1.3 var(--body)">${r.titulo}</p><p class="rs" style="margin-top:10px"><span class="chip ${r.cuando < nowISO() && !r.hecho ? 'bad' : ''}">${icon('clock', 12)}${cuandoTxt(r.cuando)}</span><span class="chip">${r.canal === 'wa' ? 'WhatsApp' : r.canal === 'ambos' ? 'Celular + WhatsApp' : 'Notificación'}</span></p></div>
    ${canWa ? `<a class="btn wa" href="${waLink(lead.fono, waText(lead))}" target="_blank" rel="noopener" data-act="leadWa" data-id="${lead.id}">${icon('whatsapp')}Enviar WhatsApp ahora</a>` : ''}
    <div class="grid2"><button class="btn ghost" data-act="recSnooze" data-id="${r.id}" data-m="60">${icon('clock')}En 1 hora</button><button class="btn ghost" data-act="recSnooze" data-id="${r.id}" data-m="tomorrow">${icon('calendar')}Mañana 9:00</button></div>
    <div class="grid2">${ref ? `<button class="btn ghost" data-act="recOpen" data-id="${r.id}">${icon('arrowR')}Abrir ficha</button>` : '<span></span>'}<button class="btn primary" data-act="recDone2" data-id="${r.id}">${icon('check')}Hecho</button></div>
    <button class="btn danger" data-act="recDel" data-id="${r.id}">${icon('trash')}Eliminar</button></div>`);
}
ACT.recOpen = d => { const r = REMS.find(x => x.id === d.id); closeSheet(); setTimeout(() => { if (r.ref.t === 'lead') openLead(r.ref.id); else if (r.ref.t === 'venta') openVenta(r.ref.id); else if (r.ref.t === 'item') openItem(r.ref.id); }, 350); };
ACT.recDone2 = d => { const r = REMS.find(x => x.id === d.id); r.hecho = true; closeSheet(); toast('Recordatorio hecho'); refreshHub(); refreshAll(); };
ACT.recDel = d => { REMS.splice(REMS.findIndex(x => x.id === d.id), 1); closeSheet(); toast('Recordatorio eliminado', 'trash'); refreshHub(); refreshAll(); };
ACT.recSnooze = d => {
  const r = REMS.find(x => x.id === d.id), p = n => String(n).padStart(2, '0'); const t = new Date(nowISO() + ':00');
  if (d.m === 'tomorrow') { t.setDate(t.getDate() + 1); t.setHours(9, 0); } else t.setMinutes(t.getMinutes() + 60);
  r.cuando = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}T${p(t.getHours())}:${p(t.getMinutes())}`; closeSheet(); toast('Pospuesto a ' + cuandoTxt(r.cuando).toLowerCase(), 'clock'); refreshHub(); refreshAll();
};
let nrState = {};
function openNuevoRecordatorio(opt = {}) {
  const w = W(), tp = REC_TPL[w.key], c = opt.contactoId ? CONTACTOS.find(x => x.id === opt.contactoId) : null;
  nrState = { tpl: tp[0][0], when: 'h1', canal: 'push', wa: false, contactoId: c ? c.id : '', leadId: opt.leadId || null };
  openSheet('Nuevo recordatorio', `<div id="nrq" style="display:flex;flex-direction:column;gap:14px">
    <div><p class="kicker" style="margin-bottom:10px">¿Qué quieres recordar?</p><div class="optrow">${tp.map(([k, ic, t], i) => `<button class="opt ${i === 0 ? 'on' : ''}" data-act="nrTpl" data-k="${k}">${icon(ic)}${t}</button>`).join('')}</div></div>
    <label class="field"><span>Para quién (opcional)</span><select id="nr-c" data-change="nrContacto"><option value="">Sin cliente</option>${CONTACTOS.filter(x => x.w === w.key).map(x => `<option value="${x.id}" ${c && x.id === c.id ? 'selected' : ''}>${x.nombre}</option>`).join('')}</select></label>
    <label class="field"><span>Título</span><input id="nr-t" value="${TPL_TXT[tp[0][0]]}${c ? c.nombre : ''}" autocomplete="off"></label>
    <div><p class="kicker" style="margin-bottom:10px">¿Cuándo?</p><div class="hscroll">${[['h1', 'En 1 hora'], ['h18', 'Hoy 18:00'], ['m9', 'Mañana 9:00'], ['d3', 'En 3 días']].map(([k, t], i) => `<button class="opt ${i === 0 ? 'on' : ''}" data-act="nrWhen" data-k="${k}">${t}</button>`).join('')}</div></div>
    <div><p class="kicker" style="margin-bottom:10px">¿Cómo te avisamos?</p>
      <div class="card tight">
        <div class="pickrow" style="padding:14px 16px"><span class="ni thumb" style="width:38px;height:38px">${icon('bell', 18)}</span><span class="grow"><b style="font:600 14px var(--body)">Notificación en tu celular</b><br><span style="font-size:12px;color:var(--fg3)">Llega a la hora elegida</span></span><button class="toggle on" id="nr-push" data-act="togSimple" aria-label="Notificación"></button></div>
        <div class="pickrow" style="padding:14px 16px"><span class="thumb" style="width:38px;height:38px;color:#25D366">${icon('whatsapp', 18)}</span><span class="grow"><b style="font:600 14px var(--body)">WhatsApp al cliente</b><br><span style="font-size:12px;color:var(--fg3)" id="nr-wahint">${c && c.fono ? 'Se abre con el mensaje listo, un toque' : 'Elige un cliente con teléfono'}</span></span><button class="toggle" id="nr-wa" data-act="togSimple" aria-label="WhatsApp"></button></div></div></div>
    <button class="btn primary" data-act="saveRecordatorio">${icon('bell')}Guardar recordatorio</button>
    <button class="btn ghost small" data-act="probarNotif" style="width:100%">Ver cómo llegará la notificación</button></div>`);
}
ACT.nrTpl = (d, el) => { nrState.tpl = d.k; $$('[data-act="nrTpl"]').forEach(b => b.classList.toggle('on', b === el)); const c = CONTACTOS.find(x => x.id === $('#nr-c').value); $('#nr-t').value = (TPL_TXT[d.k] || '') + (c ? c.nombre : ''); };
ACT.nrWhen = (d, el) => { nrState.when = d.k; $$('[data-act="nrWhen"]').forEach(b => b.classList.toggle('on', b === el)); };
ACT.nrContacto = (d, el) => { const c = CONTACTOS.find(x => x.id === el.value); const t = $('#nr-t'); t.value = (TPL_TXT[nrState.tpl] || '') + (c ? c.nombre : ''); $('#nr-wahint').textContent = c && c.fono ? 'Se abre con el mensaje listo, un toque' : 'Elige un cliente con teléfono'; };
ACT.saveRecordatorio = () => {
  const w = W(), titulo = $('#nr-t').value.trim(); if (!titulo) { toast('Escribe un título', 'warn'); return; }
  const p = n => String(n).padStart(2, '0'), t = new Date(nowISO() + ':00');
  if (nrState.when === 'h1') t.setHours(t.getHours() + 1); else if (nrState.when === 'h18') t.setHours(18, 0); else if (nrState.when === 'm9') { t.setDate(t.getDate() + 1); t.setHours(9, 0); } else { t.setDate(t.getDate() + 3); t.setHours(9, 0); }
  const cuando = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}T${p(t.getHours())}:${p(t.getMinutes())}`, push = $('#nr-push').classList.contains('on'), wa = $('#nr-wa').classList.contains('on'), cid = $('#nr-c').value;
  const lead = nrState.leadId ? { t: 'lead', id: nrState.leadId } : cid ? { t: 'contacto', id: cid } : null;
  REMS.push({ id: nuevoId('r'), w: w.key, titulo, cuando, canal: push && wa ? 'ambos' : wa ? 'wa' : 'push', tpl: nrState.tpl, ref: lead, hecho: false });
  if (nrState.leadId) { const l = LEADS.find(x => x.id === nrState.leadId); logLead(l, 'recordatorio', `${titulo} · ${cuandoTxt(cuando).toLowerCase()}`); refreshLead(l.id); }
  closeSheet(); toast('Te avisamos ' + cuandoTxt(cuando).toLowerCase(), 'bell'); refreshHub(); refreshAll();
};
ACT.nuevoRecordatorio = () => openNuevoRecordatorio();
ACT.probarNotif = () => { const r = REMS.find(x => x.w === state.world && !x.hecho); notify('Recordatorio', r ? r.titulo : 'Así te avisamos de tus pendientes'); if (window.RV && RV.askNotif) RV.askNotif(); };
