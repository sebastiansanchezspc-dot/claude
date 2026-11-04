/* =====================================================================
   PUBLICAR: arma imágenes para redes (post 4:5 e historia 9:16) con las
   fotos del auto, el logo de la empresa y los datos del vendedor.
   Todo se dibuja en el celular (canvas): gratis y sin servicios externos.
   ===================================================================== */
ICONS.download = '<path d="M12 4v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19.5h14"/>';
ICONS.share = '<path d="M12 15V4"/><path d="M8 7.5 12 3.5l4 4"/><path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1"/>';
ICONS.image = '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>';

const PUB_FMT = { post: [1080, 1350], story: [1080, 1920] };
const PUB_TPL = [['vitrina', 'Vitrina'], ['ficha', 'Ficha'], ['oferta', 'Oferta'], ['galeria', 'Galería'], ['premium', 'Premium']];
const PUB_COLORS = ['#C8F03C', '#FF6B35', '#2F80ED', '#E63946', '#F2C14E', '#FFFFFF'];
const PUB_TAGS = {
  auto: ['Disponible', 'Recién llegado', 'Oferta', 'Financiamiento', 'Único dueño', 'Precio conversable'],
  prop: ['Disponible', 'Nueva', 'Oportunidad', 'Exclusiva', 'Precio conversable'],
  tienda: ['Nuevo', 'Oferta', 'Últimas unidades', 'Envíos'],
};
let pub = null;
const pubImgs = new Map();

/* ---------------- carga de imágenes (sin "ensuciar" el canvas) ---------------- */
// las fotos de la nube se bajan como archivo propio: así el canvas se puede exportar
function pubImg(src) {
  if (!src) return Promise.resolve(null);
  if (pubImgs.has(src)) return pubImgs.get(src);
  const pr = (async () => {
    let u = src;
    if (/^https?:/.test(src) && !src.startsWith(location.origin)) { const r = await fetch(src); if (!r.ok) throw new Error('foto'); u = URL.createObjectURL(await r.blob()); }
    return await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = u; });
  })().catch(() => null);
  pubImgs.set(src, pr); return pr;
}
const pubFonts = () => Promise.all(['800 100px "Bricolage Grotesque"', '700 100px "Bricolage Grotesque"', '700 40px "Instrument Sans"', '600 40px "Instrument Sans"', '500 40px "Instrument Sans"', '500 30px "DM Mono"']
  .map(f => document.fonts && document.fonts.load ? document.fonts.load(f).catch(() => null) : null));

