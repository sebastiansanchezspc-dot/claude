// Catálogo público: todo el stock disponible de una empresa, para buscar, filtrar y contactar.
// Se comparte como enlace (WhatsApp, Instagram, QR del local). Si el enlace trae ?v=, las consultas van a ese vendedor.
import './catalogo.css'

const API = (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/catalogo'
// el enlace es /c/<slug> (o /catalogo.html?s=<slug>); ?v=<vendedor> asigna las consultas a quien lo compartió
const q = new URLSearchParams(location.search), S = (location.pathname.match(/^\/c\/([a-z0-9-]+)\/?$/) || [])[1] || q.get('s') || '', V = q.get('v') || ''
let W = 'auto'
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = s => String(s ?? '').replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]))
const fmt = n => '$' + Math.round(n || 0).toLocaleString('es-CL')
const ok = v => v != null && v !== '' && v !== '—' && v !== '-'
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const miles = n => Number(n).toLocaleString('es-CL')
const corto = n => n >= 1e6 ? '$' + (n / 1e6).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' MM' : '$' + Math.round(n / 1e3) + ' mil'
const HOY = new Date().toISOString().slice(0, 10)

const ICO = {
  wa: '<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20Z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2L9 8.5Z"/>',
  tel: '<path d="M7 3.5h3l1.3 4L9.5 9.2a11 11 0 0 0 5.3 5.3l1.7-1.8 4 1.3v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 5.5 5.1 1.5 1.5 0 0 1 7 3.5Z"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  share: '<path d="M12 15V4"/><path d="M8 7.5 12 3.5l4 4"/><path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  cam: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z"/><circle cx="12" cy="13" r="3.5"/>',
  l: '<path d="m15 5-7 7 7 7"/>', r: '<path d="m9 5 7 7-7 7"/>', chev: '<path d="m6 9 6 6 6-6"/>',
  bed: '<path d="M3 18v-8m0 4h18v4M21 18v-5a3 3 0 0 0-3-3h-7v4"/><circle cx="7" cy="11.5" r="1.5"/>', bath: '<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2ZM6 12V6a2 2 0 0 1 4 0"/>',
  area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10" r="2.3"/>',
}
const ico = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`

// textos por mundo
const TXT = {
  auto: { uno: 'auto', varios: 'autos', buscar: 'Marca, modelo o año', nada: 'No encontramos autos con esos filtros' },
  prop: { uno: 'propiedad', varios: 'propiedades', buscar: 'Comuna, tipo o característica', nada: 'No encontramos propiedades con esos filtros' },
  tienda: { uno: 'producto', varios: 'productos', buscar: 'Nombre, marca o categoría', nada: 'No encontramos productos con esos filtros' },
}
let T = TXT.auto

let D = null // datos del catálogo
const st = { texto: '', op: '', orden: 'recientes', f: {} }
const cacheDet = new Map()
let pila = false // true si abrimos el detalle con pushState (al cerrar se vuelve atrás)

/* ---------------- datos de cada ítem ---------------- */
const sp = it => it.specs || {}
function titulo(it) { const s = sp(it); return it.w === 'auto' && ok(s.marca) ? [s.marca, s.modelo].filter(ok).join(' ') : it.nombre }
function lineas(it) {
  const s = sp(it)
  if (it.w === 'auto') return [ok(s.km) && miles(s.km) + ' km', s.transmision, s.combustible].filter(ok)
  if (it.w === 'prop') return [s.tipo, s.comuna].filter(ok)
  return [s.marca, s.categoria].filter(ok)
}
const anio = it => it.w === 'auto' && ok(sp(it).anio) ? String(sp(it).anio) : ''
const precioTxt = it => it.precio ? fmt(it.precio) + (it.op === 'Arriendo' ? ' /mes' : '') : 'Consultar'
const nuevo = it => it.ingreso && (Date.parse(HOY) - Date.parse(it.ingreso)) / 864e5 <= 10
const cuota = it => {
  const f = D.fin; if (!f || !it.precio || it.w !== 'auto' || !f.plazo) return 0
  const m = it.precio * (1 - (f.pie || 0) / 100), i = (f.tasa || 0) / 100, n = f.plazo
  return Math.round(i > 0 ? m * i / (1 - Math.pow(1 + i, -n)) : m / n)
}
const waLink = (fono, txt) => { const d = String(fono || '').replace(/\D/g, ''); return d ? `https://wa.me/${d.length === 9 ? '56' + d : d}?text=${encodeURIComponent(txt)}` : '' }
const telLink = fono => { const d = String(fono || '').replace(/\D/g, ''); return d ? `tel:+${d.length === 9 ? '56' + d : d}` : '' }
const itemUrl = it => `${location.origin}${location.pathname}${location.search}#i=${encodeURIComponent(it.id)}`

