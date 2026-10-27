/* =====================================================================
   NÚCLEO: iconos, marca, estado, selectores, navegación, sheets, toasts
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rAF2 = f => requestAnimationFrame(() => requestAnimationFrame(f));

const ICONS = {
  gauge: '<path d="M4.6 17.5a8.5 8.5 0 1 1 14.8 0"/><path d="M12 14l3.6-4.6"/><circle cx="12" cy="14.2" r="1.3" fill="currentColor" stroke="none"/><path d="M12 6.2v1.3M6.4 8.6l.9.9M17.6 8.6l-.9.9"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5L12 12 3.5 7.5Z"/><path d="M3.5 7.5V16l8.5 4.5V12"/><path d="M20.5 7.5V16L12 20.5"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M14.5 9.3c-.4-.7-1.4-1.1-2.5-1.1-1.4 0-2.5.7-2.5 1.9 0 2.6 5 1.2 5 3.8 0 1.2-1.3 1.9-2.7 1.9-1.2 0-2.3-.5-2.7-1.3"/>',
  calc: '<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="M7.5 7h9M7.5 11h2.2M11.8 11h2.2M16 11h.5M7.5 14.5h2.2M11.8 14.5h2.2M16 14.5h.5M7.5 18h2.2M11.8 18h2.2M16 18h.5"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 13.2c2.4.2 4.5 2 4.5 4.8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M4.9 7l1.9 1.1M17.2 15.9l1.9 1.1M3 12h2.2M18.8 12H21M4.9 17l1.9-1.1M17.2 8.1l1.9-1.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevL: '<path d="M15 5 8 12l7 7"/>', chevR: '<path d="M9 5l7 7-7 7"/>', chevD: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 13l4.5 4.5L19 7"/>',
  car: '<path d="M3.5 15.5 5 10a2 2 0 0 1 2-1.5h10a2 2 0 0 1 2 1.5l1.5 5.5"/><rect x="2.5" y="15.5" width="19" height="4.5" rx="1.5"/><circle cx="7" cy="18" r="1.1"/><circle cx="17" cy="18" r="1.1"/>',
  building: '<rect x="5" y="3.5" width="9" height="17" rx="1"/><rect x="14.5" y="9.5" width="5" height="11" rx="1"/><path d="M8 7.5h2M8 11h2M8 14.5h2"/>',
  bag: '<path d="M5.5 8h13l1 12.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5L5.5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>',
  warn: '<path d="M12 4 21 19H3L12 4Z"/><path d="M12 10v4"/><circle cx="12" cy="16.8" r=".4" fill="currentColor" stroke="none"/>',
  trophy: '<path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5 3.5 3.5 0 0 0 6.5 11H7M17 6h2.5A1.5 1.5 0 0 1 21 7.5 3.5 3.5 0 0 1 17.5 11H17"/><path d="M12 15v3M9 21h6M10 18h4"/>',
  trash: '<path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 12.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5L17 7"/><path d="M10 11v6M14 11v6"/>',
  power: '<path d="M12 4v7"/><path d="M7 6.3a7 7 0 1 0 10 0"/>',
  camera: '<path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h1.6l1-1.6a1.5 1.5 0 0 1 1.3-.7h5.2a1.5 1.5 0 0 1 1.3.7l1 1.6h1.6A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"/><circle cx="12" cy="13" r="3.6"/>',
  doc: '<path d="M7 3.5h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V7a1 1 0 0 0 1 1h3.3"/><path d="M8.5 12h7M8.5 15h7M8.5 18h4"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.5 3 7 7 9 4-2 7-4.5 7-9V6l-7-2.5Z"/><path d="M9 12l2 2 4-4.3"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 1 1 18.5 10c0 5.3-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  phone: '<path d="M7 3.5h3l1.3 4L9.5 9.2a11 11 0 0 0 5.3 5.3l1.7-1.8 4 1.3v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 5.5 5.1 1.5 1.5 0 0 1 7 3.5Z"/>',
  edit: '<path d="M4 20h4.2l10-10-4.2-4.2-10 10V20Z"/><path d="M13 7l4 4"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20c0-4 3.3-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  receipt: '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15L6 16.5Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z"/>',
  tag: '<path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5L3.5 12.5Z"/><circle cx="8" cy="8" r="1.3"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  chat: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-7Z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>', arrowDn: '<path d="M12 5v14M6 13l6 6 6-6"/>', arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  sparkle: '<path d="M12 4l1.8 4.7L18.5 10.5 13.8 12.3 12 17l-1.8-4.7L5.5 10.5l4.7-1.8L12 4Z"/>',
  home: '<path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5a2 2 0 0 1 2-2 2 2 0 0 1 2 2V21h3.5a1 1 0 0 0 1-1V9.5"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  key: '<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5 19 4M16 7l2.5 2.5M13.5 9.5l2 2"/>',
  flame: '<path d="M12 3c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1.2 2 2 2-.5-3 0-5 1-8Z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  bed: '<path d="M3.5 19V9.5A1.5 1.5 0 0 1 5 8h14a1.5 1.5 0 0 1 1.5 1.5V19"/><path d="M3.5 16h17"/><path d="M6 13h4.5v3H6ZM13.5 13H18v3h-4.5Z"/>',
  ruler: '<path d="M3.5 16.5 16.5 3.5l4 4-13 13-4-4Z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  userplus: '<circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M19 8v6M16 11h6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  send: '<path d="M20.5 3.5 3.5 10.5l6.5 2.5 2.5 6.5 8-16Z"/><path d="M10 13l10.5-9.5"/>',
  bank: '<path d="M3.5 9.5 12 4l8.5 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3.5 20h17"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  crown: '<path d="M4 8l4 4 4-6 4 6 4-4-1.5 10h-13L4 8Z"/>',
  minus: '<path d="M5 12h14"/>',
  whatsapp: '<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20Z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2L9 8.5Z"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.5-5.8L4 8.5"/><path d="M4 4v4.5h4.5M12 8v4l3 2"/>',
  user2: '<circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20c0-4 3.3-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
  thermo: '<path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z"/>',
};
const icon = (n, s = 18, sw = 1.75) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------------- marca ---------------- */
const logo = (s = 28, color = 'currentColor') => `<svg viewBox="0 0 32 32" width="${s}" height="${s}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M5.8 24a12.6 12.6 0 1 1 20.4 0"/><path d="M16 20.2l5.6-7.2"/><circle cx="16" cy="20.4" r="2.1" fill="${color}" stroke="none"/></svg>`;
const plate = (t, lg = false) => { const [a, b] = t.split('·'); return `<span class="plate${lg ? ' lg' : ''}" aria-label="Patente ${t}"><b>${a}·${b}</b><i>CHILE</i></span>`; };
const rolTag = t => `<span class="rol">${icon('key', 12)}ROL ${t}</span>`;
const skuTag = t => `<span class="sku">${t}</span>`;
const idChip = (it, lg) => it.w === 'auto' ? plate(it.sku, lg) : it.w === 'prop' ? rolTag(it.sku) : skuTag(it.sku);