/* ---------------- ayudas de dibujo ---------------- */
const PF = (w, s, fam) => `${w} ${Math.round(s)}px ${fam === 'm' ? '"DM Mono", ui-monospace, monospace' : fam === 'b' ? '"Instrument Sans", system-ui, sans-serif' : '"Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif'}`;
function pRR(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
// achica la letra hasta que el texto quepa en maxW (en hasta "lineas" líneas); devuelve líneas y tamaño
function pFit(c, text, w, size, maxW, fam, lineas = 1, min = size * 0.45) {
  for (let s = size; s >= min; s -= 2) {
    c.font = PF(w, s, fam);
    if (lineas === 1) { if (c.measureText(text).width <= maxW) return { lines: [text], s }; continue; }
    const words = String(text).split(' '), out = []; let cur = '';
    for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (c.measureText(t).width <= maxW) cur = t; else { if (cur) out.push(cur); cur = wd; } }
    if (cur) out.push(cur);
    if (out.length <= lineas && out.every(l => c.measureText(l).width <= maxW)) return { lines: out, s };
  }
  c.font = PF(w, min, fam); return { lines: [text], s: min };
}
function pText(c, text, x, y, w, size, maxW, fam, color, opt = {}) {
  const f = pFit(c, text, w, size, maxW, fam, opt.lines || 1, opt.min); c.fillStyle = color; c.textAlign = opt.align || 'left'; c.textBaseline = 'alphabetic';
  if (opt.ls) c.letterSpacing = opt.ls + 'px';
  f.lines.forEach((l, i) => c.fillText(l, x, y + i * f.s * (opt.lh || 1.02)));
  if (opt.ls) c.letterSpacing = '0px';
  return f.s * (opt.lh || 1.02) * f.lines.length;
}
// foto que cubre el área (recorte centrado, un poco hacia abajo, donde suele estar el auto)
function pCover(c, img, x, y, w, h, fy = 0.55, d) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (img) {
    const k = Math.max(w / img.width, h / img.height), iw = img.width * k, ih = img.height * k;
    c.drawImage(img, x + (w - iw) / 2, y + (h - ih) * fy, iw, ih);
  } else {
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#2A2F37'); g.addColorStop(1, '#121417'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.globalAlpha = .5; pText(c, d && d.w === 'prop' ? 'Agrega fotos de la propiedad' : 'Agrega fotos del ' + (d && d.w === 'tienda' ? 'producto' : 'auto'), x + w / 2, y + h / 2, 600, 40, w * .8, 'b', '#fff', { align: 'center' }); c.globalAlpha = 1;
  }
  c.restore();
}
const pInk = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#101114' : '#FFFFFF'; };
const pAlpha = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
const pIni = s => String(s || '').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'G';
function pWa(c, x, y, s, color) {
  c.save(); c.translate(x, y); c.scale(s / 24, s / 24); c.strokeStyle = color; c.lineWidth = 1.9; c.lineJoin = 'round'; c.lineCap = 'round';
  (ICONS.whatsapp.match(/d="([^"]+)"/g) || []).forEach(m => c.stroke(new Path2D(m.slice(3, -1)))); c.restore();
}
// logo de la empresa (o sus iniciales) dentro de un cuadro redondeado
function pLogo(c, d, x, y, s) {
  c.save(); pRR(c, x, y, s, s, s * .24); c.clip();
  if (d.logo) { c.fillStyle = '#fff'; c.fillRect(x, y, s, s); const k = Math.min(s / d.logo.width, s / d.logo.height); c.drawImage(d.logo, x + (s - d.logo.width * k) / 2, y + (s - d.logo.height * k) / 2, d.logo.width * k, d.logo.height * k); }
  else { c.fillStyle = d.accent; c.fillRect(x, y, s, s); pText(c, pIni(d.org), x + s / 2, y + s * .64, 800, s * .4, s * .8, 'd', pInk(d.accent), { align: 'center' }); }
  c.restore();
}
// cápsula con logo y nombre de la empresa
function pBrand(c, d, x, y, h, dark, maxW = 600) {
  c.font = PF(700, h * .38, 'b'); const tw = Math.min(maxW - h - 34, c.measureText(d.org).width), w = h + 26 + tw + 22;
  pRR(c, x, y, w, h, h / 2); c.fillStyle = dark ? 'rgba(12,13,16,.78)' : 'rgba(255,255,255,.94)'; c.fill();
  pLogo(c, d, x + 6, y + 6, h - 12);
  pText(c, d.org, x + h + 10, y + h * .63, 700, h * .38, tw + 4, 'b', dark ? '#fff' : '#121417');
  return w;
}
function pTag(c, d, x, y, h, align = 'left') {
  if (!d.tag) return 0; c.font = PF(700, h * .42, 'b'); c.letterSpacing = '2px'; const t = d.tag.toUpperCase(), w = c.measureText(t).width + h * .9; c.letterSpacing = '0px';
  const X = align === 'right' ? x - w : x; pRR(c, X, y, w, h, h / 2); c.fillStyle = d.accent; c.fill();
  pText(c, t, X + w / 2, y + h * .66, 700, h * .42, w, 'b', pInk(d.accent), { align: 'center', ls: 2 }); return w;
}
// fila del vendedor: iniciales, nombre, teléfono y botón "Escríbeme"
function pSeller(c, d, x, y, w, h, dark) {
  const fg = dark ? '#FFFFFF' : '#121417', fg2 = dark ? 'rgba(255,255,255,.7)' : 'rgba(18,20,23,.62)', a = h * .82;
  c.beginPath(); c.arc(x + a / 2, y + h / 2, a / 2, 0, Math.PI * 2); c.fillStyle = d.accent; c.fill();
  pText(c, pIni(d.vend), x + a / 2, y + h / 2 + a * .15, 800, a * .38, a * .8, 'd', pInk(d.accent), { align: 'center' });
  const cta = 'Escríbeme'; c.font = PF(700, h * .3, 'b'); const cw = c.measureText(cta).width + h * .9 + h * .42;
  const tx = x + a + h * .3, maxT = w - a - cw - h * .6;
  pText(c, d.vend || 'Tu vendedor', tx, y + h * .44, 700, h * .34, maxT, 'b', fg);
  if (d.fono) { pWa(c, tx, y + h * .58, h * .26, fg2); pText(c, d.fono, tx + h * .34, y + h * .8, 500, h * .27, maxT - h * .34, 'b', fg2); }
  const bx = x + w - cw, bh = h * .62, by = y + (h - bh) / 2;
  pRR(c, bx, by, cw, bh, bh / 2); c.fillStyle = dark ? '#FFFFFF' : '#121417'; c.fill();
  pWa(c, bx + h * .3, by + bh / 2 - h * .14, h * .28, dark ? '#121417' : '#FFFFFF');
  pText(c, cta, bx + h * .3 + h * .4, by + bh * .66, 700, h * .3, cw, 'b', dark ? '#121417' : '#FFFFFF');
}
const pShade = (c, x, y, w, h, from, to) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, from); g.addColorStop(1, to); c.fillStyle = g; c.fillRect(x, y, w, h); };

