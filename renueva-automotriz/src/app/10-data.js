/* =====================================================================
   DATOS: reloj real, mundos, catálogos y colecciones (se llenan desde la
   nube o, en modo demo, con datos de ejemplo)
   ===================================================================== */
const MS = 86400000;
const pad2 = n => String(n).padStart(2, '0');
const isoD = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isoDT = d => `${isoD(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
let TODAY = isoD(new Date());
const dateOf = iso => new Date(iso + 'T12:00:00');
const addDays = (iso, n) => { const d = dateOf(iso); d.setDate(d.getDate() + n); return isoD(d); };
const diffDays = (a, b = TODAY) => a ? Math.round((dateOf(a.slice(0, 10)) - dateOf(b)) / MS) : 0;
const daysSince = iso => -diffDays(iso);
const nowISO = () => isoDT(new Date());
const tick = () => nowISO();
const minsAgo = ts => ts ? Math.max(0, Math.round((Date.now() - new Date(ts + ':00')) / 60000)) : 0;
const hhmm = ts => ts.slice(11, 16);
const monthKey = (iso, delta = 0) => { const d = dateOf(iso.slice(0, 7) + '-15'); d.setMonth(d.getMonth() + delta); return isoD(d).slice(0, 7); };
let CUR = TODAY.slice(0, 7), PREV = monthKey(TODAY, -1);
// mes que se está mirando (por defecto el actual); "ahora" (alertas, consultas) siempre es hoy
let MES_SEL = null;
const MK = () => MES_SEL || CUR;
const MKP = () => monthKey(MK(), -1);
const esMesActual = () => MK() === CUR;
const diasMes = mk => new Date(+mk.slice(0, 4), +mk.slice(5, 7), 0).getDate();
const MES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const mesDe = mk => MES[+mk.slice(5, 7) - 1];
const fmt = n => (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n || 0)).toLocaleString('es-CL');
const fmtM = n => fmt(n); // siempre el monto completo, ej: $25.000.000
const fechaCL = iso => iso ? dateOf(iso.slice(0, 10)).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fechaCorta = iso => iso ? dateOf(iso.slice(0, 10)).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '') : '—';
const initials = n => String(n || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
// los textos que escribe la gente se guardan sin caracteres de HTML (evita que un nombre rompa la pantalla)
const SAFE = { '<': '‹', '>': '›', '"': '”', "'": '’', '`': 'ʼ' };
const clean = s => String(s).replace(/[<>"'`]/g, c => SAFE[c]);
const deepClean = o => typeof o === 'string' ? clean(o) : Array.isArray(o) ? o.map(deepClean) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deepClean(v)])) : o;