/* ---------------- estado y selectores ---------------- */
const state = { world: null, tab: 'panel', fFilter: 'todos', fSort: 'rec', q: '', cajaP: 'mes' };
const W = () => WORLDS[state.world];
const itemsOf = w => STOCK.filter(s => s.w === w);
const getItem = id => STOCK.find(s => s.id === id);
// la venta que registra un vendedor (autos y propiedades) cuenta recién cuando el administrador la aprueba
const aprobada = v => !v.aprob || v.aprob === 'aprobada';
const conAprobacion = w => w !== 'tienda';
const ventasOf = (w, mk) => VENTAS.filter(v => v.w === w && aprobada(v) && (!mk || v.fecha.startsWith(mk)));
const porAprobar = w => VENTAS.filter(v => v.w === w && v.aprob === 'pendiente');
const comision = v => v.comTipo === 'pct' ? Math.round(v.ingreso * v.comVal / 100) : v.comVal;
// comisión que paga la financiera por los créditos de esta venta (es ingreso de la automotora)
const comFin = v => v.pagos.reduce((a, p) => a + (p.fin ? p.fcm || 0 : 0), 0);
const utilidad = v => v.ingreso - v.costo - comision(v) + comFin(v);
// comisiones de financieras pendientes de pago (de créditos ya cursados o en curso)
function finComRows(w, filtro = 'pend') {
  const out = []; ventasOf(w).forEach(v => v.pagos.forEach((p, i) => { if (p.fin && p.fcm > 0 && (filtro === 'todas' || (filtro === 'pend') === (p.fcs !== 'pagada'))) out.push({ v, p, i }); }));
  return out.sort((a, b) => (b.v.fecha).localeCompare(a.v.fecha));
}
// un gasto fijo cuenta todos los meses desde que se registró
const gastosMes = (w, mk = MK()) => GASTOS.filter(g => g.w === w && (g.fecha.startsWith(mk) || (g.fijo && g.fecha.slice(0, 7) < mk)));
const sum = (a, f) => a.reduce((x, y) => x + f(y), 0);
function monthStats(w, mk) {
  const vs = ventasOf(w, mk), gs = gastosMes(w, mk);
  const bruta = sum(vs, utilidad), gastos = sum(gs, g => g.monto);
  return { n: vs.length, ingreso: sum(vs, v => v.ingreso), volumen: sum(vs, v => v.precio), com: sum(vs, comision), bruta, gastos, neta: bruta - gastos };
}
const diasStock = it => daysSince(it.ingreso);
const bucketIdx = d => d <= 30 ? 0 : d <= 60 ? 1 : d <= 90 ? 2 : 3;
const BUCKETS = [{ l: '0–30', c: 'var(--good)' }, { l: '31–60', c: 'var(--warn)' }, { l: '61–90', c: 'var(--hot)' }, { l: '90+', c: 'var(--bad)' }];
const BUCKETS_T = [{ l: '0–15', c: 'var(--good)' }, { l: '16–30', c: 'var(--warn)' }, { l: '31–60', c: 'var(--hot)' }, { l: '60+', c: 'var(--bad)' }];
const bucketT = d => d <= 15 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : 3;
const activos = w => itemsOf(w).filter(i => w === 'tienda' ? i.stock > 0 : !['vendido', 'arrendado'].includes(i.estado));
const shortName = n => n.split(' · ')[0].replace(/\s\d{4}$/, '');
const minTxt = m => m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;