/* ---------------- plantillas ---------------- */
// alto de las letras (para ubicar textos de abajo hacia arriba)
const pCap = s => s * 0.74;
// título en 1-2 líneas cuya última línea queda en "base"; devuelve el borde superior
function pTitleUp(c, text, x, base, w, size, maxW, color, opt = {}) {
  const f = pFit(c, text, w, size, maxW, opt.fam || 'd', opt.lines || 2, opt.min || size * .55), lh = f.s * (opt.lh || 1);
  c.fillStyle = color; c.textAlign = opt.align || 'left'; c.textBaseline = 'alphabetic'; if (opt.ls) c.letterSpacing = opt.ls + 'px';
  f.lines.forEach((l, k) => c.fillText(l, x, base - (f.lines.length - 1 - k) * lh));
  if (opt.ls) c.letterSpacing = '0px';
  return base - (f.lines.length - 1) * lh - pCap(f.s);
}
const PUB_DRAW = {
  // foto completa, degradado y datos sobre la foto
  vitrina(c, W, H, d) {
    const st = H > 1500, m = 64, top = st ? 120 : m;
    pCover(c, d.fotos[0], 0, 0, W, H, st ? 0.5 : 0.55, d);
    pShade(c, 0, 0, W, 300, 'rgba(0,0,0,.55)', 'rgba(0,0,0,0)');
    pShade(c, 0, H * (st ? .4 : .34), W, H * (st ? .6 : .66), 'rgba(8,9,11,0)', 'rgba(8,9,11,.95)');
    pBrand(c, d, m, top, 86, false); pTag(c, d, W - m, top + 8, 70, 'right');
    const sy = H - (st ? 250 : 150); pSeller(c, d, m, sy, W - m * 2, 104, true);
    let y = sy - 30; c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(m, y, W - m * 2, 2);
    if (d.precio) { y -= 40; const f = pFit(c, d.precio, 800, 128, W - m * 2, 'd'); pText(c, d.precio, m, y, 800, f.s, W - m * 2, 'd', d.accent); y -= pCap(f.s) + 36; }
    if (d.specs.length) { y -= 62; c.font = PF(600, 32, 'b'); let x = m; d.specs.forEach(([, v]) => { const w = c.measureText(v).width + 44; if (x + w > W - m) return; pRR(c, x, y, w, 62, 31); c.fillStyle = 'rgba(255,255,255,.15)'; c.fill(); pText(c, v, x + 22, y + 42, 600, 32, w, 'b', '#fff'); x += w + 12; }); y -= 30; }
    const tt = pTitleUp(c, d.titulo, m, y, 800, 112, W - m * 2, '#fff', { min: 60, lh: .98 });
    if (d.anio) pText(c, d.anio, m, tt - 24, 600, 44, 400, 'm', d.accent, { ls: 4 });
  },
  // estilo editorial claro: foto arriba, ficha técnica y precio
  ficha(c, W, H, d) {
    const st = H > 1500, m = 56, top = st ? 170 : 132, ink = '#121417';
    c.fillStyle = '#F4F2EC'; c.fillRect(0, 0, W, H);
    pBrand(c, d, m, st ? 64 : 32, 80, false, 640);
    const sy = H - (st ? 210 : 130); pSeller(c, d, m, sy, W - m * 2, 100, false);
    let y = sy - 28;
    if (d.precio) { const ph = 112; y -= ph; pRR(c, m, y, W - m * 2, ph, 30); c.fillStyle = ink; c.fill();
      pText(c, 'PRECIO', m + 36, y + 66, 500, 26, 200, 'm', 'rgba(255,255,255,.55)', { ls: 3 });
      pText(c, d.precio, W - m - 36, y + 80, 800, 70, W - m * 2 - 260, 'd', d.accent === '#FFFFFF' ? '#F2C14E' : d.accent, { align: 'right' }); y -= 24; }
    if (d.specs.length) { const n = Math.min(4, d.specs.length), gw = (W - m * 2 - 16 * (n - 1)) / n, sh = 122; y -= sh;
      d.specs.slice(0, n).forEach(([k, v], i) => { const x = m + i * (gw + 16); pRR(c, x, y, gw, sh, 26); c.fillStyle = '#FFFFFF'; c.fill();
        pText(c, k.toUpperCase(), x + 24, y + 46, 500, 22, gw - 40, 'm', 'rgba(18,20,23,.5)', { ls: 2 }); pText(c, v, x + 24, y + 94, 700, 36, gw - 40, 'b', ink); }); y -= 30; }
    const tt = pTitleUp(c, d.titulo + (d.anio ? ' ' + d.anio : ''), m, y, 800, 84, W - m * 2, ink, { min: 50 });
    const ph = tt - 44 - top; c.save(); pRR(c, m, top, W - m * 2, ph, 40); c.clip(); pCover(c, d.fotos[0], m, top, W - m * 2, ph, 0.58, d); c.restore();
    pTag(c, d, m + 28, top + 28, 66);
  },
  // banda diagonal con la etiqueta y el precio como protagonista
  oferta(c, W, H, d) {
    const st = H > 1500, m = 64, top = st ? 120 : m, ink = pInk(d.accent);
    c.fillStyle = '#0E0F12'; c.fillRect(0, 0, W, H);
    const sy = H - (st ? 220 : 140);
    // de abajo hacia arriba: vendedor, precio, datos y título; la foto ocupa el resto
    let y = sy - 34, priceY = 0, specY = 0;
    if (d.precio) { const f = pFit(c, d.precio, 800, st ? 150 : 120, W - m * 2, 'd'); priceY = y; y -= pCap(f.s) + 40; }
    if (d.specs.length) { specY = y; y -= 32 + 30; }
    const titulo = d.titulo + (d.anio ? ' · ' + d.anio : ''), ft = pFit(c, titulo, 800, 74, W - m * 2, 'd', 2, 44), tBase = y, tTop = y - (ft.lines.length - 1) * ft.s - pCap(ft.s);
    const band = tTop - 130;   // borde inferior de la banda
    pCover(c, d.fotos[0], 0, 0, W, band, 0.55, d);
    pShade(c, 0, 0, W, 260, 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)');
    pBrand(c, d, m, top, 86, false);
    c.save(); c.translate(W / 2, band - 70); c.rotate(-0.055);
    c.fillStyle = d.accent; c.fillRect(-W, -84, W * 2, 168);
    pText(c, (d.tag || 'Disponible').toUpperCase(), 0, 38, 800, 104, W - 140, 'd', ink, { align: 'center', ls: 2 });
    c.restore();
    c.fillStyle = '#0E0F12'; c.beginPath(); c.moveTo(0, band + 40); c.lineTo(W, band - 20); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    pTitleUp(c, titulo, m, tBase, 800, 74, W - m * 2, '#fff', { min: 44 });
    if (specY) pText(c, d.specs.map(s => s[1]).join('  ·  '), m, specY, 500, 32, W - m * 2, 'b', 'rgba(255,255,255,.7)');
    if (priceY) pText(c, d.precio, m, priceY, 800, st ? 150 : 120, W - m * 2, 'd', d.accent === '#FFFFFF' ? '#fff' : d.accent);
    pSeller(c, d, m, sy, W - m * 2, 100, true);
  },
  // varias fotos: una grande y dos chicas
  galeria(c, W, H, d) {
    const st = H > 1500, m = 40, g = 14, f = d.fotos, top = st ? 190 : 140;
    c.fillStyle = '#121417'; c.fillRect(0, 0, W, H);
    pBrand(c, d, m + 8, st ? 80 : 36, 80, true);
    pTag(c, d, W - m - 8, st ? 86 : 42, 66, 'right');
    const sy = H - (st ? 200 : 126); pSeller(c, d, m + 8, sy, W - m * 2 - 16, 96, true);
    let y = sy - 34;
    if (d.specs.length) { pText(c, d.specs.map(s => s[1]).join('  ·  '), m + 8, y, 500, 30, W - m * 2 - 16, 'b', 'rgba(255,255,255,.62)'); y -= 30 + 26; }
    if (d.precio) { pText(c, d.precio, m + 8, y, 800, 76, W - m * 2 - 16, 'd', d.accent); y -= pCap(76) + 22; }
    const tt = pTitleUp(c, d.titulo + (d.anio ? ' ' + d.anio : ''), m + 8, y, 800, 60, W - m * 2 - 16, '#fff', { lines: 1, min: 38 });
    const avail = tt - 40 - top, smH = Math.round(avail * .38), bigH = avail - smH - g, sw = (W - m * 2 - g) / 2;
    c.save(); pRR(c, m, top, W - m * 2, bigH, 34); c.clip(); pCover(c, f[0], m, top, W - m * 2, bigH, 0.55, d); c.restore();
    [f[1] || f[0], f[2] || f[1] || f[0]].forEach((im, i) => { const x = m + i * (sw + g), yy = top + bigH + g; c.save(); pRR(c, x, yy, sw, smH, 30); c.clip(); pCover(c, im, x, yy, sw, smH, i ? 0.4 : 0.6, d); c.restore(); });
  },
  // sobrio y elegante: negro, marco fino y textos espaciados
  premium(c, W, H, d) {
    const st = H > 1500, gold = d.accent === '#C8F03C' ? '#C9A961' : d.accent, m = 70, lg = 88, lt = st ? 110 : 52;
    c.fillStyle = '#0A0A0B'; c.fillRect(0, 0, W, H);
    pLogo(c, d, W / 2 - lg / 2, lt, lg);
    pText(c, d.org.toUpperCase(), W / 2, lt + lg + 46, 500, 26, W - 200, 'm', 'rgba(255,255,255,.75)', { align: 'center', ls: 6 });
    const py = lt + lg + 84;
    let y = H - (st ? 130 : 70);
    pText(c, 'AGENDA TU VISITA', W / 2, y, 500, 24, W - m * 2, 'm', gold, { align: 'center', ls: 6 }); y -= 50;
    pText(c, (d.vend || '') + (d.fono ? '   ·   ' + d.fono : ''), W / 2, y, 600, 34, W - m * 2, 'b', '#fff', { align: 'center' }); y -= 70;
    if (d.precio) { pText(c, d.precio, W / 2, y, 700, 84, W - m * 2, 'd', gold, { align: 'center' }); y -= pCap(84) + 30; c.fillStyle = gold; c.fillRect(W / 2 - 45, y, 90, 2); y -= 42; }
    if (d.specs.length) { pText(c, d.specs.map(s => s[1]).join('   |   '), W / 2, y, 500, 30, W - m * 2, 'b', 'rgba(255,255,255,.62)', { align: 'center' }); y -= 30 + 30; }
    const tt = pTitleUp(c, d.titulo.toUpperCase(), W / 2, y, 700, 66, W - m * 2, '#fff', { align: 'center', ls: 3, lines: 1, min: 38 });
    let ph = tt - 50 - py;
    if (d.tag) { pText(c, d.tag.toUpperCase(), W / 2, tt - 30, 500, 24, W - 200, 'm', gold, { align: 'center', ls: 6 }); ph -= 46; }
    c.strokeStyle = gold; c.lineWidth = 2; c.strokeRect(m - 14, py - 14, W - m * 2 + 28, ph + 28);
    pCover(c, d.fotos[0], m, py, W - m * 2, ph, 0.55, d);
  },
};