/* ---------------- mundos ---------------- */
const WORLDS = {
  auto: {
    key: 'auto', name: 'Auto', brand: 'Renueva Auto', icon: 'car', accent: '#C8F03C', ink: '#141900',
    desc: 'Stock, papeles y cierres de tu automotora', itemOne: 'Vehículo', itemMany: 'Vehículos',
    tabs: { stock: 'Stock', ventas: 'Ventas' }, idLabel: 'Patente', meta: 6000000, metodos: ['Efectivo', 'Transferencia', 'Crédito automotriz', 'Tarjeta de crédito', 'Cheque'],
    nombrePh: 'Ej: Toyota Corolla 2020', cierreLabel: 'Venta',
    campos: [['marca', 'Marca', 'text'], ['modelo', 'Modelo', 'text'], ['anio', 'Año', 'number'], ['km', 'Kilometraje', 'number'], ['color', 'Color', 'text'], ['tipo', 'Tipo', 'text']],
  },
  prop: {
    key: 'prop', name: 'Propiedades', brand: 'Renueva Propiedades', icon: 'building', accent: '#B7A6FF', ink: '#150F33',
    desc: 'Cartera, visitas y honorarios de tu corretaje', itemOne: 'Propiedad', itemMany: 'Propiedades',
    tabs: { stock: 'Cartera', ventas: 'Operaciones' }, idLabel: 'Rol de avalúo', meta: 4000000, metodos: ['Transferencia', 'Vale vista', 'Cheque', 'Efectivo'],
    nombrePh: 'Ej: Depto 3D, Providencia', cierreLabel: 'Operación',
    campos: [['operacion', 'Operación', 'text'], ['tipo', 'Tipo de propiedad', 'text'], ['direccion', 'Dirección', 'text'], ['comuna', 'Comuna', 'text'], ['m2c', 'm² construidos', 'number'], ['m2t', 'm² terreno', 'number'], ['dorm', 'Dormitorios', 'number'], ['banos', 'Baños', 'number']],
  },
  tienda: {
    key: 'tienda', name: 'Tienda', brand: 'Renueva Tienda', icon: 'bag', accent: '#FF8A6B', ink: '#2A0D05',
    desc: 'Inventario, reposición y caja de tu comercio', itemOne: 'Producto', itemMany: 'Productos',
    tabs: { stock: 'Productos', ventas: 'Ventas' }, idLabel: 'SKU', meta: 5000000, metodos: ['Efectivo', 'Débito', 'Tarjeta de crédito', 'Transferencia'],
    nombrePh: 'Ej: Zapatillas Nike Air Max', cierreLabel: 'Venta',
    campos: [['marca', 'Marca', 'text'], ['categoria', 'Categoría', 'text'], ['variante', 'Talla / variante', 'text']],
  },
};
const METODO_ICON = { 'Efectivo': 'dollar', 'Transferencia': 'swap', 'Crédito automotriz': 'car', 'Tarjeta de crédito': 'card', 'Débito': 'card', 'Cheque': 'receipt', 'Vale vista': 'doc' };
const mk = (arr, tipo) => arr.map(([k, n, on = true, t = tipo]) => ({ k, n, on, tipo: t }));
const catDefaults = () => ({
  portales: {
    auto: mk([['c', 'Chileautos'], ['y', 'Yapo'], ['f', 'Marketplace'], ['m', 'Mercado Libre']]),
    prop: mk([['c', 'Portal Inmobiliario'], ['y', 'Yapo'], ['m', 'Mercado Libre']]),
    tienda: mk([['i', 'Instagram'], ['w', 'Catálogo WhatsApp']]),
  },
  // Instituciones que financian en Chile (financieras especializadas, bancos y cajas). Fuente: comparativas del mercado 2026.
  financieras: mk([['forum', 'Forum', true, 'Financiera'], ['autofin', 'Autofin', true, 'Financiera'], ['sconsumer', 'Santander Consumer', true, 'Financiera'], ['tanner', 'Tanner', true, 'Financiera'],
    ['amicar', 'Amicar', true, 'Financiera'], ['crediautos', 'Crediautos (BICE)', true, 'Financiera'], ['maf', 'MAF Chile', true, 'Financiera'], ['dily', 'Dily', false, 'Financiera'],
    ['bchile', 'Banco de Chile', true, 'Banco'], ['bci', 'BCI', true, 'Banco'], ['bestado', 'BancoEstado', true, 'Banco'], ['bsant', 'Banco Santander', true, 'Banco'],
    ['itau', 'Itaú', true, 'Banco'], ['scotia', 'Scotiabank', true, 'Banco'], ['bfala', 'Banco Falabella', false, 'Banco'], ['cla', 'Caja Los Andes', false, 'Caja']]),
  origenes: {
    auto: mk([['wa', 'WhatsApp'], ['ca', 'Chileautos'], ['ya', 'Yapo'], ['mk', 'Marketplace'], ['ml', 'Mercado Libre'], ['ig', 'Instagram'], ['re', 'Referido'], ['lo', 'Llegó al local']]),
    prop: mk([['pi', 'Portal Inmobiliario'], ['ya', 'Yapo'], ['re', 'Referido'], ['ig', 'Instagram'], ['le', 'Letrero'], ['wa', 'WhatsApp']]),
    tienda: [],
  },
  motivos: {
    auto: mk([['m1', 'Precio muy alto'], ['m2', 'Compró en otro lugar'], ['m3', 'Sin crédito aprobado'], ['m4', 'Eligió otro vehículo'], ['m5', 'Ya no le interesa'], ['m6', 'No contesta']]),
    prop: mk([['m1', 'Precio muy alto'], ['m2', 'Eligió otra propiedad'], ['m3', 'Sin crédito hipotecario'], ['m5', 'Ya no le interesa'], ['m6', 'No contesta']]),
    tienda: [],
  },
});
const CAT = catDefaults();
const portalesOf = w => CAT.portales[w].filter(p => p.on);
const portalName = (w, k) => (CAT.portales[w].find(p => p.k === k) || { n: k }).n;
const finsOn = () => CAT.financieras.filter(f => f.on);
const finName = k => (CAT.financieras.find(f => f.k === k) || { n: k }).n;


/* ---------------- colecciones ---------------- */
const STOCK = [], VENTAS = [], GASTOS = [], EQUIPO = [], LEADS = [], REMS = [], CONTACTOS = [];
const COLS = { items: STOCK, ventas: VENTAS, gastos: GASTOS, equipo: EQUIPO, leads: LEADS, rems: REMS, contactos: CONTACTOS };
const PREFS = { accent: {} }; // color por mundo (se guarda con la empresa)
const V = (id, w, itemId, fecha, cliente, fono, vend, ingreso, precio, costo, comTipo, comVal, pagos, extra = {}) =>
  ({ id, w, itemId, fecha, cliente, fono, vend, ingreso, precio, costo, comTipo, comVal, pagos, ...extra });
