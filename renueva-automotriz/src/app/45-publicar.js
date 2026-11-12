/* =====================================================================
   PUBLICAR: arma imágenes para redes (post 4:5 e historia 9:16) con las
   fotos del auto, el logo de la empresa y los datos del vendedor.
   Todo se dibuja en el celular (canvas): gratis y sin servicios externos.
   ===================================================================== */
import qrcode from 'qrcode-generator';
ICONS.download = '<path d="M12 4v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19.5h14"/>';
ICONS.share = '<path d="M12 15V4"/><path d="M8 7.5 12 3.5l4 4"/><path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1"/>';
ICONS.image = '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>';

const PUB_FMT = { post: [1080, 1350], story: [1080, 1920], hoja: [1240, 1754], vidrio: [1240, 1754] };   // hoja y vidrio: A4 a 150 ppp
const PUB_PRINT = { hoja: 1, vidrio: 1 };   // formatos para imprimir (sin elegir diseño)
const PUB_TPL_AUTO = [['vitrina', 'Vitrina'], ['ficha', 'Ficha'], ['oferta', 'Oferta'], ['galeria', 'Galería'], ['premium', 'Premium']];
const PUB_TPL_PROP = [['portada', 'Portada'], ['catalogo', 'Catálogo'], ['mosaico', 'Mosaico'], ['cartel', 'Cartel'], ['residencial', 'Residencial']];
const pubTpls = w => w === 'prop' ? PUB_TPL_PROP : PUB_TPL_AUTO;
const PUB_COLORS = ['#C8F03C', '#FFFFFF', '#D9B36C', '#FF7A3D', '#E5383B', '#3D7BFF', '#1FA97A', '#B7A6FF'];
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
const pubFonts = () => Promise.all(['700 100px "Instrument Sans"', '600 40px "Instrument Sans"', '500 40px "Instrument Sans"', '400 40px "Instrument Sans"']
  .map(f => document.fonts && document.fonts.load ? document.fonts.load(f).catch(() => null) : null));