/* ---------------- datos de la publicación ---------------- */
function pubDatos(it) {
  const s = it.specs || {}, ok = v => v != null && v !== '—' && v !== '', num = n => Number(n).toLocaleString('es-CL');
  let titulo = it.nombre, anio = '', specs = [];
  if (it.w === 'auto') {
    titulo = [s.marca, s.modelo].filter(ok).join(' ') || it.nombre; anio = ok(s.anio) ? String(s.anio) : '';
    if (!ok(s.marca)) titulo = it.nombre.replace(/\s\d{4}$/, '');
    specs = [['Año', anio], ['Kilometraje', ok(s.km) ? num(s.km) + ' km' : ''], ['Transmisión', s.transmision], ['Combustible', s.combustible], ['Color', s.color]];
  } else if (it.w === 'prop') specs = [['Dormitorios', ok(s.dorm) ? s.dorm + ' dorm.' : ''], ['Baños', ok(s.banos) ? s.banos + ' baños' : ''], ['Superficie', ok(s.m2c) ? num(s.m2c) + ' m²' : ''], ['Comuna', s.comuna]];
  else specs = [['Marca', s.marca], ['Categoría', s.categoria], ['Variante', s.variante]];
  specs = specs.filter(([, v]) => ok(v)).map(([k, v]) => [k, String(v)]);
  if (it.w === 'auto') specs = specs.filter(([k]) => k !== 'Año');
  return { titulo, anio, specs: specs.slice(0, 4), precio: it.precio ? fmt(it.precio) + (it.w === 'prop' && it.op === 'Arriendo' ? ' /mes' : '') : '' };
}
function pubTextoPost(it) {
  const d = pubDatos(it), w = it.w, e = { auto: '🚗', prop: '🏡', tienda: '🛍️' }[w];
  return [`${e} ${d.titulo}${d.anio ? ' ' + d.anio : ''}`, d.specs.length ? '📍 ' + d.specs.map(s => s[1]).join(' · ') : '', pub.precio && d.precio ? '💰 ' + d.precio : '',
    pub.tag ? '✅ ' + pub.tag : '', `📲 Escríbeme${pub.fono ? ': ' + pub.fono : ''}${pub.vend ? ' — ' + pub.vend : ''}`, orgNombre()].filter(Boolean).join('\n');
}