/* ---------------- filtros ---------------- */
// cada filtro: clave, título, valores posibles y cómo se compara
function filtrosDef() {
  const lista = base(), cuenta = (fn) => { const m = new Map(); lista.forEach(it => { const v = fn(it); if (ok(v)) m.set(String(v), (m.get(String(v)) || 0) + 1) }); return [...m.entries()].sort((a, b) => b[1] - a[1]) }
  const precios = lista.map(it => it.precio).filter(Boolean).sort((a, b) => a - b), tramos = tramosPrecio(precios)
  const defs = []
  if (W === 'auto') {
    defs.push({ k: 'marca', t: 'Marca', multi: true, op: cuenta(it => sp(it).marca), test: (it, v) => v.has(String(sp(it).marca)) })
    defs.push({ k: 'tipo', t: 'Carrocería', multi: true, op: cuenta(it => sp(it).tipo), test: (it, v) => v.has(String(sp(it).tipo)) })
    defs.push({ k: 'precio', t: 'Precio', op: tramos.map(t => [t.k, t.t]), test: (it, v) => enTramo(it.precio, v) })
    const anios = [...new Set(lista.map(it => Number(sp(it).anio)).filter(Boolean))].sort((a, b) => b - a)
    if (anios.length > 1) defs.push({ k: 'anio', t: 'Año desde', op: [...new Set([anios[0] - 1, anios[0] - 3, anios[0] - 5, anios[0] - 8].filter(a => a >= anios[anios.length - 1]))].map(a => [String(a), String(a)]), test: (it, v) => Number(sp(it).anio) >= Number(v) })
    defs.push({ k: 'km', t: 'Kilometraje', op: [['30000', 'Hasta 30.000 km'], ['60000', 'Hasta 60.000 km'], ['100000', 'Hasta 100.000 km']], test: (it, v) => ok(sp(it).km) && Number(sp(it).km) <= Number(v) })
    defs.push({ k: 'trans', t: 'Transmisión', multi: true, op: cuenta(it => sp(it).transmision), test: (it, v) => v.has(String(sp(it).transmision)) })
    defs.push({ k: 'comb', t: 'Combustible', multi: true, op: cuenta(it => sp(it).combustible), test: (it, v) => v.has(String(sp(it).combustible)) })
  } else if (W === 'prop') {
    defs.push({ k: 'tipo', t: 'Tipo', multi: true, op: cuenta(it => sp(it).tipo), test: (it, v) => v.has(String(sp(it).tipo)) })
    defs.push({ k: 'comuna', t: 'Comuna', multi: true, op: cuenta(it => sp(it).comuna), test: (it, v) => v.has(String(sp(it).comuna)) })
    defs.push({ k: 'precio', t: st.op === 'Arriendo' ? 'Arriendo mensual' : 'Precio', op: tramos.map(t => [t.k, t.t]), test: (it, v) => enTramo(it.precio, v) })
    defs.push({ k: 'dorm', t: 'Dormitorios', op: [['1', '1+'], ['2', '2+'], ['3', '3+'], ['4', '4+']], test: (it, v) => Number(sp(it).dorm) >= Number(v) })
    defs.push({ k: 'banos', t: 'Baños', op: [['1', '1+'], ['2', '2+'], ['3', '3+']], test: (it, v) => Number(sp(it).banos) >= Number(v) })
  } else {
    defs.push({ k: 'cat', t: 'Categoría', multi: true, op: cuenta(it => sp(it).categoria), test: (it, v) => v.has(String(sp(it).categoria)) })
    defs.push({ k: 'marca', t: 'Marca', multi: true, op: cuenta(it => sp(it).marca), test: (it, v) => v.has(String(sp(it).marca)) })
    defs.push({ k: 'precio', t: 'Precio', op: tramos.map(t => [t.k, t.t]), test: (it, v) => enTramo(it.precio, v) })
  }
  return defs.filter(d => d.op.length > (d.multi ? 1 : 0))
}
// tramos de precio redondos según el stock real (sirven igual para autos de $5 MM o arriendos de $400 mil)
function tramosPrecio(p) {
  if (p.length < 4) return []
  const redondo = n => { const e = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / (e * 5)) * e * 5 }
  const cortes = [...new Set([0.3, 0.6, 0.85].map(x => redondo(p[Math.floor(x * (p.length - 1))])))].filter(Boolean)
  const t = []; let ant = 0
  cortes.forEach(c => { t.push({ k: `${ant}-${c}`, t: ant ? `${corto(ant)} a ${corto(c)}` : `Hasta ${corto(c)}` }); ant = c })
  t.push({ k: `${ant}-`, t: `Más de ${corto(ant)}` })
  return t
}
const enTramo = (n, k) => { if (!n) return false; const [a, b] = k.split('-').map(Number); return n >= a && (!b || n <= b) }

