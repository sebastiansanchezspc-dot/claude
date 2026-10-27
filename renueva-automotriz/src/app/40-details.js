/* =====================================================================
   PANTALLAS DE DETALLE (push) y FORMULARIOS (sheets)
   ===================================================================== */
const itemTabState = {};
const seg = (id, opts, active, act, extra = '') => `<div class="seg" id="${id}">${opts.map(([k, t]) => `<button data-act="${act}" data-k="${k}" ${extra} class="${active === k ? 'active' : ''}">${t}</button>`).join('')}<span class="ind"></span></div>`;
const kpi = (l, v, sub = '', col = '') => `<div class="card" style="padding:14px"><span class="kicker" style="font-size:9.5px">${l}</span><div class="num" style="font-size:19px;margin-top:9px;line-height:1;white-space:nowrap;${col ? 'color:' + col : ''}">${v}</div>${sub ? `<div style="font-size:11.5px;color:var(--fg3);margin-top:7px">${sub}</div>` : ''}</div>`;
const drow = (l, v) => `<div class="drow"><span class="l">${l}</span><span class="v">${v}</span></div>`;

ACT.item = d => openItem(d.id); ACT.venta = d => openVenta(d.id); ACT.vendor = d => openVendor(d.id); ACT.metodo = d => openMetodo(d.m);
ACT.gastos = () => openGastos(); ACT.alerts = () => openAlerts(); ACT.ajustes = () => openAjustes(); ACT.leads = () => openLeads();
ACT.nuevoItem = () => openNuevoItem(); ACT.nuevaVenta = () => openNuevaVenta();