const G = (id, w, concepto, cat, monto, fecha, fijo, notas = '') => ({ id, w, concepto, cat, monto, fecha, fijo, notas, boleta: null });
const CAT_ICON = { Arriendo: 'home', Sueldo: 'user', Servicios: 'bolt', Marketing: 'sparkle', Mantención: 'wrench', Impuestos: 'receipt', Otros: 'box' };
const ETAPAS = [['nuevo', 'Nuevo'], ['contactado', 'Contactado'], ['visita', 'Visita'], ['trato', 'En trato'], ['reserva', 'Reserva']];
const RANK = { nuevo: 0, contactado: 1, visita: 2, trato: 3, reserva: 4, ganado: 5, perdido: -1 };
const L = (id, w, nombre, fono, itemId, origen, etapa, ts, vend, nota, x = {}) =>
  ({ id, w, nombre, fono, itemId, origen, etapa, ts, creado: ts, vend, nota, temp: 'tibio', motivo: null, log: [], ...x });
const nuevoId = p => p + Date.now().toString(36) + Math.floor(Math.random() * 99);
const leadMin = l => minsAgo(l.ts); // minutos desde el último movimiento

// datos derivados (se calculan, no se guardan)
const visitasDe = it => (it.visBase || 0) + (it.vis || []).length;
const visitas14 = it => (it.vis || []).filter(d => daysSince(d) <= 14).length;
const ventas30 = it => VENTAS.filter(v => v.itemId === it.id && daysSince(v.fecha) <= 30).reduce((a, v) => a + (v.q || 1), 0);
function mesesVend(e) {
  return Array.from({ length: 6 }, (_, k) => { const mk = monthKey(TODAY, k - 5); return { mk, n: VENTAS.filter(v => v.w === e.w && v.vend === e.nombre && v.fecha.startsWith(mk)).length }; });
}

/* ---------------- quién usa la app y su plan ---------------- */
const PLANES = [
  { k: 'standard', n: 'Standard', users: 1, worlds: 1, price: 19990, tag: 'Para partir', feats: ['1 usuario (el administrador)', '1 mundo a elección', 'Recordatorios con notificación', 'WhatsApp con mensaje listo (un toque)', 'Catálogos básicos', 'Soporte por correo'], wa: 0, xl: false },
  { k: 'media', n: 'Media', users: 3, worlds: 2, price: 39990, tag: 'Más elegido', feats: ['Hasta 3 usuarios', '2 mundos', 'Todo lo de Standard', 'Catálogos y financiadoras editables', 'Exportar a Excel', 'Roles: vendedor y solo lectura'], wa: 0, xl: true },
  { k: 'premium', n: 'Premium', users: 7, worlds: 3, price: 69990, tag: 'Equipo completo', feats: ['Hasta 7 usuarios', '3 mundos', 'Todo lo de Media', 'Reportes por vendedor', 'Soporte prioritario'], wa: 0, xl: true },
];
const ME = { id: 'u1', nombre: 'Sebastián S.', email: '', rol: 'admin', mundos: ['auto', 'prop', 'tienda'], plataforma: false };
const ORG = { id: null, nombre: 'Mi empresa' };
const SUB = { plan: 'premium', trial: true, trialLeft: 14, ciclo: 'mensual', extraUsers: 0, extraWorlds: 0, wa: 0, escribible: true, pagadoHasta: null, flow: false };
const USUARIOS = [];
const ENABLED = { auto: true, prop: true, tienda: true };
const planOf = k => PLANES.find(p => p.k === k) || PLANES[0];
const planNow = () => planOf(SUB.plan);
const limUsers = () => planNow().users + SUB.extraUsers;
const limWorlds = () => planNow().worlds + SUB.extraWorlds;
const isAdmin = () => ME.rol === 'admin';
const canWrite = () => ME.rol !== 'lectura' && SUB.escribible;
const puedeMundo = k => ENABLED[k] && (isAdmin() || ME.mundos.includes(k));
const firstName = n => String(n || '').split(' ')[0];

/* ---------------- cargar datos ---------------- */
function loadData(data) {
  Object.entries(COLS).forEach(([k, arr]) => { arr.length = 0; (data[k] || []).forEach(x => arr.push(x)); });
  const def = catDefaults(); Object.keys(def).forEach(k => { CAT[k] = data.cat && data.cat[k] ? data.cat[k] : def[k]; });
  PREFS.accent = (data.prefs && data.prefs.accent) || {};
}