// stock del mundo, en la operación elegida (arriendo o venta)
const base = () => (D ? D.items : []).filter(it => !st.op || it.op === st.op)
function filtrados() {
  const defs = filtrosDef(), txt = norm(st.texto).split(/\s+/).filter(Boolean)
  let r = base().filter(it => defs.every(d => { const v = st.f[d.k]; if (!v || (v instanceof Set && !v.size)) return true; return d.test(it, v) }))
  if (txt.length) r = r.filter(it => { const h = norm([it.nombre, ...Object.values(sp(it))].join(' ')); return txt.every(t => h.includes(t)) })
  const by = { menor: (a, b) => (a.precio || 9e15) - (b.precio || 9e15), mayor: (a, b) => (b.precio || 0) - (a.precio || 0), anio: (a, b) => (Number(sp(b).anio) || 0) - (Number(sp(a).anio) || 0), km: (a, b) => (Number(sp(a).km) || 9e9) - (Number(sp(b).km) || 9e9), m2: (a, b) => (Number(sp(b).m2c) || 0) - (Number(sp(a).m2c) || 0) }[st.orden]
  return by ? r.slice().sort(by) : r
}
const activos = () => Object.values(st.f).reduce((n, v) => n + (v instanceof Set ? v.size : v ? 1 : 0), 0)

/* ---------------- pantalla principal ---------------- */
function tarjeta(it, k = 0) {
  const c = cuota(it), s = sp(it), yr = anio(it), tag = it.estado === 'reservado' ? ['res', 'Reservado'] : nuevo(it) ? ['new', 'Recién llegado'] : null
  const props = it.w === 'prop' ? [ok(s.dorm) && Number(s.dorm) > 0 && [ico('bed', 15), s.dorm + 'D'], ok(s.banos) && [ico('bath', 15), s.banos + 'B'], ok(s.m2c) && [ico('area', 15), s.m2c + ' m²']].filter(Boolean) : []
  return `<a class="card" href="#i=${encodeURIComponent(it.id)}" data-id="${esc(it.id)}" style="--k:${Math.min(k, 12)}">
    <div class="ph">${it.foto ? `<img src="${esc(it.foto)}" alt="${esc(titulo(it))}" loading="${k < 4 ? 'eager' : 'lazy'}" decoding="async">` : `<div class="sinfoto">${marcaIni(30)}<span>Fotos pronto</span></div>`}
      ${tag ? `<span class="tag ${tag[0]}">${tag[1]}</span>` : ''}${it.nf > 1 ? `<span class="nf">${ico('cam', 13)}${it.nf}</span>` : ''}
      <span class="pr">${esc(precioTxt(it))}</span></div>
    <div class="bd">
      <h3><span>${esc(titulo(it))}</span>${yr ? `<em>${esc(yr)}</em>` : ''}</h3>
      ${props.length ? `<p class="ic">${props.map(([i, t]) => `<span>${i}${esc(t)}</span>`).join('')}</p>` : ''}
      <p class="sub">${esc(lineas(it).join(' · '))}</p>
      ${c ? `<p class="cu">Cuota desde <b>${fmt(c)}</b><sup>*</sup></p>` : ''}
    </div></a>`
}
function marcaIni(s = 38) { return D.org.logo ? `<img class="logo" src="${esc(D.org.logo)}" alt="" width="${s}" height="${s}">` : `<span class="ini" style="width:${s}px;height:${s}px">${esc(D.org.nombre.slice(0, 2).toUpperCase())}</span>` }