/* ---------------- ficha de ítem ---------------- */
function itemTabs(it) { return it.w === 'tienda' ? [['info', 'Información'], ['hist', 'Movimiento']] : [['info', 'Información'], ['docs', 'Documentos'], ['hist', 'Historial']]; }
function itemHtml(it) {
  const w = WORLDS[it.w], tab = itemTabState[it.id] || 'info';
  const gal = it.fotos.length
    ? it.fotos.map((f, i) => `<div class="shot"><img src="${fotoSrc(f)}" alt="Foto ${i + 1}"><button class="rm2" data-act="rmFoto" data-id="${it.id}" data-i="${i}" aria-label="Quitar foto">${icon('close')}</button></div>`).join('')
    : `<div class="shot ph">${icon(w.icon, 44, 1.1)}<span style="font:500 11px var(--mono);letter-spacing:.1em">SIN FOTOS AÚN</span></div>`;
  const cerrado = ['vendido', 'arrendado'].includes(it.estado);
  const estChip = { disponible: ['good', 'Disponible'], reservado: ['warn', it.w === 'prop' ? 'En promesa' : 'Reservado'], taller: ['', 'En taller'], vendido: ['', 'Vendido'], arrendado: ['', 'Arrendada'], agotado: ['bad', 'Agotado'] }[it.estado] || ['', it.estado];
  let kp;
  if (isVend()) kp = `<div class="grid2">${kpi(it.w === 'prop' && it.op === 'Arriendo' ? 'Arriendo mensual' : 'Precio', fmtM(it.precio))}${it.w === 'tienda' ? kpi('En stock', it.stock + ' un.') : kpi('En stock hace', diasStock(it) + ' días')}</div>`;
  else if (it.w === 'auto') { const mg = it.precio - it.costo - it.recon, p = ptm(it); kp = `<div class="grid2">${kpi('Inversión', fmtM(it.costo + it.recon), it.recon ? `incl. ${fmtM(it.recon)} de reacond.` : 'sin reacondicionar')}${kpi('Precio publicado', fmtM(it.precio), `<span style="color:${p > 0.02 ? 'var(--warn)' : 'var(--good)'}">${p >= 0 ? '+' : ''}${(p * 100).toFixed(1).replace('.', ',')}% vs mercado</span>`)}</div>${kpi('Margen potencial', fmt(mg), `${(mg / it.precio * 100).toFixed(1).replace('.', ',')}% sobre el precio`, 'var(--good)')}`; }
  else if (it.w === 'prop') { const hon = it.op === 'Arriendo' ? it.precio : Math.round(it.precio * 0.04); kp = `<div class="grid2">${kpi(it.op === 'Arriendo' ? 'Arriendo mensual' : 'Precio', fmtM(it.precio))}${kpi('Honorario estimado', fmtM(hon), it.op === 'Arriendo' ? '1 mes' : '4% (2% + 2%)', 'var(--good)')}</div>`; }
  else { const mg = (it.precio - it.costoU) / it.precio; kp = `<div class="grid2">${kpi('Precio', fmt(it.precio))}${kpi('Margen', Math.round(mg * 100) + '%', `${fmt(it.precio - it.costoU)} por unidad`, 'var(--good)')}</div>`; }
  return `
    <div class="gallery">${gal}<label class="addshot">${icon('camera')}<span>Agregar foto</span><input type="file" accept="image/*" multiple hidden data-change="addFotos" data-id="${it.id}"></label></div>
    <div class="px" style="padding-top:18px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div class="grow"><h2 style="font:700 26px/1.05 var(--display);font-variation-settings:'wdth' 82,'opsz' 60;letter-spacing:-.02em;text-wrap:balance">${it.nombre}</h2><div style="margin-top:12px">${idChip(it, true)}</div></div><span class="chip ${estChip[0]}">${estChip[1]}</span></div>
      ${it.aprob === 'pendiente' ? precioCard(it) : kp}
      ${seg('seg-i', itemTabs(it), tab, 'itemTab', `data-id="${it.id}"`)}
      <div id="itab" class="tabs-body">${itemTabHtml(it, tab)}</div>
    </div>`;
}
// lo que ingresa un vendedor queda "por aprobar" hasta que el administrador pone precio y costo
function precioCard(it) {
  const quien = it.creadoPor ? clean(it.creadoPor.nombre || it.creadoPor.email) : 'Un vendedor', sug = it.precioSug ? fmt(it.precioSug) : '';
  if (!isAdmin()) return `<div class="tip">${icon('clock')}<span>Esperando que el administrador ponga el precio de venta.${sug ? ` Sugeriste ${sug}.` : ''} Cuando lo apruebe quedará a la venta.</span></div>`;
  return `<div class="card" style="border-color:var(--warn)"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Por aprobar</span><span class="chip warn">${icon('clock', 12)}${firstName(quien)}</span></div>
    <p style="font-size:13px;color:var(--fg2);margin-top:12px;line-height:1.45">${quien} ingresó este ${WORLDS[it.w].itemOne.toLowerCase()} el ${fechaCL(it.ingreso)}.${sug ? ` Precio sugerido: <b style="color:var(--fg)">${sug}</b>.` : ''}</p>
    <div class="grid2" style="margin-top:14px"><label class="field"><span>Precio de venta</span><input id="pa-p" data-money inputmode="numeric" placeholder="$0" value="${it.precioSug ? fmt(it.precioSug) : ''}"></label>
    ${it.w === 'prop' ? '' : `<label class="field"><span>${it.w === 'tienda' ? 'Costo unitario' : 'Costo de compra'}</span><input id="pa-c" data-money inputmode="numeric" placeholder="$0"></label>`}</div>
    <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="itemDescartar" data-id="${it.id}">${icon('trash')}Descartar</button><button class="btn primary" data-act="itemAprobar" data-id="${it.id}">${icon('check')}Aprobar</button></div></div>`;
}
ACT.itemAprobar = d => {
  const it = getItem(d.id); if (!it || it.aprob !== 'pendiente') return;
  const precio = money($('#pa-p').value), costo = $('#pa-c') ? money($('#pa-c').value) : 0;
  if (!precio) { toast('Pon el precio de venta', 'warn'); return; }
  it.precio = precio; if (it.w === 'tienda') { it.costoU = costo; it.costo = costo * it.stock; } else if (it.w === 'auto') it.costo = costo;
  delete it.aprob; it.aprobadoPor = ME.nombre;
  refreshItem(it.id); renderAll(); toast(`${shortName(it.nombre)} quedó a la venta en ${fmtM(precio)}`);
  const cta = topPush() && $('.cta-bar', topPush()); if (cta) cta.innerHTML = itemCta(it);
};
ACT.itemDescartar = d => {
  const it = getItem(d.id); if (!it) return;
  if (!confirm(`¿Descartar "${it.nombre}"? Se elimina del stock.`)) return;
  STOCK.splice(STOCK.indexOf(it), 1); while (pushes.length) popScreen(); renderAll(); toast('Ingreso descartado', 'trash');
};
function itemCta(it) {
  if (it.aprob === 'pendiente') return `<button class="btn ghost" data-act="editarItem" data-id="${it.id}" style="width:100%">${icon('edit')}Editar datos</button>`;
  const cerrado = ['vendido', 'arrendado'].includes(it.estado);
  if (it.w === 'tienda') return `<button class="btn ghost" data-act="reponer" data-id="${it.id}">${icon('box')}Reponer</button><button class="btn primary" data-act="nuevaVentaItem" data-id="${it.id}" ${it.stock ? '' : 'disabled'}>${icon('dollar')}Vender</button>`;
  if (it.pendVenta && VENTAS.some(x => x.id === it.pendVenta)) return `<button class="btn primary" data-act="venta" data-id="${it.pendVenta}">${icon('clock')}Venta por aprobar</button>`;
  if (cerrado) { const v = VENTAS.find(x => x.itemId === it.id && aprobada(x)) || VENTAS.find(x => x.itemId === it.id); return `<button class="btn primary" data-act="venta" data-id="${v ? v.id : ''}" ${v ? '' : 'disabled'}>${icon('receipt')}Ver ${it.w === 'prop' ? 'operación' : 'venta'}</button>`; }
  return `<button class="btn ghost" data-act="editarItem" data-id="${it.id}" style="width:auto;padding:0 20px">${icon('edit')}</button><button class="btn primary" data-act="nuevaVentaItem" data-id="${it.id}">${icon('dollar')}Registrar ${it.w === 'prop' ? 'operación' : 'venta'}</button>`;
}
function openItem(id, tab) {
  const it = getItem(id); if (!it) return; if (tab) itemTabState[id] = tab;
  pushScreen(WORLDS[it.w].itemOne, itemHtml(it), { cta: itemCta(it), right: `<button class="ibtn" data-act="editarItem" data-id="${it.id}" aria-label="Editar">${icon('edit')}</button>`, onReady: el => moveSeg('seg-i') });
}
function refreshItem(id) {
  const top = topPush(); if (!top) return; const it = getItem(id), sc = $('.pbody', top).scrollTop;
  $('.pbody', top).innerHTML = itemHtml(it); $('.pbody', top).scrollTop = sc; moveSeg('seg-i'); animateIn(top);
}
ACT.itemTab = d => {
  itemTabState[d.id] = d.k; const s = $('#seg-i'); $$('button', s).forEach(b => b.classList.toggle('active', b.dataset.k === d.k));
  const b = $('button.active', s), ind = $('.ind', s); ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft - 3}px)`;
  const c = $('#itab'); c.innerHTML = itemTabHtml(getItem(d.id), d.k); c.classList.remove('tabs-body'); void c.offsetWidth; c.classList.add('tabs-body'); animateIn(c);
};
function docCard(it, d) {
  const chip = `<span class="chip ${d.est === 'ok' ? 'good' : d.est}">${d.est === 'ok' ? 'Al día' : d.est === 'warn' ? 'Por vencer' : 'Urgente'}</span>`;
  let ctl = '';
  if (d.k === 'permiso') ctl = `<div class="steps">${[[0, 'Pendiente'], [1, '1ª cuota'], [2, '2ª cuota · al día']].map(([n, t]) => `<button class="${it.permiso.pagadas >= n && (n > 0 || it.permiso.pagadas === 0) ? (n === it.permiso.pagadas ? 'on' : '') : ''}" data-act="setPermiso" data-id="${it.id}" data-n="${n}">${t}</button>`).join('')}</div>`;
  else if (['rev', 'soap'].includes(d.k)) ctl = `<div class="field" style="margin-top:12px"><span>Vencimiento</span><input type="date" value="${d.k === 'rev' ? it.rev : it.soap}" data-change="setDoc" data-id="${it.id}" data-k="${d.k}"></div>`;
  else if (it.w === 'prop' && d.k === 'contrib') ctl = `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><span style="font-size:13px;color:var(--fg2)">Contribuciones al día</span><button class="toggle ${it.docs.contrib ? 'on' : ''}" data-act="togContrib" data-id="${it.id}" aria-label="Contribuciones al día"></button></div>`;
  else if (it.w === 'prop') ctl = `<div class="field" style="margin-top:12px"><span>Vencimiento</span><input type="date" value="${d.k === 'dominio' ? it.docs.dominio : d.k === 'grav' ? it.docs.grav : it.mandato}" data-change="setDoc" data-id="${it.id}" data-k="${d.k}"></div>`;
  return `<div class="doc"><div class="dh"><span class="dt"><span class="di">${icon(d.icon)}</span><span>${d.label}<br><small style="font:500 12px var(--body);color:${d.est === 'ok' ? 'var(--fg3)' : d.est === 'warn' ? 'var(--warn)' : 'var(--bad)'}">${d.txt}</small></span></span>${chip}</div>${ctl}</div>`;
}
function itemTabHtml(it, tab) {
  const w = WORLDS[it.w];
  if (tab === 'docs') return `<div style="display:flex;flex-direction:column;gap:12px">${docsOf(it).map(d => docCard(it, d)).join('')}<p style="font-size:12px;color:var(--fg3);text-align:center;padding:4px 18px">${it.w === 'auto' ? 'El permiso de circulación puede pagarse en 1 o 2 cuotas. Revisa que revisión técnica y SOAP estén vigentes antes de entregar.' : 'Mantén los certificados vigentes: los compradores y notarías los exigen al cerrar.'}</p></div>`;
  if (tab === 'hist') {
    const ev = [];
    if (it.w === 'tienda') {
      const mv = ventasOf('tienda').filter(v => v.itemId === it.id).slice(-6).reverse();
      ev.push(...mv.map(v => ({ a: `Venta ×${v.q}`, b: `${v.vend} · ${fmt(v.ingreso)}`, c: `${fechaCL(v.fecha)} ${v.hora}:00` })));
      ev.push({ a: 'Ingreso de lote', b: `${it.stockInicial} unidades · ${it.prov.n}`, c: fechaCL(it.ingreso) });
    } else {
      const v = VENTAS.find(x => x.itemId === it.id);
      if (v) ev.push({ a: it.w === 'prop' ? (it.estado === 'arrendado' ? 'Arriendo cerrado' : 'Escritura firmada') : 'Vendido', b: `${v.cliente} · ${fmt(v.precio)}`, c: fechaCL(v.fecha) });
      if (it.reservaVenc) ev.push({ a: 'Reservado', b: `Reserva vigente hasta ${fechaCorta(it.reservaVenc)}`, c: 'En curso' });
      if (it.w === 'prop' && it.estado === 'reservado') ev.push({ a: 'Oferta aceptada', b: 'Promesa de compraventa por firmar', c: 'Pendiente' });
      (it.vis || []).slice(-5).reverse().forEach(d => ev.push({ a: 'Visita', b: 'Visita a la propiedad', c: fechaCL(d) }));
      if (it.pubs.length) ev.push({ a: `Publicado en ${it.pubs.length} portales`, b: it.pubs.map(p => portalName(it.w, p)).join(', '), c: fechaCL(it.ingreso) });
      if (it.recon && !isVend()) ev.push({ a: 'Reacondicionamiento', b: `${fmt(it.recon)} invertidos en preparación`, c: fechaCL(it.ingreso) });
      ev.push({ a: it.w === 'prop' ? 'Captación' : 'Ingreso a stock', b: it.w === 'prop' ? `${it.dueno} · mandato ${it.op === 'Venta' ? 'de venta' : 'de arriendo'}` : isVend() ? `Ingresó a stock` : `Comprado a ${it.prov.n} · ${fmt(it.costo)}`, c: fechaCL(it.ingreso) });
    }
    return `<div class="card"><div class="tl">${ev.map(e => `<div class="tl-i"><p class="a">${e.a}</p><p class="b">${e.b}</p><p class="c">${e.c}</p></div>`).join('')}</div></div>`;
  }
  // info
  const specs = w.campos.map(([k, l]) => drow(l, (it.specs[k] ?? '—') + (k === 'km' ? ' km' : ['m2c', 'm2t'].includes(k) && it.specs[k] !== '-' ? ' m²' : ''))).join('');
  let extra = '';
  if (it.w === 'auto') {
    const p = ptm(it);
    extra = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Precio vs mercado</span><span class="chip ${p > 0.02 ? 'warn' : 'good'}">${p >= 0 ? '+' : ''}${(p * 100).toFixed(1).replace('.', ',')}%</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:14px"><div><p class="mono" style="font-size:10px;color:var(--fg3)">TU PRECIO</p><p class="num" style="font-size:20px;margin-top:5px">${fmt(it.precio)}</p></div><div style="text-align:right"><p class="mono" style="font-size:10px;color:var(--fg3)">MERCADO</p><p class="num" style="font-size:20px;margin-top:5px;color:var(--fg2)">${fmt(it.mercado)}</p></div></div>
      ${p > 0.02 ? `<div class="tip">${icon('sparkle')}<span>Bajar a ${fmt(it.mercado)} te pone en precio de mercado y acelera la venta.</span></div>` : ''}</div>
    <div class="card"><span class="kicker">Publicado en</span><div class="pubs" style="margin-top:12px">${portalesOf('auto').map(({ k, n }) => `<button class="pub ${it.pubs.includes(k) ? 'on' : ''}" data-act="togPub" data-id="${it.id}" data-p="${k}">${icon(it.pubs.includes(k) ? 'check' : 'plus', 14, 2.2)}${n}</button>`).join('')}<button class="pub" data-act="catQuick" data-kind="portales" data-w="${it.w}" style="border-style:dashed">${icon('plus', 14, 2.2)}Otro</button></div></div>`;
  } else if (it.w === 'prop') {
    extra = `<div class="card"><span class="kicker">Publicado en</span><div class="pubs" style="margin-top:12px">${portalesOf('prop').map(({ k, n }) => `<button class="pub ${it.pubs.includes(k) ? 'on' : ''}" data-act="togPub" data-id="${it.id}" data-p="${k}">${icon(it.pubs.includes(k) ? 'check' : 'plus', 14, 2.2)}${n}</button>`).join('')}<button class="pub" data-act="catQuick" data-kind="portales" data-w="${it.w}" style="border-style:dashed">${icon('plus', 14, 2.2)}Otro</button></div></div>
    <div class="card">${drow('Visitas totales', visitasDe(it))}${drow('Últimos 14 días', visitas14(it) === 0 ? '<span style="color:var(--bad)">0 visitas</span>' : visitas14(it))}${drow('Propietario', it.dueno)}${drow('Mandato hasta', fechaCL(it.mandato))}${drow('Corredor', it.gestor)}<button class="btn ghost small" data-act="addVisita" data-id="${it.id}" style="width:100%;margin-top:12px">${icon('eye', 15)}Registrar visita de hoy</button></div>`;
  } else {
    const pct = Math.min(100, it.stock / Math.max(1, it.minimo * 2) * 100), col = it.stock === 0 ? 'var(--bad)' : it.stock < it.minimo ? 'var(--warn)' : 'var(--good)';
    extra = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Nivel de stock</span><span class="chip ${it.stock < it.minimo ? (it.stock ? 'warn' : 'bad') : 'good'}">${it.stock} / mín. ${it.minimo}</span></div>
      <div class="gauge"><i style="width:0;background:${col};--w:${pct}%" data-w="${pct}"></i><b style="position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:var(--fg3);opacity:.6"></b></div>
      <p style="font-size:12px;color:var(--fg3);margin-top:12px">Vende ${ventas30(it)} al mes · alcanza para ${ventas30(it) ? Math.round(it.stock / (ventas30(it) / 30)) : '∞'} días · último movimiento ${fechaCorta(it.ultimaVenta)}</p></div>
    <div class="card">${isVend() ? drow('Precio de venta', fmt(it.precio)) : drow('Costo unitario', fmt(it.costoU)) + drow('Precio de venta', fmt(it.precio)) + drow('Proveedor', it.prov.n) + drow('Valor en bodega', fmt(it.costoU * it.stock))}</div>`;
  }
  const prov = it.w === 'auto' ? `<div class="card">${drow('Proveedor', it.prov.n)}${drow('Fono proveedor', it.prov.f)}${drow('Gestionó', it.gestor)}${drow('Ingreso', fechaCL(it.ingreso) + ` · ${diasStock(it)} días`)}</div>` : '';
  return `<div style="display:flex;flex-direction:column;gap:12px"><div class="card">${specs}</div>${extra}${prov}<label class="field"><span>Observaciones</span><textarea placeholder="Notas internas, estado, detalles…" data-change="itemNota" data-id="${it.id}">${it.notas || ''}</textarea></label></div>`;
}
// el permiso de circulación vence el 31 de marzo (1ª cuota) y la 2ª cuota en agosto
const proxMarzo = () => { const y = +TODAY.slice(0, 4); return TODAY <= `${y}-03-31` ? `${y}-03-31` : `${y + 1}-03-31`; };
ACT.itemNota = (d, el) => { const it = getItem(d.id); if (it) it.notas = el.value; };
ACT.addVisita = d => { const it = getItem(d.id); (it.vis = it.vis || []).push(TODAY); toast('Visita registrada', 'eye'); afterDocChange(it); };
ACT.setPermiso = d => { const it = getItem(d.id); it.permiso.pagadas = +d.n; if (+d.n === 2) it.permiso.venc = proxMarzo(); else if (+d.n === 1) it.permiso.venc = TODAY.slice(0, 4) + '-08-31'; toast(+d.n === 2 ? 'Permiso de circulación al día' : +d.n === 1 ? '1ª cuota registrada' : 'Permiso marcado pendiente'); afterDocChange(it); };
ACT.setDoc = (d, el) => { const it = getItem(d.id); const v = el.value; if (!v) return; if (d.k === 'rev') it.rev = v; else if (d.k === 'soap') it.soap = v; else if (d.k === 'dominio') it.docs.dominio = v; else if (d.k === 'grav') it.docs.grav = v; else if (d.k === 'mandato') it.mandato = v; toast('Fecha actualizada'); afterDocChange(it); };
ACT.togContrib = d => { const it = getItem(d.id); it.docs.contrib = !it.docs.contrib; afterDocChange(it); };
ACT.togPub = d => { const it = getItem(d.id), i = it.pubs.indexOf(d.p); if (i >= 0) it.pubs.splice(i, 1); else { it.pubs.push(d.p); toast('Publicado en ' + portalName(it.w, d.p)); } afterDocChange(it); };
function afterDocChange(it) { const sc = $('.pbody', topPush()).scrollTop; $('#itab').innerHTML = itemTabHtml(it, itemTabState[it.id] || 'info'); $('.pbody', topPush()).scrollTop = sc; animateIn(topPush()); renderPanel(); renderStock(); animateIn($('#scr-panel')); }
ACT.addFotos = async (d, el) => {
  const it = getItem(d.id), files = [...el.files].slice(0, 8); if (!files.length) return; el.value = '';
  toast(files.length > 1 ? `Subiendo ${files.length} fotos…` : 'Subiendo foto…', 'camera');
  try {
    for (const f of files) it.fotos.push(await storeImage(await readImage(f)));
    refreshItem(it.id); renderStock(); toast(`${files.length} foto${files.length > 1 ? 's' : ''} agregada${files.length > 1 ? 's' : ''}`, 'camera');
  } catch (e) { console.error(e); toast('No se pudo subir la foto. Revisa tu conexión.', 'warn'); refreshItem(it.id); }
};
ACT.rmFoto = d => { const it = getItem(d.id); it.fotos.splice(+d.i, 1); refreshItem(it.id); renderStock(); };
ACT.reponer = d => { const it = getItem(d.id); const q = Math.max(it.minimo * 2 - it.stock, 1); it.stock += q; it.estado = 'disponible'; it.ultimaVenta = it.ultimaVenta; refreshItem(it.id); renderAll(); animateIn($('#scr-panel')); toast(`Reposición registrada: +${q} un.`, 'box'); };
ACT.editarItem = d => openNuevoItem(getItem(d.id));
ACT.nuevaVentaItem = d => { popScreenThen(() => openNuevaVenta(d.id)); };
function popScreenThen(fn) { fn(); }

/* ---------------- ficha de venta ---------------- */
function openVenta(id) {
  const v = VENTAS.find(x => x.id === id); if (!v) return; const it = getItem(v.itemId) || { nombre: 'Ítem eliminado', sku: '—', w: v.w }, w = WORLDS[v.w], u = utilidad(v), c = comision(v);
  // el vendedor solo modifica su venta mientras espera aprobación; después la gestiona el administrador
  const ok = aprobada(v), ro = isVend() && conAprobacion(v.w) && v.aprob !== 'pendiente';
  const aprob = v.aprob === 'pendiente' ? (isAdmin() ? aprobarCard(v, it) : `<div class="tip">${icon('clock')}<span>Enviada al administrador el ${fechaCL(v.fecha)}. Cuando la apruebe verás tu comisión aquí.</span></div><button class="btn ghost small" data-act="ventaBorrar" data-id="${v.id}">${icon('trash')}Retirar envío</button>`)
    : v.aprob === 'rechazada' ? `<div class="tip">${icon('warn')}<span><b>Rechazada.</b> ${clean(v.motivo || 'Sin motivo')}</span></div><button class="btn ghost small" data-act="ventaBorrar" data-id="${v.id}">${icon('trash')}Eliminar</button>` : '';
  const trasp = v.w === 'auto' ? `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Traspaso · Registro Civil</span><span class="chip ${v.tramite === 'pendiente' ? 'warn' : 'good'}">${v.tramite === 'pendiente' ? 'Pendiente' : 'Inscrito'}</span></div>
    ${drow('Impuesto municipal (1,5%)', fmt(v.precio * 0.015))}${drow('Derecho Registro Civil', fmt(36030))}<p style="font-size:11.5px;color:var(--fg3);margin-top:4px">Valores de referencia que paga el comprador. Confirma montos vigentes en el Registro Civil.</p>
    ${v.tramite === 'pendiente' && ok && !ro ? `<button class="btn ghost small" style="margin-top:12px;width:100%" data-act="tramiteOk" data-id="${v.id}">${icon('check')}Marcar traspaso inscrito</button>` : ''}</div>` : '';
  const html = `<div class="px" style="padding-top:8px;display:flex;flex-direction:column;gap:14px">
    ${aprob}
    <div class="ticket" style="padding-bottom:0">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="chip mono">${v.w === 'tienda' ? 'TICKET' : v.w === 'prop' ? 'OPERACIÓN' : 'VENTA'} ${v.id.toUpperCase()}</span><span class="mono" style="font-size:11px;color:var(--fg3)">${fechaCL(v.fecha)}</span></div>
      <p style="font:600 15px/1.25 var(--body);margin-top:16px">${it.nombre}${v.q ? ` ×${v.q}` : ''}</p><div style="margin-top:8px">${it.sku ? idChip(it) : ''}</div>
      <span class="big" style="display:block;margin-top:16px;font-size:44px">${odo(v.ingreso)}</span>
      <p style="font-size:12px;color:var(--fg3);margin-top:8px">${v.op || (v.w === 'prop' ? '' : 'Total de la venta')}${v.w === 'prop' ? ` · monto de la operación ${fmt(v.precio)}` : ''}</p>
      <div class="tear" style="margin-top:20px"></div>
      <div style="padding:14px 0 6px">${isVend()
        ? (ok ? drow('Tu comisión' + ` (${v.comTipo === 'pct' ? comTxt('pct', v.comVal) : 'fija'})`, `<b style="color:var(--good);font:700 17px var(--display)">${fmt(c)}</b>`) + (v.comBase && (v.comBase.t !== v.comTipo || v.comBase.v !== v.comVal) ? `<p style="font-size:12px;color:var(--fg3);margin:-2px 0 8px">Ajustada por la jefatura · tu base era ${comTxt(v.comBase.t, v.comBase.v)}</p>` : '')
          : drow('Comisión base', v.aprob === 'rechazada' ? '—' : `<span>${v.comBase ? comTxt(v.comBase.t, v.comBase.v) : 'Por definir'}<br><span style="font-size:11px;color:var(--fg3)">por confirmar · la jefatura puede ajustarla</span></span>`))
        : !ok ? (v.costo ? drow('Costo', fmt(v.costo)) : '') + drow('Precio publicado', fmt(it.precio != null ? it.precio * (v.q || 1) : v.precio)) + (v.costo ? drow('Margen antes de comisión', fmt(v.ingreso - v.costo + comFin(v))) : '')
        : (v.costo ? drow('Costo', fmt(v.costo)) : '') + drow('Comisión ' + v.vend.split(' ')[0] + ` (${v.comTipo === 'pct' ? v.comVal + '%' : 'fija'})`, '−' + fmt(c)) + (comFin(v) ? drow('Comisión financiera', '+' + fmt(comFin(v))) : '') + drow('Utilidad', `<b style="color:var(--good);font:700 17px var(--display)">${fmt(u)}</b>`)}</div>
    </div>
    <div class="card">${v.w !== 'tienda' ? drow('Cliente', v.cliente) + drow('Contacto', v.fono) : ''}${drow('Vendedor', v.vend)}</div>
    ${v.nota || v.notaJefe ? `<div class="card">${v.nota ? `<span class="kicker">Observación del vendedor</span><p style="font-size:14px;line-height:1.45;margin-top:8px;white-space:pre-wrap">${clean(v.nota)}</p>` : ''}${v.notaJefe ? `<span class="kicker" style="display:block;${v.nota ? 'margin-top:14px' : ''}">Nota de la jefatura</span><p style="font-size:14px;line-height:1.45;margin-top:8px;white-space:pre-wrap">${clean(v.notaJefe)}</p>` : ''}</div>` : ''}
    <div><div class="sec" style="margin:0 0 10px"><span class="kicker">Pagos</span></div><div class="card tight">${v.pagos.map((p, i) => `<div class="row" style="cursor:default"><span class="thumb" style="width:40px;height:40px">${icon(p.fin ? 'bank' : METODO_ICON[p.m] || 'dollar', 18)}</span><span class="rm"><p class="rt">${p.m}</p><p class="rs">${p.fin ? creditoTxt(p) : p.s === 'cobrado' ? 'Cobrado' : 'Vence ' + fechaCorta(p.v)}</p></span><span class="rr"><span class="p">${fmt(p.a)}</span>${p.s === 'cobrado' ? '<span class="chip good">Cobrado</span>' : p.fin || ro || !ok ? '<span class="chip warn">Pendiente</span>' : `<button class="chip warn" style="border:0" data-act="cobrar" data-id="${v.id}" data-i="${i}">Marcar cobrado</button>`}</span></div>`).join('')}</div></div>
    ${v.pagos.map((p, i) => p.fin ? creditoCard(v, p, i, ro || !ok) : '').join('')}
    ${trasp}
    <div><div class="sec" style="margin:0 0 10px"><span class="kicker">Comprobante</span></div><div class="gallery" style="padding:0">${v.boleta ? `<div class="shot" style="width:120px;height:120px"><img src="${fotoSrc(v.boleta)}" alt="Comprobante"></div>` : ''}${ro ? '' : `<label class="addshot" style="width:120px;height:120px">${icon('receipt')}<span>Adjuntar</span><input type="file" accept="image/*" hidden data-change="addBoleta" data-id="${v.id}"></label>`}</div></div>
  </div>`;
  pushScreen(v.w === 'tienda' ? 'Ticket' : w.cierreLabel, html, { onReady: el => {} });
}
// el administrador revisa la venta enviada por el vendedor y define su comisión
function aprobarCard(v, it) {
  const e = EQUIPO.find(x => x.w === v.w && x.nombre === v.vend), b = v.comBase || (e ? { t: e.comTipo, v: e.comVal } : { t: v.comTipo, v: v.comVal }), ct = b.t, cv = b.v;
  const pub = it.precio != null ? it.precio * (v.q || 1) : null, dif = pub ? v.precio - pub : 0;
  return `<div class="card" style="border-color:var(--warn)"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Por aprobar</span><span class="chip warn">${icon('clock', 12)}${firstName(v.vend)}</span></div>
    <p style="font-size:13px;color:var(--fg2);margin-top:12px;line-height:1.45">${clean(v.vend)} registró esta venta el ${fechaCL(v.fecha)}.${pub ? ` Precio publicado ${fmt(pub)}${dif ? `, vendido ${dif < 0 ? 'con descuento de' : 'sobre precio por'} <b style="color:${dif < 0 ? 'var(--warn)' : 'var(--good)'}">${fmt(Math.abs(dif))}</b>` : ', vendido a precio publicado'}.` : ''}</p>
    <div class="grid2" style="margin-top:14px"><label class="field"><span>Comisión</span><select id="va-ct" data-change="vaCt"><option value="pct" ${ct === 'pct' ? 'selected' : ''}>% porcentaje</option><option value="monto" ${ct === 'monto' ? 'selected' : ''}>$ Monto fijo</option></select></label>
    <label class="field"><span id="va-l">${ct === 'pct' ? 'Valor (%)' : 'Valor (CLP)'}</span><input id="va-cv" inputmode="${ct === 'pct' ? 'decimal' : 'numeric'}" ${ct === 'monto' ? 'data-money' : ''} value="${ct === 'pct' ? cv : fmt(cv)}"></label></div>
    <p style="font-size:12px;color:var(--fg3);margin-top:8px">Comisión base de ${firstName(v.vend)}: ${comTxt(b.t, b.v)}. Puedes ajustarla. Revisa los pagos de abajo antes de aprobar.</p>
    <div style="margin-top:14px"><label class="field"><span>Nota para ${firstName(v.vend)} (opcional)</span><textarea id="va-nota" maxlength="300" placeholder="Ej: comisión ajustada por el descuento"></textarea></label></div>
    <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="ventaRechazar" data-id="${v.id}">${icon('close')}Rechazar</button><button class="btn primary" data-act="ventaAprobar" data-id="${v.id}">${icon('check')}Aprobar</button></div></div>`;
}
ACT.vaCt = (d, el) => { const i = $('#va-cv'), m = el.value === 'monto'; i.toggleAttribute('data-money', m); i.inputMode = m ? 'numeric' : 'decimal'; i.value = m ? '$0' : '0'; $('#va-l').textContent = m ? 'Valor (CLP)' : 'Valor (%)'; };
ACT.ventaAprobar = d => {
  const v = VENTAS.find(x => x.id === d.id); if (!v || v.aprob !== 'pendiente') return;
  const ct = $('#va-ct').value, raw = $('#va-cv').value;
  v.comTipo = ct; v.comVal = ct === 'pct' ? Math.min(100, Math.max(0, parseFloat(String(raw).replace(',', '.')) || 0)) : money(raw);
  v.aprob = 'aprobada'; v.aprobada = TODAY; v.aprobPor = ME.nombre;
  const nj = ($('#va-nota').value || '').trim().replace(/[<>"'`]/g, '').slice(0, 300); if (nj) v.notaJefe = nj;
  const it = getItem(v.itemId); if (it && it.pendVenta === v.id) { delete it.pendVenta; it.estado = it.op === 'Arriendo' ? 'arrendado' : 'vendido'; }
  const l = v.leadId && LEADS.find(x => x.id === v.leadId); if (l && l.etapa !== 'ganado') { l.etapa = 'ganado'; l.ts = nowISO(); l.log.push({ ts: tick(), tipo: 'etapa', txt: 'Venta aprobada' }); }
  toast(`Venta aprobada · comisión ${fmt(comision(v))}`); popScreen(); setTimeout(() => openVenta(v.id), 120); renderAll();
};
ACT.ventaRechazar = d => openSheet('Rechazar venta', `<div style="display:flex;flex-direction:column;gap:14px"><label class="field"><span>Motivo (lo verá el vendedor)</span><textarea id="vr-m" placeholder="Ej: el precio no corresponde, faltan pagos…"></textarea></label><button class="btn danger" data-act="ventaRechazarOk" data-id="${d.id}">${icon('close')}Rechazar venta</button></div>`);
ACT.ventaRechazarOk = d => {
  const v = VENTAS.find(x => x.id === d.id); if (!v || v.aprob !== 'pendiente') return;
  v.aprob = 'rechazada'; v.motivo = $('#vr-m').value.trim().replace(/[<>"'`]/g, '').slice(0, 300) || 'Sin motivo';
  const it = getItem(v.itemId); if (it && it.pendVenta === v.id) { delete it.pendVenta; it.estado = 'disponible'; }
  closeSheet(); toast('Venta rechazada', 'close'); popScreen(); setTimeout(() => openVenta(v.id), 120); renderAll();
};
ACT.ventaBorrar = d => {
  const v = VENTAS.find(x => x.id === d.id); if (!v || aprobada(v)) return;
  if (!confirm(v.aprob === 'pendiente' ? '¿Retirar esta venta? El auto vuelve a quedar disponible.' : '¿Eliminar esta venta rechazada?')) return;
  const it = getItem(v.itemId); if (it && it.pendVenta === v.id) { delete it.pendVenta; it.estado = 'disponible'; }
  VENTAS.splice(VENTAS.indexOf(v), 1); popScreen(); renderAll(); toast('Venta eliminada', 'trash');
};
function creditoCard(v, p, i, ro) {
  const steps = [['evaluacion', 'En evaluación'], ['aprobado', 'Aprobado'], ['cursado', 'Cursado']], cur = steps.findIndex(x => x[0] === p.cr);
  const fins = finsOn().some(f => f.k === p.fin) ? finsOn() : [...finsOn(), CAT.financieras.find(f => f.k === p.fin)];
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Crédito automotriz</span><span class="chip ${p.cr === 'cursado' ? 'good' : 'warn'}">${p.cr === 'cursado' ? 'Cobrado' : 'Por cursar'}</span></div>
    <label class="field" style="margin-top:14px"><span>Financiera</span><select ${ro ? 'disabled' : ''} data-change="crFin" data-id="${v.id}" data-i="${i}">${fins.map(f => `<option value="${f.k}" ${f.k === p.fin ? 'selected' : ''}>${f.n}</option>`).join('')}</select></label>
    <div class="steps" style="margin-top:14px">${steps.map(([k, t], n) => `<button class="${n === cur ? 'on' : ''}" ${ro ? 'disabled' : ''} data-act="crStep" data-id="${v.id}" data-i="${i}" data-n="${k}">${t}</button>`).join('')}</div>
    <p style="font-size:12px;color:var(--fg3);margin-top:12px">Al marcar "Cursado" el pago de ${fmt(p.a)} pasa a cobrado y entra a la caja.</p>
    ${isVend() ? '' : `<div style="border-top:1px solid var(--line);margin-top:14px;padding-top:14px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Comisión que te paga ${finName(p.fin)}</span>${p.fcm ? `<span class="chip ${p.fcs === 'pagada' ? 'good' : 'warn'}">${p.fcs === 'pagada' ? 'Pagada' : 'Pendiente'}</span>` : ''}</div>
      <div class="grid2" style="margin-top:12px;align-items:end"><label class="field"><span>Porcentaje (%)</span><input inputmode="decimal" value="${p.fcp || ''}" placeholder="0" data-change="crFcp" data-id="${v.id}" data-i="${i}"></label><div style="padding-bottom:12px"><span class="num" style="font-size:20px;color:var(--good)">${fmt(p.fcm || 0)}</span></div></div>
      ${p.fcm ? `<button class="btn ${p.fcs === 'pagada' ? 'ghost' : 'primary'} small" style="width:100%;margin-top:12px" data-act="crFcs" data-id="${v.id}" data-i="${i}">${icon(p.fcs === 'pagada' ? 'history' : 'check')}${p.fcs === 'pagada' ? 'Marcar como pendiente' : 'Me la pagaron'}</button>${p.fcs === 'pagada' && p.fcf ? `<p style="font-size:12px;color:var(--fg3);margin-top:8px;text-align:center">Pagada el ${fechaCL(p.fcf)}</p>` : p.cr !== 'cursado' ? '<p style="font-size:12px;color:var(--fg3);margin-top:8px">Normalmente la financiera la paga después de cursar el crédito.</p>' : ''}` : ''}
    </div>`}</div>`;
}
ACT.crFcp = (d, el) => { const v = VENTAS.find(x => x.id === d.id), p = v.pagos[+d.i]; p.fcp = Math.max(0, parseFloat(String(el.value).replace(',', '.')) || 0); p.fcm = Math.round(p.a * p.fcp / 100); if (!p.fcs) p.fcs = 'pendiente'; toast('Comisión: ' + fmt(p.fcm), 'bank'); popScreen(); setTimeout(() => openVenta(v.id), 120); renderAll(); };
ACT.crFcs = d => { const v = VENTAS.find(x => x.id === d.id), p = v.pagos[+d.i]; p.fcs = p.fcs === 'pagada' ? 'pendiente' : 'pagada'; p.fcf = p.fcs === 'pagada' ? TODAY : null; toast(p.fcs === 'pagada' ? `Comisión de ${finName(p.fin)} cobrada` : 'Marcada como pendiente', 'bank'); renderAll(); if (d.list) { refreshFinCom(); return; } popScreen(); setTimeout(() => { openVenta(v.id); refreshFinCom(); }, 120); };
ACT.crFin = (d, el) => { const v = VENTAS.find(x => x.id === d.id); v.pagos[+d.i].fin = el.value; toast('Financiera: ' + finName(el.value), 'bank'); renderAll(); };
ACT.crStep = d => { const v = VENTAS.find(x => x.id === d.id), p = v.pagos[+d.i]; p.cr = d.n; p.s = d.n === 'cursado' ? 'cobrado' : 'pendiente'; if (p.s === 'pendiente' && !p.v) p.v = addDays(TODAY, 7); toast(d.n === 'cursado' ? 'Crédito cursado: pago cobrado' : 'Crédito ' + (d.n === 'aprobado' ? 'aprobado' : 'en evaluación'), 'bank'); popScreen(); setTimeout(() => openVenta(d.id), 120); renderAll(); animateIn($('#scr-panel')); };
ACT.cobrar = d => { const v = VENTAS.find(x => x.id === d.id); v.pagos[+d.i].s = 'cobrado'; toast('Pago marcado como cobrado'); popScreen(); setTimeout(() => openVenta(d.id), 120); renderAll(); animateIn($('#scr-panel')); };
ACT.tramiteOk = d => { const v = VENTAS.find(x => x.id === d.id); v.tramite = 'ok'; toast('Traspaso inscrito'); popScreen(); setTimeout(() => openVenta(d.id), 120); renderAll(); };
ACT.addBoleta = async (d, el) => {
  const v = VENTAS.find(x => x.id === d.id), f = el.files[0]; if (!f) return; toast('Subiendo comprobante…', 'receipt');
  try { v.boleta = await storeImage(await readImage(f, 1800, 0.85)); popScreen(); setTimeout(() => openVenta(v.id), 120); toast('Comprobante adjuntado', 'receipt'); } catch (e) { toast('No se pudo subir el comprobante', 'warn'); }
};

/* ---------------- vendedor ---------------- */
function openVendor(id) {
  const e = EQUIPO.find(x => x.id === id), s = vendStats(e), meses = mesesVend(e), mx = Math.max(1, ...meses.map(m => m.n));
  const cierres = ventasOf(e.w, MK()).filter(v => v.vend === e.nombre);
  pushScreen('Vendedor', `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;align-items:center;gap:16px"><span class="avatar xl">${initials(e.nombre)}</span><div><h2 style="font:700 24px/1.05 var(--display);font-variation-settings:'wdth' 82;letter-spacing:-.02em">${e.nombre}</h2><div style="margin-top:9px"><span class="chip ${e.activo ? 'good' : ''}">${e.activo ? 'Activo' : 'Inactivo'}</span></div></div></div>
    <div style="display:grid;grid-template-columns:.7fr 1.7fr 1fr;gap:10px">${kpi('Cierres', s.n)}${kpi('Comisión', fmtM(s.com), '', 'var(--good)')}${kpi('Particip.', s.part + '%')}</div>
    <div class="card"><span class="kicker">${e.w === 'tienda' ? 'Tickets' : 'Cierres'} últimos 6 meses</span><div class="bars6">${meses.map((m, i) => `<div class="b"><i class="${i === 5 ? 'cur' : ''}" style="height:${Math.max(8, m.n / mx * 100)}%;--i:${i}" title="${m.n}"></i><span>${mesDe(m.mk).slice(0, 3)}</span></div>`).join('')}</div></div>
    <div class="card"><div class="grid2"><label class="field"><span>Teléfono</span><input value="${e.fono || ''}" inputmode="tel" data-change="vDatos" data-id="${e.id}" data-k="fono"></label><label class="field"><span>Correo (para usar la app)</span><input value="${e.email || ''}" inputmode="email" data-change="vDatos" data-id="${e.id}" data-k="email"></label></div>
      <p style="font-size:12px;color:var(--fg3);margin-top:10px">${USUARIOS.some(u => lc(u.email) === lc(e.email) && e.email) ? 'Usa la app con este correo: ve solo sus ventas y clientes.' : 'Si invitas a esta persona con este mismo correo, verá en la app solo sus ventas, sus clientes y su comisión.'}</p></div>
    <div class="card"><span class="kicker">Comisión base</span>
      <div class="grid2" style="margin-top:12px" data-id="${e.id}"><label class="field"><span>Tipo</span><select id="vc-t" data-change="vCom" data-id="${e.id}"><option value="pct" ${e.comTipo === 'pct' ? 'selected' : ''}>% Porcentaje</option><option value="monto" ${e.comTipo === 'monto' ? 'selected' : ''}>$ Monto fijo</option></select></label><label class="field"><span id="vc-l">${e.comTipo === 'pct' ? 'Porcentaje (%)' : 'Monto (CLP)'}</span><input id="vc-v" inputmode="${e.comTipo === 'pct' ? 'decimal' : 'numeric'}" value="${e.comTipo === 'pct' ? e.comVal : fmt(e.comVal)}" ${e.comTipo === 'monto' ? 'data-money' : ''} data-change="vCom" data-id="${e.id}"></label></div>
      <p style="font-size:12px;color:var(--fg3);margin-top:10px">Una comisión base de 0% es válida. Se puede editar en cada venta.</p></div>
    ${cierres.length ? `<div><div class="sec" style="margin:0 0 10px"><span class="kicker">Cierres del mes</span><span class="count">${cierres.length}</span></div><div class="card tight">${cierres.slice(0, 6).map(ventaRow).join('')}</div></div>` : ''}
    <div class="card" style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 14px var(--body)">Vendedor activo</span><button class="toggle ${e.activo ? 'on' : ''}" data-act="togVend" data-id="${e.id}" aria-label="Activo"></button></div>
  </div>`);
}
ACT.vDatos = (d, el) => { const e = EQUIPO.find(x => x.id === d.id); if (!e) return; const v = el.value.trim(); if (d.k === 'email' && v && !/.+@.+\..+/.test(v)) { toast('Correo no válido', 'warn'); return; } e[d.k] = d.k === 'email' ? lc(v) : v; toast('Datos guardados'); };
ACT.vCom = (d, el) => {
  const e = EQUIPO.find(x => x.id === d.id), t = $('#vc-t').value, inp = $('#vc-v');
  if (el.id === 'vc-t' && t !== e.comTipo) { e.comTipo = t; e.comVal = 0; }
  else e.comVal = t === 'pct' ? Math.min(100, Math.max(0, parseFloat(String(inp.value).replace(',', '.')) || 0)) : money(inp.value);
  inp.toggleAttribute('data-money', t === 'monto'); inp.inputMode = t === 'pct' ? 'decimal' : 'numeric';
  inp.value = t === 'pct' ? e.comVal : fmt(e.comVal); $('#vc-l').textContent = t === 'pct' ? 'Porcentaje (%)' : 'Monto (CLP)';
  toast('Comisión base: ' + (t === 'pct' ? e.comVal + '%' : fmt(e.comVal)), 'check');
};
ACT.togVend = (d, el) => { const e = EQUIPO.find(x => x.id === d.id); e.activo = !e.activo; el.classList.toggle('on', e.activo); toast(e.activo ? 'Vendedor activado' : 'Vendedor desactivado'); renderEquipo(); renderPanel(); animateIn($('#scr-panel')); };

/* ---------------- método de pago / gastos ---------------- */
function openMetodo(m) {
  const w = W(); const rows = []; ventasOf(w.key).forEach(v => v.pagos.filter(p => p.m === m && p.s === 'cobrado' && (state.cajaP === 'todo' || (state.cajaP === 'mes' ? v.fecha.startsWith(MK()) : v.fecha >= addDays(TODAY, -6)))).forEach(p => rows.push({ v, p })));
  pushScreen(m, `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px"><div class="card"><span class="kicker">Total ${m.toLowerCase()}</span><span class="big" style="display:block;margin-top:10px;font-size:44px">${odo(sum(rows, r => r.p.a))}</span></div>
  <div class="card tight">${rows.map(({ v, p }, k) => `<button class="row" data-act="venta" data-id="${v.id}"><span class="thumb">${icon(w.icon, 20)}</span><span class="rm"><p class="rt">${(getItem(v.itemId) || { nombre: 'Ítem eliminado' }).nombre}</p><p class="rs">${v.w === 'tienda' ? v.vend : v.cliente} · ${fechaCorta(v.fecha)}</p></span><span class="rr"><span class="p">${fmtM(p.a)}</span></span></button>`).join('') || `<div class="empty">${icon('dollar', 30)}<p>Sin movimientos en este período</p></div>`}</div></div>`);
}
function openGastos() {
  const w = W(), gs = gastosMes(w.key), tot = sum(gs, g => g.monto), cats = {}; gs.forEach(g => cats[g.cat] = (cats[g.cat] || 0) + g.monto);
  const el = pushScreen('Gastos', `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px">${mesBar()}
    <div class="card"><span class="kicker">Gastos de ${mesDe(MK()).toLowerCase()} ${MK().slice(0, 4)}</span><span class="big" style="display:block;margin-top:10px;font-size:44px">${odo(tot)}</span></div>
    <div class="card" style="display:flex;flex-direction:column;gap:14px">${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, m]) => `<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span style="display:flex;align-items:center;gap:8px;color:var(--fg2)">${icon(CAT_ICON[c] || 'box', 15)}${c}</span><b class="num" style="font-size:15px">${fmtM(m)}</b></div><div class="pbar" style="--w:${m / tot * 100}%"><i></i></div></div>`).join('')}</div>
    <div class="card tight">${gs.length ? '' : `<div class="empty">${icon('receipt', 30)}<p>Sin gastos en ${mesDe(MK()).toLowerCase()}</p></div>`}${gs.map((g, k) => `<button class="row" data-act="gasto" data-id="${g.id}"><span class="thumb">${icon(CAT_ICON[g.cat] || 'box', 20)}</span><span class="rm"><p class="rt">${g.concepto}</p><p class="rs">${fechaCorta(g.fecha)}${g.fijo ? '<span class="chip">Fijo</span>' : ''}</p></span><span class="rr"><span class="p">${fmtM(g.monto)}</span></span></button>`).join('')}</div></div>`,
    { cta: `<button class="btn primary" data-act="nuevoGasto">${icon('plus')}Registrar gasto</button>` });
  el.dataset.gastos = '1';
}
ACT.gasto = d => openGasto(d.id);
function openGasto(id) {
  const g = GASTOS.find(x => x.id === id);
  pushScreen('Gasto', `<div class="px" style="padding-top:10px;display:flex;flex-direction:column;gap:14px"><div class="card" style="display:flex;gap:14px;align-items:center"><span class="thumb" style="width:54px;height:54px;border-radius:16px">${icon(CAT_ICON[g.cat] || 'box', 24)}</span><span class="grow"><p class="rt" style="font-size:16px;white-space:normal">${g.concepto}</p><p class="rs">${fechaCL(g.fecha)} · ${g.cat}</p></span></div>
  <div class="card"><span class="kicker">Monto</span><span class="big" style="display:block;margin-top:10px;font-size:44px">${odo(g.monto)}</span></div>
  <div class="card" style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 14px var(--body)">Gasto fijo recurrente</span><button class="toggle ${g.fijo ? 'on' : ''}" data-act="togFijo" data-id="${g.id}" aria-label="Fijo"></button></div>
  <label class="field"><span>Notas</span><textarea data-change="gastoNota" data-id="${g.id}">${g.notas || ''}</textarea></label>
  <div><div class="sec" style="margin:0 0 10px"><span class="kicker">Boleta o factura</span></div><div class="gallery" style="padding:0">${g.boleta ? `<div class="shot" style="width:120px;height:120px"><img src="${fotoSrc(g.boleta)}" alt="Boleta"></div>` : ''}<label class="addshot" style="width:120px;height:120px">${icon('receipt')}<span>Adjuntar</span><input type="file" accept="image/*" hidden data-change="gastoBoleta" data-id="${g.id}"></label></div></div>
  <button class="btn danger" data-act="delGasto" data-id="${g.id}">${icon('trash')}Eliminar gasto</button></div>`);
}
ACT.togFijo = (d, el) => { const g = GASTOS.find(x => x.id === d.id); g.fijo = !g.fijo; el.classList.toggle('on', g.fijo); renderAll(); };
ACT.gastoNota = (d, el) => { const g = GASTOS.find(x => x.id === d.id); if (g) g.notas = el.value; };
ACT.gastoBoleta = async (d, el) => {
  const g = GASTOS.find(x => x.id === d.id), f = el.files[0]; if (!f) return; toast('Subiendo boleta…', 'receipt');
  try { g.boleta = await storeImage(await readImage(f, 1800, 0.85)); popScreen(); setTimeout(() => openGasto(g.id), 120); toast('Boleta adjuntada', 'receipt'); } catch (e) { toast('No se pudo subir la boleta', 'warn'); }
};
ACT.delGasto = d => { const i = GASTOS.findIndex(x => x.id === d.id); GASTOS.splice(i, 1); popScreen(); popScreen(); renderAll(); animateIn($('#scr-panel')); setTimeout(openGastos, 300); toast('Gasto eliminado', 'trash'); };
ACT.nuevoGasto = () => openSheet('Registrar gasto', `<div data-live="noop" style="display:flex;flex-direction:column;gap:14px">
  <label class="field"><span>Concepto</span><input id="g-c" placeholder="Ej: Publicidad en redes"></label>
  <div class="grid2"><label class="field"><span>Categoría</span><select id="g-k">${Object.keys(CAT_ICON).map(c => `<option>${c}</option>`).join('')}</select></label><label class="field"><span>Monto</span><input id="g-m" data-money inputmode="numeric" placeholder="$0"></label></div>
  <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 14px var(--body)">Gasto fijo recurrente</span><button class="toggle" id="g-f" data-act="togSimple" aria-label="Fijo"></button></div>
  <button class="btn primary" data-act="saveGasto">Guardar gasto</button></div>`);
ACT.noop = () => { };
ACT.togSimple = (d, el) => el.classList.toggle('on');
ACT.saveGasto = () => {
  const c = $('#g-c').value.trim(), m = money($('#g-m').value); if (!c || !m) { toast('Completa concepto y monto', 'warn'); return; }
  GASTOS.push(G(nuevoId('g'), state.world, c, $('#g-k').value, m, TODAY, $('#g-f').classList.contains('on')));
  closeSheet(); popScreen(); renderAll(); animateIn($('#scr-panel')); setTimeout(openGastos, 350); toast('Gasto registrado');
};

/* ---------------- alertas ---------------- */
function openAlerts() {
  const al = alertsFor(state.world), g = [['bad', 'Urgente'], ['warn', 'Esta semana'], ['info', 'Para tener en cuenta']];
  pushScreen('Alertas', `<div class="px" style="padding-top:8px;display:flex;flex-direction:column;gap:12px">${g.map(([s, t]) => { const l = al.filter(a => a.sev === s); return l.length ? `${sec(t, l.length)}<div class="card tight">${l.map(a => `<button class="alert" data-act="alert" data-i="${al.indexOf(a)}"><span class="ai ${a.sev}">${icon(a.icon)}</span><span class="grow"><p class="at">${a.title}</p><p class="as">${a.sub}</p></span><span class="ar">${icon('chevR')}</span></button>`).join('')}</div>` : ''; }).join('')}</div>`);
}

/* ---------------- ajustes ---------------- */
const ACCENTS = ['#C8F03C', '#4BE3A0', '#6FD3FF', '#B7A6FF', '#FF8A6B', '#FFC93C'];
function setAccent(c) {
  const sh = $('#shell'); const rgb = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)).join(',');
  sh.style.setProperty('--accent', c); sh.style.setProperty('--accent-soft', `rgba(${rgb},.13)`); sh.style.setProperty('--accent-glow', `rgba(${rgb},.32)`); sh.style.setProperty('--accent-ink', '#121212');
}
function resetAccent() { const sh = $('#shell'); ['--accent', '--accent-soft', '--accent-glow', '--accent-ink'].forEach(p => sh.style.removeProperty(p)); }
ACT.accent = d => { setAccent(d.c); PREFS.accent[state.world] = d.c; toast('Color actualizado'); };
ACT.logout = () => { if (window.RV && RV.logout) { RV.logout(); return; } toast('Sesión cerrada', 'power'); setTimeout(() => ACT.toLobby(), 500); };

/* ---------------- formularios: ingresar / editar ítem ---------------- */
let editingId = null;
/* ---------------- opciones rápidas al ingresar al stock (siempre se puede escribir otra cosa) ---------------- */
const MODELOS = {
  Toyota: ['Yaris', 'Corolla', 'Corolla Cross', 'RAV4', 'Hilux', 'Rush', 'Fortuner', '4Runner'], Chevrolet: ['Sail', 'Onix', 'Spark', 'Tracker', 'Groove', 'Captiva', 'Colorado', 'Silverado'],
  Hyundai: ['Accent', 'Grand i10', 'Creta', 'Tucson', 'Santa Fe', 'Elantra', 'Venue'], Kia: ['Morning', 'Rio', 'Soluto', 'Sonet', 'Seltos', 'Sportage', 'Sorento'],
  Nissan: ['March', 'Versa', 'Sentra', 'Kicks', 'Qashqai', 'X-Trail', 'Navara'], Suzuki: ['Swift', 'Baleno', 'Dzire', 'Celerio', 'Vitara', 'S-Cross', 'Jimny'],
  Mazda: ['Mazda 2', 'Mazda 3', 'CX-3', 'CX-30', 'CX-5', 'BT-50'], Peugeot: ['208', '2008', '308', '3008', '5008', 'Partner'], Ford: ['Ranger', 'Territory', 'EcoSport', 'Explorer', 'Maverick', 'F-150'],
  Mitsubishi: ['L200', 'ASX', 'Outlander', 'Eclipse Cross', 'Montero Sport'], Volkswagen: ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Tiguan', 'Amarok'], Subaru: ['Impreza', 'XV', 'Forester', 'Outback'],
  MG: ['MG3', 'MG5', 'MG ZS', 'MG HS'], Chery: ['Tiggo 2', 'Tiggo 3', 'Tiggo 7', 'Tiggo 8'], Renault: ['Kwid', 'Logan', 'Duster', 'Oroch', 'Koleos'],
};
const anios = n => { const y = +TODAY.slice(0, 4) + 1; return Array.from({ length: n }, (_, i) => String(y - i)); };
const QUICK = {
  auto: {
    marca: () => [...Object.keys(MODELOS), 'Citroën', 'Honda', 'Jeep', 'RAM', 'Changan', 'Great Wall', 'JAC', 'Haval', 'Fiat', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo'],
    modelo: () => MODELOS[($('.ni-f[data-k=marca]') || {}).value] || [], anio: () => anios(26),
    color: () => ['Blanco', 'Gris', 'Negro', 'Plata', 'Rojo', 'Azul', 'Café', 'Beige', 'Verde'], tipo: () => ['SUV', 'Sedán', 'Hatchback', 'Camioneta', 'Station wagon', 'Furgón', 'Coupé', 'Minivan'],
    transmision: () => ['Manual', 'Automática'], combustible: () => ['Bencina', 'Diésel', 'Híbrido', 'Eléctrico'],
  },
  prop: {
    tipo: () => ['Departamento', 'Casa', 'Oficina', 'Local comercial', 'Terreno', 'Parcela', 'Bodega', 'Estacionamiento'],
    comuna: () => ['Providencia', 'Las Condes', 'Ñuñoa', 'Santiago', 'Vitacura', 'Lo Barnechea', 'La Reina', 'Macul', 'Peñalolén', 'La Florida', 'Maipú', 'Puente Alto', 'San Miguel', 'Estación Central', 'Independencia', 'Recoleta', 'Huechuraba', 'Quilicura', 'Colina', 'Chicureo', 'San Bernardo', 'Viña del Mar', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Puerto Montt'],
    dorm: () => ['1', '2', '3', '4', '5'], banos: () => ['1', '2', '3', '4'],
  },
  tienda: {
    categoria: () => ['Calzado', 'Ropa', 'Accesorios', 'Electrónica', 'Hogar', 'Belleza', 'Deportes', 'Juguetes', 'Librería', 'Alimentos'],
    variante: () => ['XS', 'S', 'M', 'L', 'XL', '36', '38', '40', '42', 'Única'],
  },
};
// lo que ya usaste en tu stock aparece primero
function opcionesDe(w, k) {
  if (['km', 'm2c', 'm2t', 'direccion'].includes(k)) return []; // cada uno es distinto: no sirve sugerir
  const usadas = [...new Set(itemsOf(w).map(i => i.specs && i.specs[k]).filter(v => v != null && v !== '—' && v !== '').map(String))];
  const base = (QUICK[w] && QUICK[w][k]) ? QUICK[w][k]() : [];
  const out = [...new Set([...usadas.filter(v => k !== 'modelo' || base.includes(v) || !base.length), ...base])];
  if (k === 'anio') return out.filter(v => /^\d{4}$/.test(v)).sort((a, b) => b - a);
  if (['dorm', 'banos'].includes(k)) return out.filter(v => /^\d+$/.test(v) && +v > 0).sort((a, b) => a - b);
  return out;
}
function campoItem(w, k, l, t, v) {
  if (k === 'operacion') return `<div class="field"><span>${l}</span><div class="qchips wrap">${['Venta', 'Arriendo'].map(o => `<button type="button" class="opt ${(v || 'Venta') === o ? 'on' : ''}" data-act="qFill" data-k="${k}" data-v="${o}">${o}</button>`).join('')}</div><input type="hidden" data-k="${k}" class="ni-f" value="${v || 'Venta'}"></div>`;
  const ops = opcionesDe(w, k), num = t === 'number';
  const attrs = `data-k="${k}" ${num ? 'inputmode="numeric" pattern="[0-9]*"' : ''} type="text" class="ni-f" autocomplete="off"`;
  if (!ops.length) return `<label class="field"><span>${l}</span><input ${attrs} value="${clean(v)}"></label>`;
  const otra = v !== '' && v != null && !ops.slice(0, nChips(k)).includes(String(v));
  return `<div class="field fq" style="grid-column:span 2"><span>${l}</span>
    <div class="qchips" data-k="${k}">${chipsHtml(k, ops, v)}<button type="button" class="opt otra ${otra ? 'on' : ''}" data-act="qOtra" data-k="${k}">${icon('edit', 14)}Otra</button></div>
    <input ${attrs} value="${clean(v)}" list="dl-${k}" placeholder="Escribe ${l.toLowerCase()}" style="margin-top:8px;${otra ? '' : 'display:none'}"><datalist id="dl-${k}">${ops.map(o => `<option value="${clean(o)}">`).join('')}</datalist></div>`;
}
const nChips = k => k === 'comuna' || k === 'marca' ? 12 : 10;
const chipsHtml = (k, ops, v) => ops.slice(0, nChips(k)).map(o => `<button type="button" class="opt ${String(v) === o ? 'on' : ''}" data-act="qFill" data-k="${k}" data-v="${clean(o)}">${clean(o)}</button>`).join('');
// el nombre del auto se arma solo con marca, modelo y año (mientras no lo escribas tú)
function nombreAuto() {
  const n = $('#ni-n'); if (!n || n.dataset.manual === '1' || W().key !== 'auto') return;
  const g = k => ($('.ni-f[data-k=' + k + ']') || {}).value || ''; n.value = [g('marca'), g('modelo'), g('anio')].map(s => s.trim()).filter(Boolean).join(' ');
  const pv = $('#ni-prev'); if (pv) pv.textContent = n.value || 'Elige marca, modelo y año';
}
ACT.qFill = d => {
  const i = $('.ni-f[data-k=' + d.k + ']'); if (!i) return;
  const ya = i.value === d.v && i.type !== 'hidden'; i.value = ya ? '' : d.v;   // tocar de nuevo la quita
  if (i.type !== 'hidden') i.style.display = 'none';
  $$('[data-act=qFill][data-k=' + d.k + '],[data-act=qOtra][data-k=' + d.k + ']').forEach(b => b.classList.toggle('on', !ya && b.dataset.v === d.v));
  if (d.k === 'marca') { const m = $('.ni-f[data-k=modelo]'); if (m) { m.value = ''; m.style.display = 'none'; refrescarModelos(); } }
  nombreAuto();
};
ACT.qOtra = d => {
  const i = $('.ni-f[data-k=' + d.k + ']'); if (!i) return; i.style.display = ''; i.value = ''; i.focus();
  $$('[data-act=qFill][data-k=' + d.k + ']').forEach(b => b.classList.remove('on')); $('[data-act=qOtra][data-k=' + d.k + ']').classList.add('on'); nombreAuto();
};
function refrescarModelos() {
  const ops = opcionesDe('auto', 'modelo'), q = $('.qchips[data-k=modelo]'), dl = $('#dl-modelo');
  if (q) q.innerHTML = chipsHtml('modelo', ops, '') + `<button type="button" class="opt otra" data-act="qOtra" data-k="modelo">${icon('edit', 14)}Otra</button>`; if (dl) dl.innerHTML = ops.map(o => `<option value="${clean(o)}">`).join('');
}
ACT.niLive = (d, f, e) => {
  const t = e && e.target; if (!t) return;
  if (t.id === 'ni-n') { t.dataset.manual = t.value.trim() ? '1' : '0'; const pv = $('#ni-prev'); if (pv) pv.textContent = t.value || 'Elige marca, modelo y año'; return; }
  if (t.classList.contains('ni-f')) {
    $$('[data-act=qFill][data-k=' + t.dataset.k + ']').forEach(b => b.classList.remove('on'));
    if (t.dataset.k === 'marca') refrescarModelos();
    nombreAuto();
  }
};
const PRINCIPALES = { auto: ['marca', 'modelo', 'anio'], prop: ['operacion', 'tipo', 'comuna', 'dorm', 'banos'], tienda: ['marca', 'categoria', 'variante'] };
let nuevasFotos = [];
function openNuevoItem(it) {
  const w = W(), e = it || null; editingId = e ? e.id : null; nuevasFotos = [];
  const val = (v, money) => v == null || v === '—' ? '' : money ? fmt(v) : v;
  const specV = k => e ? val(e.specs[k]) : '';
  const princ = w.campos.filter(c => PRINCIPALES[w.key].includes(c[0])), resto = w.campos.filter(c => !PRINCIPALES[w.key].includes(c[0]));
  const nombre = `<label class="field"><span>${w.key === 'auto' ? 'Nombre (se arma solo)' : 'Nombre'}</span><input id="ni-n" placeholder="${w.key === 'auto' ? 'Marca modelo año' : w.nombrePh}" value="${e ? e.nombre : ''}" data-manual="${e ? '1' : '0'}" autocomplete="off"></label>`;
  const costo = w.key === 'prop' ? `<label class="field"><span>Mandato hasta</span><input id="ni-md" type="date" value="${e ? e.mandato : addDays(TODAY, 180)}"></label>` : isVend() ? '' : `<label class="field"><span>${w.key === 'tienda' ? 'Costo unitario' : 'Costo de compra'}</span><input id="ni-c" data-money inputmode="numeric" placeholder="$0" value="${e ? val(w.key === 'tienda' ? e.costoU : e.costo, 1) : ''}"></label>`;
  const papeles = w.key === 'auto' ? `<div class="grid2"><label class="field"><span>Revisión técnica vence</span><input id="ni-rev" type="date" value="${e ? e.rev : ''}"></label><label class="field"><span>SOAP vence</span><input id="ni-soap" type="date" value="${e ? e.soap : proxMarzo()}"></label></div>
    <div class="grid2"><label class="field"><span>Permiso de circulación</span><select id="ni-pc">${[[0, 'Pendiente'], [1, '1ª cuota pagada'], [2, 'Al día (2 cuotas)']].map(([n, t]) => `<option value="${n}" ${e && e.permiso.pagadas === n ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label class="field"><span>Proveedor</span><input id="ni-pv" placeholder="Particular, automotora…" value="${e ? val(e.prov.n) : ''}"></label></div>` : '';
  const costosAuto = w.key === 'auto' && !isVend() ? `<div class="grid2"><label class="field"><span>Reacondicionamiento</span><input id="ni-r" data-money inputmode="numeric" placeholder="$0" value="${e ? val(e.recon, 1) : ''}"></label><label class="field"><span>Precio de mercado</span><input id="ni-mk" data-money inputmode="numeric" placeholder="Opcional" value="${e && e.mercado ? fmt(e.mercado) : ''}"></label></div>
    <p style="font-size:12px;color:var(--fg3);margin-top:-6px">El precio de mercado lo escribes tú mirando autos parecidos en Chileautos o Yapo; la app lo usa para avisarte si tu precio está alto.</p>` : '';
  const masTxt = { auto: 'Color, tipo, transmisión, papeles, reacondicionamiento', prop: 'Dirección, metros, propietario', tienda: 'Stock, proveedor' }[w.key];
  openSheet(e ? `Editar ${w.itemOne.toLowerCase()}` : `Ingresar ${w.itemOne.toLowerCase()}`, `<div style="display:flex;flex-direction:column;gap:16px" data-live="niLive">
    ${e ? '' : `<div class="nfotos" id="ni-fotos"><label class="addshot mini">${icon('camera')}<span>Fotos</span><input type="file" accept="image/*" multiple hidden data-change="niFotos"></label></div>`}
    ${w.key === 'auto' ? `<p class="ni-prev" id="ni-prev">${e ? clean(e.nombre) : 'Elige marca, modelo y año'}</p>` : nombre}
    <div class="grid2">${princ.map(([k, l, t]) => campoItem(w.key, k, l, t, specV(k))).join('')}</div>
    <div class="grid2"><label class="field"><span>${w.idLabel}</span><input id="ni-s" placeholder="${w.key === 'auto' ? 'BKTS·41' : w.key === 'prop' ? '004-112' : 'NK-AM-42'}" style="text-transform:uppercase" value="${e ? val(e.sku) : ''}" autocomplete="off"></label>
    ${w.key === 'auto' ? `<label class="field"><span>Kilometraje</span><input data-k="km" inputmode="numeric" pattern="[0-9]*" type="text" class="ni-f" autocomplete="off" placeholder="0" value="${specV('km')}"></label>` : ''}</div>
    <div class="grid2"><label class="field"><span>${isVend() && (!e || e.aprob === 'pendiente') ? 'Precio sugerido (opcional)' : w.key === 'prop' ? 'Precio / arriendo' : 'Precio de venta'}</span><input id="ni-p" data-money inputmode="numeric" placeholder="$0" value="${e ? val(e.aprob === 'pendiente' ? e.precioSug : e.precio, 1) : ''}" ${isVend() && e && e.aprob !== 'pendiente' ? 'readonly style="opacity:.6"' : ''}></label>${costo}</div>
    ${isVend() && !e ? `<p style="font-size:12px;color:var(--fg3);margin-top:-6px">El administrador pone el precio de venta final y lo deja a la venta.</p>` : ''}
    ${w.key === 'tienda' ? `<div class="grid2"><label class="field"><span>${e ? 'Stock actual' : 'Cantidad'}</span><input id="ni-q" type="number" value="${e ? e.stock : 10}"></label><label class="field"><span>Stock mínimo</span><input id="ni-m" type="number" value="${e ? e.minimo : 5}"></label></div>` : ''}
    <details class="mas"><summary><span><b>Más detalles</b><br><small>${masTxt}</small></span>${icon('chevD', 18)}</summary><div class="mas-body">
      <div class="grid2">${resto.filter(c => c[0] !== 'km').map(([k, l, t]) => campoItem(w.key, k, l, t, specV(k))).join('')}</div>
      ${costosAuto}${papeles}
      ${w.key === 'tienda' ? `<label class="field"><span>Proveedor</span><input id="ni-pv" value="${e ? val(e.prov.n) : ''}"></label>` : ''}
      ${w.key === 'prop' ? `<label class="field"><span>Propietario</span><input id="ni-du" value="${e ? val(e.dueno) : ''}"></label>` : ''}
      ${w.key === 'auto' ? nombre : ''}
      ${e && w.key !== 'tienda' ? `<label class="field"><span>Estado</span><select id="ni-e">${(w.key === 'auto' ? [['disponible', 'Disponible'], ['reservado', 'Reservado'], ['taller', 'En taller'], ['vendido', 'Vendido']] : [['disponible', 'Disponible'], ['reservado', 'En promesa'], ['vendido', 'Vendida'], ['arrendado', 'Arrendada']]).map(([k, t]) => `<option value="${k}" ${e.estado === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}
    </div></details>
    <button class="btn primary" data-act="saveItem">${icon('check')}${e ? 'Guardar cambios' : 'Ingresar a ' + w.tabs.stock.toLowerCase()}</button>
    ${e && (isAdmin() || (e.aprob === 'pendiente' && e.creadoPor && e.creadoPor.email === lc(ME.email))) ? `<button class="btn danger" data-act="delItem" data-id="${e.id}">${icon('trash')}Eliminar</button>` : ''}</div>`);
}
// fotos al ingresar: se ven al tiro y se suben al guardar
ACT.niFotos = async (d, el) => {
  const files = [...el.files].slice(0, 8 - nuevasFotos.length); el.value = '';
  for (const f of files) { try { nuevasFotos.push(await readImage(f)); } catch (e) { } }
  pintarNuevasFotos();
};
ACT.niFotoRm = d => { nuevasFotos.splice(+d.i, 1); pintarNuevasFotos(); };
function pintarNuevasFotos() {
  const c = $('#ni-fotos'); if (!c) return;
  $$('.nshot', c).forEach(x => x.remove());
  c.insertAdjacentHTML('beforeend', nuevasFotos.map((f, i) => `<div class="nshot"><img src="${f}" alt=""><button type="button" data-act="niFotoRm" data-i="${i}" aria-label="Quitar foto">${icon('close', 12)}</button></div>`).join(''));
}

ACT.saveItem = () => {
  const w = W(), nombre = $('#ni-n').value.trim(); if (!nombre) { toast(w.key === 'auto' ? 'Elige la marca y el modelo' : 'Falta el nombre', 'warn'); return; }
  const NUMS = w.campos.filter(c => c[2] === 'number').map(c => c[0]);
  const specs = {}; $$('.ni-f').forEach(i => { const v = i.value.trim(); specs[i.dataset.k] = NUMS.includes(i.dataset.k) ? (v === '' || isNaN(+v.replace(/\./g, '')) ? '—' : +v.replace(/\./g, '')) : (v || '—'); });
  const ex0 = editingId ? getItem(editingId) : null;
  const sku = (w.key === 'auto' ? fmtPatente(($('#ni-s').value || '').trim()) : ($('#ni-s').value || '').trim().toUpperCase()) || '—', precio = money($('#ni-p').value), costo = $('#ni-c') ? money($('#ni-c').value) : ex0 ? (w.key === 'tienda' ? ex0.costoU : ex0.costo) || 0 : 0;
  const vendPend = isVend() && (!editingId || (getItem(editingId) || {}).aprob === 'pendiente');
  if (!precio && !vendPend) { toast(w.key === 'prop' ? 'Falta el precio' : 'Falta el precio de venta', 'warn'); return; }
  const prov = $('#ni-pv') ? { n: $('#ni-pv').value.trim() || '—', f: '—' } : null;
  const ex = editingId ? getItem(editingId) : null, id = ex ? ex.id : nuevoId('i');
  let it;
  if (w.key === 'auto') {
    const recon = $('#ni-r') ? money($('#ni-r').value) : ex0 ? ex0.recon || 0 : 0, mercado = $('#ni-mk') ? money($('#ni-mk').value) || null : ex0 ? ex0.mercado : null, pc = +$('#ni-pc').value;
    it = { ...(ex || { pubs: [], fotos: [], notas: '', ingreso: TODAY, gestor: ME.nombre, estado: 'disponible', prov: { n: '—', f: '—' } }), id, w: 'auto', nombre, sku, costo, recon, precio, mercado, specs,
      permiso: { pagadas: pc, venc: pc >= 2 ? proxMarzo() : ex && ex.permiso.pagadas === pc ? ex.permiso.venc : pc === 1 ? TODAY.slice(0, 4) + '-08-31' : proxMarzo() }, rev: $('#ni-rev').value || addDays(TODAY, 365), soap: $('#ni-soap').value || proxMarzo() };
    if (prov) it.prov = { ...(ex ? ex.prov : {}), n: prov.n, f: ex ? ex.prov.f : '—' };
  } else if (w.key === 'prop') {
    it = { ...(ex || { pubs: [], fotos: [], notas: '', ingreso: TODAY, gestor: ME.nombre, estado: 'disponible', vis: [], visBase: 0, docs: { dominio: addDays(TODAY, 30), grav: addDays(TODAY, 30), contrib: true }, costo: 0, recon: 0, mercado: null }), id, w: 'prop', nombre, sku, precio, specs,
      op: specs.operacion === 'Arriendo' ? 'Arriendo' : 'Venta', mandato: $('#ni-md').value || addDays(TODAY, 180), dueno: $('#ni-du').value.trim() || '—' };
  } else {
    const q = Math.max(0, +$('#ni-q').value || 0);
    it = { ...(ex || { fotos: [], notas: '', ingreso: TODAY, gestor: '—', pubs: [], ultimaVenta: TODAY, stockInicial: q, recon: 0, mercado: null }), id, w: 'tienda', nombre, sku, costoU: costo, precio, stock: q, minimo: Math.max(0, +$('#ni-m').value || 0), specs, costo: costo * q, prov: prov || { n: '—', f: '—' } };
    it.estado = q === 0 ? 'agotado' : 'disponible';
  }
  if (ex && $('#ni-e')) it.estado = $('#ni-e').value;
  if (vendPend) { it.aprob = 'pendiente'; it.precioSug = precio || null; it.precio = ex ? ex.precio || 0 : 0; if (!ex) it.creadoPor = { email: lc(ME.email), nombre: ME.nombre }; }
  else if (isVend() && ex) it.precio = ex.precio;
  if (ex) STOCK[STOCK.indexOf(ex)] = it; else STOCK.push(it);
  closeSheet(); renderAll(); animateIn($('#scr-panel'));
  if (ex) { toast('Cambios guardados'); if (topPush()) { const cta = $('.cta-bar', topPush()); refreshItem(it.id); if (cta) cta.innerHTML = itemCta(it); } }
  else {
    go('stock'); toast(vendPend ? `${w.itemOne} ingresado · el administrador pondrá el precio` : `${w.itemOne} ingresado`); setTimeout(() => openItem(id), 450);
    // las fotos elegidas al ingresar se suben ahora
    const fotos = nuevasFotos.slice(); nuevasFotos = [];
    if (fotos.length) (async () => {
      try { for (const f of fotos) it.fotos.push(await storeImage(f)); toast(`${fotos.length} foto${fotos.length > 1 ? 's' : ''} agregada${fotos.length > 1 ? 's' : ''}`, 'camera'); }
      catch (e) { toast('No se pudieron subir algunas fotos. Agrégalas desde la ficha.', 'warn'); }
      saved(); renderStock(); if (topPush()) refreshItem(it.id);
    })();
  }
};
ACT.delItem = d => {
  const it = getItem(d.id); if (!it) return;
  if (!confirm(`¿Eliminar "${it.nombre}"? Las ventas registradas se mantienen.`)) return;
  STOCK.splice(STOCK.indexOf(it), 1); closeSheet(); while (pushes.length) popScreen(); renderAll(); animateIn($('#scr-panel')); toast('Eliminado', 'trash');
};

/* ---------------- vendedores ---------------- */
ACT.nuevoVendedor = () => openSheet('Agregar vendedor', `<div style="display:flex;flex-direction:column;gap:14px">
  <label class="field"><span>Nombre</span><input id="nv-n" placeholder="Nombre y apellido" autocomplete="off"></label>
  <div class="grid2"><label class="field"><span>Teléfono</span><input id="nv-f" inputmode="tel" placeholder="+56 9 …"></label><label class="field"><span>Email</span><input id="nv-e" inputmode="email" placeholder="correo@…"></label></div>
  <div class="grid2"><label class="field"><span>Comisión base</span><select id="nv-t" data-change="nvTipo"><option value="pct">% Porcentaje</option><option value="monto">$ Monto fijo</option></select></label><label class="field"><span id="nv-l">Porcentaje (%)</span><input id="nv-v" inputmode="decimal" value="${W().key === 'prop' ? 40 : W().key === 'tienda' ? 3 : 2}"></label></div>
  <p style="font-size:12px;color:var(--fg3);margin-top:-4px">Es la comisión que aparece por defecto al registrar una venta de esta persona. Se puede cambiar en cada venta. Para que use la app, invítalo en Ajustes → Usuarios.</p>
  <button class="btn primary" data-act="saveVendedor">${icon('check')}Guardar vendedor</button></div>`);
ACT.nvTipo = (d, el) => { const i = $('#nv-v'), m = el.value === 'monto'; i.toggleAttribute('data-money', m); i.inputMode = m ? 'numeric' : 'decimal'; i.value = m ? '' : '0'; i.placeholder = m ? '$0' : ''; $('#nv-l').textContent = m ? 'Monto (CLP)' : 'Porcentaje (%)'; };
ACT.saveVendedor = () => {
  const n = $('#nv-n').value.trim(); if (!n) { toast('Falta el nombre', 'warn'); return; }
  if (EQUIPO.some(e => e.w === state.world && e.nombre.toLowerCase() === n.toLowerCase())) { toast('Ya existe un vendedor con ese nombre', 'warn'); return; }
  const t = $('#nv-t').value, raw = $('#nv-v').value;
  EQUIPO.push({ id: nuevoId('e'), w: state.world, nombre: n, fono: $('#nv-f').value.trim(), email: $('#nv-e').value.trim(), comTipo: t, comVal: t === 'pct' ? Math.min(100, Math.max(0, parseFloat(String(raw).replace(',', '.')) || 0)) : money(raw), activo: true });
  closeSheet(); renderEquipo(); renderPanel(); toast('Vendedor agregado', 'userplus');
};

/* ---------------- formulario: nueva venta ---------------- */
const comTxt = (t, v) => t === 'pct' ? String(v).replace('.', ',') + '%' : fmt(v);
const comBaseDe = (w, nombre) => { const e = EQUIPO.find(x => x.w === w && x.nombre === nombre); return e ? { t: e.comTipo, v: e.comVal } : null; };
let saleLead = null;
function openNuevaVenta(preId, leadId) {
  saleLead = leadId || null; const lead = leadId ? LEADS.find(l => l.id === leadId) : null;
  const w = W(), disp = itemsOf(w.key).filter(i => w.key === 'tienda' ? i.stock > 0 : ['disponible', 'reservado'].includes(i.estado) && !i.pendVenta && i.aprob !== 'pendiente'), vend = EQUIPO.filter(e => e.w === w.key && e.activo);
  if (!disp.length) { toast(w.key === 'tienda' ? 'No hay productos con stock' : `No hay ${w.itemMany.toLowerCase()} disponibles`, 'warn'); return; }
  // el vendedor registra a su nombre y con su comisión base; el admin elige a quién
  const vendNames = isVend() ? [miNombre(w.key)] : vend.length ? vend.map(e => e.nombre) : [ME.nombre];
  const lbl = w.key === 'prop' ? 'operación' : 'venta', envia = isVend() && conAprobacion(w.key);
  openSheet(envia ? `Enviar ${lbl}` : `Registrar ${lbl}`, `<div id="vf" data-live="liveVenta" style="display:flex;flex-direction:column;gap:14px">
    <label class="field"><span>${w.itemOne}</span><select id="vf-i" data-change="liveVenta">${disp.map(i => `<option value="${i.id}" ${i.id === preId ? 'selected' : ''}>${i.nombre} · ${i.sku}</option>`).join('')}</select></label>
    <div class="grid2"><label class="field"><span>Vendedor</span><select id="vf-v" data-change="vfVend">${vendNames.map(n => `<option>${n}</option>`).join('')}</select></label>
    ${w.key === 'tienda' ? `<label class="field"><span>Cantidad</span><input id="vf-q" type="number" min="1" value="1"></label>` : `<label class="field"><span>Cliente</span><input id="vf-cl" placeholder="Nombre y apellido" value="${lead ? lead.nombre : ''}"></label>`}</div>
    <label class="field"><span>${w.key === 'prop' ? 'Monto de la operación' : 'Precio de venta'}</span><input id="vf-p" data-money inputmode="numeric" placeholder="$0"></label><p id="vf-pp" style="font-size:12px;color:var(--fg3);margin-top:-6px"></p>
    ${w.key === 'prop' ? `<label class="field"><span>Honorario total (%)</span><input id="vf-h" type="number" step="0.1" value="4"></label>` : ''}
    <div class="grid2" ${envia ? 'style="display:none"' : ''}><label class="field"><span>Comisión</span><select id="vf-ct" data-change="vfCt"><option value="pct">% porcentaje</option><option value="monto">$ Monto fijo</option></select></label><label class="field"><span id="vf-cl2">Valor (%)</span><input id="vf-cv" inputmode="decimal" value="0"></label></div><p id="vf-hint" style="font-size:12px;color:var(--fg3);margin-top:-6px;${envia ? 'display:none' : ''}"></p>
    <div><p class="kicker" style="margin-bottom:10px">Pagos del cliente</p><div id="vf-pays" style="display:flex;flex-direction:column;gap:8px"></div><button class="btn ghost small" data-act="addPay" style="margin-top:10px;width:100%">${icon('plus', 15)}Agregar forma de pago</button></div>
    <label class="field"><span>Observación (opcional)</span><textarea id="vf-nota" maxlength="500" placeholder="Ej: el cliente deja el auto en parte de pago, entrega el lunes…"></textarea></label>
    <div class="card" id="vf-sum" style="padding:14px"></div>
    <div class="cuadra no" id="vf-ok"></div>
    ${envia ? `<p style="font-size:12px;color:var(--fg3)">La ${lbl} queda pendiente hasta que el administrador la apruebe. Tu comisión base es una referencia: la jefatura puede ajustarla al aprobar.</p>` : ''}
    <button class="btn primary" id="vf-save" data-act="saveVenta" disabled>${icon(envia ? 'send' : 'check')}${envia ? 'Enviar para aprobación' : 'Registrar ' + lbl}</button></div>`, () => { addPay(); vfDefault(); if (isVend()) ['#vf-v', '#vf-ct', '#vf-cv'].forEach(q => { $(q).disabled = true; }); liveVenta(); });
}
function vfDefault() {
  const e = EQUIPO.find(x => x.w === W().key && x.nombre === $('#vf-v').value); if (!e) { $('#vf-hint').textContent = 'Sin comisión base asignada. Agrega vendedores en Equipo.'; return; }
  $('#vf-ct').value = e.comTipo; vfFmt(); $('#vf-cv').value = e.comTipo === 'pct' ? e.comVal : fmt(e.comVal);
  $('#vf-hint').innerHTML = `Comisión base de ${e.nombre.split(' ')[0]}: <b>${e.comTipo === 'pct' ? e.comVal + '%' : fmt(e.comVal)}</b> · puedes cambiarla en esta venta.`;
}
function vfFmt() { const t = $('#vf-ct').value, i = $('#vf-cv'); i.toggleAttribute('data-money', t === 'monto'); i.inputMode = t === 'pct' ? 'decimal' : 'numeric'; $('#vf-cl2').textContent = t === 'pct' ? 'Valor (%)' : 'Valor (CLP)'; }
ACT.vfVend = () => { vfDefault(); liveVenta(); };
ACT.vfCt = () => { vfFmt(); const i = $('#vf-cv'); i.value = $('#vf-ct').value === 'pct' ? 0 : '$0'; liveVenta(); };
function payRow() { const w = W(); return `<div class="payw"><div class="pay"><select class="pm">${w.metodos.map(m => `<option value="${m}">${{ 'Crédito automotriz': 'Crédito', 'Tarjeta de crédito': 'Tarjeta' }[m] || m}</option>`).join('')}</select><input class="pa" data-money inputmode="numeric" placeholder="$0"><button class="x" data-act="rmPay" aria-label="Quitar pago">${icon('close')}</button></div><div class="payx" hidden style="margin-top:8px"><div class="grid2"><label class="field"><span>Financiera</span><select class="pf">${finsOn().map(f => `<option value="${f.k}">${f.n}</option>`).join('')}</select></label><label class="field"><span>Estado del crédito</span><select class="pc"><option value="evaluacion">En evaluación</option><option value="aprobado">Aprobado</option><option value="cursado">Cursado</option></select></label></div><div class="grid2" style="margin-top:8px"><label class="field"><span>Comisión financiera (%)</span><input class="pfc" inputmode="decimal" placeholder="0"></label><div class="pfm" style="align-self:end;font-size:12px;color:var(--fg3);padding-bottom:12px"></div></div></div></div>`; }
function addPay() { $('#vf-pays').insertAdjacentHTML('beforeend', payRow()); }
ACT.addPay = () => { addPay(); liveVenta(); };
ACT.rmPay = (d, el) => { if ($$('#vf-pays .payw').length > 1) el.closest('.payw').remove(); liveVenta(); };
function ventaCalc() {
  const w = W(), it = getItem($('#vf-i').value); if (!it) return null;
  const q = w.key === 'tienda' ? Math.max(1, +$('#vf-q').value || 1) : 1, precio = money($('#vf-p').value);
  let ingreso = precio, costo = 0;
  if (w.key === 'auto') costo = it.costo + it.recon; else if (w.key === 'tienda') costo = it.costoU * q;
  else ingreso = it.op === 'Arriendo' ? precio : Math.round(precio * (+$('#vf-h').value || 0) / 100);
  const ct = $('#vf-ct').value, cvRaw = $('#vf-cv').value, cv = ct === 'monto' ? money(cvRaw) : parseFloat(String(cvRaw).replace(',', '.')) || 0;
  const com = ct === 'pct' ? Math.round(ingreso * cv / 100) : cv;
  const pagos = $$('#vf-pays .payw').map(r => { const m = $('.pm', r).value, o = { m, a: money($('.pa', r).value), s: 'cobrado' }; if (m === 'Crédito automotriz') { o.fin = $('.pf', r).value; o.cr = $('.pc', r).value; o.s = o.cr === 'cursado' ? 'cobrado' : 'pendiente'; if (o.s === 'pendiente') o.v = addDays(TODAY, 7); o.fcp = Math.max(0, parseFloat(String($('.pfc', r).value).replace(',', '.')) || 0); o.fcm = Math.round(o.a * o.fcp / 100); o.fcs = 'pendiente'; } return o; });
  const tot = sum(pagos, p => p.a), fcm = sum(pagos, p => p.fcm || 0);
  return { it, q, precio, ingreso, costo, ct, cv, com, pagos, tot, fcm, u: ingreso - costo - com + fcm };
}
function liveVenta() {
  const it0 = getItem($('#vf-i').value), q0 = $('#vf-q') ? Math.max(1, +$('#vf-q').value || 1) : 1, key = it0 ? it0.id + ':' + q0 : '', vf = $('#vf');
  if (it0 && vf.dataset.pk !== key) {
    vf.dataset.pk = key; const sug = it0.precio * q0;
    $('#vf-p').value = sug ? fmt(sug) : '';
    const rows = $$('#vf-pays .pa'); if (rows.length === 1 && W().key !== 'prop') rows[0].value = sug ? fmt(sug) : '';
  }
  if (it0) $('#vf-pp').textContent = it0.precio ? `${W().key === 'prop' ? (it0.op === 'Arriendo' ? 'Arriendo publicado' : 'Precio publicado') : 'Precio publicado'}: ${fmt(it0.precio)}${q0 > 1 ? ' c/u' : ''}${money($('#vf-p').value) && money($('#vf-p').value) !== it0.precio * q0 ? ` · ${money($('#vf-p').value) < it0.precio * q0 ? 'descuento' : 'sobre precio'} de ${fmt(Math.abs(it0.precio * q0 - money($('#vf-p').value)))}` : ''}` : '';
  const c = ventaCalc(); if (!c) return; const ok = c.ingreso > 0 && c.tot === c.ingreso, falta = c.ingreso - c.tot;
  $$('#vf-pays .payw').forEach(r => {
    const cred = $('.pm', r).value === 'Crédito automotriz'; $('.payx', r).hidden = !cred; if (!cred) return;
    // al elegir (o cambiar) la financiera se propone su % de comisión; se puede cambiar
    const f = $('.pf', r).value, inp = $('.pfc', r); if (r.dataset.fin !== f) { r.dataset.fin = f; inp.value = finCom(f) || ''; }
    const pc = parseFloat(String(inp.value).replace(',', '.')) || 0, a = money($('.pa', r).value);
    $('.pfm', r).innerHTML = pc ? `Te paga <b style="color:var(--good)">${fmt(Math.round(a * pc / 100))}</b>` : 'Sin comisión';
  });
  $('#vf-sum').innerHTML = isVend() ? `<div class="grid2" style="text-align:left"><div><span class="kicker" style="font-size:9px">Monto</span><b class="num" style="display:block;font-size:15px;margin-top:6px">${fmtM(c.ingreso)}</b></div><div><span class="kicker" style="font-size:9px">Tu comisión</span>${conAprobacion(W().key) ? (b => `<b class="num" style="display:block;font-size:15px;margin-top:6px">${b ? 'Base ' + comTxt(b.t, b.v) : 'Por definir'}</b><span style="font-size:11px;color:var(--fg3)">La jefatura puede ajustarla</span>`)(comBaseDe(W().key, $('#vf-v').value)) : `<b class="num" style="display:block;font-size:15px;margin-top:6px;color:var(--good)">${fmtM(c.com)}</b>`}</div></div>` : `<div style="display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px;text-align:left"><div><span class="kicker" style="font-size:9px">Ingreso</span><b class="num" style="display:block;font-size:15px;margin-top:6px;white-space:nowrap">${fmtM(c.ingreso)}</b></div><div><span class="kicker" style="font-size:9px">Comisión</span><b class="num" style="display:block;font-size:15px;margin-top:6px;white-space:nowrap">${fmtM(c.com)}</b></div><div><span class="kicker" style="font-size:9px">Utilidad${c.fcm ? ' + financ.' : ''}</span><b class="num" style="display:block;font-size:15px;margin-top:6px;white-space:nowrap;color:${c.u >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtM(c.u)}</b></div></div>`;
  const b = $('#vf-ok'); b.className = 'cuadra ' + (ok ? 'ok' : 'no'); b.innerHTML = `<span>Pagos: ${fmt(c.tot)}</span><span style="display:flex;align-items:center;gap:6px">${ok ? icon('check', 14, 2.4) + 'Cuadra' : falta > 0 ? 'Falta ' + fmt(falta) : 'Sobra ' + fmt(-falta)}</span>`;
  $('#vf-save').disabled = !ok;
}
ACT.liveVenta = () => liveVenta();
ACT.saveVenta = () => {
  const c = ventaCalc(); if (!c || c.tot !== c.ingreso) return; const w = W(), it = c.it;
  const cliente = w.key === 'tienda' ? 'Cliente mostrador' : ($('#vf-cl').value.trim() || 'Cliente'), id = nuevoId('v');
  const extra = w.key === 'tienda' ? { q: c.q, hora: new Date().getHours() } : w.key === 'auto' ? { tramite: 'pendiente' } : { op: `${it.op} · ${it.op === 'Arriendo' ? 'contrato firmado' : 'promesa firmada'}` };
  const lead = saleLead ? LEADS.find(x => x.id === saleLead) : null;
  const nota = ($('#vf-nota').value || '').trim().replace(/[<>"'`]/g, '').slice(0, 500); if (nota) extra.nota = nota;
  if (isVend() && conAprobacion(w.key)) {
    extra.comBase = comBaseDe(w.key, $('#vf-v').value);
    VENTAS.push(V(id, w.key, it.id, TODAY, cliente, lead ? lead.fono : '', $('#vf-v').value, c.ingreso, c.precio, c.costo, c.ct, c.cv, c.pagos, { ...extra, aprob: 'pendiente', enviada: nowISO(), leadId: saleLead || null }));
    it.estado = 'reservado'; it.pendVenta = id; saleLead = null;
    closeSheet(); while (pushes.length) popScreen(); renderAll(); go('ventas'); toast(`Enviada al administrador · ${fmtM(c.ingreso)}`, 'send');
    setTimeout(() => openVenta(id), 500); return;
  }
  VENTAS.push(V(id, w.key, it.id, TODAY, cliente, lead ? lead.fono : '', $('#vf-v').value, c.ingreso, c.precio, c.costo, c.ct, c.cv, c.pagos, extra));
  if (w.key === 'tienda') { it.stock -= c.q; it.estado = it.stock <= 0 ? 'agotado' : 'disponible'; it.ultimaVenta = TODAY; } else it.estado = it.op === 'Arriendo' ? 'arrendado' : 'vendido';
  if (saleLead) { const l = LEADS.find(x => x.id === saleLead); if (l) { l.etapa = 'ganado'; l.ts = nowISO(); l.log.push({ ts: tick(), tipo: 'etapa', txt: 'Venta cerrada' }); } saleLead = null; }
  closeSheet(); while (pushes.length) popScreen(); renderAll(); animateIn($('#scr-panel')); go('ventas'); toast(`${w.cierreLabel} registrada · ${fmtM(c.ingreso)}`);
  setTimeout(() => openVenta(id), 500);
};
