/* =====================================================================
   ACTA DE ENTREGA (arriendos y ventas de propiedades): arrendatario,
   medidores, llaves, estado de cada recinto con fotos y firmas en pantalla.
   Se arma un PDF en el celular, queda guardado en la propiedad y se comparte.
   ===================================================================== */
let acta = null;
const AC_ESTADOS = ['Bueno', 'Regular', 'Malo'];
function acRecintos(it) {
  const s = it.specs || {}, n = (v, max) => Math.max(1, Math.min(max, parseInt(v) || 1)), casa = /casa/i.test(s.tipo || '');
  const r = ['Living-comedor', 'Cocina'];
  for (let k = 1; k <= n(s.dorm, 6); k++) r.push(n(s.dorm, 6) > 1 ? `Dormitorio ${k}` : 'Dormitorio');
  for (let k = 1; k <= n(s.banos, 4); k++) r.push(n(s.banos, 4) > 1 ? `Baño ${k}` : 'Baño');
  r.push('Logia', casa ? 'Patio / jardín' : 'Terraza');
  return r.map(nombre => ({ nombre, estado: 'Bueno', obs: '', fotos: [] }));
}
// tarjeta en la ficha de la propiedad: actas guardadas y botón para crear una
function actasCard(it) {
  const a = (it.actas || []).slice().reverse();
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">Actas de entrega</span>${a.length ? `<span class="chip">${a.length}</span>` : ''}</div>
    ${a.length ? `<div style="margin-top:6px">${a.slice(0, 4).map(x => `<a class="acrow" href="${fotoSrc(x.pdf)}" target="_blank" rel="noopener"${/^data:/.test(fotoSrc(x.pdf)) ? ` download="acta-${mkSlug(x.persona)}.pdf"` : ''}><span class="thumb">${icon('doc', 18)}</span><span class="grow"><b>${x.tipo} · ${clean(x.persona)}</b><small>${fechaCL(x.fecha)} · ${clean(x.por)}</small></span>${icon('arrowR', 15)}</a>`).join('')}</div>`
      : `<p style="font-size:13px;color:var(--fg2);margin-top:10px;line-height:1.45">Registra el estado de cada recinto con fotos, los medidores y las llaves, y que ambos firmen en el celular. Queda un PDF guardado aquí.</p>`}
    <button class="btn ghost small" data-act="nuevaActa" data-id="${it.id}" style="width:100%;margin-top:12px">${icon('plus', 15)}Nueva acta de entrega</button></div>`;
}
function openActa(id) {
  const it = getItem(id); if (!it) return;
  acta = { id, tipo: 'Entrega', fecha: TODAY, persona: '', rut: '', fono: '', luz: '', agua: '', gas: '', llaves: '', controles: '', obs: '', recintos: acRecintos(it), firmas: { cliente: null, agente: null } };
  const el = pushScreen('Acta de entrega', acHtml(it), { cta: `<button class="btn primary" data-act="acGenerar" style="width:100%">${icon('doc')}Generar acta en PDF</button>`, onReady: () => moveSeg('seg-ac') });
  el.dataset.acta = id; acFirmas();
}
function acHtml(it) {
  const arr = it.op === 'Arriendo', quien = arr ? 'Arrendatario' : 'Comprador';
  return `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:14px">
    <div class="tip">${icon('home')}<span><b>${clean(it.nombre)}</b>${it.specs && it.specs.direccion && it.specs.direccion !== '—' ? ' · ' + clean(it.specs.direccion) : ''}</span></div>
    ${seg('seg-ac', [['Entrega', 'Entrega'], ['Devolución', 'Devolución']], acta.tipo, 'acTipo')}
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">${quien}</span>
      <label class="field"><span>Nombre completo</span><input id="ac-p" maxlength="60" data-change="acDatos" value="${clean(acta.persona)}" autocomplete="off"></label>
      <div class="grid2"><label class="field"><span>RUT</span><input id="ac-r" maxlength="14" data-change="acDatos" placeholder="12.345.678-9" value="${clean(acta.rut)}"></label><label class="field"><span>Teléfono</span><input id="ac-f" maxlength="20" inputmode="tel" data-change="acDatos" value="${clean(acta.fono)}"></label></div>
      <label class="field"><span>Fecha</span><input id="ac-d" type="date" data-change="acDatos" value="${acta.fecha}"></label></div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">Medidores y llaves</span>
      <div class="grid2"><label class="field"><span>Luz (kWh)</span><input id="ac-luz" inputmode="decimal" data-change="acDatos" value="${clean(acta.luz)}"></label><label class="field"><span>Agua (m³)</span><input id="ac-agua" inputmode="decimal" data-change="acDatos" value="${clean(acta.agua)}"></label></div>
      <div class="grid2"><label class="field"><span>Gas (m³)</span><input id="ac-gas" inputmode="decimal" data-change="acDatos" value="${clean(acta.gas)}"></label><label class="field"><span>Llaves</span><input id="ac-ll" inputmode="numeric" data-change="acDatos" placeholder="Ej: 3" value="${clean(acta.llaves)}"></label></div>
      <label class="field"><span>Controles, tarjetas u otros</span><input id="ac-ct" maxlength="80" data-change="acDatos" placeholder="Ej: 1 control portón, 2 tarjetas" value="${clean(acta.controles)}"></label></div>
    <div><p class="kicker" style="margin-bottom:10px">Estado de cada recinto</p><div style="display:flex;flex-direction:column;gap:10px">${acta.recintos.map((r, i) => acRecintoHtml(r, i)).join('')}</div>
      <button class="btn ghost small" data-act="acAgregar" style="width:100%;margin-top:10px">${icon('plus', 15)}Agregar recinto</button></div>
    <div class="card"><label class="field"><span>Observaciones generales</span><textarea id="ac-o" maxlength="600" data-change="acDatos" placeholder="Ej: pintura nueva en living, cortinas incluidas">${clean(acta.obs)}</textarea></label></div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">Firmas</span>
      ${[['cliente', quien + (acta.persona ? ' · ' + clean(acta.persona) : '')], ['agente', 'Corredor · ' + clean(ME.nombre)]].map(([k, t]) => `<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:13px;color:var(--fg2)">${t}</span><button class="chip" style="border:0" data-act="acBorrarFirma" data-k="${k}">Borrar</button></div><canvas class="acfirma" data-k="${k}" width="900" height="300" aria-label="Firma de ${t}"></canvas></div>`).join('')}
      <p style="font-size:12px;color:var(--fg3)">Firma con el dedo dentro del recuadro.</p></div>
  </div>`;
}
function acRecintoHtml(r, i) {
  return `<div class="card acrec" data-i="${i}"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><input class="acnom" data-i="${i}" data-change="acRec" value="${clean(r.nombre)}" maxlength="30" aria-label="Nombre del recinto"><button class="ibtn" data-act="acQuitar" data-i="${i}" aria-label="Quitar recinto">${icon('close', 15)}</button></div>
    <div class="steps" style="margin-top:10px">${AC_ESTADOS.map(e => `<button class="${r.estado === e ? 'on' : ''}" data-act="acEstado" data-i="${i}" data-e="${e}">${e}</button>`).join('')}</div>
    <input class="acobs" data-i="${i}" data-change="acRec" placeholder="Observación (opcional)" value="${clean(r.obs)}" maxlength="160">
    <div class="nfotos" style="margin-top:10px">${r.fotos.map((f, k) => `<div class="nshot"><img src="${f}" alt=""><button type="button" data-act="acFotoRm" data-i="${i}" data-k="${k}" aria-label="Quitar foto">${icon('close', 12)}</button></div>`).join('')}<label class="addshot mini">${icon('camera')}<span>Foto</span><input type="file" accept="image/*" multiple hidden data-change="acFotos" data-i="${i}"></label></div></div>`;
}
// firmas: se dibujan con el dedo o el mouse
function acFirmas() {
  $$('.acfirma').forEach(cv => {
    const g = cv.getContext('2d'), k = cv.dataset.k; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#111';
    if (acta.firmas[k]) { const im = new Image(); im.onload = () => g.drawImage(im, 0, 0); im.src = acta.firmas[k]; }
    let on = false; const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', e => { on = true; cv.setPointerCapture(e.pointerId); const [x, y] = pt(e); g.beginPath(); g.moveTo(x, y); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!on) return; const [x, y] = pt(e); g.lineTo(x, y); g.stroke(); e.preventDefault(); });
    const fin = () => { if (!on) return; on = false; acta.firmas[k] = cv.toDataURL('image/png'); };
    cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
  });
}
// guarda lo escrito antes de rehacer la pantalla (al agregar o quitar recintos)
function acLeer() {
  const g = id => ($('#' + id) || { value: '' }).value.trim().replace(/[<>"'`]/g, '');
  Object.assign(acta, { persona: g('ac-p').slice(0, 60), rut: g('ac-r').slice(0, 14), fono: g('ac-f').slice(0, 20), fecha: g('ac-d') || TODAY, luz: g('ac-luz').slice(0, 12), agua: g('ac-agua').slice(0, 12), gas: g('ac-gas').slice(0, 12), llaves: g('ac-ll').slice(0, 6), controles: g('ac-ct').slice(0, 80), obs: g('ac-o').slice(0, 600) });
  $$('.acnom').forEach(i => { acta.recintos[+i.dataset.i].nombre = i.value.trim().replace(/[<>"'`]/g, '').slice(0, 30) || 'Recinto'; });
  $$('.acobs').forEach(i => { acta.recintos[+i.dataset.i].obs = i.value.trim().replace(/[<>"'`]/g, '').slice(0, 160); });
}
function acRehacer() { acLeer(); const el = topPush(); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop; pb.innerHTML = acHtml(getItem(acta.id)); pb.scrollTop = sc; moveSeg('seg-ac'); acFirmas(); }
ACT.nuevaActa = d => openActa(d.id);
ACT.acDatos = () => acLeer();
ACT.acRec = () => acLeer();
ACT.acTipo = d => { acta.tipo = d.k; $$('#seg-ac button').forEach(b => b.classList.toggle('active', b.dataset.k === d.k)); moveSeg('seg-ac'); };
ACT.acEstado = d => { acta.recintos[+d.i].estado = d.e; $$(`[data-act=acEstado][data-i="${d.i}"]`).forEach(b => b.classList.toggle('on', b.dataset.e === d.e)); };
ACT.acAgregar = () => { acLeer(); acta.recintos.push({ nombre: 'Recinto', estado: 'Bueno', obs: '', fotos: [] }); acRehacer(); };
ACT.acQuitar = d => { acLeer(); acta.recintos.splice(+d.i, 1); acRehacer(); };
ACT.acFotos = async (d, el) => {
  const r = acta.recintos[+d.i], files = [...el.files].slice(0, 6 - r.fotos.length); el.value = ''; let malas = 0;
  for (const f of files) { try { r.fotos.push(await readImage(f, 1000, 0.72)); } catch (e) { malas++; } }
  if (malas) toast('Una foto no se pudo leer. Prueba con otra.', 'warn');
  acRehacer();
};
ACT.acFotoRm = d => { acLeer(); acta.recintos[+d.i].fotos.splice(+d.k, 1); acRehacer(); };
ACT.acBorrarFirma = d => { acta.firmas[d.k] = null; const cv = $(`.acfirma[data-k="${d.k}"]`); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); };

/* ---------------- PDF ---------------- */
// imagen (logo, aunque sea SVG) a PNG para el PDF
async function acPng(src, max = 300) {
  const im = await pubImg(src); if (!im) return null;
  const k = Math.min(1, max / Math.max(im.width || max, im.height || max)), c = document.createElement('canvas');
  c.width = Math.round((im.width || max) * k); c.height = Math.round((im.height || max) * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  return { d: c.toDataURL('image/png'), w: c.width, h: c.height };
}
// recorta la foto para llenar el recuadro del PDF sin deformarla
async function acCover(src, w = 855, h = 555) {
  const im = await pubImg(src); if (!im) return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const k = Math.max(w / im.width, h / im.height), sw = w / k, sh = h / k;
  c.getContext('2d').drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.8);
}
async function acPdf(it) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }), W = 210, H = 297, m = 16, ink = [21, 23, 26], soft = [110, 106, 98], line = [225, 221, 213];
  const arr = it.op === 'Arriendo', quien = arr ? 'Arrendatario' : 'Comprador', s = it.specs || {};
  let y = 0;
  const color = c => doc.setTextColor(...c), font = (st, sz) => { doc.setFont('helvetica', st); doc.setFontSize(sz); };
  const salto = h => { if (y + h > H - 18) { doc.addPage(); y = 18; } };
  const texto = (t, x, yy, opt) => doc.text(String(t), x, yy, opt);
  // cabecera
  doc.setFillColor(...ink); doc.rect(0, 0, W, 34, 'F');
  const lg = PREFS.logo ? await acPng(fotoSrc(PREFS.logo)) : null;
  if (lg) { doc.setFillColor(255, 255, 255); doc.roundedRect(m, 7, 20, 20, 3, 3, 'F'); const k = Math.min(18 / lg.w, 18 / lg.h); doc.addImage(lg.d, 'PNG', m + 1 + (18 - lg.w * k) / 2, 8 + (18 - lg.h * k) / 2, lg.w * k, lg.h * k, 'logo', 'FAST'); }
  color([255, 255, 255]); font('bold', 14); texto(orgNombre(), m + (lg ? 25 : 0), 16);
  font('normal', 8); color([190, 190, 190]); texto(`ACTA DE ${acta.tipo.toUpperCase()} DE ${arr ? 'INMUEBLE ARRENDADO' : 'INMUEBLE'}`, m + (lg ? 25 : 0), 23);
  color([255, 255, 255]); font('bold', 10); texto(fechaCL(acta.fecha), W - m, 16, { align: 'right' });
  y = 46; color(ink); font('bold', 15); texto(it.nombre, m, y);
  font('normal', 9.5); color(soft); y += 6; texto([s.direccion, s.comuna].filter(x => x && x !== '—').join(', ') || ' ', m, y);
  // partes
  y += 10; doc.setDrawColor(...line); doc.line(m, y, W - m, y); y += 7;
  const col = (t, v, x) => { font('normal', 7.5); color(soft); texto(t.toUpperCase(), x, y); font('bold', 10); color(ink); texto(v || '—', x, y + 5.5); };
  col(quien, acta.persona, m); col('RUT', acta.rut, m + 70); col('Teléfono', acta.fono, m + 115); y += 14;
  col('Propietario', it.dueno && it.dueno !== '—' ? it.dueno : '', m); col('Corredor', ME.nombre, m + 70); col('Empresa', orgNombre(), m + 115); y += 14;
  // medidores y llaves
  doc.line(m, y, W - m, y); y += 7; font('bold', 11); color(ink); texto('Medidores y llaves', m, y); y += 7;
  [['Luz', acta.luz && acta.luz + ' kWh'], ['Agua', acta.agua && acta.agua + ' m³'], ['Gas', acta.gas && acta.gas + ' m³'], ['Llaves', acta.llaves]].forEach(([t, v], i) => col(t, v, m + i * 45));
  y += 13; if (acta.controles) { col('Controles y otros', acta.controles, m); y += 13; }
  // recintos con fotos
  doc.line(m, y, W - m, y); y += 7; font('bold', 11); color(ink); texto('Estado de los recintos', m, y); y += 4;
  for (const r of acta.recintos) {
    const filas = Math.ceil(r.fotos.length / 3), alto = 12 + (r.obs ? 5 : 0) + filas * 40;
    salto(Math.min(alto, 60)); y += 6;
    font('bold', 10.5); color(ink); texto(r.nombre, m, y);
    const ec = r.estado === 'Bueno' ? [31, 111, 92] : r.estado === 'Regular' ? [176, 112, 0] : [179, 38, 30];
    doc.setFillColor(...ec); doc.roundedRect(W - m - 22, y - 4.2, 22, 6, 3, 3, 'F'); font('bold', 8); color([255, 255, 255]); texto(r.estado.toUpperCase(), W - m - 11, y, { align: 'center' });
    if (r.obs) { y += 5.5; font('normal', 9); color(soft); texto(doc.splitTextToSize(r.obs, W - m * 2)[0], m, y); }
    y += 3;
    for (let k = 0; k < r.fotos.length; k += 3) {
      salto(40); const fs = await Promise.all(r.fotos.slice(k, k + 3).map(f => acCover(f)));
      fs.forEach((f, j) => { if (f) try { doc.addImage(f, 'JPEG', m + j * 60, y, 57, 37, undefined, 'FAST'); } catch (e) { } }); y += 40;
    }
    y += 2; doc.setDrawColor(...line); doc.line(m, y, W - m, y);
  }
  if (acta.obs) { salto(24); y += 8; font('bold', 11); color(ink); texto('Observaciones', m, y); font('normal', 9.5); color(ink); const ls = doc.splitTextToSize(acta.obs, W - m * 2); y += 6; ls.forEach(l => { salto(6); texto(l, m, y); y += 5; }); }
  // firmas
  salto(52); y += 10; font('normal', 9); color(soft);
  texto(`Las partes declaran recibir y entregar el inmueble en el estado descrito, con fecha ${fechaCL(acta.fecha)}.`, m, y); y += 8;
  [['cliente', quien, acta.persona], ['agente', 'Corredor', ME.nombre]].forEach(([k, t, n], i) => {
    const x = m + i * 92; if (acta.firmas[k]) doc.addImage(acta.firmas[k], 'PNG', x, y, 75, 25, 'firma-' + k, 'FAST');
    doc.setDrawColor(...ink); doc.line(x, y + 27, x + 75, y + 27); font('bold', 9.5); color(ink); texto(n || '—', x, y + 32); font('normal', 8); color(soft); texto(t, x, y + 36.5);
  });
  // pie de página
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) { doc.setPage(p); font('normal', 7.5); color(soft); texto(`${orgNombre()} · Acta de ${acta.tipo.toLowerCase()} · ${it.nombre}`, m, H - 8); texto(`Página ${p} de ${n}`, W - m, H - 8, { align: 'right' }); }
  return doc;
}
ACT.acGenerar = async () => {
  acLeer(); const it = getItem(acta.id);
  if (!acta.persona) { toast(`Falta el nombre del ${it.op === 'Arriendo' ? 'arrendatario' : 'comprador'}`, 'warn'); return; }
  if (!acta.firmas.cliente) { toast('Falta la firma del ' + (it.op === 'Arriendo' ? 'arrendatario' : 'comprador'), 'warn'); return; }
  toast('Generando el acta…', 'doc');
  try {
    const doc = await acPdf(it), nombre = `acta-${acta.tipo === 'Entrega' ? 'entrega' : 'devolucion'}-${mkSlug(acta.persona)}-${acta.fecha}.pdf`, blob = doc.output('blob');
    const path = await storeImage(doc.output('datauristring').replace(/^data:application\/pdf;[^,]*,/, 'data:application/pdf;base64,'));
    it.actas = [...(it.actas || []), { tipo: acta.tipo, persona: acta.persona, fecha: acta.fecha, pdf: path, por: ME.nombre }]; saved();
    const f = new File([blob], nombre, { type: 'application/pdf' });
    popScreen(); refreshItem(it.id); toast('Acta guardada en la propiedad', 'check');
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: nombre }); } catch (e) { } } else pubDescargar(f);
  } catch (e) { console.error(e); toast('No se pudo generar el acta. Revisa tu conexión e inténtalo de nuevo.', 'warn'); }
};
WRITE_ACTS.add('acGenerar');