function pintar() {
  const org = D.org, con = D.contacto, ops = W === 'prop' ? ['Arriendo', 'Venta'].filter(o => D.items.some(it => it.op === o)) : []
  if (ops.length && !ops.includes(st.op)) st.op = ops[0]
  document.title = `${org.nombre} · Catálogo de ${T.varios}`
  const wa = con && waLink(con.fono, `Hola${con.nombre ? ' ' + con.nombre.split(' ')[0] : ''}, vi el catálogo de ${org.nombre} y quiero hacer una consulta.`)
  $('#app').className = 'cat'
  $('#app').innerHTML = `
    <header class="top"><div class="wrap"><div class="marca">${marcaIni()}<b>${esc(org.nombre)}</b></div>
      ${wa ? `<a class="hbtn wa" href="${wa}" target="_blank" rel="noopener">${ico('wa', 18)}<span>Escríbenos</span></a>` : ''}</div></header>
    <section class="hero"><div class="wrap">
      <p class="kick">Catálogo en línea</p>
      <h1 id="h1"></h1>
      ${ops.length > 1 ? `<div class="ops" role="tablist">${ops.map(o => `<button role="tab" data-op="${o}" aria-selected="${st.op === o}">${o === 'Arriendo' ? 'En arriendo' : 'En venta'}</button>`).join('')}</div>` : ''}
      <label class="buscar">${ico('search', 20)}<input id="q" type="search" placeholder="${T.buscar}" autocomplete="off" enterkeyhint="search" aria-label="Buscar"></label>
    </div></section>
    <nav class="barra"><div class="wrap">
      <button class="fbtn" id="abrirF">${ico('sliders', 17)}Filtros<span class="n" id="nf" hidden></span></button>
      <div class="rap" id="rap"></div>
      <label class="orden"><span class="sr">Ordenar</span><select id="orden" aria-label="Ordenar">${[['recientes', 'Más recientes'], ['menor', 'Menor precio'], ['mayor', 'Mayor precio'], ...(W === 'auto' ? [['anio', 'Año más nuevo'], ['km', 'Menos kilómetros']] : W === 'prop' ? [['m2', 'Más metros']] : [])].map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>${ico('chev', 15)}</label>
    </div></nav>
    <main class="wrap"><p class="res" id="res"></p><section class="grid" id="grid"></section>
      ${D.fin ? `<p class="nota">* Cuota referencial con pie de ${D.fin.pie}% a ${D.fin.plazo} meses y tasa ${String(D.fin.tasa).replace('.', ',')}% mensual. Sujeta a evaluación y aprobación de la financiera.</p>` : ''}
      <section class="busco"><div><h2>¿No encuentras lo que buscas?</h2><p>Cuéntanos qué ${W === 'prop' ? 'propiedad' : W === 'auto' ? 'auto' : 'producto'} necesitas y te avisamos apenas tengamos uno.</p></div><button class="btn dark" id="busco">Avísenme</button></section>
    </main>
    <footer class="pie">${esc(org.nombre)} · catálogo hecho con <b>gestix</b></footer>
    <div class="capa" id="capa" hidden></div>`
  $('#q').addEventListener('input', e => { st.texto = e.target.value; lista() })
  $('#orden').addEventListener('change', e => { st.orden = e.target.value; lista() })
  $$('.ops button').forEach(b => b.addEventListener('click', () => { st.op = b.dataset.op; st.f = {}; $$('.ops button').forEach(x => x.setAttribute('aria-selected', x === b)); lista() }))
  $('#abrirF').addEventListener('click', abrirFiltros)
  $('#busco').addEventListener('click', () => abrirForm(null))
  $('#grid').addEventListener('click', e => { const a = e.target.closest('.card'); if (!a) return; e.preventDefault(); abrir(a.dataset.id) })
  lista()
  ruta()
}

// lista de resultados, título y atajos de filtro
function lista() {
  const r = filtrados(), n = base().length, act = activos() + (st.texto ? 1 : 0)
  const h1 = W === 'prop' ? `${n} ${n === 1 ? 'propiedad' : 'propiedades'} ${st.op === 'Venta' ? 'en venta' : st.op === 'Arriendo' ? 'en arriendo' : 'disponibles'}` : `${n} ${n === 1 ? T.uno : T.varios} ${n === 1 ? 'disponible' : 'disponibles'}`
  $('#h1').textContent = h1
  $('#res').innerHTML = act ? `<b>${r.length}</b> de ${n} ${T.varios} <button class="lnk" id="limpiar">Limpiar filtros</button>` : `Mostrando <b>${r.length}</b> ${r.length === 1 ? T.uno : T.varios}`
  $('#grid').innerHTML = r.length ? r.map(tarjeta).join('') : `<div class="vacio"><h3>${T.nada}</h3><p>Prueba quitando algún filtro o cuéntanos qué buscas.</p><button class="btn ghost" id="limpiar2">Ver todo el stock</button></div>`
  const nf = $('#nf'), a = activos(); nf.hidden = !a; nf.textContent = a
  const lim = () => { st.f = {}; st.texto = ''; $('#q').value = ''; lista() }
  $('#limpiar') && $('#limpiar').addEventListener('click', lim); $('#limpiar2') && $('#limpiar2').addEventListener('click', lim)
  rapidos()
}
// atajos: los valores más comunes del primer filtro (marca, tipo o categoría) como chips
function rapidos() {
  const d = filtrosDef().find(x => x.multi && x.k !== 'marca') || filtrosDef().find(x => x.multi); const el = $('#rap')
  if (!d) { el.innerHTML = ''; return }
  const sel = st.f[d.k] instanceof Set ? st.f[d.k] : new Set()
  el.innerHTML = d.op.slice(0, 6).map(([v]) => `<button class="chip ${sel.has(v) ? 'on' : ''}" data-v="${esc(v)}" aria-pressed="${sel.has(v)}">${esc(v)}</button>`).join('')
  $$('button', el).forEach(b => b.addEventListener('click', () => { const s = st.f[d.k] instanceof Set ? st.f[d.k] : new Set(); s.has(b.dataset.v) ? s.delete(b.dataset.v) : s.add(b.dataset.v); st.f[d.k] = s; lista() }))
}

