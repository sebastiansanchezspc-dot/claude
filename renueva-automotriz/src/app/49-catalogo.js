/* =====================================================================
   CATÁLOGO EN LÍNEA: un enlace con todo el stock disponible (fotos,
   precios, filtros y contacto directo) para compartir con clientes.
   Se actualiza solo: lo vendido o arrendado desaparece.
   ===================================================================== */
const CL_FUERA = ['vendido', 'arrendado', 'agotado'];
const clCfg = w => (PREFS.cat && PREFS.cat[w]) || {};
// qué estados se muestran: reservados (sí por defecto) y en taller o preparación (no por defecto)
const clMuestra = (it, cfg) => !(it.estado === 'reservado' && cfg.res === false) && !(it.estado === 'taller' && cfg.taller !== true);
const clOn = w => !!(clCfg(w).on && clCfg(w).slug);
const clNube = () => !!(window.RV && RV.catalogoNuevo && RV.mode === 'cloud');
const clItems = w => STOCK.filter(it => it.w === w && it.aprob !== 'pendiente' && it.web !== false && !CL_FUERA.includes(it.estado) && clMuestra(it, clCfg(w)) && !(w === 'tienda' && !(it.stock > 0)));
// si quien comparte está en el equipo, las consultas de su enlace le llegan a él
function clLink(w) {
  const yo = miEquipo(w), v = yo && yo.id ? yo.id : isAdmin() ? (clCfg(w).quien === 'adm' ? 'adm' : 'emp') : '';
  const slug = clCfg(w).slug || 'demo';
  return window.RV && RV.catUrl ? RV.catUrl(slug, v) : `${location.origin}/c/${slug}${v ? '?v=' + v : ''}`;
}
const clTexto = w => `¡Hola! Te comparto el catálogo de ${orgNombre()} con ${w === 'prop' ? 'todas las propiedades disponibles' : w === 'auto' ? 'todos los autos disponibles' : 'todos los productos disponibles'}, con fotos y precios: ${clLink(w)}`;

// tarjeta en Stock
function clCard(w) {
  const n = clItems(w).length, on = clOn(w);
  if (!on && !isAdmin()) return '';
  if (on && clCfg(w).tpl && canWrite()) setTimeout(() => clDisenos(w), 2500); // mantiene al día las portadas con diseño
  return `<button class="card pressable catcta" data-act="catLinea"><span class="thumb">${icon('link', 20)}</span><span class="grow"><b>${on ? 'Tu catálogo en línea' : 'Crea tu catálogo en línea'}</b><small>${on ? `${n} ${n === 1 ? WORLDS[w].itemOne.toLowerCase() : WORLDS[w].itemMany.toLowerCase()} publicados · compártelo por WhatsApp` : 'Todo tu stock en un enlace para tus clientes'}</small></span>${on ? `<span class="chip good">Activo</span>` : icon('chevR', 16)}</button>`;
}