function docState(venc) {
  const d = diffDays(venc);
  const est = d <= 7 ? 'bad' : d <= 30 ? 'warn' : 'ok';
  const txt = d < 0 ? `Vencido hace ${-d}d` : d === 0 ? 'Vence hoy' : d <= 30 ? `Vence en ${d}d` : `Al día · vence ${fechaCorta(venc)}`;
  return { est, txt, d };
}
function docsOf(it) {
  if (it.w === 'auto') {
    const p = it.permiso, ps = docState(p.venc);
    const permiso = p.pagadas >= 2
      ? { k: 'permiso', label: 'Permiso de circulación', icon: 'doc', est: 'ok', txt: 'Al día · 2 cuotas pagadas' }
      : { k: 'permiso', label: 'Permiso de circulación', icon: 'doc', est: ps.est === 'ok' ? 'warn' : ps.est, txt: `${p.pagadas} de 2 cuotas · ${p.pagadas === 0 ? '1ª' : '2ª'} vence ${fechaCorta(p.venc)}${ps.d >= 0 ? ` (${ps.d}d)` : ''}` };
    const r = docState(it.rev), s = docState(it.soap);
    return [permiso, { k: 'rev', label: 'Revisión técnica', icon: 'shield', ...r }, { k: 'soap', label: 'SOAP', icon: 'shield', ...s }];
  }
  if (it.w === 'prop') {
    const a = docState(it.docs.dominio), b = docState(it.docs.grav), m = docState(it.mandato);
    return [
      { k: 'dominio', label: 'Certificado de dominio', icon: 'doc', ...a },
      { k: 'grav', label: 'Hipotecas y gravámenes', icon: 'doc', ...b },
      { k: 'contrib', label: 'Contribuciones', icon: 'receipt', est: it.docs.contrib ? 'ok' : 'bad', txt: it.docs.contrib ? 'Al día' : 'Con deuda pendiente' },
      { k: 'mandato', label: 'Mandato de corretaje', icon: 'key', ...m },
    ];
  }
  return [];
}
const docIssues = it => docsOf(it).filter(d => d.est !== 'ok');
const ptm = it => it.mercado ? (it.precio / it.mercado - 1) : 0;