/* ---------------- capas (filtros, detalle, formulario) ---------------- */
let alCerrar = null
function capa(html, cls, onClose) {
  const c = $('#capa'); c.className = 'capa ' + cls; c.innerHTML = `<div class="fondo" data-cerrar></div><div class="panel" role="dialog" aria-modal="true">${html}</div>`; c.hidden = false
  document.documentElement.classList.add('fija'); requestAnimationFrame(() => c.classList.add('in'))
  alCerrar = onClose || null
  $$('[data-cerrar]', c).forEach(b => b.addEventListener('click', () => cerrar()))
  setTimeout(() => { const f = $('.cerrar', c); f && f.focus({ preventScroll: true }) }, 60)
  return c
}
function cerrar(desdeHistorial) {
  const c = $('#capa'); if (!c || c.hidden) return
  c.classList.remove('in'); document.documentElement.classList.remove('fija')
  setTimeout(() => { if (!c.classList.contains('in')) { c.hidden = true; c.innerHTML = '' } }, 260)
  const f = alCerrar; alCerrar = null; if (f) f(desdeHistorial)
}
addEventListener('keydown', e => { if (e.key === 'Escape') cerrar() })

function abrirFiltros() {
  const defs = filtrosDef()
  const borrador = Object.fromEntries(Object.entries(st.f).map(([k, v]) => [k, v instanceof Set ? new Set(v) : v]))
  const html = `<div class="phd"><h2>Filtros</h2><button class="ib cerrar" data-cerrar aria-label="Cerrar">${ico('x', 18)}</button></div>
    <div class="pbody">${defs.map(d => `<section class="fg"><h3>${d.t}</h3><div class="chips">${d.op.map(([v, t, n]) => `<button class="chip" data-k="${d.k}" data-v="${esc(v)}">${typeof t === 'number' ? `${esc(v)}<small>${t}</small>` : esc(t || v)}</button>`).join('')}</div></section>`).join('') || '<p class="sub">No hay filtros para este stock.</p>'}</div>
    <div class="pft"><button class="btn ghost" id="fLimpiar">Limpiar</button><button class="btn dark" id="fVer"></button></div>`
  const c = capa(html, 'hoja')
  const contar = () => { const prev = st.f; st.f = borrador; const n = filtrados().length; st.f = prev; $('#fVer', c).textContent = n ? `Ver ${n} ${n === 1 ? T.uno : T.varios}` : 'Sin resultados'; $('#fVer', c).disabled = !n }
  const marcar = () => $$('.chip', c).forEach(b => { const v = borrador[b.dataset.k], on = v instanceof Set ? v.has(b.dataset.v) : v === b.dataset.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on) })
  $$('.chip', c).forEach(b => b.addEventListener('click', () => {
    const d = defs.find(x => x.k === b.dataset.k), v = b.dataset.v
    if (d.multi) { const s = borrador[d.k] instanceof Set ? borrador[d.k] : new Set(); s.has(v) ? s.delete(v) : s.add(v); borrador[d.k] = s } else borrador[d.k] = borrador[d.k] === v ? '' : v
    marcar(); contar()
  }))
  $('#fLimpiar', c).addEventListener('click', () => { Object.keys(borrador).forEach(k => delete borrador[k]); marcar(); contar() })
  $('#fVer', c).addEventListener('click', () => { st.f = borrador; cerrar(); lista(); scrollTo({ top: $('.barra').offsetTop - 60, behavior: 'smooth' }) })
  marcar(); contar()
}