function openCatLinea() {
  const w = state.world;
  pushScreen('Catálogo en línea', clHtml(w), { cta: clCta(w) }); clMiniDiseno(); clDisenos(w);
  // el estado real está en la nube (por si se cambió desde otro equipo)
  if (clNube() && isAdmin()) RV.catalogos().then(rs => { const r = rs.find(x => x.mundo === w); const c = clCfg(w); if (r && (r.slug !== c.slug || r.activo !== !!c.on)) { clSet(w, { slug: r.slug, on: r.activo }); clRefrescar(); rerender(); } }).catch(() => { });
}
const clCta = w => clOn(w) ? `<button class="btn ghost" data-act="clCopiar" style="width:auto;padding:0 18px" aria-label="Copiar enlace">${icon('copy')}</button><button class="btn primary" data-act="clCompartir">${icon('share')}Compartir catálogo</button>` : isAdmin() ? `<button class="btn primary" data-act="clActivar">${icon('check')}Activar mi catálogo</button>` : '';
function clHtml(w) {
  const its = clItems(w), on = clOn(w), cfg = (PREFS.cat && PREFS.cat[w]) || {}, sinFoto = its.filter(it => !(it.fotos || []).length).length, yo = miEquipo(w);
  const muestra = its.filter(it => (it.fotos || []).length).slice(0, 4).concat(its.filter(it => !(it.fotos || []).length)).slice(0, 4);
  const cu = cfg.cuota || {};
  return `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:16px">
    <div class="catprev">
      <div class="catprev-top">${orgLogo(30)}<b>${clean(orgNombre())}</b><span class="chip ${on ? 'good' : ''}">${on ? 'En línea' : 'Sin publicar'}</span></div>
      <p class="catprev-h">${its.length} ${its.length === 1 ? WORLDS[w].itemOne.toLowerCase() : WORLDS[w].itemMany.toLowerCase()} ${w === 'prop' ? 'disponibles' : 'disponibles'}</p>
      <div class="catprev-grid">${muestra.map(it => `<div class="catprev-it">${(it.fotos || []).length ? `<img src="${fotoSrc(it.fotos[0])}" alt="">` : `<span class="catprev-nf">${icon('camera', 18)}</span>`}<span class="catprev-p">${it.precio ? fmtM(it.precio) : 'Consultar'}</span><span class="catprev-n">${clean(shortName(it.nombre))}</span></div>`).join('') || `<p style="grid-column:1/-1;color:var(--fg3);font-size:13px;padding:18px 0">Cuando tengas stock disponible aparecerá aquí.</p>`}</div>
    </div>
    <p style="font-size:14px;color:var(--fg2);line-height:1.5">Un enlace con todo tu stock disponible: fotos, precios, filtros y contacto directo por WhatsApp. ${w === 'auto' ? 'Ideal para responder "¿qué autos tienen?" en un segundo.' : w === 'prop' ? 'Ideal para responder "¿qué tienen en arriendo?" en un segundo.' : ''} Se actualiza solo: lo ${w === 'prop' ? 'arrendado o vendido' : 'vendido'} desaparece.</p>
    ${on ? `<div class="card publink"><span class="thumb">${icon('link', 20)}</span><span class="grow" style="min-width:0"><b>Enlace de tu catálogo</b><small class="mono" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${clean(clLink(w).replace(/^https?:\/\//, ''))}</small></span><button class="ibtn" data-act="clAbrir" aria-label="Abrir catálogo">${icon('arrowR')}</button></div>
      <div class="grid2"><button class="btn ghost small" data-act="clAfiche">${icon('download', 15)}Afiche con QR</button><button class="btn ghost small" data-act="clWa">${icon('chat', 15)}Enviar por WhatsApp</button></div>
      ${yo ? `<div class="tip good">${icon('user')}<span>Tu enlace es tuyo: muestra tu nombre y tu WhatsApp en todo el catálogo y las consultas te llegan a ti.</span></div>` : ''}` : !isAdmin() ? `<div class="tip">${icon('lock')}<span>El administrador todavía no activa el catálogo.</span></div>` : ''}
    ${sinFoto ? `<div class="tip">${icon('camera')}<span>${sinFoto} ${sinFoto === 1 ? 'publicación no tiene' : 'publicaciones no tienen'} fotos. Con fotos reciben muchas más consultas.</span></div>` : ''}
    ${isAdmin() ? `<div class="card" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span><b style="font-weight:600">Catálogo activo</b><small style="display:block;font-size:12px;color:var(--fg3);margin-top:2px">Si lo pausas, el enlace deja de mostrar el stock</small></span><button class="toggle ${on ? 'on' : ''}" data-act="clToggleOn" aria-label="Catálogo activo"></button></div>
      ${w === 'auto' ? `<div style="height:1px;background:var(--line)"></div>
      <div style="display:flex;justify-content:space-between;align-items:center"><span><b style="font-weight:600">Mostrar "cuota desde"</b><small style="display:block;font-size:12px;color:var(--fg3);margin-top:2px">Cada auto muestra una cuota referencial con tu financiamiento</small></span><button class="toggle ${cu.on ? 'on' : ''}" data-act="clCuota" aria-label="Mostrar cuota desde"></button></div>
      ${cu.on ? `<div class="grid2"><label class="field"><span>Pie (%)</span><input id="cc-pie" inputmode="numeric" value="${cu.pie ?? 30}" data-change="clCuotaDatos"></label><label class="field"><span>Tasa mensual (%)</span><input id="cc-t" inputmode="decimal" value="${String(cu.tasa ?? 1.6).replace('.', ',')}" data-change="clCuotaDatos"></label></div>
      <div><p class="kicker" style="margin-bottom:8px">Plazo</p><div class="optrow">${[24, 36, 48, 60].map(n => `<button class="opt ${n === (cu.plazo || 48) ? 'on' : ''}" data-act="clPlazo" data-n="${n}">${n} meses</button>`).join('')}</div></div>
      <p style="font-size:12px;color:var(--fg3)">Se muestra como referencial, sujeta a evaluación de la financiera.</p>` : ''}` : ''}
      <div style="height:1px;background:var(--line)"></div>
      <span class="kicker">Contacto cuando compartes tú</span>
      <div class="seg2">${[['emp', 'La empresa'], ['adm', 'Mis datos']].map(([k, t]) => `<button class="opt ${(cfg.quien === 'adm' ? 'adm' : 'emp') === k ? 'on' : ''}" data-act="clQuien" data-k="${k}">${t}</button>`).join('')}</div>
      ${cfg.quien === 'adm' ? `<div class="grid2"><label class="field"><span>Tu nombre</span><input id="cl-an" maxlength="40" value="${clean(cfg.admNombre || ME.nombre || '')}" data-change="clAdm"></label><label class="field"><span>Tu WhatsApp</span><input id="cl-af" maxlength="20" inputmode="tel" placeholder="+56 9 …" value="${clean(cfg.admFono || '')}" data-change="clAdm"></label></div>` : ''}
      <label class="field"><span>WhatsApp de la empresa</span><input id="cl-fono" maxlength="20" inputmode="tel" placeholder="+56 9 …" value="${clean(cfg.fono || '')}" data-change="clFono"></label>
      <p style="font-size:12px;color:var(--fg3);margin-top:-4px">Cada vendedor comparte su propio enlace: ahí aparecen sus datos y las consultas le llegan a él.</p>
      <div style="height:1px;background:var(--line)"></div>
      <span class="kicker">Qué mostrar</span>
      <div style="display:flex;justify-content:space-between;align-items:center"><span><b style="font-weight:600">${w === 'prop' ? 'En promesa o reservadas' : 'Reservados'}</b><small style="display:block;font-size:12px;color:var(--fg3);margin-top:2px">Se ven con la etiqueta "Reservado"</small></span><button class="toggle ${cfg.res !== false ? 'on' : ''}" data-act="clEstado" data-k="res" aria-label="Mostrar reservados"></button></div>
      ${w === 'tienda' ? '' : `<div style="display:flex;justify-content:space-between;align-items:center"><span><b style="font-weight:600">${w === 'prop' ? 'En preparación' : 'En taller o preparación'}</b><small style="display:block;font-size:12px;color:var(--fg3);margin-top:2px">Se ven como "Próximamente" para que te consulten antes</small></span><button class="toggle ${cfg.taller === true ? 'on' : ''}" data-act="clEstado" data-k="taller" aria-label="Mostrar en preparación"></button></div>`}
      <div style="height:1px;background:var(--line)"></div>
      <span class="kicker">Color del catálogo</span>
      <div class="pubcolors">${PUB_COLORS.map(c => `<button data-act="clColor" data-c="${c}" class="${c === (cfg.color || PREFS.accent[w] || WORLDS[w].accent) ? 'on' : ''}" style="--c:${c}" aria-label="Color ${c}"></button>`).join('')}</div>
      <div style="height:1px;background:var(--line)"></div>
      <span class="kicker">Diseño de las fotos</span>
      <p style="font-size:12.5px;color:var(--fg3);margin-top:-6px">La portada de cada ${WORLDS[w].itemOne.toLowerCase()} sale con tu plantilla, tu logo y los datos de la empresa. Las demás fotos se ven normales.</p>
      <div class="optrow">${[['', 'Foto limpia'], ...pubTpls(w)].map(([k, t]) => `<button class="opt ${k === (cfg.tpl || '') ? 'on' : ''}" data-act="clTpl" data-k="${k}">${t}</button>`).join('')}</div>
      ${cfg.tpl ? `<div class="clmini"><canvas id="cl-mini" width="432" height="540" aria-label="Vista previa del diseño"></canvas><div style="display:flex;flex-direction:column;gap:10px;flex:1;min-width:0">
        <p id="cl-prog" style="font-size:12.5px;color:var(--fg3)">${clProgreso(w)}</p>
        <button class="btn ghost small" data-act="clRehacer">${icon('image', 15)}Actualizar diseños</button></div></div>` : ''}
      ${cfg.slug ? `<div style="height:1px;background:var(--line)"></div><button class="btn ghost small" data-act="clNuevoEnlace">${icon('link', 15)}Cambiar el enlace</button><p style="font-size:12px;color:var(--fg3);margin-top:-4px">El enlace y los QR anteriores dejan de funcionar. Úsalo si se compartió donde no querías.</p>` : ''}
    </div>` : ''}
    <p style="font-size:12px;color:var(--fg3);text-align:center">Nunca se muestran costos, la dirección exacta ni datos internos.</p>
  </div>`;
}
function clRefrescar() { const el = topPush(); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop, w = state.world; pb.innerHTML = clHtml(w); pb.scrollTop = sc; const bar = $('.cta-bar', el); if (bar) bar.innerHTML = clCta(w); }
function clSet(w, patch) { PREFS.cat = { ...(PREFS.cat || {}) }; PREFS.cat[w] = { ...(PREFS.cat[w] || {}), ...patch }; saved(); }

ACT.catLinea = () => openCatLinea();
ACT.clActivar = async () => {
  const w = state.world, c = clCfg(w);
  try {
    let slug = c.slug;
    if (clNube()) { if (slug) await RV.catalogoActivo(slug, true); else slug = await RV.catalogoNuevo(w, orgNombre()); }
    else slug = slug || `${mkSlug(orgNombre())}-demo`;
    clSet(w, { on: true, slug }); clRefrescar(); rerender(); toast('Tu catálogo está en línea', 'check');
  } catch (e) { toast(e.message || 'No se pudo activar el catálogo', 'warn'); }
};
ACT.clToggleOn = async () => {
  const w = state.world, c = clCfg(w), on = !c.on;
  if (on && !c.slug) return ACT.clActivar();
  try { if (clNube() && c.slug) await RV.catalogoActivo(c.slug, on); clSet(w, { on }); clRefrescar(); rerender(); toast(on ? 'Catálogo activo' : 'Catálogo pausado: el enlace ya no muestra tu stock', on ? 'check' : 'lock'); }
  catch (e) { toast(e.message || 'No se pudo cambiar el catálogo', 'warn'); }
};
ACT.clNuevoEnlace = async () => {
  if (!confirm('¿Cambiar el enlace del catálogo? El enlace y los QR que ya compartiste dejarán de funcionar.')) return;
  const w = state.world;
  try { const slug = clNube() ? await RV.catalogoNuevo(w, orgNombre()) : `${mkSlug(orgNombre())}-${Math.random().toString(36).slice(2, 6)}`; clSet(w, { on: true, slug }); clRefrescar(); toast('Enlace nuevo listo', 'check'); }
  catch (e) { toast(e.message || 'No se pudo cambiar el enlace', 'warn'); }
};
ACT.clCuota = () => { const w = state.world, cu = (PREFS.cat[w] || {}).cuota || {}; clSet(w, { cuota: { pie: 30, tasa: 1.6, plazo: 48, ...cu, on: !cu.on } }); clRefrescar(); };
ACT.clCuotaDatos = () => {
  const w = state.world, cu = (PREFS.cat[w] || {}).cuota || {};
  const pie = Math.max(0, Math.min(90, parseInt(($('#cc-pie') || {}).value) || 0)), tasa = Math.max(0, Math.min(10, parseFloat(String(($('#cc-t') || {}).value || '').replace(',', '.')) || 0));
  clSet(w, { cuota: { ...cu, pie, tasa } });
};
ACT.clPlazo = d => { const w = state.world, cu = (PREFS.cat[w] || {}).cuota || {}; clSet(w, { cuota: { ...cu, plazo: +d.n } }); clRefrescar(); };
// la cuota solo se publica si está activada
ACT.clAbrir = () => window.open(clLink(state.world), '_blank', 'noopener');
ACT.clCopiar = async () => { try { await navigator.clipboard.writeText(clLink(state.world)); toast('Enlace copiado', 'check'); } catch (e) { toast('No se pudo copiar el enlace', 'warn'); } };
ACT.clCompartir = async () => {
  const w = state.world;
  if (navigator.share) { try { await navigator.share({ title: `Catálogo · ${orgNombre()}`, text: clTexto(w).replace(/: https?:\/\/\S+$/, ':'), url: clLink(w) }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  ACT.clCopiar();
};
ACT.clWa = () => window.open('https://wa.me/?text=' + encodeURIComponent(clTexto(state.world)), '_blank', 'noopener');

// afiche A4 con código QR para la vitrina o el local
async function clAficheRender(c, w) {
  const W = 1240, H = 1754, g = c.getContext('2d'); c.width = W; c.height = H; await pubFonts();
  const logo = await pubImg(PREFS.logo ? fotoSrc(PREFS.logo) : ''), acc = PREFS.accent[w] || WORLDS[w].accent, d = { logo, org: orgNombre(), accent: acc };
  const ink = '#15171A', m = 96;
  g.fillStyle = ink; g.fillRect(0, 0, W, H);
  // halo de color
  const gr = g.createRadialGradient(W * .85, 120, 40, W * .85, 120, 900); gr.addColorStop(0, acc + '55'); gr.addColorStop(1, 'transparent'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  pLogo(g, d, m, m, 120);
  pText(g, orgNombre(), m + 150, m + 76, 700, 46, W - m * 2 - 150, 'd', '#fff');
  const t1 = w === 'prop' ? 'Todas nuestras' : w === 'auto' ? 'Todos nuestros' : 'Todo nuestro', t2 = w === 'prop' ? 'propiedades' : w === 'auto' ? 'autos' : 'catálogo';
  pText(g, t1, m, 420, 800, 118, W - m * 2, 'd', '#fff');
  pText(g, t2, m, 540, 800, 118, W - m * 2, 'd', acc);
  pText(g, 'en tu celular.', m, 660, 800, 118, W - m * 2, 'd', '#fff');
  // código QR
  const qs = 560, qx = (W - qs - 80) / 2, qy = 780;
  pRR(g, qx, qy, qs + 80, qs + 80, 48); g.fillStyle = '#fff'; g.fill();
  pQR(g, clLink(w), qx + 40, qy + 40, qs, ink);
  pText(g, 'Escanea con la cámara', W / 2, qy + qs + 160, 700, 44, W - m * 2, 'b', '#fff', { align: 'center' });
  pText(g, 'Fotos, precios y contacto directo por WhatsApp', W / 2, qy + qs + 220, 500, 32, W - m * 2, 'b', 'rgba(255,255,255,.62)', { align: 'center' });
  pText(g, 'CATÁLOGO EN LÍNEA · SIEMPRE ACTUALIZADO', W / 2, H - 70, 500, 22, W - m * 2, 'm', 'rgba(255,255,255,.45)', { align: 'center', ls: 4 });
  return c;
}
ACT.clAfiche = async () => {
  try {
    const c = await clAficheRender(document.createElement('canvas'), state.world);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/png')), f = new File([blob], `catalogo-${mkSlug(orgNombre())}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: 'Afiche del catálogo' }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    pubDescargar(f); toast('Afiche descargado: imprímelo en tamaño carta u oficio', 'download');
  } catch (e) { console.error(e); toast('No se pudo crear el afiche', 'warn'); }
};
ADMIN_ACTS.add('clActivar'); ADMIN_ACTS.add('clNuevoEnlace'); ADMIN_ACTS.add('clToggleOn'); ADMIN_ACTS.add('clCuota'); ADMIN_ACTS.add('clCuotaDatos'); ADMIN_ACTS.add('clPlazo');

// cada ítem se puede sacar del catálogo (por ejemplo, un auto en consignación que el dueño no quiere publicar)
ACT.togWeb = d => { const it = getItem(d.id); if (!it) return; it.web = it.web === false ? true : false; saved(); refreshItem(it.id); toast(it.web === false ? 'Ya no aparece en tu catálogo' : 'Visible en tu catálogo', it.web === false ? 'lock' : 'check'); };
WRITE_ACTS.add('togWeb');

/* ---------------- opciones del catálogo: estados, color y diseño ---------------- */
ACT.clEstado = d => { const w = state.world, cfg = clCfg(w); clSet(w, { [d.k]: d.k === 'res' ? cfg.res === false : cfg.taller !== true }); clRefrescar(); clMiniDiseno(); clDisenos(w); };
ACT.clColor = d => { const w = state.world; clSet(w, { color: d.c }); $$('[data-act=clColor]').forEach(b => b.classList.toggle('on', b.dataset.c === d.c)); clMiniDiseno(); clDisenos(w); };
ACT.clTpl = d => { const w = state.world; clSet(w, { tpl: d.k }); clRefrescar(); clMiniDiseno(); clDisenos(w); };
ACT.clFono = (d, el) => { const w = state.world; clSet(w, { fono: el.value.trim().replace(/[^\d+ ()-]/g, '').slice(0, 20) }); clMiniDiseno(); clDisenos(w); };
ACT.clRehacer = () => { const w = state.world; STOCK.forEach(it => { if (it.w === w) delete it.catSig; }); clDisenos(w); };
['clEstado', 'clColor', 'clTpl', 'clFono', 'clRehacer'].forEach(a => ADMIN_ACTS.add(a));

// opciones con que se dibuja la portada de un ítem en el catálogo (siempre con los datos de la empresa)
const clOpts = (it, w) => { const cfg = clCfg(w); return { fmt: 'post', tpl: cfg.tpl, foto: 0, precio: !!it.precio, tag: it.estado === 'reservado' ? 'Reservado' : it.estado === 'taller' ? 'Próximamente' : PUB_TAGS[w][0], color: cfg.color || PREFS.accent[w] || WORLDS[w].accent, vend: orgNombre(), fono: cfg.fono || '', empresa: true }; };
// firma: si cambia algo que se ve en la imagen, se vuelve a generar
const clFirma = (it, w) => { const s = JSON.stringify([clOpts(it, w), PREFS.logo || '', (it.fotos || [])[0] || '', it.precio, it.nombre, it.estado, it.specs, it.op]); let h = 0; for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) | 0; return (h >>> 0).toString(36); };
const clPend = w => clItems(w).filter(it => (it.fotos || []).length && !(it.catImg && it.catSig === clFirma(it, w)));
function clProgreso(w) { const con = clItems(w).filter(it => (it.fotos || []).length).length, p = clPend(w).length; return !con ? 'Agrega fotos a tu stock para generar los diseños.' : p ? `Preparando diseños: ${con - p} de ${con} listos…` : `Los ${con} diseños están listos y se actualizan solos cuando cambias precio o fotos.`; }
async function clMiniDiseno() {
  const w = state.world, cfg = clCfg(w), cv = $('#cl-mini'); if (!cv || !cfg.tpl) return;
  const it = clItems(w).find(x => (x.fotos || []).length) || clItems(w)[0]; if (!it) return;
  await pubFonts(); const off = document.createElement('canvas'); await pubRender(off, it, clOpts(it, w));
  const c2 = $('#cl-mini'); if (c2) c2.getContext('2d').drawImage(off, 0, 0, c2.width, c2.height);
}
// genera (una por una, en segundo plano) las portadas que faltan o quedaron viejas
let clGen = false;
async function clDisenos(w) {
  if (clGen || !canWrite() || !clCfg(w).tpl || !clOn(w)) return; clGen = true;
  try {
    await pubFonts();
    for (const it of clPend(w)) {
      if (!clCfg(w).tpl) break;
      const firma = clFirma(it, w), c = document.createElement('canvas'); await pubRender(c, it, clOpts(it, w));
      it.catImg = await storeImage(c.toDataURL('image/jpeg', 0.86)); it.catSig = firma; saved();
      const pg = $('#cl-prog'); if (pg) pg.textContent = clProgreso(w);
    }
  } catch (e) { console.error(e); } finally { clGen = false; const pg = $('#cl-prog'); if (pg) pg.textContent = clProgreso(w); }
}

ACT.clQuien = d => { const w = state.world; clSet(w, { quien: d.k, ...(d.k === 'adm' && !clCfg(w).admNombre ? { admNombre: ME.nombre } : {}) }); clRefrescar(); };
ACT.clAdm = () => { const w = state.world; clSet(w, { admNombre: (($('#cl-an') || {}).value || '').trim().replace(/[<>"'`]/g, '').slice(0, 40), admFono: (($('#cl-af') || {}).value || '').trim().replace(/[^\d+ ()-]/g, '').slice(0, 20) }); };
['clQuien', 'clAdm'].forEach(a => ADMIN_ACTS.add(a));