/* ---------------- alertas (la cola de "qué requiere mi atención hoy") ---------------- */
function alertsFor(w) {
  const A = [];
  const it = itemsOf(w), pa = porAprobar(w);
  const ip = it.filter(i => i.aprob === 'pendiente');
  if (ip.length && isAdmin()) A.push({ sev: 'warn', icon: WORLDS[w].icon, title: `${ip.length} ${ip.length > 1 ? WORLDS[w].itemMany.toLowerCase() : WORLDS[w].itemOne.toLowerCase()} por aprobar`, sub: ip.slice(0, 3).map(i => `${shortName(i.nombre)}${i.creadoPor ? ' · ' + firstName(i.creadoPor.nombre) : ''}`).join(' / ') + ' · ponles precio', act: 'item', id: ip[0].id });
  if (pa.length && isAdmin()) A.push({ sev: 'warn', icon: 'check', title: `${pa.length} venta${pa.length > 1 ? 's' : ''} por aprobar`, sub: pa.slice(0, 3).map(v => `${firstName(v.vend)} · ${fmtM(v.ingreso)}`).join(' / '), act: pa.length === 1 ? 'venta' : 'ventas', id: pa[0].id });
  if (isVend()) {
    VENTAS.filter(v => v.w === w && v.aprob === 'rechazada').forEach(v => A.push({ sev: 'bad', icon: 'warn', title: `Venta rechazada · ${shortName((getItem(v.itemId) || { nombre: v.cliente }).nombre)}`, sub: v.motivo || 'Revisa con el administrador', act: 'venta', id: v.id }));
    if (pa.length) A.push({ sev: 'info', icon: 'clock', title: `${pa.length} venta${pa.length > 1 ? 's' : ''} esperando aprobación`, sub: 'Tu comisión aparece cuando el administrador la apruebe.', act: pa.length === 1 ? 'venta' : 'ventas', id: pa[0].id });
  }
  if (w === 'auto') {
    const sr = LEADS.filter(l => l.w === w && l.etapa === 'nuevo' && leadMin(l) > 10);
    if (sr.length) A.push({ sev: 'bad', icon: 'chat', title: `${sr.length} consulta${sr.length > 1 ? 's' : ''} sin responder`, sub: `La más antigua espera ${minTxt(Math.max(...sr.map(leadMin)))}. Responder en menos de 10 min sube el cierre.`, act: 'leads' });
    it.filter(i => i.estado !== 'vendido').forEach(i => docIssues(i).forEach(d => A.push({ sev: d.est, icon: d.icon, title: `${shortName(i.nombre)} · ${d.label}`, sub: d.txt, act: 'item', id: i.id, tab: 'docs' })));
    it.filter(i => i.estado === 'disponible' && diasStock(i) >= 60).sort((a, b) => diasStock(b) - diasStock(a)).forEach(i => {
      const d = diasStock(i), p = ptm(i);
      A.push({ sev: d >= 90 ? 'bad' : 'warn', icon: 'clock', title: `${shortName(i.nombre)} lleva ${d} días`, sub: isVend() ? (p > 0.015 ? `Precio ${(p * 100).toFixed(1).replace('.', ',')}% sobre mercado` : 'Revisa precio, fotos y publicaciones') : p > 0.015 ? `Precio ${(p * 100).toFixed(1).replace('.', ',')}% sobre mercado · ${fmt(i.costo + i.recon)} inmovilizados` : `${fmt(i.costo + i.recon)} inmovilizados`, act: 'item', id: i.id });
    });
    it.filter(i => i.reservaVenc).forEach(i => A.push({ sev: 'warn', icon: 'key', title: `Reserva ${shortName(i.nombre)} vence en ${diffDays(i.reservaVenc)}d`, sub: 'Falta el curso del crédito automotriz.', act: 'item', id: i.id }));
    ventasOf(w).forEach(v => v.pagos.filter(p => p.s === 'pendiente').forEach(p => { const d = diffDays(p.v); if (d <= 7) A.push({ sev: 'warn', icon: p.fin ? 'bank' : 'receipt', title: `${p.m}${p.fin ? ' · ' + finName(p.fin) : ''} por cobrar · ${fmtM(p.a)}`, sub: `${v.cliente} · ${p.fin ? 'crédito ' + ({ evaluacion: 'en evaluación', aprobado: 'aprobado, falta cursar', cursado: 'cursado' }[p.cr]) + ' · ' : ''}${d < 0 ? 'vencido hace ' + -d + 'd' : 'vence en ' + d + 'd'}`, act: 'venta', id: v.id }); }));
    const fpend = {}; if (!isVend()) finComRows('auto').filter(r => r.p.cr === 'cursado').forEach(r => { const o = fpend[r.p.fin] || (fpend[r.p.fin] = { m: 0, n: 0 }); o.m += r.p.fcm; o.n++; });
    Object.entries(fpend).forEach(([k, o]) => A.push({ sev: 'info', icon: 'bank', title: `${finName(k)} te debe ${fmt(o.m)} en comisiones`, sub: `${o.n} crédito${o.n > 1 ? 's' : ''} cursado${o.n > 1 ? 's' : ''} · márcalas como pagadas cuando lleguen`, act: 'fincom' }));
    ventasOf(w).filter(v => v.tramite === 'pendiente').forEach(v => A.push({ sev: 'info', icon: 'doc', title: `Traspaso pendiente · ${shortName((getItem(v.itemId) || { nombre: v.cliente }).nombre)}`, sub: `Registro Civil · ${daysSince(v.fecha)} días desde la venta`, act: 'venta', id: v.id }));
  } else if (w === 'prop') {
    const sr = LEADS.filter(l => l.w === w && l.etapa === 'nuevo' && leadMin(l) > 10);
    if (sr.length) A.push({ sev: 'bad', icon: 'chat', title: `${sr.length} consulta${sr.length > 1 ? 's' : ''} sin responder`, sub: 'El primero en contestar suele quedarse con la visita.', act: 'leads' });
    const vis = LEADS.filter(l => l.w === w && l.etapa === 'visita');
    if (vis.length) A.push({ sev: 'info', icon: 'calendar', title: `${vis.length} consulta${vis.length > 1 ? 's' : ''} en etapa de visita`, sub: vis.slice(0, 3).map(l => { const i = getItem(l.itemId); return firstName(l.nombre) + (i ? ' · ' + shortName(i.nombre) : ''); }).join(' / '), act: 'leads' });
    it.filter(i => i.estado === 'reservado').forEach(i => A.push({ sev: 'warn', icon: 'key', title: `Promesa por firmar · ${shortName(i.nombre)}`, sub: `Honorario proyectado ${fmt(i.op === 'Arriendo' ? i.precio : Math.round(i.precio * 0.04))}`, act: 'item', id: i.id }));
    it.filter(i => !['vendido', 'arrendado'].includes(i.estado)).forEach(i => docIssues(i).forEach(d => A.push({ sev: d.est, icon: d.icon, title: `${shortName(i.nombre)} · ${d.label}`, sub: d.txt, act: 'item', id: i.id, tab: 'docs' })));
    it.filter(i => i.estado === 'disponible' && visitas14(i) === 0 && daysSince(i.ingreso) > 30).forEach(i => A.push({ sev: 'warn', icon: 'eye', title: `${shortName(i.nombre)}: 0 visitas en 14 días`, sub: 'Revisa precio, fotos y descripción del aviso.', act: 'item', id: i.id }));
    ventasOf(w).forEach(v => v.pagos.filter(p => p.s === 'pendiente').forEach(p => A.push({ sev: 'info', icon: 'receipt', title: `Honorario por cobrar · ${fmtM(p.a)}`, sub: `${v.cliente} · ${diffDays(p.v) < 0 ? 'vencido' : 'vence en ' + diffDays(p.v) + 'd'}`, act: 'venta', id: v.id })));
  } else {
    it.filter(i => i.stock < i.minimo).sort((a, b) => a.stock / a.minimo - b.stock / b.minimo).forEach(i => A.push({ sev: i.stock === 0 ? 'bad' : i.stock / i.minimo < 0.5 ? 'bad' : 'warn', icon: 'box', title: `${i.nombre}: ${i.stock === 0 ? 'agotado' : `quedan ${i.stock}`}`, sub: `Mínimo ${i.minimo} · vende ${ventas30(i)} al mes · reponer ${Math.max(i.minimo * 2 - i.stock, 0)} un.`, act: 'item', id: i.id }));
    it.filter(i => i.stock > 0 && daysSince(i.ultimaVenta) >= 45).forEach(i => A.push({ sev: 'warn', icon: 'clock', title: `${i.nombre}: ${daysSince(i.ultimaVenta)} días sin venderse`, sub: isVend() ? `${i.stock} unidades sin movimiento` : `${fmt(i.costoU * i.stock)} detenidos en ${i.stock} unidades. Liquida con descuento.`, act: 'item', id: i.id }));
  }
  REMS.filter(r => r.w === w && !r.hecho && r.cuando.slice(0, 10) <= TODAY).forEach(r => { const late = r.cuando < nowISO(); A.push({ sev: late ? 'bad' : 'info', icon: 'bell', title: r.titulo, sub: late ? `Recordatorio vencido · era a las ${hhmm(r.cuando)}` : `Recordatorio · hoy ${hhmm(r.cuando)}`, act: 'reminder', id: r.id }); });
  const rank = { bad: 0, warn: 1, info: 2, ok: 3 };
  return A.sort((a, b) => rank[a.sev] - rank[b.sev]);
}

