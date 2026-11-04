/* =====================================================================
   PROPUESTA AL CLIENTE: documento con foto, precio y simulación de
   crédito (cuota aproximada), listo para enviar por WhatsApp o descargar.
   ===================================================================== */
let prop = null;
const PR_PLAZOS = { auto: [12, 24, 36, 48, 60], prop: [15, 20, 25, 30] };
// cuota fija (sistema francés): monto, tasa del período y número de cuotas
const prCuota = (m, i, n) => !m || !n ? 0 : i > 0 ? Math.round(m * i / (1 - Math.pow(1 + i, -n))) : Math.round(m / n);
function prCalc(it, o) {
  const precio = o.precio || 0, pie = Math.min(precio, o.pie || 0), monto = Math.max(0, precio - pie), hip = it.w === 'prop';
  const n = hip ? o.plazo * 12 : o.plazo, i = (o.tasa || 0) / 100 / (hip ? 12 : 1);
  return { precio, pie, monto, n, cuota: o.cred ? prCuota(monto, i, n) : 0, piePct: precio ? Math.round(pie / precio * 100) : 0 };
}
const prFecha = d => dateOf(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

/* ---------------- dibujo del documento (1080 × 1528, proporción A4) ---------------- */
async function prRender(canvas, it, o) {
  const W = 1080, H = 1528, c = canvas.getContext('2d'); canvas.width = W; canvas.height = H;
  const [foto, logo] = await Promise.all([pubImg(it.fotos[0] ? fotoSrc(it.fotos[0]) : ''), pubImg(PREFS.logo ? fotoSrc(PREFS.logo) : '')]);
  const d = { ...pubDatos(it), logo, org: orgNombre(), vend: o.vend, fono: o.fono, accent: o.color, fotos: foto ? [foto] : [], w: it.w };
  const k = prCalc(it, o), ink = '#15171A', soft = 'rgba(21,23,26,.55)', line = '#E6E3DC', acc = pInk(d.accent) === '#101114' ? '#1F6F5C' : d.accent, m = 60;
  c.fillStyle = '#F6F5F1'; c.fillRect(0, 0, W, H);
  // cabecera
  c.fillStyle = ink; c.fillRect(0, 0, W, 200);
  pLogo(c, d, m, 52, 96);
  pText(c, d.org, m + 120, 96, 700, 38, 520, 'b', '#fff');
  pText(c, 'PROPUESTA COMERCIAL', m + 120, 140, 500, 22, 520, 'm', 'rgba(255,255,255,.6)', { ls: 4 });
  pText(c, prFecha(TODAY), W - m, 96, 600, 26, 340, 'b', '#fff', { align: 'right' });
  pText(c, 'VÁLIDA HASTA ' + prFecha(addDays(TODAY, o.vig)).toUpperCase(), W - m, 136, 500, 18, 380, 'm', d.accent === '#FFFFFF' ? '#fff' : d.accent, { align: 'right', ls: 2 });
  let y = 290;
  pText(c, 'PREPARADA PARA', m, y - 40, 500, 22, 400, 'm', soft, { ls: 4 });
  pText(c, o.cliente || 'Cliente', m, y + 22, 800, 64, W - m * 2, 'd', ink);
  y += 70;
  // foto y nombre del vehículo / propiedad
  // la foto toma el espacio que dejan los bloques de abajo (precio, crédito, incluye y vendedor)
  const nInc = (o.incluye || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 4).length, conCred = o.cred && k.monto > 0;
  const bajo = 74 + 92 + (k.precio && it.precio && k.precio < it.precio ? 150 : 120) + 24 + (conCred ? 304 : 0) + (nInc ? 22 + nInc * 46 : 0);
  const ph = Math.max(220, Math.min(460, H - 182 - 36 - y - bajo)); c.save(); pRR(c, m, y, W - m * 2, ph, 32); c.clip(); pCover(c, foto, m, y, W - m * 2, ph, 0.55, d); c.restore(); y += ph + 74;
  pText(c, d.titulo + (d.anio ? ' ' + d.anio : ''), m, y, 800, 54, W - m * 2, 'd', ink);
  if (d.specs.length) pText(c, d.specs.map(s => s[1]).join('  ·  '), m, y + 46, 500, 28, W - m * 2, 'b', soft);
  y += 92;
  // precio
  const lista = it.precio || 0, especial = k.precio && lista && k.precio < lista;
  pRR(c, m, y, W - m * 2, especial ? 150 : 120, 28); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = line; c.lineWidth = 2; c.stroke();
  if (especial) {
    pText(c, 'PRECIO DE LISTA', m + 36, y + 50, 500, 20, 300, 'm', soft, { ls: 3 });
    c.font = PF(600, 32, 'b'); const lw = c.measureText(fmt(lista)).width; pText(c, fmt(lista), m + 36, y + 102, 600, 32, 300, 'b', soft); c.fillStyle = soft; c.fillRect(m + 36, y + 90, lw, 3);
    pText(c, 'PRECIO ESPECIAL PARA TI', W - m - 36, y + 50, 500, 20, 400, 'm', acc, { align: 'right', ls: 3 });
    pText(c, fmt(k.precio), W - m - 36, y + 114, 800, 62, 520, 'd', ink, { align: 'right' }); y += 150;
  } else { pText(c, it.w === 'prop' && it.op === 'Arriendo' ? 'ARRIENDO MENSUAL' : 'PRECIO', m + 36, y + 70, 500, 22, 300, 'm', soft, { ls: 3 }); pText(c, fmt(k.precio), W - m - 36, y + 84, 800, 62, 560, 'd', ink, { align: 'right' }); y += 120; }
  y += 24;
  // financiamiento
  if (o.cred && k.monto > 0) {
    const fh = 250; pRR(c, m, y, W - m * 2, fh, 28); c.fillStyle = ink; c.fill();
    pText(c, it.w === 'prop' ? 'CRÉDITO HIPOTECARIO (REFERENCIAL)' : 'FINANCIAMIENTO (REFERENCIAL)', m + 36, y + 52, 500, 20, 600, 'm', 'rgba(255,255,255,.55)', { ls: 3 });
    const cols = [['Pie', fmt(k.pie) + (k.piePct ? ` (${k.piePct}%)` : '')], ['A financiar', fmt(k.monto)], ['Plazo', it.w === 'prop' ? `${o.plazo} años` : `${o.plazo} meses`]], cw = (W - m * 2 - 72) / 3;
    cols.forEach(([l, v], i) => { pText(c, l.toUpperCase(), m + 36 + i * cw, y + 100, 500, 18, cw - 16, 'm', 'rgba(255,255,255,.5)', { ls: 2 }); pText(c, v, m + 36 + i * cw, y + 140, 700, 30, cw - 16, 'b', '#fff'); });
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(m + 36, y + 166, W - m * 2 - 72, 2);
    pText(c, `${k.n} cuotas de`, m + 36, y + 222, 600, 30, 300, 'b', 'rgba(255,255,255,.75)');
    pText(c, fmt(k.cuota), W - m - 36, y + 228, 800, 64, 560, 'd', d.accent === '#FFFFFF' ? '#fff' : d.accent, { align: 'right' });
    y += fh + 24;
    pText(c, `Tasa referencial ${String(o.tasa).replace('.', ',')}% ${it.w === 'prop' ? 'anual' : 'mensual'}. Valores sujetos a evaluación y aprobación de la entidad financiera.`, m, y + 8, 500, 20, W - m * 2, 'b', soft); y += 30;
  }
  // incluye
  const inc = (o.incluye || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 4);
  if (inc.length) { y += 22; inc.forEach(t => { c.beginPath(); c.arc(m + 14, y - 9, 13, 0, Math.PI * 2); c.fillStyle = acc; c.fill(); c.strokeStyle = pInk(acc); c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(m + 8, y - 9); c.lineTo(m + 13, y - 4); c.lineTo(m + 21, y - 14); c.stroke(); pText(c, t, m + 42, y, 600, 28, W - m * 2 - 42, 'b', ink); y += 46; }); }
  // vendedor y nota legal al pie
  pSeller(c, d, m, H - 182, W - m * 2, 100, false);
  pText(c, 'Propuesta referencial, no constituye una oferta vinculante. Sujeta a disponibilidad.', W / 2, H - 46, 500, 19, W - m * 2, 'b', soft, { align: 'center' });
  return canvas;
}

/* ---------------- pantalla ---------------- */
function openPropuesta(id) {
  const it = getItem(id); if (!it) return; const pr = pubPrefs(), yo = miEquipo(it.w), hip = it.w === 'prop', arr = hip && it.op === 'Arriendo';
  prop = { id, cliente: '', precio: it.precio || 0, cred: !arr, pie: Math.round((it.precio || 0) * (hip ? 0.2 : 0.3)), plazo: hip ? 20 : 36, tasa: hip ? 4.5 : 1.6, vig: 7,
    incluye: hip ? '' : 'Transferencia incluida\nRevisión técnica al día', vend: pr.vend || (yo && yo.nombre) || ME.nombre || '', fono: pr.fono || (yo && yo.fono) || '', color: pr.color || (PREFS.accent[it.w] || WORLDS[it.w].accent) };
  pushScreen('Propuesta', prHtml(it), { cta: `<button class="btn ghost" data-act="prBajar">${icon('download')}Descargar</button><button class="btn primary" data-act="prEnviar">${icon('share')}Enviar</button>` });
  prDibujar();
}
function prHtml(it) {
  const hip = it.w === 'prop', arr = hip && it.op === 'Arriendo', k = prCalc(it, prop);
  return `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:16px">
    <div class="pubprev"><canvas id="pr-c" width="1080" height="1528" aria-label="Vista previa de la propuesta"></canvas></div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">Cliente y precio</span>
      <label class="field"><span>Nombre del cliente</span><input id="pr-cl" maxlength="40" placeholder="Nombre y apellido" data-change="prDatos" value="${clean(prop.cliente)}"></label>
      <div class="grid2"><label class="field"><span>${arr ? 'Arriendo' : 'Precio ofrecido'}</span><input id="pr-p" data-money inputmode="numeric" value="${fmt(prop.precio)}" data-change="prDatos"></label>
      <label class="field"><span>Vigencia</span><select id="pr-v" data-change="prDatos">${[3, 7, 15, 30].map(n => `<option value="${n}" ${n === prop.vig ? 'selected' : ''}>${n} días</option>`).join('')}</select></label></div>
      ${it.precio && prop.precio < it.precio ? `<p style="font-size:12px;color:var(--fg3);margin-top:-4px">Descuento de ${fmt(it.precio - prop.precio)} sobre el precio publicado.</p>` : ''}</div>
    ${arr ? '' : `<div class="card" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">${hip ? 'Crédito hipotecario' : 'Financiamiento'}</span><button class="toggle ${prop.cred ? 'on' : ''}" data-act="prCred" aria-label="Incluir financiamiento"></button></div>
      ${prop.cred ? `<div class="grid2"><label class="field"><span>Pie</span><input id="pr-pie" data-money inputmode="numeric" value="${fmt(prop.pie)}" data-change="prDatos"></label><label class="field"><span>Tasa ${hip ? 'anual' : 'mensual'} (%)</span><input id="pr-t" inputmode="decimal" value="${String(prop.tasa).replace('.', ',')}" data-change="prDatos"></label></div>
      <div class="optrow">${(hip ? [10, 20, 30] : [20, 30, 40, 50]).map(n => `<button class="opt ${k.piePct === n ? 'on' : ''}" data-act="prPiePct" data-n="${n}">Pie ${n}%</button>`).join('')}</div>
      <div><p class="kicker" style="margin-bottom:8px">Plazo</p><div class="optrow">${PR_PLAZOS[it.w === 'prop' ? 'prop' : 'auto'].map(n => `<button class="opt ${n === prop.plazo ? 'on' : ''}" data-act="prPlazo" data-n="${n}">${n} ${hip ? 'años' : 'meses'}</button>`).join('')}</div></div>
      <div class="prres"><span>${k.n} cuotas de</span><b>${fmt(k.cuota)}</b></div>` : '<p style="font-size:13px;color:var(--fg3)">La propuesta se envía solo con el precio (pago contado).</p>'}</div>`}
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">Incluye (una por línea, opcional)</span>
      <textarea id="pr-inc" maxlength="200" data-change="prDatos" placeholder="${hip ? 'Ej: Estacionamiento y bodega' : 'Ej: Transferencia incluida'}">${clean(prop.incluye)}</textarea>
      <div class="grid2"><label class="field"><span>Tu nombre</span><input id="pr-vn" maxlength="40" value="${clean(prop.vend)}" data-change="prDatos"></label><label class="field"><span>WhatsApp</span><input id="pr-f" maxlength="20" inputmode="tel" placeholder="+56 9 …" value="${clean(prop.fono)}" data-change="prDatos"></label></div></div>
  </div>`;
}
let prTimer = null;
function prDibujar() {
  clearTimeout(prTimer); const it = getItem(prop.id);
  prTimer = setTimeout(async () => { await pubFonts(); const off = document.createElement('canvas'); await prRender(off, it, prop); const cc = $('#pr-c'); if (!cc) return; cc.getContext('2d').drawImage(off, 0, 0); }, 60);
}
// rehace el formulario (sin perder el desplazamiento) y la vista previa
function prRefrescar() { const el = topPush(); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop; pb.innerHTML = prHtml(getItem(prop.id)); pb.scrollTop = sc; prDibujar(); }
ACT.propuesta = d => openPropuesta(d.id);
ACT.prDatos = () => {
  const g = id => ($('#' + id) || { value: '' }).value;
  prop.cliente = g('pr-cl').trim().replace(/[<>"'`]/g, '').slice(0, 40); prop.precio = money(g('pr-p')) || prop.precio; prop.vig = +g('pr-v') || 7;
  if ($('#pr-pie')) prop.pie = Math.min(prop.precio, money(g('pr-pie'))); if ($('#pr-t')) prop.tasa = Math.max(0, Math.min(10 * (getItem(prop.id).w === 'prop' ? 3 : 1), parseFloat(g('pr-t').replace(',', '.')) || 0));
  prop.incluye = g('pr-inc').replace(/[<>"'`]/g, '').slice(0, 200); prop.vend = g('pr-vn').trim().replace(/[<>"'`]/g, '').slice(0, 40); prop.fono = g('pr-f').trim().replace(/[^\d+ ()-]/g, '').slice(0, 20);
  try { localStorage.setItem('gestix_pub', JSON.stringify({ ...pubPrefs(), vend: prop.vend, fono: prop.fono })); } catch (e) { }
  prSync();
};
// al escribir no se rehace el formulario (se perdería el foco): solo el resultado y la vista previa
function prSync() {
  const it = getItem(prop.id), k = prCalc(it, prop), r = $('.prres');
  if (r) r.innerHTML = `<span>${k.n} cuotas de</span><b>${fmt(k.cuota)}</b>`;
  $$('[data-act=prPiePct]').forEach(b => b.classList.toggle('on', +b.dataset.n === k.piePct));
  prDibujar();
}
ACT.prCred = () => { prop.cred = !prop.cred; prRefrescar(); };
ACT.prPiePct = d => { prop.pie = Math.round(prop.precio * +d.n / 100); prRefrescar(); };
ACT.prPlazo = d => { prop.plazo = +d.n; prRefrescar(); };
function prTexto(it) {
  const k = prCalc(it, prop), d = pubDatos(it);
  return [`Hola${prop.cliente ? ' ' + firstName(prop.cliente) : ''}, te envío la propuesta por ${d.titulo}${d.anio ? ' ' + d.anio : ''}:`, `• Precio: ${fmt(k.precio)}`,
    prop.cred && k.monto ? `• Pie ${fmt(k.pie)} y ${k.n} cuotas de ${fmt(k.cuota)} (referencial)` : '', `Válida hasta el ${prFecha(addDays(TODAY, prop.vig))}.`, prop.vend ? `${prop.vend} · ${orgNombre()}` : orgNombre()].filter(Boolean).join('\n');
}
async function prArchivo() {
  const it = getItem(prop.id), c = document.createElement('canvas'); await pubFonts(); await prRender(c, it, prop);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.92));
  // queda registro en el historial del ítem
  it.propuestas = [...(it.propuestas || []), { cliente: prop.cliente || 'Cliente', precio: prop.precio, cuota: prCalc(it, prop).cuota || null, fecha: TODAY, por: ME.nombre }].slice(-20);
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