/* ---------------- ayudas de dibujo ---------------- */
const PF = (w, s, fam) => `${fam === 'm' ? 600 : Math.min(w, 700)} ${Math.round(fam === 'm' ? s * .94 : s)}px "Instrument Sans", -apple-system, "Segoe UI", system-ui, sans-serif`;
// los títulos van apretados (como en la app); las etiquetas en mayúsculas traen su propio espaciado
const pLs = (fam, size, opt) => opt.ls ? opt.ls + 'px' : fam === 'd' ? (-size * .02).toFixed(2) + 'px' : '0px';
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
  c.letterSpacing = pLs(fam, f.s, opt);
  f.lines.forEach((l, i) => c.fillText(l, x, y + i * f.s * (opt.lh || 1.02)));
  c.letterSpacing = '0px';
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
// íconos de línea (24×24) para dormitorios, baños, superficie y ubicación
const PIC = {
  dorm: 'M3 18v-6.5A1.5 1.5 0 0 1 4.5 10h15a1.5 1.5 0 0 1 1.5 1.5V18M3 15h18M3 18v2M21 18v2M6 10V7.5A1.5 1.5 0 0 1 7.5 6h3A1.5 1.5 0 0 1 12 7.5V10',
  banos: 'M4 12h16v2.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 14.5V12ZM6.5 12V6a2 2 0 0 1 3.6-1.2M8 19l-1 2M16 19l1 2',
  m2: 'M4 9V4h5M20 15v5h-5M4 4l6.5 6.5M20 20l-6.5-6.5M15 4h5v5M9 20H4v-5',
  pin: 'M12 21s-7-6.2-7-11.2a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12.3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  auto: 'M5 16.5V12l2-4.5h10l2 4.5v4.5M5 16.5h14M5 16.5V18M19 16.5V18M8 13.5h.01M16 13.5h.01',
};
function pIcon(c, k, x, y, s, color, lw = 1.7) { c.save(); c.translate(x, y); c.scale(s / 24, s / 24); c.strokeStyle = color; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(new Path2D(PIC[k])); c.restore(); }
// fila de datos con ícono: [ícono, valor, etiqueta]
function pStats(c, d, x, y, w, color, color2, size = 44, opt = {}) {
  const st = d.stats.slice(0, opt.max || 3); if (!st.length) return 0; const cw = w / st.length;
  st.forEach(([ic, v, l], i) => { const cx = x + i * cw;
    if (i && opt.sep) { c.fillStyle = opt.sep; c.fillRect(cx, y - 6, 2, size * 2.2); }
    const px = cx + (i ? (opt.sep ? 28 : 0) : 0);
    pIcon(c, ic, px, y, size * .9, opt.icon || color2, 1.8);
    pText(c, v, px + size * 1.15, y + size * .74, 700, size * .82, cw - size * 1.3 - 30, 'b', color);
    if (opt.labels) pText(c, l.toUpperCase(), px, y + size * 1.9, 500, size * .42, cw - 30, 'm', color2, { ls: 2 });
  });
  return size * (opt.labels ? 2.1 : 1.1);
}
// vidrio esmerilado: desenfoca lo que ya está dibujado debajo (donde el navegador lo permite), lo tiñe y le pone un filo de luz
const P_BLUR = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;
function pGlass(c, x, y, w, h, r, dark = true) {
  c.save(); pRR(c, x, y, w, h, r); c.clip();
  if (P_BLUR) { try { c.filter = 'blur(20px) saturate(1.5)'; c.drawImage(c.canvas, x - 40, y - 40, w + 80, h + 80, x - 40, y - 40, w + 80, h + 80); } catch (e) { } c.filter = 'none'; }
  c.fillStyle = dark ? `rgba(14,16,20,${P_BLUR ? .44 : .74})` : `rgba(255,255,255,${P_BLUR ? .74 : .93})`; c.fillRect(x, y, w, h);
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgba(255,255,255,${dark ? .2 : .5})`); g.addColorStop(.55, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x, y, w, h);
  c.restore(); pRR(c, x + 1, y + 1, w - 2, h - 2, r); c.strokeStyle = dark ? 'rgba(255,255,255,.24)' : 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.stroke();
}
// brillo suave arriba de una pieza de color (cápsulas, sellos, avatar)
function pShine(c, x, y, w, h, r) { c.save(); pRR(c, x, y, w, h, r); c.clip(); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); c.restore(); }
// ¿el logo tiene transparencia? (se mide una vez por imagen: si le sobran píxeles transparentes no lleva cuadro blanco)
const pTransp = new WeakMap();
function pEsTransp(img) {
  if (!img) return false; if (pTransp.has(img)) return pTransp.get(img);
  let t = false;
  try { const n = 48, cv = document.createElement('canvas'); cv.width = cv.height = n; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, n, n); const a = g.getImageData(0, 0, n, n).data; let k = 0; for (let i = 3; i < a.length; i += 4) if (a[i] < 200) k++; t = k > n * n * .06; } catch (e) { }
  pTransp.set(img, t); return t;
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
  if (d.marca === false) return 0;   // el usuario eligió publicar sin logo ni nombre
  const libre = d.logo && pEsTransp(d.logo) && !dark;   // logo sin fondo sobre cápsula clara: va entero, sin cuadro blanco
  const lh = h - 12, lw = libre ? Math.min(lh * 2.4, Math.max(lh, lh * d.logo.width / d.logo.height)) : lh;
  c.font = PF(700, h * .38, 'b'); const tw = Math.min(maxW - lw - 56, c.measureText(d.org).width), w = 6 + lw + 14 + tw + 24;
  pGlass(c, x, y, w, h, h / 2, dark);
  if (libre) { const k = Math.min(lw / d.logo.width, lh / d.logo.height); c.drawImage(d.logo, x + 12 + (lw - d.logo.width * k) / 2, y + 6 + (lh - d.logo.height * k) / 2, d.logo.width * k, d.logo.height * k); }
  else pLogo(c, d, x + 6, y + 6, lh);
  pText(c, d.org, x + 6 + lw + 14, y + h * .63, 700, h * .38, tw + 4, 'b', dark ? '#fff' : '#121417');
  return w;
}
function pTag(c, d, x, y, h, align = 'left') {
  if (!d.tag) return 0; c.font = PF(700, h * .42, 'b'); c.letterSpacing = '2px'; const t = d.tag.toUpperCase(), w = c.measureText(t).width + h * .9; c.letterSpacing = '0px';
  const X = align === 'right' ? x - w : x; pRR(c, X, y, w, h, h / 2); c.fillStyle = d.accent; c.fill(); pShine(c, X, y, w, h, h / 2);
  pText(c, t, X + w / 2, y + h * .66, 700, h * .42, w, 'b', pInk(d.accent), { align: 'center', ls: 2 }); return w;
}
// fila del vendedor: iniciales, nombre, teléfono y botón "Escríbeme"
function pSeller(c, d, x, y, w, h, dark) {
  const fg = dark ? '#FFFFFF' : '#121417', fg2 = dark ? 'rgba(255,255,255,.7)' : 'rgba(18,20,23,.62)', a = h * .82;
  if (d.empresa) pLogo(c, d, x, y + (h - a) / 2, a); // datos de la empresa: va su logo
  else { c.beginPath(); c.arc(x + a / 2, y + h / 2, a / 2, 0, Math.PI * 2); c.fillStyle = d.accent; c.fill(); pShine(c, x, y + (h - a) / 2, a, a, a / 2);
    pText(c, pIni(d.vend), x + a / 2, y + h / 2 + a * .15, 800, a * .38, a * .8, 'd', pInk(d.accent), { align: 'center' }); }
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
  c.fillStyle = color; c.textAlign = opt.align || 'left'; c.textBaseline = 'alphabetic'; c.letterSpacing = pLs(opt.fam || 'd', f.s, opt);
  f.lines.forEach((l, k) => c.fillText(l, x, base - (f.lines.length - 1 - k) * lh));
  c.letterSpacing = '0px';
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
    if (d.specs.length) { y -= 62; c.font = PF(600, 32, 'b'); let x = m; d.specs.forEach(([, v]) => { const w = c.measureText(v).width + 44; if (x + w > W - m) return; pGlass(c, x, y, w, 62, 31, true); pText(c, v, x + 22, y + 42, 600, 32, w, 'b', '#fff'); x += w + 12; }); y -= 30; }
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
    if (d.marca !== false) { pLogo(c, d, W / 2 - lg / 2, lt, lg);
    pText(c, d.org.toUpperCase(), W / 2, lt + lg + 46, 500, 26, W - 200, 'm', 'rgba(255,255,255,.75)', { align: 'center', ls: 6 }); }
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

/* ---------------- plantillas para propiedades ---------------- */
const pOp = d => d.op === 'Arriendo' ? 'EN ARRIENDO' : 'EN VENTA';
const pLugar = d => [d.tipo, d.comuna].filter(Boolean).join(' · ');
Object.assign(PUB_DRAW, {
  // foto completa con la operación arriba y los datos con íconos abajo
  portada(c, W, H, d) {
    const st = H > 1500, m = 64, top = st ? 120 : m;
    pCover(c, d.fotos[0], 0, 0, W, H, 0.5, d);
    pShade(c, 0, 0, W, 300, 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)');
    pShade(c, 0, H * (st ? .38 : .3), W, H * (st ? .62 : .7), 'rgba(6,8,10,0)', 'rgba(6,8,10,.95)');
    pBrand(c, d, m, top, 86, false);
    const opT = pOp(d); c.font = PF(800, 30, 'b'); c.letterSpacing = '4px'; const ow = c.measureText(opT).width + 56; c.letterSpacing = '0px';
    pRR(c, W - m - ow, top + 10, ow, 66, 12); c.fillStyle = d.accent; c.fill(); pText(c, opT, W - m - ow / 2, top + 54, 800, 30, ow, 'b', pInk(d.accent), { align: 'center', ls: 4 });
    const sy = H - (st ? 250 : 150); pSeller(c, d, m, sy, W - m * 2, 104, true);
    let y = sy - 30; c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(m, y, W - m * 2, 2); y -= 34;
    if (d.precio) { const f = pFit(c, d.precio, 800, 112, W - m * 2, 'd'); pText(c, d.precio, m, y, 800, f.s, W - m * 2, 'd', d.accent); y -= pCap(f.s) + 40; }
    if (d.stats.length) { y -= 44; pStats(c, d, m, y, W - m * 2, '#fff', 'rgba(255,255,255,.75)', 46); y -= 36; }
    const tt = pTitleUp(c, d.titulo, m, y, 800, 96, W - m * 2, '#fff', { min: 56 });
    if (pLugar(d)) { pIcon(c, 'pin', m, tt - 66, 34, d.accent, 2); pText(c, pLugar(d).toUpperCase(), m + 46, tt - 38, 600, 28, W - m * 2 - 46, 'm', 'rgba(255,255,255,.85)', { ls: 3 }); }
  },
  // catálogo claro: foto con bordes redondos, lugar en color y datos en columnas
  catalogo(c, W, H, d) {
    const st = H > 1500, m = 60, ink = '#1D1F22', top = st ? 180 : 130, acc = pInk(d.accent) === '#101114' ? '#1F6F5C' : d.accent;
    c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);
    pBrand(c, d, m, st ? 70 : 34, 76, false, 600);
    pText(c, pOp(d), W - m, (st ? 70 : 34) + 50, 700, 26, 400, 'm', acc, { align: 'right', ls: 5 });
    const sy = H - (st ? 210 : 130); pSeller(c, d, m, sy, W - m * 2, 100, false);
    let y = sy - 36; c.fillStyle = '#E8E6E1'; c.fillRect(m, y, W - m * 2, 2); y -= 34;
    if (d.precio) { pText(c, d.precio, m, y, 800, 84, W - m * 2, 'd', ink); y -= pCap(84) + 40; }
    if (d.stats.length) { y -= 96; pStats(c, d, m, y, W - m * 2, ink, 'rgba(29,31,34,.5)', 44, { labels: true, sep: '#E8E6E1', icon: acc }); y -= 34; }
    const tt = pTitleUp(c, d.titulo, m, y, 800, 76, W - m * 2, ink, { min: 46 });
    if (pLugar(d)) pText(c, pLugar(d).toUpperCase(), m, tt - 26, 600, 26, W - m * 2, 'm', acc, { ls: 4 });
    const ph = tt - 80 - top; c.save(); pRR(c, m, top, W - m * 2, ph, 34); c.clip(); pCover(c, d.fotos[0], m, top, W - m * 2, ph, 0.5, d); c.restore();
    pTag(c, d, m + 26, top + 26, 62);
  },
  // varias fotos en mosaico: una grande y tres chicas
  mosaico(c, W, H, d) {
    const st = H > 1500, m = 40, g = 12, f = d.fotos, top = st ? 190 : 140, bg = '#13201C';
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    pBrand(c, d, m + 8, st ? 80 : 36, 80, true); pTag(c, d, W - m - 8, st ? 86 : 42, 66, 'right');
    const sy = H - (st ? 200 : 126); pSeller(c, d, m + 8, sy, W - m * 2 - 16, 96, true);
    let y = sy - 40;
    if (d.stats.length) { y -= 40; pStats(c, d, m + 8, y, W - m * 2 - 16, '#fff', 'rgba(255,255,255,.7)', 40); y -= 30; }
    if (d.precio) { pText(c, d.precio, m + 8, y, 800, 72, W - m * 2 - 16, 'd', d.accent); y -= pCap(72) + 24; }
    const tt = pTitleUp(c, d.titulo, m + 8, y, 800, 58, W - m * 2 - 16, '#fff', { lines: 1, min: 36 });
    if (pLugar(d)) pText(c, (pOp(d) + ' · ' + pLugar(d)).toUpperCase(), m + 8, tt - 22, 600, 24, W - m * 2 - 16, 'm', 'rgba(255,255,255,.7)', { ls: 3 });
    const avail = tt - 64 - top, bigH = Math.round(avail * .6), smH = avail - bigH - g, sw = (W - m * 2 - g * 2) / 3;
    c.save(); pRR(c, m, top, W - m * 2, bigH, 30); c.clip(); pCover(c, f[0], m, top, W - m * 2, bigH, 0.5, d); c.restore();
    [f[1] || f[0], f[2] || f[1] || f[0], f[3] || f[2] || f[0]].forEach((im, i) => { const x = m + i * (sw + g), yy = top + bigH + g; c.save(); pRR(c, x, yy, sw, smH, 24); c.clip(); pCover(c, im, x, yy, sw, smH, [0.5, 0.3, 0.7][i], d); c.restore(); });
  },
  // estilo letrero: SE VENDE / SE ARRIENDA en grande y el teléfono destacado
  cartel(c, W, H, d) {
    const st = H > 1500, m = 56, ink = pInk(d.accent), bh = st ? 380 : 300;
    c.fillStyle = '#F7F5F0'; c.fillRect(0, 0, W, H);
    c.fillStyle = d.accent; c.fillRect(0, 0, W, bh);
    pBrand(c, d, m, st ? 70 : 40, 74, ink === '#FFFFFF', 640);
    pText(c, d.op === 'Arriendo' ? 'SE ARRIENDA' : 'SE VENDE', m - 4, bh - (st ? 60 : 44), 800, st ? 150 : 132, W - m * 2, 'd', ink, { ls: 1 });
    const sy = H - (st ? 260 : 170), ink2 = '#16181B';
    // teléfono grande, como en un letrero
    pRR(c, m, sy, W - m * 2, st ? 150 : 130, 30); c.fillStyle = ink2; c.fill();
    pWa(c, m + 40, sy + (st ? 50 : 40), 50, d.accent === '#FFFFFF' ? '#25D366' : d.accent);
    pText(c, d.fono || 'Escríbenos', m + 112, sy + (st ? 94 : 84), 800, 60, W - m * 2 - 330, 'd', '#fff');
    pText(c, (d.vend || '').toUpperCase(), W - m - 40, sy + (st ? 90 : 80), 600, 26, 260, 'm', 'rgba(255,255,255,.6)', { align: 'right', ls: 2 });
    let y = sy - 40;
    if (d.precio) { pText(c, d.precio, m, y, 800, 84, W - m * 2, 'd', ink2); y -= pCap(84) + 30; }
    if (d.stats.length) { y -= 44; pStats(c, d, m, y, W - m * 2, ink2, 'rgba(22,24,27,.55)', 42); y -= 34; }
    const tt = pTitleUp(c, d.titulo + (d.comuna && !d.titulo.includes(d.comuna) ? ', ' + d.comuna : ''), m, y, 800, 64, W - m * 2, ink2, { min: 40 });
    const pt = bh + 34, ph = tt - 50 - pt;
    c.save(); pRR(c, m, pt, W - m * 2, ph, 26); c.clip(); pCover(c, d.fotos[0], m, pt, W - m * 2, ph, 0.5, d); c.restore();
    pTag(c, d, W - m - 24, pt + 24, 60, 'right');
  },
  // residencial elegante: tonos cálidos y foto en forma de arco
  residencial(c, W, H, d) {
    const st = H > 1500, m = 80, ink = '#2B241D', soft = '#8A7B69', acc = pInk(d.accent) === '#101114' ? '#A8794B' : d.accent;
    c.fillStyle = '#EFE8DD'; c.fillRect(0, 0, W, H);
    const lg = 70, lt = st ? 100 : 46; if (d.marca !== false) { pLogo(c, d, W / 2 - lg / 2, lt, lg);
    pText(c, d.org.toUpperCase(), W / 2, lt + lg + 40, 500, 22, W - 200, 'm', soft, { align: 'center', ls: 6 }); }
    let y = H - (st ? 140 : 70);
    pText(c, (d.vend || '') + (d.fono ? '  ·  ' + d.fono : ''), W / 2, y, 600, 32, W - m * 2, 'b', ink, { align: 'center' }); y -= 54;
    c.fillStyle = soft; c.fillRect(W / 2 - 40, y, 80, 2); y -= 40;
    if (d.precio) { pText(c, d.precio, W / 2, y, 700, 70, W - m * 2, 'd', acc, { align: 'center' }); y -= pCap(70) + 30; }
    if (d.stats.length) { pText(c, d.stats.slice(0, 3).map(s => s[1] + ' ' + (s[0] === 'dorm' ? 'dorm.' : s[0] === 'banos' ? 'baños' : '')).join('   ·   ').replace(/\s+·/g, ' ·').trim(), W / 2, y, 500, 30, W - m * 2, 'b', soft, { align: 'center' }); y -= 30 + 30; }
    const tt = pTitleUp(c, d.titulo, W / 2, y, 700, 70, W - m * 2, ink, { align: 'center', min: 42 });
    pText(c, (pOp(d) + (d.comuna ? ' · ' + d.comuna : '')).toUpperCase(), W / 2, tt - 26, 500, 22, W - m * 2, 'm', acc, { align: 'center', ls: 6 });
    const pt = lt + lg + 80, ph = tt - 70 - pt, pw = W - m * 2, r = pw / 2;
    c.save(); c.beginPath(); c.moveTo(m, pt + r); c.arc(W / 2, pt + r, r, Math.PI, 0); c.lineTo(m + pw, pt + ph); c.lineTo(m, pt + ph); c.closePath(); c.clip();
    pCover(c, d.fotos[0], m, pt, pw, ph, 0.5, d); c.restore();
    c.strokeStyle = pAlpha(acc, .55); c.lineWidth = 2; c.beginPath(); c.moveTo(m - 16, pt + r); c.arc(W / 2, pt + r, r + 16, Math.PI, 0); c.lineTo(m + pw + 16, pt + ph + 16); c.lineTo(m - 16, pt + ph + 16); c.closePath(); c.stroke();
    if (d.tag) { c.font = PF(700, 24, 'm'); c.letterSpacing = '4px'; const tw = c.measureText(d.tag.toUpperCase()).width + 64; c.letterSpacing = '0px'; pRR(c, W / 2 - tw / 2, pt + ph - 86, tw, 58, 29); c.fillStyle = 'rgba(239,232,221,.94)'; c.fill(); pText(c, d.tag.toUpperCase(), W / 2, pt + ph - 48, 600, 22, tw, 'm', ink, { align: 'center', ls: 4 }); }
  },
});

/* ---------------- hoja para imprimir con código QR ---------------- */
// enlace público del ítem (la página que abre el QR); en la demo, la app
const pubLink = it => window.RV && RV.mode === 'cloud' && RV.fichaUrl && ORG.id ? RV.fichaUrl(it.id) : location.origin + '/';
function pQR(c, text, x, y, s, color = '#111') {
  const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(), m = s / n;
  c.fillStyle = color; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) c.fillRect(x + k * m, y + r * m, Math.ceil(m), Math.ceil(m));
}
function pubHoja(c, W, H, d) {
  const m = 80, ink = '#15171A', soft = 'rgba(21,23,26,.55)', acc = pInk(d.accent) === '#101114' ? ink : d.accent;
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);
  // cabecera del color elegido (el blanco usa grafito para que no se pierda en la hoja)
  const band = d.accent === '#FFFFFF' ? ink : d.accent, onBand = pInk(band);
  c.fillStyle = band; c.fillRect(0, 0, W, 190);
  if (d.marca !== false) { pLogo(c, d.logo ? d : { ...d, accent: onBand === '#FFFFFF' ? '#FFFFFF' : ink }, m, 47, 96); pText(c, d.org, m + 122, 112, 700, 44, 640, 'b', onBand); }
  const est = d.w === 'prop' ? (d.op === 'Arriendo' ? 'SE ARRIENDA' : 'SE VENDE') : (d.tag || 'DISPONIBLE').toUpperCase();
  c.font = PF(800, 34, 'b'); c.letterSpacing = '3px'; const ew = c.measureText(est).width + 64; c.letterSpacing = '0px';
  pRR(c, W - m - ew, 63, ew, 64, 14); c.fillStyle = onBand; c.fill(); pText(c, est, W - m - ew / 2, 107, 800, 34, ew, 'b', band, { align: 'center', ls: 3 });
  // título, foto y precio
  let y = 300; pText(c, d.titulo + (d.anio ? ' ' + d.anio : ''), m, y, 800, 96, W - m * 2, 'd', ink, { min: 56 });
  const sub = d.w === 'prop' ? [d.tipo, d.comuna].filter(Boolean).join(' · ') : d.specs.slice(0, 3).map(s => s[1]).join(' · ');
  if (sub) pText(c, sub, m, y + 58, 500, 36, W - m * 2, 'b', soft);
  y += 100; const ph = 560; c.save(); pRR(c, m, y, W - m * 2, ph, 30); c.clip(); pCover(c, d.fotos[0], m, y, W - m * 2, ph, 0.55, d); c.restore(); y += ph + 40;
  if (d.precio) { pRR(c, m, y, W - m * 2, 150, 30); c.fillStyle = '#F2F0EA'; c.fill(); c.save(); c.globalAlpha = 0.16; c.fillStyle = band; c.fill(); c.restore(); c.fillStyle = band; c.fillRect(m, y + 30, 8, 90); pText(c, d.w === 'prop' && d.op === 'Arriendo' ? 'ARRIENDO' : 'PRECIO', m + 44, y + 90, 600, 30, 300, 'm', soft, { ls: 4 }); pText(c, d.precio, W - m - 44, y + 108, 800, 96, W - m * 2 - 330, 'd', ink, { align: 'right' }); y += 190; }
  // datos en dos columnas
  const datos = d.w === 'prop' ? d.stats.map(([, v, l]) => [l, v]) : d.specs, qTop = H - 470;
  datos.slice(0, y + 192 < qTop ? 4 : 2).forEach(([k, v], i) => { const cx = m + (i % 2) * ((W - m * 2) / 2), cy = y + Math.floor(i / 2) * 96;
    pText(c, k.toUpperCase(), cx, cy + 30, 600, 24, (W - m * 2) / 2 - 30, 'm', soft, { ls: 3 }); pText(c, v, cx, cy + 74, 700, 40, (W - m * 2) / 2 - 30, 'b', ink); });
  // QR y contacto
  const qy = H - 430, qs = 330; c.fillStyle = '#E6E3DC'; c.fillRect(m, qy - 40, W - m * 2, 2);
  pRR(c, m, qy, qs + 40, qs + 40, 26); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = acc; c.lineWidth = 6; c.stroke();
  pQR(c, d.link, m + 20, qy + 20, qs, ink);
  const tx = m + qs + 90, tw = W - m - tx;
  pText(c, 'Escanea con la cámara', tx, qy + 64, 800, 46, tw, 'd', ink);
  pText(c, 'Ve todas las fotos y escríbenos', tx, qy + 114, 500, 32, tw, 'b', soft);
  if (d.fono) { pWa(c, tx, qy + 178, 46, acc === ink ? '#1FA855' : acc); pText(c, d.fono, tx + 62, qy + 218, 800, 52, tw - 62, 'd', ink); }
  if (d.vend) pText(c, d.vend, tx, qy + (d.fono ? 274 : 200), 600, 32, tw, 'b', soft);
  pText(c, d.link.replace(/^https?:\/\//, '').split('?')[0].replace(/\/$/, ''), tx, qy + qs + 26, 500, 22, tw, 'm', soft);
}

/* ---------------- ficha para pegar en el vidrio: solo datos y QR, sin foto ---------------- */
// todos los datos publicables del ítem (los mismos que muestra la página pública; nunca patente ni costos)
function pubTodos(it) {
  const s = it.specs || {}, ok = v => v != null && v !== '—' && v !== '' && v !== '-' && !(typeof v === 'number' && isNaN(v)), num = n => Number(n).toLocaleString('es-CL');
  const L = it.w === 'auto' ? [['anio', 'Año'], ['km', 'Kilometraje', v => num(v) + ' km'], ['transmision', 'Transmisión'], ['combustible', 'Combustible'], ['motor', 'Motor'], ['tipo', 'Carrocería'], ['color', 'Color'], ['puertas', 'Puertas'], ['version', 'Versión']]
    : it.w === 'prop' ? [['tipo', 'Tipo'], ['comuna', 'Comuna'], ['dorm', 'Dormitorios'], ['banos', 'Baños'], ['m2c', 'Construidos', v => num(v) + ' m²'], ['m2t', 'Terreno', v => num(v) + ' m²'], ['estac', 'Estacionamientos'], ['bodega', 'Bodega']]
    : [['marca', 'Marca'], ['categoria', 'Categoría'], ['variante', 'Variante']];
  return L.filter(([k]) => ok(s[k]) && !(k === 'dorm' && Number(s[k]) === 0)).map(([k, l, f]) => [l, String(f ? f(s[k]) : s[k])]);
}
function pubVidrio(c, W, H, d) {
  const m = 80, ink = '#101114', soft = 'rgba(16,17,20,.58)', line = '#DEDBD3', band = d.accent === '#FFFFFF' ? ink : d.accent, onBand = pInk(band), cw = W - m * 2;
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);
  // franja de la empresa
  c.fillStyle = band; c.fillRect(0, 0, W, 170);
  if (d.marca !== false) { pLogo(c, d.logo ? d : { ...d, accent: onBand === '#FFFFFF' ? '#FFFFFF' : ink }, m, 37, 96); pText(c, d.org, m + 122, 102, 700, 44, 600, 'b', onBand); }
  const est = d.w === 'prop' ? (d.op === 'Arriendo' ? 'SE ARRIENDA' : 'SE VENDE') : (d.tag || 'EN VENTA').toUpperCase();
  c.font = PF(700, 34, 'b'); c.letterSpacing = '3px'; const ew = c.measureText(est).width + 64; c.letterSpacing = '0px';
  pRR(c, W - m - ew, 53, ew, 64, 32); c.fillStyle = onBand; c.fill(); pText(c, est, W - m - ew / 2, 97, 700, 34, ew, 'b', band, { align: 'center', ls: 3 });
  // nombre grande (se lee desde la vereda)
  let y = 320; const tf = pFit(c, d.titulo, 700, 132, cw, 'd', 2, 78);
  c.fillStyle = ink; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = PF(700, tf.s, 'd'); c.letterSpacing = pLs('d', tf.s, {});
  tf.lines.forEach((l, k) => c.fillText(l, m, y + k * tf.s * 1.02)); c.letterSpacing = '0px'; y += (tf.lines.length - 1) * tf.s * 1.02;
  const sub = d.w === 'auto' ? ((d.todos.find(t => t[0] === 'Versión') || [])[1] || '') : d.w === 'prop' ? [d.tipo, d.comuna].filter(Boolean).join(' · ') : '';
  if (sub) { y += 66; pText(c, sub, m, y, 500, 46, cw, 'b', soft); }
  y += 50;
  // precio: bloque oscuro, lo más visible de la hoja
  if (d.precio) {
    pRR(c, m, y, cw, 210, 34); c.fillStyle = ink; c.fill(); c.fillStyle = band === ink ? '#FFFFFF' : band; pRR(c, m + 34, y + 44, 10, 122, 5); c.fill();
    pText(c, d.w === 'prop' && d.op === 'Arriendo' ? 'ARRIENDO' : 'PRECIO', m + 76, y + 122, 600, 32, 260, 'm', 'rgba(255,255,255,.62)', { ls: 4 });
    pText(c, d.precio, W - m - 44, y + 150, 700, 132, cw - 330, 'd', '#FFFFFF', { align: 'right', min: 70 }); y += 250;
  }
  // todos los datos en dos columnas
  const qTop = H - 450, extras = d.extras || [], datos = d.todos.filter(([l]) => !(d.w === 'auto' && (l === 'Versión'))), libre = qTop - y - (extras.length ? 100 : 24);
  const filas = Math.max(1, Math.min(Math.ceil(datos.length / 2), Math.floor(libre / 104))), rh = Math.max(104, Math.min(176, Math.floor(libre / filas))), k = rh / 112, col = cw / 2;
  datos.slice(0, filas * 2).forEach(([et, v], i) => { const cx = m + (i % 2) * (col + 0), cy = y + Math.floor(i / 2) * rh;
    pText(c, et.toUpperCase(), cx + (i % 2 ? 40 : 0), cy + 34 * Math.min(k, 1.25), 600, 26 * Math.min(k, 1.2), col - 60, 'm', soft, { ls: 3 }); pText(c, v, cx + (i % 2 ? 40 : 0), cy + rh - 26 * k, 700, 50 * Math.min(k, 1.5), col - 60, 'b', ink);
    if (i % 2 === 0) { c.fillStyle = line; c.fillRect(m, cy + rh - 4, cw, 2); } });
  if (datos.length > 1) { c.fillStyle = line; c.fillRect(m + col, y + 10, 2, Math.ceil(Math.min(datos.length, filas * 2) / 2) * rh - 28); }
  y += Math.ceil(Math.min(datos.length, filas * 2) / 2) * rh + 22;
  // lo que ofrece la empresa (financiamiento, parte de pago)
  let ex = m; extras.forEach(t => { c.font = PF(600, 30, 'b'); const w = c.measureText(t).width + 86; if (ex + w > W - m) return;
    pRR(c, ex, y, w, 60, 30); c.fillStyle = '#F1EFE9'; c.fill(); c.beginPath(); c.arc(ex + 32, y + 30, 13, 0, Math.PI * 2); c.fillStyle = ink; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(ex + 26, y + 30.5); c.lineTo(ex + 30.5, y + 35); c.lineTo(ex + 38.5, y + 26); c.stroke();
    pText(c, t, ex + 58, y + 41, 600, 30, w, 'b', ink); ex += w + 14; });
  // QR y contacto
  const qy = H - 420, qs = 320; c.fillStyle = line; c.fillRect(m, qy - 36, cw, 2);
  pRR(c, m, qy, qs + 40, qs + 40, 28); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = ink; c.lineWidth = 6; c.stroke();
  pQR(c, d.link, m + 20, qy + 20, qs, ink);
  const tx = m + qs + 90, tw = W - m - tx;
  pText(c, 'Escanea y mira las fotos', tx, qy + 62, 700, 48, tw, 'd', ink);
  pText(c, 'Apunta la cámara de tu celular al código', tx, qy + 112, 500, 30, tw, 'b', soft);
  if (d.fono) { pWa(c, tx, qy + 172, 52, '#1FA855'); pText(c, d.fono, tx + 70, qy + 220, 700, 62, tw - 70, 'd', ink); }
  if (d.vend) pText(c, d.vend, tx, qy + (d.fono ? 282 : 200), 600, 34, tw, 'b', soft);
  pText(c, d.link.replace(/^https?:\/\//, '').split('?')[0].replace(/\/$/, ''), tx, qy + qs + 30, 500, 22, tw, 'b', soft);
}

/* ---------------- datos de la publicación ---------------- */
function pubDatos(it) {
  const s = it.specs || {}, ok = v => v != null && v !== '—' && v !== '' && v !== '-' && !(typeof v === 'number' && isNaN(v)), num = n => Number(n).toLocaleString('es-CL');
  let titulo = it.nombre, anio = '', specs = [];
  if (it.w === 'auto') {
    titulo = [s.marca, s.modelo].filter(ok).join(' ') || it.nombre; anio = ok(s.anio) ? String(s.anio) : '';
    if (!ok(s.marca)) titulo = it.nombre.replace(/\s\d{4}$/, '');
    specs = [['Año', anio], ['Kilometraje', ok(s.km) ? num(s.km) + ' km' : ''], ['Transmisión', s.transmision], ['Combustible', s.combustible], ['Color', s.color]];
  } else if (it.w === 'prop') specs = [['Dormitorios', ok(s.dorm) ? s.dorm + ' dorm.' : ''], ['Baños', ok(s.banos) ? s.banos + ' baños' : ''], ['Superficie', ok(s.m2c) ? num(s.m2c) + ' m²' : ''], ['Comuna', s.comuna]];
  else specs = [['Marca', s.marca], ['Categoría', s.categoria], ['Variante', s.variante]];
  specs = specs.filter(([, v]) => ok(v)).map(([k, v]) => [k, String(v)]);
  if (it.w === 'auto') specs = specs.filter(([k]) => k !== 'Año');
  const stats = it.w === 'prop' ? [ok(s.dorm) && ['dorm', String(s.dorm), 'Dormitorios'], ok(s.banos) && ['banos', String(s.banos), 'Baños'], ok(s.m2c) && ['m2', num(s.m2c) + ' m²', 'Construidos'], ok(s.m2t) && ['m2', num(s.m2t) + ' m²', 'Terreno']].filter(Boolean) : [];
  const op = it.w === 'prop' ? (it.op === 'Arriendo' || s.operacion === 'Arriendo' ? 'Arriendo' : 'Venta') : '';
  return { titulo, anio, specs: specs.slice(0, 4), stats, op, comuna: ok(s.comuna) ? String(s.comuna) : '', tipo: ok(s.tipo) ? String(s.tipo) : '',
    precio: it.precio ? fmt(it.precio) + (op === 'Arriendo' ? ' /mes' : '') : '' };
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
  const d = { ...base, precio: o.precio ? base.precio : '', fotos: fotos.filter(Boolean), logo, org: orgNombre(), vend: o.vend, fono: o.fono, tag: o.tag, accent: o.color, w: it.w, empresa: !!o.empresa, marca: o.marca !== false };
  d.link = pubLink(it); d.op = base.op; d.stats = base.stats; d.todos = pubTodos(it);
  if (o.fmt === 'vidrio') { const cf = typeof clCfg === 'function' ? clCfg(it.w) : {}; d.extras = it.w === 'auto' ? [cf.cuota && cf.cuota.on && 'Financiamiento', cf.pp !== false && 'Recibimos tu auto'].filter(Boolean) : []; }
  c.clearRect(0, 0, W, H); c.save(); (o.fmt === 'hoja' ? pubHoja : o.fmt === 'vidrio' ? pubVidrio : PUB_DRAW[o.tpl])(c, W, H, d); c.restore();
  return canvas;
}

/* ---------------- pantalla del editor ---------------- */
function pubPrefs() { try { return JSON.parse(localStorage.getItem('gestix_pub') || '{}'); } catch (e) { return {}; } }
function pubGuardarPrefs() { try { localStorage.setItem('gestix_pub', JSON.stringify({ ...pubPrefs(), ...(pub.empresa ? { fonoEmp: pub.fono } : { vend: pub.vend, fono: pub.fono }), ['tpl_' + getItem(pub.id).w]: pub.tpl, color: pub.color, marca: pub.marca !== false })); } catch (e) { } }
function openPublicar(id) {
  const it = getItem(id); if (!it) return; const w = WORLDS[it.w], pr = pubPrefs(), yo = miEquipo(it.w);
  const tpls = pubTpls(it.w), tplPref = pr['tpl_' + it.w];
  pub = { id, fmt: 'post', tpl: tpls.some(t => t[0] === tplPref) ? tplPref : tpls[0][0], foto: 0, precio: !!it.precio, tag: PUB_TAGS[it.w][0], color: pr.color || (PREFS.accent[it.w] || w.accent),
    vend: pr.vend || (yo && yo.nombre) || ME.nombre || '', fono: pr.fono || (yo && yo.fono) || '', marca: pr.marca !== false };
  const el = pushScreen('Publicación', pubHtml(it), { cta: `<button class="btn ghost" data-act="pubBajar">${icon('download')}Descargar</button><button class="btn primary" data-act="pubEnviar">${icon('share')}Enviar</button>` });
  el.dataset.pub = id; pubDibujar(); pubMiniaturas();
}
function pubHtml(it) {
  const fotos = it.fotos.map((f, i) => `<button class="pubfoto ${i === pub.foto ? 'on' : ''}" data-act="pubFoto" data-i="${i}" aria-label="Usar foto ${i + 1}"><img src="${fotoSrc(f)}" alt=""></button>`).join('');
  return `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:16px">
    <div class="pubprev ${pub.fmt}"><canvas id="pub-c" width="1080" height="1350" aria-label="Vista previa de la publicación"></canvas><span class="pubload" id="pub-l">${icon('image', 22)}</span></div>
    ${seg('seg-pub', [['post', 'Post'], ['story', 'Historia'], ['hoja', 'Hoja QR'], ['vidrio', 'Para el vidrio']], pub.fmt, 'pubFmt')}
    <div id="pub-link" class="card publink"><span class="grow"><b>Página ${it.w === 'prop' ? 'de la propiedad' : it.w === 'auto' ? 'del auto' : 'del producto'}</b><small>${window.RV && RV.mode === 'cloud' ? 'Fotos, precio, WhatsApp y formulario de contacto. Es la que abre el QR.' : 'En la demo el QR lleva a Gestix; con tu cuenta lleva a la página de este ítem.'}</small></span><button class="ibtn" data-act="pubCopiar" aria-label="Copiar enlace">${icon('copy', 17)}</button><a class="ibtn" href="${pubLink(it)}" target="_blank" rel="noopener" aria-label="Abrir página">${icon('arrowR', 17)}</a></div>
    <div id="pub-dis" ${PUB_PRINT[pub.fmt] ? 'hidden' : ''}><p class="kicker" style="margin-bottom:10px">Diseño</p><div class="pubtpls">${pubTpls(it.w).map(([k, t]) => `<button class="pubtpl ${k === pub.tpl ? 'on' : ''}" data-act="pubTpl" data-k="${k}"><canvas width="216" height="270" data-mini="${k}"></canvas><span>${t}</span></button>`).join('')}</div></div>
    ${it.fotos.length ? `<div><p class="kicker" style="margin-bottom:10px">Foto principal</p><div class="pubfotos">${fotos}</div></div>` : `<div class="tip">${icon('camera')}<span>Este ${WORLDS[it.w].itemOne.toLowerCase()} aún no tiene fotos. Agrégalas en su ficha para que la publicación luzca.</span></div>`}
    <div><p class="kicker" style="margin-bottom:10px">Etiqueta</p><div class="optrow">${['', ...PUB_TAGS[it.w]].map(t => `<button class="opt ${t === pub.tag ? 'on' : ''}" data-act="pubTag" data-t="${clean(t)}">${t || 'Sin etiqueta'}</button>`).join('')}</div></div>
    <div><p class="kicker" style="margin-bottom:10px">Color</p><div class="pubcolors">${PUB_COLORS.map(c => `<button data-act="pubColor" data-c="${c}" class="${c === pub.color ? 'on' : ''}" style="--c:${c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:14px"><span class="grow"><b style="font:600 14.5px var(--body)">Logo y nombre de la empresa</b><br><span style="font-size:12px;color:var(--fg3)">Arriba de la publicación. Desactívalo si no lo quieres ahí.</span></span><button class="toggle ${pub.marca !== false ? 'on' : ''}" data-act="pubMarca" role="switch" aria-checked="${pub.marca !== false}" aria-label="Mostrar logo y nombre de la empresa"></button></div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px"><span class="kicker">Datos de contacto</span>
      <div class="seg2">${[['yo', 'Mis datos'], ['empresa', 'Datos de la empresa']].map(([k, t]) => `<button class="opt ${(pub.empresa ? 'empresa' : 'yo') === k ? 'on' : ''}" data-act="pubQuien" data-k="${k}">${t}</button>`).join('')}</div>
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
  for (const [k] of pubTpls(it.w)) {
    const off = document.createElement('canvas'); await pubRender(off, it, { ...pub, tpl: k, fmt: 'post' });
    const m = $(`canvas[data-mini="${k}"]`); if (m) m.getContext('2d').drawImage(off, 0, 0, m.width, m.height);
  }
}
const pubRedibujar = (minis) => { pubGuardarPrefs(); pubDibujar(); if (minis) pubMiniaturas(); };
ACT.publicar = d => openPublicar(d.id);
ACT.pubFmt = d => { pub.fmt = d.k; $$('#seg-pub button').forEach(b => b.classList.toggle('active', b.dataset.k === d.k)); moveSeg('seg-pub'); $('.pubprev').className = 'pubprev ' + d.k; $('#pub-dis').hidden = !!PUB_PRINT[d.k]; pubDibujar(); };
ACT.pubCopiar = async () => { const u = pubLink(getItem(pub.id)); try { await navigator.clipboard.writeText(u); toast('Enlace copiado', 'copy'); } catch (e) { prompt('Copia el enlace:', u); } };
ACT.pubTpl = d => { pub.tpl = d.k; $$('.pubtpl').forEach(b => b.classList.toggle('on', b.dataset.k === d.k)); pubRedibujar(); };
ACT.pubFoto = d => { pub.foto = +d.i; $$('.pubfoto').forEach((b, i) => b.classList.toggle('on', i === pub.foto)); pubRedibujar(true); };
ACT.pubTag = d => { pub.tag = d.t; $$('[data-act=pubTag]').forEach(b => b.classList.toggle('on', b.dataset.t === d.t)); pubRedibujar(true); };
// la pieza puede ir con los datos del vendedor o solo con los de la empresa (logo, nombre y WhatsApp de la empresa)
ACT.pubQuien = d => {
  const it = getItem(pub.id), yo = miEquipo(it.w), pr = pubPrefs(); pub.empresa = d.k === 'empresa';
  if (pub.empresa) { pub.vend = orgNombre(); pub.fono = (clCfg(it.w).fono || pr.fonoEmp || ''); }
  else { pub.vend = pr.vend || (yo && yo.nombre) || ME.nombre || ''; pub.fono = pr.fono || (yo && yo.fono) || ''; }
  $$('[data-act=pubQuien]').forEach(b => b.classList.toggle('on', b.dataset.k === d.k)); const v = $('#pub-v'), f = $('#pub-f'); if (v) v.value = pub.vend; if (f) f.value = pub.fono;
  pubRedibujar(true);
};
ACT.pubColor = d => { pub.color = d.c; $$('.pubcolors button').forEach(b => b.classList.toggle('on', b.dataset.c === d.c)); pubRedibujar(true); };
ACT.pubMarca = (d, el) => { pub.marca = pub.marca === false; el.classList.toggle('on', pub.marca); el.setAttribute('aria-checked', pub.marca); pubRedibujar(true); };
ACT.pubPrecio = (d, el) => { pub.precio = !pub.precio; el.classList.toggle('on', pub.precio); pubRedibujar(true); };
ACT.pubDatos = () => { pub.vend = ($('#pub-v').value || '').trim().replace(/[<>"'`]/g, '').slice(0, 40); pub.fono = ($('#pub-f').value || '').trim().replace(/[^\d+ ()-]/g, '').slice(0, 20); pubRedibujar(true); };
ACT.pubTexto = async () => { const t = pubTextoPost(getItem(pub.id)); try { await navigator.clipboard.writeText(t); toast('Texto copiado: pégalo en tu publicación', 'copy'); } catch (e) { prompt('Copia el texto:', t); } };
// imagen final como archivo JPG
async function pubArchivo() {
  const it = getItem(pub.id), c = document.createElement('canvas'); await pubFonts(); await pubRender(c, it, pub);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.92));
  const slug = (it.nombre || 'publicacion').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return new File([blob], `${slug}-${{ story: 'historia', hoja: 'hoja-qr', vidrio: 'ficha-vidrio' }[pub.fmt] || 'post'}.jpg`, { type: 'image/jpeg' });
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