// detalle de un ítem (con todas sus fotos); el enlace queda como #i=<id> para compartirlo
async function abrir(id, desdeRuta) {
  const it = D.items.find(x => x.id === id); if (!it) return
  if (!desdeRuta) { history.pushState({ i: id }, '', '#i=' + encodeURIComponent(id)); pila = true }
  const ya = cacheDet.get(id) || null
  const c = capa(detalleHtml(it, ya), 'det', h => { if (h) { pila = false; return } if (pila) { pila = false; history.back() } else if (location.hash) history.replaceState(null, '', location.pathname + location.search) })
  activarDetalle(c, it, ya)
  if (ya) return
  try {
    const r = await fetch(`${API}?s=${encodeURIComponent(S)}&i=${encodeURIComponent(id)}${V ? '&v=' + encodeURIComponent(V) : ''}`), d = await r.json(); if (!r.ok) throw new Error(d.error)
    cacheDet.set(id, d)
    const pn = $('.panel', c)
    if (!c.hidden && pn && pn.dataset.id === id) { const sc = $('.pbody', c).scrollTop; pn.innerHTML = detalleHtml(it, d); $('.pbody', c).scrollTop = sc; $$('[data-cerrar]', pn).forEach(b => b.addEventListener('click', () => cerrar())); activarDetalle(c, it, d) }
  } catch (e) { const g = $('#gal', c); if (g && !it.foto) g.innerHTML = '<div class="sinfoto"><span>No pudimos cargar las fotos</span></div>' }
}
function detalleHtml(it, d) {
  const full = d ? d.item : null, fotos = full ? full.fotos : it.foto ? [it.foto] : [], vend = d ? d.vend : null, s = sp(it), c = cuota(it)
  const CAMPOS = {
    auto: [['anio', 'Año'], ['km', 'Kilometraje', v => miles(v) + ' km'], ['transmision', 'Transmisión'], ['combustible', 'Combustible'], ['tipo', 'Carrocería'], ['color', 'Color'], ['version', 'Versión'], ['puertas', 'Puertas'], ['motor', 'Motor']],
    prop: [['tipo', 'Tipo'], ['comuna', 'Comuna'], ['dorm', 'Dormitorios'], ['banos', 'Baños'], ['m2c', 'Construidos', v => v + ' m²'], ['m2t', 'Terreno', v => v + ' m²'], ['estac', 'Estacionamientos'], ['bodega', 'Bodega']],
    tienda: [['marca', 'Marca'], ['categoria', 'Categoría'], ['variante', 'Variante']],
  }[it.w]
  const datos = CAMPOS.filter(([k]) => ok(s[k]) && !(k === 'dorm' && Number(s[k]) === 0)).map(([k, l, f]) => `<div><span>${l}</span><b>${esc(f ? f(s[k]) : s[k])}</b></div>`).join('')
  const yr = anio(it), tt = titulo(it) + (yr ? ' ' + yr : '')
  const wa = vend && waLink(vend.fono, `Hola${vend.nombre ? ' ' + vend.nombre.split(' ')[0] : ''}, me interesa ${it.w === 'prop' ? 'la propiedad' : it.w === 'auto' ? 'el' : ''} ${tt} (${precioTxt(it)}) que vi en el catálogo de ${D.org.nombre}. ¿Sigue disponible?\n${itemUrl(it)}`)
  const otros = D.items.filter(x => x.id !== it.id && x.op === it.op && (sp(x).tipo === s.tipo || (it.w === 'auto' && sp(x).marca === s.marca))).slice(0, 4)
  return `<div class="dhd"><button class="ib cerrar" data-cerrar aria-label="Volver al catálogo">${ico('l', 20)}</button><span class="dt">${esc(titulo(it))}</span><button class="ib" id="compartir" aria-label="Compartir">${ico('share', 18)}</button></div>
    <div class="pbody"><div class="dgrid">
      <div class="galw"><div class="gal" id="gal">${fotos.length ? fotos.map((u, k) => `<img src="${esc(u)}" alt="Foto ${k + 1} de ${esc(tt)}" ${k > 1 ? 'loading="lazy"' : ''}>`).join('') : `<div class="sinfoto">${marcaIni(40)}<span>${d ? 'Fotos pronto' : ''}</span></div>`}</div>
        ${fotos.length > 1 ? `<span class="cont" id="cont">1 / ${fotos.length}</span><button class="flecha l" id="gl" aria-label="Foto anterior">${ico('l', 20)}</button><button class="flecha r" id="gr" aria-label="Foto siguiente">${ico('r', 20)}</button>` : ''}
        ${fotos.length > 1 ? `<div class="mini" id="mini">${fotos.map((u, k) => `<button data-k="${k}" class="${k ? '' : 'on'}" aria-label="Ver foto ${k + 1}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}</div>
      <div class="dinfo">
        <span class="estado ${it.estado === 'reservado' ? 'res' : ''}">${it.estado === 'reservado' ? 'Reservado' : it.w === 'prop' ? (it.op === 'Arriendo' ? 'En arriendo' : 'En venta') : 'Disponible'}</span>
        <h2>${esc(titulo(it))}${yr ? ` <em>${esc(yr)}</em>` : ''}</h2>
        <p class="sub">${esc(lineas(it).join(' · '))}</p>
        <p class="precio">${esc(precioTxt(it))}</p>
        ${c ? `<p class="cu">Cuota desde <b>${fmt(c)}</b> con pie de ${D.fin.pie}%<sup>*</sup></p>` : ''}
        ${datos ? `<div class="datos">${datos}</div>` : ''}
        ${full && full.notas ? `<p class="notas">${esc(full.notas)}</p>` : ''}
        <div class="contacto">
          ${vend ? `<div class="vend"><span class="av">${esc((vend.nombre || 'G').split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><div><b>${esc(vend.nombre)}</b><small>${esc(D.org.nombre)}</small></div></div>` : ''}
          ${wa ? `<a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ico('wa')}Escribir por WhatsApp</a>` : ''}
          <div class="dos">${vend && vend.fono ? `<a class="btn ghost" href="${telLink(vend.fono)}">${ico('tel', 18)}Llamar</a>` : ''}<button class="btn ghost" id="meLlamen">Que me contacten</button></div>
        </div>
      </div></div>
      ${otros.length ? `<section class="otros"><h3>También te puede interesar</h3><div class="grid mini4">${otros.map(tarjeta).join('')}</div></section>` : ''}
    </div>`
}
function activarDetalle(c, it, d) {
  $('.panel', c).dataset.id = it.id
  const g = $('#gal', c), n = g ? $$('img', g).length : 0, cont = $('#cont', c)
  const ir = k => g.scrollTo({ left: Math.max(0, Math.min(n - 1, k)) * g.clientWidth, behavior: 'smooth' })
  if (g && n > 1) {
    g.addEventListener('scroll', () => { const k = Math.round(g.scrollLeft / g.clientWidth); cont.textContent = `${k + 1} / ${n}`; $$('#mini button', c).forEach((b, j) => b.classList.toggle('on', j === k)) }, { passive: true })
    $('#gl', c).addEventListener('click', () => ir(Math.round(g.scrollLeft / g.clientWidth) - 1)); $('#gr', c).addEventListener('click', () => ir(Math.round(g.scrollLeft / g.clientWidth) + 1))
    $$('#mini button', c).forEach(b => b.addEventListener('click', () => ir(+b.dataset.k)))
  }
  $('#compartir', c).addEventListener('click', async () => { const url = itemUrl(it); try { if (navigator.share) await navigator.share({ title: `${titulo(it)} · ${D.org.nombre}`, url }); else { await navigator.clipboard.writeText(url); aviso('Enlace copiado') } } catch (e) { } })
  $('#meLlamen', c).addEventListener('click', () => abrirForm(it, d && d.vend))
  $$('.otros .card', c).forEach(a => a.addEventListener('click', e => { e.preventDefault(); history.replaceState({ i: a.dataset.id }, '', '#i=' + encodeURIComponent(a.dataset.id)); abrir(a.dataset.id, true) }))
}

// formulario de contacto (de un ítem o general: "avísenme cuando llegue")
function abrirForm(it, vend) {
  const volver = it ? () => abrir(it.id, true) : null
  const html = `<div class="phd"><h2>${it ? 'Te contactamos' : '¿Qué estás buscando?'}</h2><button class="ib cerrar" data-cerrar aria-label="Cerrar">${ico('x', 18)}</button></div>
    <form class="pbody form" id="form" novalidate>
      ${it ? `<p class="sub">Déjanos tus datos y ${vend ? esc(vend.nombre.split(' ')[0]) : 'un ejecutivo'} te contacta por ${esc(titulo(it))}${anio(it) ? ' ' + esc(anio(it)) : ''}.</p>` : `<p class="sub">Cuéntanos qué necesitas y te avisamos apenas tengamos algo para ti.</p>`}
      <label><span>Nombre</span><input name="nombre" autocomplete="name" maxlength="60" required></label>
      <label><span>Teléfono</span><input name="fono" autocomplete="tel" inputmode="tel" maxlength="24" placeholder="+56 9 …" required></label>
      <label><span>${it ? 'Mensaje (opcional)' : 'Qué buscas'}</span><textarea name="mensaje" maxlength="400" rows="3" placeholder="${it ? (W === 'auto' ? '¿Aceptan mi auto en parte de pago?' : W === 'prop' ? '¿Cuándo puedo visitarla?' : '¿Tienen stock?') : (W === 'auto' ? 'Ej: SUV automática, hasta $15 millones' : W === 'prop' ? 'Ej: depto 2D en Ñuñoa, hasta $600 mil' : 'Ej: el producto que necesitas')}"></textarea></label>
      ${W === 'auto' ? `<label class="check"><input type="checkbox" name="pp" value="1"><span>Tengo un auto para dejar en parte de pago</span></label>` : ''}
      <input name="web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="err" id="err" hidden></p>
      <button class="btn dark" type="submit">Enviar</button>
      <p class="legal">Al enviar aceptas que ${esc(D.org.nombre)} use estos datos solo para contactarte por esta consulta.</p>
    </form>`
  const c = capa(html, 'hoja', h => { if (!h && volver && location.hash) { /* vuelve al detalle */ setTimeout(volver, 270) } })
  $('#form', c).addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, b = $('button[type=submit]', f), er = $('#err', f), v = Object.fromEntries(new FormData(f))
    if (String(v.nombre).trim().length < 2 || String(v.fono).replace(/\D/g, '').length < 8) { er.textContent = 'Escribe tu nombre y un teléfono válido.'; er.hidden = false; return }
    b.disabled = true; b.textContent = 'Enviando…'; er.hidden = true
    const mensaje = [v.pp ? 'Tiene un auto para dejar en parte de pago.' : '', String(v.mensaje || '').trim()].filter(Boolean).join(' ')
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: v.nombre, fono: v.fono, mensaje, web: v.web, s: S, v: V || undefined, i: it ? it.id : undefined }) }), j = await r.json()
      if (!r.ok) throw new Error(j.error || 'No se pudo enviar')
      f.innerHTML = `<div class="listo">${ico('ok', 30)}<h2>¡Listo, ${esc(String(v.nombre).trim().split(' ')[0])}!</h2><p>${vend ? esc(vend.nombre.split(' ')[0]) + ' te va' : 'Te vamos'} a contactar muy pronto.</p><button type="button" class="btn ghost" data-cerrar>Seguir viendo</button></div>`
      $$('[data-cerrar]', f).forEach(x => x.addEventListener('click', () => cerrar()))
    } catch (x) { er.textContent = x.message || 'No se pudo enviar. Inténtalo de nuevo.'; er.hidden = false; b.disabled = false; b.textContent = 'Enviar' }
  })
}