/* ---------------- dibujar ---------------- */
async function pubRender(canvas, it, o) {
  const [W, H] = PUB_FMT[o.fmt], c = canvas.getContext('2d'); canvas.width = W; canvas.height = H;
  const orden = it.fotos.length ? [o.foto, ...it.fotos.map((_, i) => i).filter(i => i !== o.foto)] : [];
  const [fotos, logo] = await Promise.all([Promise.all(orden.slice(0, 3).map(i => pubImg(fotoSrc(it.fotos[i])))), pubImg(PREFS.logo ? fotoSrc(PREFS.logo) : '')]);
  const base = pubDatos(it);
  const d = { ...base, precio: o.precio ? base.precio : '', fotos: fotos.filter(Boolean), logo, org: orgNombre(), vend: o.vend, fono: o.fono, tag: o.tag, accent: o.color, w: it.w };
  c.clearRect(0, 0, W, H); c.save(); PUB_DRAW[o.tpl](c, W, H, d); c.restore();
  return canvas;
}

/* ---------------- pantalla del editor ---------------- */
function pubPrefs() { try { return JSON.parse(localStorage.getItem('gestix_pub') || '{}'); } catch (e) { return {}; } }
function pubGuardarPrefs() { try { localStorage.setItem('gestix_pub', JSON.stringify({ vend: pub.vend, fono: pub.fono, tpl: pub.tpl, color: pub.color })); } catch (e) { } }
function openPublicar(id) {
  const it = getItem(id); if (!it) return; const w = WORLDS[it.w], pr = pubPrefs(), yo = miEquipo(it.w);
  pub = { id, fmt: 'post', tpl: pr.tpl || 'vitrina', foto: 0, precio: !!it.precio, tag: PUB_TAGS[it.w][0], color: pr.color || (PREFS.accent[it.w] || w.accent),
    vend: pr.vend || (yo && yo.nombre) || ME.nombre || '', fono: pr.fono || (yo && yo.fono) || '' };
  const el = pushScreen('Publicación', pubHtml(it), { cta: `<button class="btn ghost" data-act="pubBajar">${icon('download')}Descargar</button><button class="btn primary" data-act="pubEnviar">${icon('share')}Enviar</button>` });
  el.dataset.pub = id; pubDibujar(); pubMiniaturas();
}
function pubHtml(it) {
  const fotos = it.fotos.map((f, i) => `<button class="pubfoto ${i === pub.foto ? 'on' : ''}" data-act="pubFoto" data-i="${i}" aria-label="Usar foto ${i + 1}"><img src="${fotoSrc(f)}" alt=""></button>`).join('');
  return `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:16px">
    <div class="pubprev ${pub.fmt}"><canvas id="pub-c" width="1080" height="1350" aria-label="Vista previa de la publicación"></canvas><span class="pubload" id="pub-l">${icon('image', 22)}</span></div>
    ${seg('seg-pub', [['post', 'Post 4:5'], ['story', 'Historia 9:16']], pub.fmt, 'pubFmt')}
    <div><p class="kicker" style="margin-bottom:10px">Diseño</p><div class="pubtpls">${PUB_TPL.map(([k, t]) => `<button class="pubtpl ${k === pub.tpl ? 'on' : ''}" data-act="pubTpl" data-k="${k}"><canvas width="216" height="270" data-mini="${k}"></canvas><span>${t}</span></button>`).join('')}</div></div>
    ${it.fotos.length ? `<div><p class="kicker" style="margin-bottom:10px">Foto principal</p><div class="pubfotos">${fotos}</div></div>` : `<div class="tip">${icon('camera')}<span>Este ${WORLDS[it.w].itemOne.toLowerCase()} aún no tiene fotos. Agrégalas en su ficha para que la publicación luzca.</span></div>`}
    <div><p class="kicker" style="margin-bottom:10px">Etiqueta</p><div class="optrow">${['', ...PUB_TAGS[it.w]].map(t => `<button class="opt ${t === pub.tag ? 'on' : ''}" data-act="pubTag" data-t="${clean(t)}">${t || 'Sin etiqueta'}</button>`).join('')}</div></div>
    <div><p class="kicker" style="margin-bottom:10px">Color</p><div class="pubcolors">${PUB_COLORS.map(c => `<button data-act="pubColor" data-c="${c}" class="${c === pub.color ? 'on' : ''}" style="--c:${c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">Datos de contacto</span>
      <div class="grid2"><label class="field"><span>Nombre</span><input id="pub-v" value="${clean(pub.vend)}" maxlength="40" data-change="pubDatos" autocomplete="name"></label><label class="field"><span>WhatsApp</span><input id="pub-f" value="${clean(pub.fono)}" maxlength="20" inputmode="tel" placeholder="+56 9 …" data-change="pubDatos" autocomplete="tel"></label></div>
      ${it.precio ? `<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;color:var(--fg2)">Mostrar precio</span><button class="toggle ${pub.precio ? 'on' : ''}" data-act="pubPrecio" aria-label="Mostrar precio"></button></div>` : ''}</div>
    <button class="btn ghost small" data-act="pubTexto">${icon('copy', 15)}Copiar texto para la publicación</button>
  </div>`;
}
let pubTimer = null;
function pubDibujar() {
  clearTimeout(pubTimer); const c = $('#pub-c'), it = getItem(pub.id); if (!c || !it) return; $('#pub-l') && $('#pub-l').classList.add('on');
  pubTimer = setTimeout(async () => { await pubFonts(); const off = document.createElement('canvas'); await pubRender(off, it, pub);
    const cc = $('#pub-c'); if (!cc) return; cc.width = off.width; cc.height = off.height; cc.getContext('2d').drawImage(off, 0, 0); $('#pub-l') && $('#pub-l').classList.remove('on'); }, 60);
}
// miniaturas de cada diseño con este mismo auto
async function pubMiniaturas() {
  const it = getItem(pub.id); await pubFonts();
  for (const [k] of PUB_TPL) {
    const off = document.createElement('canvas'); await pubRender(off, it, { ...pub, tpl: k, fmt: 'post' });
    const m = $(`canvas[data-mini="${k}"]`); if (m) m.getContext('2d').drawImage(off, 0, 0, m.width, m.height);
  }
}
const pubRedibujar = (minis) => { pubGuardarPrefs(); pubDibujar(); if (minis) pubMiniaturas(); };
ACT.publicar = d => openPublicar(d.id);
ACT.pubFmt = d => { pub.fmt = d.k; $$('#seg-pub button').forEach(b => b.classList.toggle('active', b.dataset.k === d.k)); moveSeg('seg-pub'); $('.pubprev').className = 'pubprev ' + d.k; pubDibujar(); };
ACT.pubTpl = d => { pub.tpl = d.k; $$('.pubtpl').forEach(b => b.classList.toggle('on', b.dataset.k === d.k)); pubRedibujar(); };
ACT.pubFoto = d => { pub.foto = +d.i; $$('.pubfoto').forEach((b, i) => b.classList.toggle('on', i === pub.foto)); pubRedibujar(true); };
ACT.pubTag = d => { pub.tag = d.t; $$('[data-act=pubTag]').forEach(b => b.classList.toggle('on', b.dataset.t === d.t)); pubRedibujar(true); };
ACT.pubColor = d => { pub.color = d.c; $$('.pubcolors button').forEach(b => b.classList.toggle('on', b.dataset.c === d.c)); pubRedibujar(true); };
ACT.pubPrecio = (d, el) => { pub.precio = !pub.precio; el.classList.toggle('on', pub.precio); pubRedibujar(true); };
ACT.pubDatos = () => { pub.vend = ($('#pub-v').value || '').trim().replace(/[<>"'`]/g, '').slice(0, 40); pub.fono = ($('#pub-f').value || '').trim().replace(/[^\d+ ()-]/g, '').slice(0, 20); pubRedibujar(true); };
ACT.pubTexto = async () => { const t = pubTextoPost(getItem(pub.id)); try { await navigator.clipboard.writeText(t); toast('Texto copiado: pégalo en tu publicación', 'copy'); } catch (e) { prompt('Copia el texto:', t); } };
// imagen final como archivo JPG
async function pubArchivo() {
  const it = getItem(pub.id), c = document.createElement('canvas'); await pubFonts(); await pubRender(c, it, pub);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.92));
  const slug = (it.nombre || 'publicacion').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return new File([blob], `${slug}-${pub.fmt === 'story' ? 'historia' : 'post'}.jpg`, { type: 'image/jpeg' });
}
ACT.pubEnviar = async () => {
  try {
    const f = await pubArchivo();
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: pubTextoPost(getItem(pub.id)) }); return; }
    pubDescargar(f); toast('Tu equipo no permite enviar directo: la imagen se descargó', 'download');
  } catch (e) { if (e && e.name === 'AbortError') return; toast('No se pudo preparar la imagen. Inténtalo de nuevo.', 'warn'); }
};
ACT.pubBajar = async () => { try { pubDescargar(await pubArchivo()); toast('Imagen descargada', 'download'); } catch (e) { toast('No se pudo descargar la imagen', 'warn'); } };
function pubDescargar(f) { const u = URL.createObjectURL(f), a = document.createElement('a'); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
