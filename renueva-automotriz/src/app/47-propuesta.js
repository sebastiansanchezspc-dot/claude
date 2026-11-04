/* =====================================================================
   PROPUESTA AL CLIENTE: documento con foto, precio y forma de pago
   combinada (efectivo, transferencia, auto en parte de pago, etc.)
   más el saldo con financiamiento y su cuota, listo para WhatsApp.
   ===================================================================== */
let prop = null;
const PR_PLAZOS = { auto: [12, 24, 36, 48, 60], prop: [15, 20, 25, 30] };
// medios de pago al contado según el mundo (el financiamiento va aparte)
const prMedios = (it) => it.w === 'auto' ? ['Transferencia', 'Efectivo', PARTE_PAGO, 'Tarjeta de crédito', 'Vale vista', 'Cheque']
  : it.w === 'prop' ? (it.op === 'Arriendo' ? ['Mes de garantía', 'Mes adelantado', 'Comisión de corretaje', 'Gastos de contrato', 'Otro'] : ['Transferencia', 'Vale vista', 'Ahorro previo', 'Subsidio', 'Efectivo'])
  : ['Efectivo', 'Transferencia', 'Débito', 'Tarjeta de crédito'];
const prArr = it => it.w === 'prop' && it.op === 'Arriendo';
// entidades que pueden financiar el saldo
const prEntidades = it => it.w === 'auto' ? [...finsOn().map(f => f.n), 'Crédito directo'] : ['Crédito hipotecario'];
// cuota fija (sistema francés): monto, tasa del período y número de cuotas
const prCuota = (m, i, n) => !m || !n ? 0 : i > 0 ? Math.round(m * i / (1 - Math.pow(1 + i, -n))) : Math.round(m / n);
function prCalc(it, o) {
  const precio = o.precio || 0, hip = it.w === 'prop', arr = prArr(it);
  const pagos = (o.pagos || []).filter(p => p.a > 0), contado = pagos.reduce((s, p) => s + p.a, 0);
  if (arr) return { precio, pagos, contado, saldo: 0, monto: 0, n: 0, cuota: 0, entrar: contado + precio * 0 };
  const saldo = Math.max(0, precio - contado), fin = o.fin && o.fin.on && saldo > 0;
  const n = hip ? o.fin.plazo * 12 : o.fin.plazo, i = (o.fin.tasa || 0) / 100 / (hip ? 12 : 1);
  return { precio, pagos, contado, saldo, monto: fin ? saldo : 0, n, cuota: fin ? prCuota(saldo, i, n) : 0, piePct: precio ? Math.round(contado / precio * 100) : 0 };
}
const prFecha = d => dateOf(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
const prPagoTxt = p => p.m === PARTE_PAGO ? `Parte de pago${p.d ? ': ' + p.d : ''}` : p.m;

/* ---------------- dibujo del documento (1080 de ancho, alto según el contenido) ---------------- */
async function prRender(canvas, it, o) {
  const W = 1080, Hmax = 3400, off = document.createElement('canvas'); off.width = W; off.height = Hmax; const c = off.getContext('2d');
  const [foto, logo] = await Promise.all([pubImg(it.fotos[0] ? fotoSrc(it.fotos[0]) : ''), pubImg(PREFS.logo ? fotoSrc(PREFS.logo) : '')]);
  const d = { ...pubDatos(it), logo, org: orgNombre(), vend: o.vend, fono: o.fono, accent: o.color, fotos: foto ? [foto] : [], w: it.w };
  const k = prCalc(it, o), ink = '#15171A', soft = 'rgba(21,23,26,.56)', line = '#E6E3DC', m = 60, arr = prArr(it);
  // color: la cabecera toma el color elegido; sobre fondo claro el acento se oscurece si hace falta
  const band = o.color === '#FFFFFF' ? ink : o.color, onBand = pInk(band), acc = pInk(o.color) === '#101114' ? ink : o.color;
  c.fillStyle = '#F6F5F1'; c.fillRect(0, 0, W, Hmax);
  // cabecera
  c.fillStyle = band; c.fillRect(0, 0, W, 196);
  pLogo(c, d.logo ? d : { ...d, accent: onBand === '#FFFFFF' ? '#FFFFFF' : ink }, m, 50, 96);
  pText(c, d.org, m + 120, 94, 700, 38, 520, 'b', onBand);
  pText(c, 'PROPUESTA COMERCIAL', m + 120, 138, 500, 21, 520, 'm', onBand === '#FFFFFF' ? 'rgba(255,255,255,.66)' : 'rgba(16,17,20,.62)', { ls: 4 });
  pText(c, prFecha(TODAY), W - m, 94, 600, 26, 340, 'b', onBand, { align: 'right' });
  pText(c, 'VÁLIDA HASTA ' + prFecha(addDays(TODAY, o.vig)).toUpperCase(), W - m, 136, 500, 17, 400, 'm', onBand === '#FFFFFF' ? 'rgba(255,255,255,.75)' : 'rgba(16,17,20,.7)', { align: 'right', ls: 2 });
  let y = 266;
  pText(c, 'PREPARADA PARA', m, y, 500, 21, 400, 'm', soft, { ls: 4 });
  pText(c, o.cliente || 'Cliente', m, y + 62, 800, 60, W - m * 2, 'd', ink);
  y += 100;
  // foto con proporción fija (3:2): se ve completa y nítida
  const pw = W - m * 2, ph = Math.round(pw * 2 / 3);
  c.save(); pRR(c, m, y, pw, ph, 34); c.clip(); pCover(c, foto, m, y, pw, ph, 0.55, d); c.restore(); y += ph + 70;
  pText(c, d.titulo + (d.anio ? ' ' + d.anio : ''), m, y, 800, 54, W - m * 2, 'd', ink);
  const sub = it.w === 'prop' ? [d.tipo, d.comuna, ...d.stats.slice(0, 2).map(s => s[1])].filter(Boolean).join('  ·  ') : d.specs.map(s => s[1]).join('  ·  ');
  if (sub) pText(c, sub, m, y + 46, 500, 27, W - m * 2, 'b', soft);
  y += 92;
  // precio
  const lista = it.precio || 0, especial = !arr && k.precio && lista && k.precio < lista;
  pRR(c, m, y, W - m * 2, especial ? 150 : 124, 28); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = line; c.lineWidth = 2; c.stroke(); c.fillStyle = acc; c.fillRect(m, y + 28, 8, (especial ? 150 : 124) - 56);
  if (especial) {
    pText(c, 'PRECIO DE LISTA', m + 40, y + 52, 500, 19, 300, 'm', soft, { ls: 3 });
    c.font = PF(600, 32, 'b'); const lw = c.measureText(fmt(lista)).width; pText(c, fmt(lista), m + 40, y + 104, 600, 32, 300, 'b', soft); c.fillStyle = soft; c.fillRect(m + 40, y + 92, lw, 3);
    pText(c, 'PRECIO ESPECIAL PARA TI', W - m - 36, y + 52, 500, 19, 420, 'm', acc, { align: 'right', ls: 3 });
    pText(c, fmt(k.precio), W - m - 36, y + 116, 800, 62, 520, 'd', ink, { align: 'right' }); y += 150;
  } else { pText(c, arr ? 'ARRIENDO MENSUAL' : 'PRECIO', m + 40, y + 72, 500, 21, 320, 'm', soft, { ls: 3 }); pText(c, fmt(k.precio), W - m - 36, y + 86, 800, 62, 560, 'd', ink, { align: 'right' }); y += 124; }
  y += 30;
  // forma de pago: cada medio con su monto
  if (k.pagos.length) {
    pText(c, arr ? 'PARA ENTRAR NECESITAS' : 'FORMA DE PAGO', m, y + 20, 500, 21, 500, 'm', soft, { ls: 4 }); y += 44;
    const rh = 70; pRR(c, m, y, W - m * 2, rh * k.pagos.length + (k.pagos.length > 1 || arr ? rh : 0) + 16, 28); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = line; c.lineWidth = 2; c.stroke();
    let ry = y + 8;
    k.pagos.forEach((p, i) => {
      if (i) { c.fillStyle = line; c.fillRect(m + 36, ry, W - m * 2 - 72, 2); }
      c.beginPath(); c.arc(m + 46, ry + rh / 2, 9, 0, Math.PI * 2); c.fillStyle = acc; c.fill();
      pText(c, prPagoTxt(p), m + 72, ry + rh / 2 + 11, 600, 29, W - m * 2 - 420, 'b', ink);
      pText(c, fmt(p.a), W - m - 36, ry + rh / 2 + 12, 700, 32, 330, 'b', ink, { align: 'right' }); ry += rh;
    });
    if (k.pagos.length > 1 || arr) { c.fillStyle = ink; c.fillRect(m + 36, ry, W - m * 2 - 72, 2); pText(c, arr ? 'Total para entrar' : 'Total al contado', m + 36, ry + rh / 2 + 12, 700, 29, 400, 'b', ink); pText(c, fmt(k.contado), W - m - 36, ry + rh / 2 + 14, 800, 38, 400, 'd', ink, { align: 'right' }); ry += rh; }
    y = ry + 8 + 30;
  }
  // saldo con financiamiento
  if (!arr && k.monto > 0) {
    const fh = 262; pRR(c, m, y, W - m * 2, fh, 28); c.fillStyle = ink; c.fill();
    const ent = o.fin.ent ? o.fin.ent.toUpperCase() : (it.w === 'prop' ? 'CRÉDITO HIPOTECARIO' : 'FINANCIAMIENTO');
    pText(c, `SALDO CON ${ent === 'CRÉDITO DIRECTO' ? 'CRÉDITO DIRECTO' : ent} (REFERENCIAL)`, m + 36, y + 54, 500, 19, W - m * 2 - 72, 'm', 'rgba(255,255,255,.58)', { ls: 3 });
    const cols = [['A financiar', fmt(k.monto)], ['Plazo', it.w === 'prop' ? `${o.fin.plazo} años` : `${o.fin.plazo} meses`], ['Tasa', `${String(o.fin.tasa).replace('.', ',')}% ${it.w === 'prop' ? 'anual' : 'mensual'}`]], cw = (W - m * 2 - 72) / 3;
    cols.forEach(([l, v], i) => { pText(c, l.toUpperCase(), m + 36 + i * cw, y + 104, 500, 18, cw - 16, 'm', 'rgba(255,255,255,.5)', { ls: 2 }); pText(c, v, m + 36 + i * cw, y + 144, 700, 30, cw - 16, 'b', '#fff'); });
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(m + 36, y + 172, W - m * 2 - 72, 2);
    pText(c, `${k.n} cuotas de`, m + 36, y + 230, 600, 30, 300, 'b', 'rgba(255,255,255,.78)');
    pText(c, fmt(k.cuota), W - m - 36, y + 236, 800, 64, 560, 'd', pInk(o.color) === '#101114' || o.color === '#FFFFFF' ? (o.color === '#FFFFFF' ? '#fff' : o.color) : '#fff', { align: 'right' });
    y += fh + 22;
    pText(c, `Valores referenciales, sujetos a evaluación y aprobación${o.fin.ent === 'Crédito directo' ? ' de ' + orgNombre() : ' de la entidad financiera'}.`, m, y + 6, 500, 20, W - m * 2, 'b', soft); y += 40;
  } else if (!arr && k.saldo > 0 && k.pagos.length) {
    pRR(c, m, y, W - m * 2, 96, 24); c.fillStyle = '#FFF3E0'; c.fill(); pText(c, 'Saldo por definir', m + 36, y + 60, 600, 29, 420, 'b', '#8A5600'); pText(c, fmt(k.saldo), W - m - 36, y + 62, 800, 36, 420, 'd', '#8A5600', { align: 'right' }); y += 126;
  }
  // incluye
  const inc = (o.incluye || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 5);
  if (inc.length) { y += 24; inc.forEach(t => { c.beginPath(); c.arc(m + 14, y - 9, 14, 0, Math.PI * 2); c.fillStyle = acc; c.fill(); c.strokeStyle = pInk(acc); c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(m + 8, y - 9); c.lineTo(m + 13, y - 4); c.lineTo(m + 21, y - 14); c.stroke(); pText(c, t, m + 44, y, 600, 28, W - m * 2 - 44, 'b', ink); y += 48; }); }
  // vendedor y nota legal
  y += 36; c.fillStyle = line; c.fillRect(m, y, W - m * 2, 2); y += 34;
  pSeller(c, { ...d, accent: band }, m, y, W - m * 2, 100, false); y += 140;
  pText(c, 'Propuesta referencial, no constituye una oferta vinculante. Sujeta a disponibilidad.', W / 2, y, 500, 19, W - m * 2, 'b', soft, { align: 'center' }); y += 50;
  const H = Math.max(1350, Math.min(Hmax, y));
  canvas.width = W; canvas.height = H; const g = canvas.getContext('2d'); g.drawImage(off, 0, 0, W, H, 0, 0, W, H);
  return canvas;
}

/* ---------------- pantalla ---------------- */
function openPropuesta(id) {
  const it = getItem(id); if (!it) return; const pr = pubPrefs(), yo = miEquipo(it.w), hip = it.w === 'prop', arr = prArr(it), precio = it.precio || 0;
  const ent = prEntidades(it)[0];
  prop = { id, cliente: '', precio, vig: 7, color: pr.color || (PREFS.accent[it.w] || WORLDS[it.w].accent),
    pagos: arr ? [{ m: 'Mes de garantía', a: precio }, { m: 'Mes adelantado', a: precio }] : [{ m: hip ? 'Transferencia' : 'Transferencia', a: Math.round(precio * (hip ? 0.2 : 0.3) / 10000) * 10000 }],
    fin: { on: !arr && it.w !== 'tienda', ent, tasa: hip ? 4.5 : 1.6, plazo: hip ? 20 : 36 },
    incluye: hip ? '' : it.w === 'auto' ? 'Transferencia incluida\nRevisión técnica al día' : '', vend: pr.vend || (yo && yo.nombre) || ME.nombre || '', fono: pr.fono || (yo && yo.fono) || '' };
  pushScreen('Propuesta', prHtml(it), { cta: `<button class="btn ghost" data-act="prBajar">${icon('download')}Descargar</button><button class="btn primary" data-act="prEnviar">${icon('share')}Enviar</button>` });
  prDibujar();
}
function prPagoRow(it, p, i) {
  const pp = p.m === PARTE_PAGO;
  return `<div class="prpago" data-i="${i}"><div class="prpago-r"><select data-change="prPagoMedio" data-i="${i}" aria-label="Medio de pago">${[...new Set([...prMedios(it), p.m])].map(m => `<option ${m === p.m ? 'selected' : ''}>${m}</option>`).join('')}</select>
    <input class="prpago-a" data-money inputmode="numeric" value="${p.a ? fmt(p.a) : ''}" placeholder="$0" data-change="prDatos" data-i="${i}" aria-label="Monto">
    <button class="ibtn" data-act="prPagoRm" data-i="${i}" aria-label="Quitar">${icon('close', 15)}</button></div>
    ${pp ? `<input class="prpago-d" maxlength="50" placeholder="Auto que recibes: marca, modelo y año" value="${clean(p.d || '')}" data-change="prDatos" data-i="${i}">` : ''}</div>`;
}
function prResumen(it) {
  const k = prCalc(it, prop), arr = prArr(it);
  if (arr) return `<div class="prres"><span>Total para entrar</span><b>${fmt(k.contado)}</b></div>`;
  return `<div class="prsum"><div><span>Precio</span><b>${fmt(k.precio)}</b></div><div><span>Al contado</span><b>${fmt(k.contado)}</b></div><div><span>${prop.fin.on ? 'A financiar' : 'Saldo'}</span><b class="${!prop.fin.on && k.saldo > 0 ? 'warn' : ''}">${fmt(k.saldo)}</b></div></div>
    ${prop.fin.on && k.monto > 0 ? `<div class="prres"><span>${k.n} cuotas de</span><b>${fmt(k.cuota)}</b></div>` : ''}`;
}
function prHtml(it) {
  const hip = it.w === 'prop', arr = prArr(it);
  return `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:16px">
    <div class="pubprev prdoc"><canvas id="pr-c" width="1080" height="1350" aria-label="Vista previa de la propuesta"></canvas></div>
    <div><p class="kicker" style="margin-bottom:10px">Color</p><div class="pubcolors">${PUB_COLORS.map(c => `<button data-act="prColor" data-c="${c}" class="${c === prop.color ? 'on' : ''}" style="--c:${c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">Cliente y precio</span>
      <label class="field"><span>Nombre del cliente</span><input id="pr-cl" maxlength="40" placeholder="Nombre y apellido" data-change="prDatos" value="${clean(prop.cliente)}"></label>
      <div class="grid2"><label class="field"><span>${arr ? 'Arriendo mensual' : 'Precio ofrecido'}</span><input id="pr-p" data-money inputmode="numeric" value="${fmt(prop.precio)}" data-change="prDatos"></label>
      <label class="field"><span>Vigencia</span><select id="pr-v" data-change="prDatos">${[3, 7, 15, 30].map(n => `<option value="${n}" ${n === prop.vig ? 'selected' : ''}>${n} días</option>`).join('')}</select></label></div>
      <p class="prdesc" style="font-size:12px;color:var(--fg3);margin-top:-4px" ${it.precio && prop.precio < it.precio ? '' : 'hidden'}>Descuento de ${fmt(Math.max(0, (it.precio || 0) - prop.precio))} sobre el precio publicado.</p></div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">${arr ? 'Para entrar necesita' : 'Forma de pago'}</span>
      <div class="prpagos">${prop.pagos.map((p, i) => prPagoRow(it, p, i)).join('')}</div>
      <button class="btn ghost small" data-act="prPagoAdd">${icon('plus', 15)}${arr ? 'Agregar concepto' : 'Agregar medio de pago'}</button>
      ${arr || it.w === 'tienda' ? '' : `<div style="height:1px;background:var(--line)"></div>
      <div style="display:flex;justify-content:space-between;align-items:center"><span><b style="font-weight:600">${hip ? 'Saldo con crédito hipotecario' : 'Saldo con financiamiento'}</b><small style="display:block;font-size:12px;color:var(--fg3);margin-top:2px">Lo que no se paga al contado</small></span><button class="toggle ${prop.fin.on ? 'on' : ''}" data-act="prCred" aria-label="Financiar el saldo"></button></div>
      ${prop.fin.on ? `<div class="grid2">${hip ? '' : `<label class="field"><span>Financia</span><select id="pr-e" data-change="prEnt">${prEntidades(it).map(e => `<option ${e === prop.fin.ent ? 'selected' : ''}>${clean(e)}</option>`).join('')}</select></label>`}<label class="field"><span>Tasa ${hip ? 'anual' : 'mensual'} (%)</span><input id="pr-t" inputmode="decimal" value="${String(prop.fin.tasa).replace('.', ',')}" data-change="prDatos"></label>${hip ? '<div></div>' : ''}</div>
      <div><p class="kicker" style="margin-bottom:8px">Plazo</p><div class="optrow">${PR_PLAZOS[hip ? 'prop' : 'auto'].map(n => `<button class="opt ${n === prop.fin.plazo ? 'on' : ''}" data-act="prPlazo" data-n="${n}">${n} ${hip ? 'años' : 'meses'}</button>`).join('')}</div></div>` : ''}`}
      <div id="pr-res">${prResumen(it)}</div></div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">Incluye (una por línea, opcional)</span>
      <textarea id="pr-inc" maxlength="240" data-change="prDatos" placeholder="${hip ? (arr ? 'Ej: Estacionamiento y bodega' : 'Ej: Estacionamiento y bodega') : 'Ej: Transferencia incluida'}">${clean(prop.incluye)}</textarea>
      <div class="grid2"><label class="field"><span>Tu nombre</span><input id="pr-vn" maxlength="40" value="${clean(prop.vend)}" data-change="prDatos"></label><label class="field"><span>WhatsApp</span><input id="pr-f" maxlength="20" inputmode="tel" placeholder="+56 9 …" value="${clean(prop.fono)}" data-change="prDatos"></label></div></div>
  </div>`;
}
let prTimer = null;
function prDibujar() {
  clearTimeout(prTimer); const it = getItem(prop.id);
  prTimer = setTimeout(async () => { await pubFonts(); const off = document.createElement('canvas'); await prRender(off, it, prop); const cc = $('#pr-c'); if (!cc) return; cc.width = off.width; cc.height = off.height; cc.getContext('2d').drawImage(off, 0, 0); }, 60);
}
// rehace el formulario (sin perder el desplazamiento) y la vista previa
function prRefrescar() { const el = topPush(); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop; pb.innerHTML = prHtml(getItem(prop.id)); pb.scrollTop = sc; prDibujar(); }
ACT.propuesta = d => openPropuesta(d.id);
// lee el formulario sin rehacerlo (así no se pierde el foco al escribir)
function prLeer() {
  const g = id => ($('#' + id) || { value: '' }).value, it = getItem(prop.id);
  prop.cliente = g('pr-cl').trim().replace(/[<>"'`]/g, '').slice(0, 40); prop.precio = money(g('pr-p')) || prop.precio; prop.vig = +g('pr-v') || 7;
  if ($('#pr-t')) prop.fin.tasa = Math.max(0, Math.min(it.w === 'prop' ? 30 : 10, parseFloat(g('pr-t').replace(',', '.')) || 0));
  $$('.prpago-a').forEach(el => { const p = prop.pagos[+el.dataset.i]; if (p) p.a = money(el.value); });
  $$('.prpago-d').forEach(el => { const p = prop.pagos[+el.dataset.i]; if (p) p.d = el.value.trim().replace(/[<>"'`]/g, '').slice(0, 50); });
  prop.incluye = g('pr-inc').replace(/[<>"'`]/g, '').slice(0, 240); prop.vend = g('pr-vn').trim().replace(/[<>"'`]/g, '').slice(0, 40); prop.fono = g('pr-f').trim().replace(/[^\d+ ()-]/g, '').slice(0, 20);
}
ACT.prDatos = () => {
  prLeer();
  try { localStorage.setItem('gestix_pub', JSON.stringify({ ...pubPrefs(), vend: prop.vend, fono: prop.fono })); } catch (e) { }
  prSync();
};
function prSync() {
  const it = getItem(prop.id), r = $('#pr-res'), dsc = $('.prdesc');
  if (r) r.innerHTML = prResumen(it);
  if (dsc) { dsc.hidden = !(it.precio && prop.precio < it.precio); dsc.textContent = `Descuento de ${fmt(Math.max(0, (it.precio || 0) - prop.precio))} sobre el precio publicado.`; }
  prDibujar();
}
ACT.prCred = () => { prLeer(); prop.fin.on = !prop.fin.on; prRefrescar(); };
ACT.prEnt = (d, el) => { prLeer(); prop.fin.ent = el.value; if (el.value === 'Crédito directo' && prop.fin.tasa === 1.6) prop.fin.tasa = 2.2; prRefrescar(); };
ACT.prPlazo = d => { prLeer(); prop.fin.plazo = +d.n; prRefrescar(); };
ACT.prColor = d => { prop.color = d.c; $$('.prdoc ~ div .pubcolors button, .pubcolors button').forEach(b => b.classList.toggle('on', b.dataset.c === d.c)); try { localStorage.setItem('gestix_pub', JSON.stringify({ ...pubPrefs(), color: d.c })); } catch (e) { } prDibujar(); };
ACT.prPagoAdd = () => { prLeer(); const it = getItem(prop.id), usados = prop.pagos.map(p => p.m), m = prMedios(it).find(x => !usados.includes(x)) || prMedios(it)[0]; prop.pagos.push({ m, a: 0 }); prRefrescar(); const filas = $$('.prpago'); if (filas.length) filas[filas.length - 1].classList.add('nuevo'); const ins = $$('.prpago-a'); if (ins.length) setTimeout(() => ins[ins.length - 1].focus(), 80); };
ACT.prPagoRm = d => { prLeer(); prop.pagos.splice(+d.i, 1); prRefrescar(); };
ACT.prPagoMedio = (d, el) => { prLeer(); const p = prop.pagos[+d.i]; if (p) { p.m = el.value; if (p.m !== PARTE_PAGO) delete p.d; } prRefrescar(); };
function prTexto(it) {
  const k = prCalc(it, prop), d = pubDatos(it), arr = prArr(it);
  return [`Hola${prop.cliente ? ' ' + firstName(prop.cliente) : ''}, te envío la propuesta por ${d.titulo}${d.anio ? ' ' + d.anio : ''}:`, `• ${arr ? 'Arriendo mensual' : 'Precio'}: ${fmt(k.precio)}`,
    ...k.pagos.map(p => `• ${prPagoTxt(p)}: ${fmt(p.a)}`), arr && k.pagos.length ? `• Total para entrar: ${fmt(k.contado)}` : '',
    k.monto ? `• Saldo ${fmt(k.monto)} en ${k.n} cuotas de ${fmt(k.cuota)}${prop.fin.ent ? ' (' + prop.fin.ent + ', referencial)' : ' (referencial)'}` : '',
    `Válida hasta el ${prFecha(addDays(TODAY, prop.vig))}.`, prop.vend ? `${prop.vend} · ${orgNombre()}` : orgNombre()].filter(Boolean).join('\n');
}
async function prArchivo() {
  prLeer();
  const it = getItem(prop.id), c = document.createElement('canvas'); await pubFonts(); await prRender(c, it, prop);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.92)), k = prCalc(it, prop);
  // queda registro en el historial del ítem
  it.propuestas = [...(it.propuestas || []), { cliente: prop.cliente || 'Cliente', precio: prop.precio, cuota: k.cuota || null, pagos: k.pagos.map(p => ({ m: p.m, a: p.a, d: p.d || undefined })), fecha: TODAY, por: ME.nombre }].slice(-20);
  return new File([blob], `propuesta-${mkSlug(prop.cliente || 'cliente')}-${mkSlug(it.nombre)}.jpg`, { type: 'image/jpeg' });
}
ACT.prEnviar = async () => {
  try {
    const f = await prArchivo(); saved();
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: prTexto(getItem(prop.id)) }); return; }
    pubDescargar(f); toast('Tu equipo no permite enviar directo: la propuesta se descargó', 'download');
  } catch (e) { if (e && e.name === 'AbortError') return; toast('No se pudo preparar la propuesta', 'warn'); }
};
ACT.prBajar = async () => { try { pubDescargar(await prArchivo()); saved(); toast('Propuesta descargada', 'download'); } catch (e) { toast('No se pudo descargar la propuesta', 'warn'); } };