function aviso(t) { const a = document.createElement('div'); a.className = 'aviso'; a.textContent = t; document.body.appendChild(a); requestAnimationFrame(() => a.classList.add('in')); setTimeout(() => { a.classList.remove('in'); setTimeout(() => a.remove(), 300) }, 1800) }

// #i=<id> abre el detalle (enlace compartido o botón atrás)
function ruta() {
  const m = location.hash.match(/^#i=(.+)$/), id = m ? decodeURIComponent(m[1]) : ''
  const abierto = $('#capa .panel') && $('#capa .panel').dataset.id
  if (id && D.items.some(x => x.id === id)) { if (abierto !== id) abrir(id, true) } else if (!$('#capa').hidden) cerrar(true)
}
addEventListener('popstate', () => D && ruta())

// color de la empresa: si es muy claro, el texto encima va oscuro
function colores(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return
  const n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255, lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  const R = document.documentElement.style
  R.setProperty('--acc', '#' + m[1]); R.setProperty('--acc-ink', lum > 0.55 ? '#16181B' : '#FFFFFF'); R.setProperty('--acc-txt', lum > 0.55 ? '#16181B' : '#' + m[1])
}

async function cargar() {
  if (!API.startsWith('http') || !S) return error('Catálogo no encontrado')
  try { const r = await fetch(`${API}?s=${encodeURIComponent(S)}${V ? '&v=' + encodeURIComponent(V) : ''}`); D = await r.json(); if (!r.ok) throw new Error(D.error || 'error') }
  catch (e) { D = null; return error(e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos cargar el catálogo') }
  W = TXT[D.w] ? D.w : 'auto'; T = TXT[W]
  colores(D.org.accent); pintar()
}
function error(t) { $('#app').className = 'vacio'; $('#app').innerHTML = `<div class="nada"><h1>${esc(t)}</h1><p>Puede que el enlace no esté completo o que la empresa haya pausado su catálogo. Escríbele a quien te lo envió.</p></div>` }
cargar()