/* ---------------- piezas visuales ---------------- */
function odo(n, cur = true) {
  const neg = n < 0, s = Math.abs(Math.round(n)).toLocaleString('es-CL'); let i = 0; const out = [];
  if (neg) out.push('<span class="s min">−</span>'); if (cur) out.push('<span class="s cur">$</span>');
  for (const ch of s) out.push(/\d/.test(ch) ? `<span class="c"><span class="strip" style="--d:${ch};--i:${i++}">${'0123456789'.split('').map(d => `<i>${d}</i>`).join('')}</span></span>` : '<span class="s sep">.</span>');
  return `<span class="odo" role="img" aria-label="${fmt(n)}">${out.join('')}</span>`;
}
function ring(p, label = '') {
  const c = 2 * Math.PI * 34;
  return `<div class="ring" style="--c:${c.toFixed(1)};--p:${Math.min(1, Math.max(0, p)).toFixed(3)}"><svg viewBox="0 0 86 86"><circle class="tr" cx="43" cy="43" r="34"/><circle class="pr" cx="43" cy="43" r="34"/></svg><div class="rv"><b>${Math.round(p * 100)}%</b><small>${label}</small></div></div>`;
}
function spark(vals, w = 380, h = 62) {
  const min = Math.min(0, ...vals), max = Math.max(1, ...vals), pad = 8;
  const X = i => pad + (w - 2 * pad) * i / (vals.length - 1), Y = v => h - pad - (h - 2 * pad) * (v - min) / (max - min);
  let d = `M${X(0)},${Y(vals[0])}`;
  for (let i = 1; i < vals.length; i++) { const mx = (X(i - 1) + X(i)) / 2; d += ` C${mx},${Y(vals[i - 1])} ${mx},${Y(vals[i])} ${X(i)},${Y(vals[i])}`; }
  const last = vals.length - 1, z = Y(0);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".32"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
  ${min < 0 ? `<line class="goalln" x1="0" x2="${w}" y1="${z}" y2="${z}"/>` : ''}<path class="area" d="${d} L${X(last)},${h} L${X(0)},${h} Z"/><path class="ln" pathLength="1" d="${d}"/><circle class="dot" cx="${X(last)}" cy="${Y(vals[last])}" r="4"/></svg>`;
}
// al refrescarse los datos, lo nuevo aparece directo (sin repetir animaciones); no se toca lo que ya animó
function sinAnimar(root) {
  $$('.reveal,.row,.alert,.qa button', root).forEach(e => { e.style.animation = 'none'; });
  root.classList.add('noanim');
  $$('.odo,.ring,.spark,.agebar,.funnel,.bars6,.pulse,.pbar,.gauge', root).forEach(e => e.classList.add('go'));
  void root.offsetWidth; rAF2(() => root.classList.remove('noanim'));
}
// al tocar una pestaña: los números parten de cero y se animan una sola vez
function reanimar(root) {
  const els = $$('.odo,.ring,.spark,.agebar,.funnel,.bars6,.pulse,.pbar,.gauge', root);
  root.classList.add('noanim'); els.forEach(e => e.classList.remove('go')); void root.offsetWidth; root.classList.remove('noanim');
  rAF2(() => els.forEach(e => e.classList.add('go')));
}
function quietas() { if ($('#app').classList.contains('quieto')) $$('.screen').forEach(sinAnimar); }
function animateIn(root = document) {
  // ya dentro del mundo, las pantallas principales no se vuelven a animar (al guardar, filtrar o cambiar de mes)
  if (root && root.classList && root.classList.contains('screen') && $('#app').classList.contains('quieto')) { sinAnimar(root); return; }
  rAF2(() => $$('.odo,.ring,.spark,.agebar,.funnel,.bars6,.pulse,.pbar,.gauge', root).forEach(e => e.classList.add('go')));
}

/* ---------------- toasts / sheets / push ---------------- */
function toast(msg, ic = 'check') {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<span class="ti">${icon(ic, 13)}</span><span>${clean(msg)}</span>`;
  $('#toast-wrap').appendChild(el); setTimeout(() => el.remove(), 2900);
}
function closeSheet() {
  const sb = $('#sb'); if (!sb) return; sb.classList.remove('open'); sb.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); sb.removeAttribute('id'); setTimeout(() => sb.remove(), 560);
}
function openSheet(title, html, onReady) {
  closeSheet();
  const layer = $('#sheet-layer');
  layer.insertAdjacentHTML('beforeend', `<div class="sbackdrop" id="sb" data-act="sbBg"><div class="sheet" id="sh"><div class="grab" id="grab"><i></i></div><div class="shead"><h2>${title}</h2><button class="ibtn" data-act="closeSheet" aria-label="Cerrar">${icon('close')}</button></div><div class="sbody">${html}</div></div></div>`);
  const sb = $('#sb'), sh = $('#sh'), grab = $('#grab'); let y0 = 0, dy = 0, drag = false, t0 = 0;
  grab.addEventListener('pointerdown', e => { drag = true; y0 = e.clientY; t0 = performance.now(); sb.classList.add('drag'); grab.setPointerCapture(e.pointerId); });
  grab.addEventListener('pointermove', e => { if (!drag) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (!drag) return; drag = false; sb.classList.remove('drag'); const v = dy / (performance.now() - t0); sh.style.transform = ''; if (dy > 120 || v > 0.6) closeSheet(); dy = 0; };
  grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
  rAF2(() => { sb.classList.add('open'); onReady && onReady(sh); animateIn(sh); });
}
// aviso dentro de la app: se va solo, se quita arrastrándolo hacia arriba y al tocarlo abre lo que avisa
function notify(title, body, onTap) {
  const el = document.createElement('div'); el.className = 'notif'; el.setAttribute('role', 'status');
  el.innerHTML = `<span class="nicon">${logo(22, 'var(--accent-ink)')}</span><span class="grow"><span class="top"><b>GESTIX</b><i>${onTap ? 'toca para abrir' : 'ahora'}</i></span><p class="t">${clean(title)}</p><p class="b">${clean(body)}</p></span>`;
  $('#shell').appendChild(el); rAF2(() => el.classList.add('in'));
  let gone = false, y0 = null, dy = 0, t0 = 0;
  const quitar = () => { if (gone) return; gone = true; el.style.transition = ''; el.style.transform = ''; el.classList.remove('in'); setTimeout(() => el.remove(), 600); };
  let timer = setTimeout(quitar, 6000);
  el.addEventListener('pointerdown', e => { y0 = e.clientY; dy = 0; t0 = performance.now(); el.style.transition = 'none'; clearTimeout(timer); el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.min(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
  const soltar = () => {
    if (y0 === null) return; y0 = null; const v = -dy / Math.max(1, performance.now() - t0);
    if (dy < -24 || v > 0.4) { quitar(); return; }                 // arrastrado hacia arriba
    el.style.transition = ''; el.style.transform = '';
    if (dy > -6) { quitar(); if (onTap) onTap(); return; }          // fue un toque
    timer = setTimeout(quitar, 4000);
  };
  el.addEventListener('pointerup', soltar); el.addEventListener('pointercancel', soltar);
}
const pushes = [];
function pushScreen(title, html, { cta = '', right = '', onReady } = {}) {
  const layer = $('#push-layer'), el = document.createElement('div'); el.className = 'push';
  el.innerHTML = `<div class="pbg"></div><div class="pnav"><button class="back" data-act="back">${icon('chevL', 18, 2.2)}Atrás</button><span class="ptitle">${title}</span><div style="min-width:84px;display:flex;justify-content:flex-end;gap:8px">${right}</div></div><div class="pbody${cta ? ' hascta' : ''}">${html}</div>${cta ? `<div class="cta-bar">${cta}</div>` : ''}`;
  layer.appendChild(el); const prev = pushes[pushes.length - 1]; if (prev) prev.classList.add('under'); pushes.push(el);
  $('#dock').classList.add('hide');
  // gesto: arrastrar desde el borde izquierdo para volver
  let x0 = null, dx = 0;
  el.addEventListener('pointerdown', e => { const r = el.getBoundingClientRect(); if (e.clientX - r.left < 26 && el === pushes[pushes.length - 1]) { x0 = e.clientX; el.style.transition = 'none'; } });
  el.addEventListener('pointermove', e => { if (x0 === null) return; dx = Math.max(0, e.clientX - x0); el.style.transform = `translateX(${dx}px)`; });
  const up = () => { if (x0 === null) return; x0 = null; el.style.transition = ''; el.style.transform = ''; if (dx > 110) popScreen(); dx = 0; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  rAF2(() => { el.classList.add('in'); animateIn(el); onReady && onReady(el); });
  return el;
}
function popScreen() {
  const el = pushes.pop(); if (!el) return;
  el.classList.remove('in'); el.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); const prev = pushes[pushes.length - 1]; if (prev) prev.classList.remove('under'); else $('#dock').classList.remove('hide');
  setTimeout(() => el.remove(), 560);
}
const topPush = () => pushes[pushes.length - 1];

/* ---------------- delegación de eventos ---------------- */
const ACT = {};
// acciones que cambian datos (solo lectura no puede) y las que son solo del administrador
const WRITE_ACTS = new Set('recSetTime ventaBorrar crFcp crFcs saveItem saveVenta saveGasto delGasto togFijo setPermiso setDoc togContrib togPub addFotos rmFoto reponer editarItem nuevaVentaItem nuevaVenta nuevoItem nuevoGasto crFin crStep cobrar tramiteOk addBoleta gastoBoleta itemNota gastoNota addVisita saveContacto nuevoContacto delContacto nuevaConsulta saveConsulta leadStage leadTemp leadNote leadWon leadReopen leadLost lostSave recDone recDone2 recDel recSnooze nuevoRecordatorio saveRecordatorio consultaContacto recContacto recLead hubAdd delItem'.split(' '));
const ADMIN_ACTS = new Set('itemAprobar itemDescartar activarMundo ventaAprobar ventaRechazar ventaRechazarOk vaCt leadVend vDatos catFinCom catToggle catDel catAdd catQuick catQuickSave planPick planConfirm addon userInvite userInviteSave userSave userDel vCom togVend nuevoVendedor saveVendedor accent delVendedor'.split(' '));
function allowAct(name) {
  if (ADMIN_ACTS.has(name) && !isAdmin()) { toast('Solo el administrador puede cambiar esto', 'lock'); return false; }
  if ((WRITE_ACTS.has(name) || ADMIN_ACTS.has(name)) && !canWrite()) { toast(ME.rol === 'lectura' ? 'Tu usuario es de solo lectura' : enIOS() ? 'Tu cuenta está en solo lectura' : 'Tu cuenta está en solo lectura: elige un plan para seguir', 'lock'); return false; }
  return true;
}
// cada cambio se guarda solo (en la nube se sincroniza con un pequeño retraso)
const saved = () => {
  if (window.RV && RV.dirty) RV.dirty();
  // en el iPhone los recordatorios se programan como avisos del sistema
  if (window.RV && RV.syncReminders) { clearTimeout(saved._t); saved._t = setTimeout(() => RV.syncReminders(REMS.filter(r => puedeMundo(r.w))), 1500); }
};
function runAct(name, el, e) {
  const fn = ACT[name]; if (!fn || !allowAct(name)) { if (fn && el.tagName === 'A') e.preventDefault(); return; }
  try { const r = fn(el.dataset, el, e); if (r && r.then) r.then(saved, err => { console.error(err); saved(); }); } finally { saved(); }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (e.target.closest('input[type=file]')) return;
  runAct(el.dataset.act, el, e);
});
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el) runAct(el.dataset.change, el, e); });
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches && el.matches('input:not([type=file]):not([type=date]):not([type=number]),textarea') && /[<>"'`]/.test(el.value)) { const p = el.selectionStart; el.value = clean(el.value); try { el.setSelectionRange(p, p); } catch (x) { } }
  if (el.matches && el.matches('[data-money]')) { const d = el.value.replace(/\D/g, ''); el.value = d ? '$' + Number(d).toLocaleString('es-CL') : ''; }
  const f = el.closest && el.closest('[data-live]'); if (f && ACT[f.dataset.live]) ACT[f.dataset.live](f.dataset, f, e);
});
ACT.back = () => popScreen();
ACT.closeSheet = () => closeSheet();
ACT.sbBg = (d, el, e) => { if (e.target === el) closeSheet(); };
const money = v => Number(String(v).replace(/\D/g, '')) || 0;

/* ---------------- fotos: se achican antes de guardar ---------------- */
function readImage(file, max = 1400, q = 0.82) {
  return new Promise((ok, bad) => {
    const r = new FileReader(); r.onerror = bad;
    r.onload = () => { const img = new Image(); img.onerror = () => ok(r.result); img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', q)); }; img.src = r.result; };
    r.readAsDataURL(file);
  });
}
// en la nube la foto sube al almacenamiento y se guarda su ruta; en demo queda en memoria
const storeImage = async dataUrl => (window.RV && RV.upload) ? RV.upload(dataUrl) : dataUrl;
const fotoSrc = f => !f ? '' : /^(data:|https?:|blob:)/.test(f) ? f : ((window.RV && RV.fileUrl && RV.fileUrl(f)) || '');
