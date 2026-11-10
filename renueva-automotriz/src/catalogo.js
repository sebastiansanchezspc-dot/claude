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
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z"/>',
  car: '<path d="M5 16.5h14M6.5 16.5v1.8M17.5 16.5v1.8M4.5 13.5l1.6-4.6A2 2 0 0 1 8 7.5h8a2 2 0 0 1 1.9 1.4l1.6 4.6v3h-15v-3Z"/><circle cx="8" cy="13.5" r=".6"/><circle cx="16" cy="13.5" r=".6"/>',
  spark: '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  bank: '<path d="M4 9.5 12 5l8 4.5M5.5 10v7M10 10v7M14 10v7M18.5 10v7M4 19h16"/>',
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

/* ---------------- favoritos (en este equipo) ---------------- */
const FAVK = 'gx_fav_' + S
let favs = new Set()
try { favs = new Set(JSON.parse(localStorage.getItem(FAVK) || '[]')) } catch (e) { }
const guardaFavs = () => { try { localStorage.setItem(FAVK, JSON.stringify([...favs])) } catch (e) { } }
function togFav(id, btn) {
  favs.has(id) ? favs.delete(id) : favs.add(id); guardaFavs()
  $$(`.fav[data-fav="${CSS.escape(id)}"]`).forEach(b => { b.classList.toggle('on', favs.has(id)); b.setAttribute('aria-pressed', favs.has(id)) })
  if (btn) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop') }
  contarFavs(); if (favs.has(id)) aviso('Guardado en tus favoritos')
}
function contarFavs() { const n = [...favs].filter(id => D.items.some(x => x.id === id)).length, b = $('#favs'); if (!b) return; b.hidden = !n; $('.n', b).textContent = n }
const favBtn = (it, cls = '') => `<button class="fav ${cls} ${favs.has(it.id) ? 'on' : ''}" data-fav="${esc(it.id)}" aria-pressed="${favs.has(it.id)}" aria-label="Guardar en favoritos">${ico('heart', 18)}</button>`

/* ---------------- movimiento: fotos que aparecen al cargar (con esqueleto) y números ---------------- */
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches
function animar(root = document) {
  $$('img:not(.ok)', root).forEach(im => {
    const caja = im.closest('.ph, .gal'), listo = mal => { im.classList.add('ok'); mal && im.classList.add('mal'); caja && caja.classList.remove('carga') }
    if (im.complete && im.naturalWidth) listo(); else { caja && caja.classList.add('carga'); im.addEventListener('load', () => listo(), { once: true }); im.addEventListener('error', () => listo(true), { once: true }) }
  })
  // seguro: ninguna foto queda invisible aunque se pierda el aviso de carga
  setTimeout(() => $$('img:not(.ok)', root).forEach(im => { im.classList.add('ok'); const c = im.closest('.ph, .gal'); c && c.classList.remove('carga') }), 4000)
}
function contar(el, n, txt) {
  if (!el) return; if (QUIETO || n < 2) { el.textContent = txt(n); return }
  const t0 = performance.now(), dur = 700, de = Math.max(0, Math.round(n * 0.4))
  const paso = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = txt(Math.round(de + (n - de) * e)); if (k < 1) requestAnimationFrame(paso) }
  requestAnimationFrame(paso)
}
const iniciales = n => String(n || 'G').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase()

/* ---------------- datos de cada ítem ---------------- */
const sp = it => it.specs || {}
function titulo(it) { const s = sp(it); return it.w === 'auto' && ok(s.marca) ? [s.marca, s.modelo].filter(ok).join(' ') : it.nombre }
function lineas(it) {
  const s = sp(it)
  if (it.w === 'auto') return [ok(s.km) && miles(s.km) + ' km', s.transmision, s.combustible].filter(x => x && ok(x))
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
  const c = cuota(it), s = sp(it), yr = anio(it), tag = it.dis ? null : it.estado === 'reservado' ? 'Reservado' : it.estado === 'taller' ? 'Próximamente' : nuevo(it) ? 'Recién llegado' : null
  const props = it.w === 'prop' ? [ok(s.dorm) && Number(s.dorm) > 0 && [ico('bed', 15), s.dorm + 'D'], ok(s.banos) && [ico('bath', 15), s.banos + 'B'], ok(s.m2c) && [ico('area', 15), s.m2c + ' m²']].filter(Boolean) : []
  return `<a class="card${it.dis ? ' dis' : ''}" href="#i=${encodeURIComponent(it.id)}" data-id="${esc(it.id)}">
    <div class="ph">${it.foto ? `<img src="${esc(it.foto)}" alt="${esc(titulo(it))}" loading="${k < 4 ? 'eager' : 'lazy'}" decoding="async">` : `<div class="sinfoto">${marcaIni(32)}<span>Fotos pronto</span></div>`}
      ${tag ? `<span class="tag">${tag}</span>` : ''}${favBtn(it)}</div>
    <div class="bd">
      <h3>${esc(titulo(it))}</h3>
      <p class="sub">${esc([yr, ...lineas(it)].filter(Boolean).join(' · '))}</p>
      ${props.length ? `<p class="ic">${props.map(([i, t]) => `<span>${i}${esc(t)}</span>`).join('')}</p>` : ''}
      <p class="pc"><b>${esc(precioTxt(it))}</b>${c ? `<span>Cuota desde ${fmt(c)}<sup>*</sup></span>` : ''}</p>
    </div></a>`
}
function marcaIni(s = 32) { return D.org.logo ? `<img class="logo" src="${esc(D.org.logo)}" alt="" width="${s}" height="${s}">` : `<span class="ini" style="width:${s}px;height:${s}px">${esc(D.org.nombre.slice(0, 2).toUpperCase())}</span>` }

// quién atiende: el vendedor que compartió el enlace, el dueño o la empresa
function asesorHtml() {
  const con = D.contacto; if (!con) return ''
  const emp = D.quien === 'empresa', wa = waLink(con.fono, `Hola${!emp ? ' ' + con.nombre.split(' ')[0] : ''}, vi el catálogo de ${D.org.nombre} y quiero hacer una consulta.`)
  return `<section class="asesor"><div class="wrap"><span class="av">${emp ? marcaIni(44) : esc(iniciales(con.nombre))}</span>
    <div class="as-t"><small>${emp ? 'Atención directa' : 'Te atiende'}</small><b>${esc(emp ? D.org.nombre : con.nombre)}</b></div>
    <div class="as-b">${wa ? `<a class="btn acc" href="${wa}" target="_blank" rel="noopener">${ico('wa', 18)}WhatsApp</a>` : ''}<a class="ib s" href="${telLink(con.fono)}" aria-label="Llamar a ${esc(emp ? D.org.nombre : con.nombre)}">${ico('tel', 18)}</a></div></div></section>`
}
// una línea de datos bajo el título de la portada
function cifrasTxt() {
  const pr = base().map(x => x.precio).filter(Boolean), min = pr.length ? Math.min(...pr) : 0
  return [min && `Desde ${corto(min)}${st.op === 'Arriendo' ? ' al mes' : ''}`, D.fin && 'Financiamiento', D.pp && 'Recibimos tu auto'].filter(Boolean).join('\u00a0· ')
}
// foto de la portada: la más reciente sin diseño encima (las portadas con diseño ya traen texto)
function fotoPortada() { if (D.hero && D.hero.foto) return D.hero.foto; const it = D.items.find(x => x.foto && !x.dis); return it ? it.foto : '' }

function pintar() {
  const org = D.org, con = D.contacto, ops = W === 'prop' ? ['Arriendo', 'Venta'].filter(o => D.items.some(it => it.op === o)) : []
  if (ops.length && !ops.includes(st.op)) st.op = ops[0]
  document.title = `${org.nombre} · Catálogo de ${T.varios}`
  const wa = con && waLink(con.fono, `Hola${con.nombre && D.quien !== 'empresa' ? ' ' + con.nombre.split(' ')[0] : ''}, vi el catálogo de ${org.nombre} y quiero hacer una consulta.`)
  const hf = fotoPortada(), Tv = T.varios[0].toUpperCase() + T.varios.slice(1)
  $('#app').className = 'cat'
  $('#app').innerHTML = `
    <header class="top"><div class="wrap"><a class="marca" href="#inicio">${marcaIni()}<b>${esc(org.nombre)}</b></a>
      <div class="acc"><button class="ib hbtn fv" id="favs" hidden aria-label="Mis favoritos">${ico('heart', 20)}<span class="n">0</span></button><button class="ib hbtn" id="compPag" aria-label="Compartir catálogo">${ico('share', 20)}</button></div></div></header>
    <section class="hero ${hf ? 'foto' : 'tipo'}" id="inicio" data-enter>${hf ? `<img class="hero-f" src="${esc(hf)}" alt="" fetchpriority="high" decoding="async">` : ''}
      <div class="wrap hero-c">
        <div><h1 id="h1" class="e1"></h1><p class="hero-s e2" id="cifras"></p></div>
        <div class="hero-b e3"><a class="btn acc" href="#catalogo">Ver ${W === 'prop' ? 'las' : 'los'} ${T.varios}</a>${D.pp ? `<button class="btn claro js-tasar" id="tasar">Cotizar mi auto</button>` : wa ? `<a class="btn claro" href="${wa}" target="_blank" rel="noopener">Escribir por WhatsApp</a>` : ''}</div>
      </div></section>
    ${asesorHtml()}
    <section class="cat-s" id="catalogo">
      <div class="wrap cat-h"><h2>${Tv} disponibles</h2>
        ${ops.length > 1 ? `<div class="ops" role="tablist">${ops.map(o => `<button role="tab" data-op="${o}" aria-selected="${st.op === o}">${o === 'Arriendo' ? 'En arriendo' : 'En venta'}</button>`).join('')}</div>` : ''}
        <label class="buscar">${ico('search', 20)}<input id="q" type="search" placeholder="${T.buscar}" autocomplete="off" enterkeyhint="search" aria-label="Buscar"></label></div>
      <nav class="barra" aria-label="Filtros"><div class="wrap">
        <button class="fbtn" id="abrirF">${ico('sliders', 17)}Filtros<span class="n" id="nf" hidden></span></button>
        <div class="rap" id="rap"></div>
        <label class="orden"><span class="sr">Ordenar</span><select id="orden" aria-label="Ordenar">${[['recientes', 'Más recientes'], ['menor', 'Menor precio'], ['mayor', 'Mayor precio'], ...(W === 'auto' ? [['anio', 'Año más nuevo'], ['km', 'Menos kilómetros']] : W === 'prop' ? [['m2', 'Más metros']] : [])].map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>${ico('chev', 15)}</label>
      </div></nav>
      <main class="wrap"><p class="res" id="res" aria-live="polite"></p><section class="grid" id="grid"></section>
        ${D.fin ? `<p class="nota">* Cuota referencial con pie de ${D.fin.pie}% a ${D.fin.plazo} meses y tasa ${String(D.fin.tasa).replace('.', ',')}% mensual. Sujeta a evaluación y aprobación de la financiera.</p>` : ''}
        ${D.pp ? `<section class="banda"><div><h2>¿Tienes un auto para dejar en parte de pago?</h2><p>Cuéntanos cuál es, súbele unas fotos y te enviamos una tasación sin compromiso.</p></div><button class="btn acc js-tasar">Cotizar mi auto</button></section>` : ''}
        <section class="banda"><div><h2>¿No encuentras lo que buscas?</h2><p>Cuéntanos qué ${W === 'prop' ? 'propiedad' : W === 'auto' ? 'auto' : 'producto'} necesitas y te avisamos apenas llegue.</p></div><button class="btn ghost" id="busco">Avísenme cuando llegue</button></section>
      </main></section>
    <footer class="pie"><div class="pie-m">${marcaIni(28)}<b>${esc(org.nombre)}</b></div>${con && con.fono ? `<a href="${telLink(con.fono)}">${esc(con.fono)}</a>` : ''}<span>Catálogo hecho con <b>gestix</b></span></footer>
    ${wa ? `<a class="fab" id="fab" href="${wa}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">${ico('wa', 20)}<span>${D.quien === 'empresa' ? 'Escríbenos' : 'Escríbeme'}</span></a>` : ''}
    <div class="capa" id="capa" hidden></div>`
  const hfi = $('.hero-f'); if (hfi) { const ya = () => hfi.classList.add('ok'); hfi.complete && hfi.naturalWidth ? ya() : (hfi.addEventListener('load', ya, { once: true }), hfi.addEventListener('error', () => { hfi.remove(); $('.hero').className = 'hero tipo' }, { once: true })) }
  $('#q').addEventListener('input', e => { st.texto = e.target.value; lista() })
  $('#orden').addEventListener('change', e => { st.orden = e.target.value; lista() })
  $$('.ops button').forEach(b => b.addEventListener('click', () => { st.op = b.dataset.op; st.f = {}; $$('.ops button').forEach(x => x.setAttribute('aria-selected', x === b)); lista(true) }))
  $('#abrirF').addEventListener('click', abrirFiltros)
  $('#busco').addEventListener('click', () => abrirForm(null))
  $$('.js-tasar').forEach(b => b.addEventListener('click', () => abrirForm(null, null, 'pp')))
  $('#favs').addEventListener('click', abrirFavs)
  $('#compPag').addEventListener('click', async () => { const url = location.origin + location.pathname + location.search; try { if (navigator.share) await navigator.share({ title: document.title, url }); else { await navigator.clipboard.writeText(url); aviso('Enlace copiado') } } catch (e) { } })
  // clics: favorito (no abre la ficha), tarjeta o recién llegado (abre la ficha)
  $('#app').addEventListener('click', e => {
    const f = e.target.closest('.fav'); if (f && !e.target.closest('.capa')) { e.preventDefault(); e.stopPropagation(); togFav(f.dataset.fav, f); return }
    const a = e.target.closest('#grid .card'); if (!a) return; e.preventDefault(); abrir(a.dataset.id)
  })
  // la cabecera se vuelve sólida al bajar y el botón de contacto aparece después de la portada
  const fab = $('#fab'), hero = $('.hero'), top = $('.top'); let pend = false
  const alBajar = () => { pend = false; const y = scrollY, fin = hero.offsetHeight - 64; top.classList.toggle('solida', y > 24); if (fab) fab.classList.toggle('in', y > fin && $('#capa').hidden) }
  addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(alBajar) } }, { passive: true }); alBajar()
  lista(true)
  contarFavs()
  ruta()
}

// lista de resultados, título y atajos de filtro
function lista(portada) {
  const r = filtrados(), n = base().length, act = activos() + (st.texto ? 1 : 0)
  const h1 = k => W === 'prop' ? `${k} ${n === 1 ? 'propiedad' : 'propiedades'} ${st.op === 'Venta' ? 'en venta' : st.op === 'Arriendo' ? 'en arriendo' : 'disponibles'}` : `${k} ${n === 1 ? T.uno : T.varios} ${n === 1 ? 'disponible' : 'disponibles'}`
  if (portada) { contar($('#h1'), n, h1); $('#cifras').textContent = cifrasTxt() } else $('#h1').textContent = h1(n)
  $('#res').innerHTML = act ? `<b>${r.length}</b> de ${n} ${T.varios} <button class="lnk" id="limpiar">Limpiar filtros</button>` : `Mostrando <b>${r.length}</b> ${r.length === 1 ? T.uno : T.varios}`
  $('#grid').innerHTML = r.length ? r.map(tarjeta).join('') : `<div class="vacio"><h3>${T.nada}</h3><p>Prueba quitando algún filtro o cuéntanos qué buscas.</p><button class="btn ghost" id="limpiar2">Ver todo el stock</button></div>`
  const nf = $('#nf'), a = activos(); nf.hidden = !a; nf.textContent = a
  const lim = () => { st.f = {}; st.texto = ''; $('#q').value = ''; lista() }
  $('#limpiar') && $('#limpiar').addEventListener('click', lim); $('#limpiar2') && $('#limpiar2').addEventListener('click', lim)
  if (!portada) { const g = $('#grid'); g.classList.remove('cambio'); void g.offsetWidth; g.classList.add('cambio') }
  rapidos(); animar($('#app'))
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
  document.documentElement.classList.add('fija'); requestAnimationFrame(() => c.classList.add('in')); const fb = $('#fab'); if (fb) fb.classList.remove('in'); setTimeout(() => animar(c), 30)
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
  const html = `<div class="phd"><h2>Filtros</h2><button class="ib cerrar" data-cerrar aria-label="Cerrar">${ico('x', 20)}</button></div>
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
  $('#fVer', c).addEventListener('click', () => { st.f = borrador; cerrar(); lista(); $('#catalogo').scrollIntoView({ behavior: QUIETO ? 'auto' : 'smooth' }) })
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
    if (!c.hidden && pn && pn.dataset.id === id) { const sc = $('.pbody', c).scrollTop; pn.innerHTML = detalleHtml(it, d); $('.pbody', c).scrollTop = sc; $$('[data-cerrar]', pn).forEach(b => b.addEventListener('click', () => cerrar())); activarDetalle(c, it, d); animar(pn) }
  } catch (e) { const g = $('#gal', c); if (g && !it.foto) g.innerHTML = '<div class="sinfoto"><span>No pudimos cargar las fotos</span></div>' }
}
function detalleHtml(it, d) {
  const full = d ? d.item : null, fotos = full ? full.fotos : it.foto ? [it.foto] : [], vend = d ? d.vend : null, s = sp(it), c = cuota(it)
  const CAMPOS = {
    auto: [['anio', 'Año'], ['km', 'Kilometraje', v => miles(v) + ' km'], ['transmision', 'Transmisión'], ['combustible', 'Combustible'], ['tipo', 'Carrocería'], ['color', 'Color'], ['version', 'Versión'], ['puertas', 'Puertas'], ['motor', 'Motor']],
    prop: [['tipo', 'Tipo'], ['comuna', 'Comuna'], ['dorm', 'Dormitorios'], ['banos', 'Baños'], ['m2c', 'Construidos', v => v + ' m²'], ['m2t', 'Terreno', v => v + ' m²'], ['estac', 'Estacionamientos'], ['bodega', 'Bodega']],
    tienda: [['marca', 'Marca'], ['categoria', 'Categoría'], ['variante', 'Variante']],
  }[it.w]
  const datos = CAMPOS.filter(([k]) => ok(s[k]) && !(k === 'dorm' && Number(s[k]) === 0)).map(([k, l, f]) => `<div><dt>${l}</dt><dd>${esc(f ? f(s[k]) : s[k])}</dd></div>`).join('')
  const yr = anio(it), tt = titulo(it) + (yr ? ' ' + yr : '')
  const wa = vend && waLink(vend.fono, `Hola${vend.nombre && D.quien !== 'empresa' ? ' ' + vend.nombre.split(' ')[0] : ''}, me interesa ${it.w === 'prop' ? 'la propiedad' : it.w === 'auto' ? 'el' : ''} ${tt} (${precioTxt(it)}) que vi en el catálogo de ${D.org.nombre}. ¿Sigue disponible?\n${itemUrl(it)}`)
  const otros = D.items.filter(x => x.id !== it.id && x.op === it.op && (sp(x).tipo === s.tipo || (it.w === 'auto' && sp(x).marca === s.marca))).slice(0, 4)
  return `<div class="dhd"><button class="ib cerrar" data-cerrar aria-label="Volver al catálogo">${ico('l', 22)}</button><span class="dt">${esc(D.org.nombre)}</span><span class="dacc">${favBtn(it, 'ib')}<button class="ib" id="compartir" aria-label="Compartir">${ico('share', 20)}</button></span></div>
    <div class="pbody"><div class="dgrid">
      <div class="galw"><div class="gal${it.dis ? ' dis' : ''}${!fotos.length && !d ? ' carga' : ''}" id="gal">${fotos.length ? fotos.map((u, k) => `<img src="${esc(u)}" alt="Foto ${k + 1} de ${esc(tt)}" ${k > 1 ? 'loading="lazy"' : ''} decoding="async">`).join('') : d ? `<div class="sinfoto">${marcaIni(40)}<span>Fotos pronto</span></div>` : ''}</div>
        ${fotos.length > 1 ? `<span class="cont" id="cont" aria-hidden="true">1 / ${fotos.length}</span><button class="flecha l" id="gl" aria-label="Foto anterior">${ico('l', 20)}</button><button class="flecha r" id="gr" aria-label="Foto siguiente">${ico('r', 20)}</button>` : ''}
        ${fotos.length > 1 ? `<div class="mini" id="mini">${fotos.map((u, k) => `<button data-k="${k}" class="${k ? '' : 'on'}" aria-label="Ver foto ${k + 1}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}</div>
      <div class="dinfo">
        <span class="estado ${it.estado !== 'disponible' ? 'res' : ''}">${it.estado === 'reservado' ? 'Reservado' : it.estado === 'taller' ? 'En preparación · pronto disponible' : it.w === 'prop' ? (it.op === 'Arriendo' ? 'En arriendo' : 'En venta') : 'Disponible'}</span>
        <h2>${esc(titulo(it))}${yr ? ` <em>${esc(yr)}</em>` : ''}</h2>
        <p class="sub">${esc(lineas(it).join(' · '))}</p>
        <p class="precio">${esc(precioTxt(it))}</p>
        ${c ? simHtml(it) : ''}
        ${it.op === 'Arriendo' && it.precio ? `<div class="entrar"><span>Para entrar, aprox.</span><b>${fmt(it.precio * 2)}</b><small>Mes de garantía + primer mes de arriendo. Pregunta por los requisitos.</small></div>` : ''}
        ${datos ? `<dl class="datos">${datos}</dl>` : ''}
        ${full && full.notas ? `<p class="notas">${esc(full.notas)}</p>` : ''}
        <div class="contacto">
          ${vend ? `<div class="vend"><span class="av">${D.quien === 'empresa' ? marcaIni(44) : esc(iniciales(vend.nombre))}</span><div><small>${D.quien === 'empresa' ? 'Atención directa' : 'Te atiende'}</small><b>${esc(vend.nombre)}</b>${D.quien === 'empresa' ? '' : `<small>${esc(D.org.nombre)}</small>`}</div></div>` : ''}
          ${wa ? `<a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ico('wa')}Escribir por WhatsApp</a>` : ''}
          <div class="dos">${vend && vend.fono ? `<a class="btn ghost" href="${telLink(vend.fono)}">${ico('tel', 18)}Llamar</a>` : ''}<button class="btn ghost" id="meLlamen">Que me contacten</button></div>
        </div>
      </div></div>
      ${otros.length ? `<section class="otros"><h3>También te puede interesar</h3><div class="grid mini4">${otros.map(tarjeta).join('')}</div></section>` : ''}
    </div>
    ${wa ? `<div class="dbar"><a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ico('wa')}Escribir por WhatsApp</a>${vend && vend.fono ? `<a class="ib s" href="${telLink(vend.fono)}" aria-label="Llamar">${ico('tel', 20)}</a>` : ''}</div>` : ''}`
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
  $$('.fav', c).forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); togFav(b.dataset.fav, b) }))
  // simulador: pie y plazo cambian la cuota al momento
  const sim = $('.sim', c)
  if (sim) {
    const pie = $('input[type=range]', sim), out = $('.sim-c b', sim), pv = $('.sim-pie', sim); let plazo = D.fin.plazo, ant = cuotaCon(it, +pie.value, plazo)
    const calc = () => { const v = cuotaCon(it, +pie.value, plazo); pv.textContent = `${pie.value}% · ${fmt(it.precio * pie.value / 100)}`; pie.style.setProperty('--p', (pie.value / 70 * 100) + '%'); tween(out, ant, v); ant = v }
    pie.addEventListener('input', calc); $$('.sim-pl button', sim).forEach(b => b.addEventListener('click', () => { plazo = +b.dataset.n; $$('.sim-pl button', sim).forEach(x => x.classList.toggle('on', x === b)); calc() }))
  }
  $$('.otros .card', c).forEach(a => a.addEventListener('click', e => { e.preventDefault(); history.replaceState({ i: a.dataset.id }, '', '#i=' + encodeURIComponent(a.dataset.id)); abrir(a.dataset.id, true) }))
}

// simulador de cuota (referencial) con los supuestos de la empresa
const cuotaCon = (it, piePct, n) => { const m = it.precio * (1 - piePct / 100), i = (D.fin.tasa || 0) / 100; return Math.round(i > 0 ? m * i / (1 - Math.pow(1 + i, -n)) : m / n) }
function simHtml(it) {
  const f = D.fin
  return `<div class="sim"><div class="sim-c"><span>Cuota referencial</span><b>${fmt(cuotaCon(it, f.pie, f.plazo))}</b><small>al mes</small></div>
    <label class="sim-r"><span>Pie <em class="sim-pie">${f.pie}% · ${fmt(it.precio * f.pie / 100)}</em></span><input type="range" min="0" max="70" step="5" value="${f.pie}" style="--p:${f.pie / 70 * 100}%" aria-label="Pie"></label>
    <div class="sim-pl">${[24, 36, 48, 60].map(n => `<button class="${n === f.plazo ? 'on' : ''}" data-n="${n}">${n} meses</button>`).join('')}</div>
    <small class="sim-n">Tasa ${String(f.tasa).replace('.', ',')}% mensual. Valores referenciales, sujetos a evaluación de la financiera.</small></div>`
}
function tween(el, de, a) { if (QUIETO) { el.textContent = fmt(a); return } const t0 = performance.now(); const p = t => { const k = Math.min(1, (t - t0) / 320), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(de + (a - de) * e); if (k < 1) requestAnimationFrame(p) }; requestAnimationFrame(p); }

// mis favoritos: lista y envío por WhatsApp a quien atiende
function abrirFavs() {
  const l = D.items.filter(x => favs.has(x.id)), con = D.contacto
  const txt = `Hola${con && D.quien !== 'empresa' ? ' ' + con.nombre.split(' ')[0] : ''}, estos son los ${T.varios} que me gustaron del catálogo de ${D.org.nombre}:\n` + l.map(it => `• ${titulo(it)}${anio(it) ? ' ' + anio(it) : ''} · ${precioTxt(it)}\n  ${itemUrl(it)}`).join('\n')
  const wa = con && waLink(con.fono, txt)
  const html = `<div class="phd"><h2>Mis favoritos</h2><button class="ib cerrar" data-cerrar aria-label="Cerrar">${ico('x', 20)}</button></div>
    <div class="pbody"><div class="favl">${l.map(it => `<div class="favr" data-id="${esc(it.id)}"><span class="fr-f">${it.foto ? `<img src="${esc(it.foto)}" alt="">` : ''}</span><span class="fr-t"><b>${esc(titulo(it))}${anio(it) ? ' ' + esc(anio(it)) : ''}</b><em>${esc(precioTxt(it))}</em></span><button class="ib fr-x" data-x="${esc(it.id)}" aria-label="Quitar ${esc(titulo(it))}">${ico('x', 18)}</button></div>`).join('') || '<p class="sub">Toca el corazón en los que te gusten y aparecerán aquí.</p>'}</div></div>
    ${l.length && wa ? `<div class="pft"><a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ico('wa')}Enviar mis favoritos</a></div>` : ''}`
  const c = capa(html, 'hoja')
  $$('.favr', c).forEach(r => r.addEventListener('click', e => { if (e.target.closest('.fr-x')) { favs.delete(r.dataset.id); guardaFavs(); contarFavs(); $$(`.fav[data-fav="${CSS.escape(r.dataset.id)}"]`).forEach(b => b.classList.remove('on')); r.remove(); return } cerrar(); setTimeout(() => abrir(r.dataset.id), 280) }))
}

// formulario de contacto (de un ítem o general: "avísenme cuando llegue")
function abrirForm(it, vend, modo) {
  const volver = it ? () => abrir(it.id, true) : null, pp = modo === 'pp'
  const html = `<div class="phd"><h2>${pp ? 'Cotiza tu auto' : it ? 'Te contactamos' : '¿Qué estás buscando?'}</h2><button class="ib cerrar" data-cerrar aria-label="Cerrar">${ico('x', 20)}</button></div>
    <form class="pbody form" id="form" novalidate>
      ${pp ? `<p class="sub">Cuéntanos qué auto tienes y te enviamos una tasación para dejarlo en parte de pago.</p>
      <div class="dos3"><label><span>Marca y modelo</span><input name="ppm" maxlength="40" placeholder="Ej: Suzuki Swift" required></label><label><span>Año</span><input name="ppa" inputmode="numeric" maxlength="4" placeholder="2018"></label></div>
      <label><span>Kilometraje</span><input name="ppk" inputmode="numeric" maxlength="9" placeholder="Ej: 85.000"></label>
      <div class="ppf"><span class="ppf-t">Fotos de tu auto <em>(opcional, hasta 6)</em></span><div class="ppf-g" id="ppfg"><label class="ppf-add">${ico('cam', 22)}<b>Agregar</b><input type="file" accept="image/*" multiple class="sr" id="ppfi" aria-label="Agregar fotos de tu auto"></label></div></div>` : ''}
      ${pp ? '' : it ? `<p class="sub">Déjanos tus datos y ${vend ? esc(vend.nombre.split(' ')[0]) : 'un ejecutivo'} te contacta por ${esc(titulo(it))}${anio(it) ? ' ' + esc(anio(it)) : ''}.</p>` : `<p class="sub">Cuéntanos qué necesitas y te avisamos apenas tengamos algo para ti.</p>`}
      <label><span>Nombre</span><input name="nombre" autocomplete="name" maxlength="60" required></label>
      <label><span>Teléfono</span><input name="fono" autocomplete="tel" inputmode="tel" maxlength="24" placeholder="+56 9 …" required></label>
      ${pp ? '' : `<label><span>${it ? 'Mensaje (opcional)' : 'Qué buscas'}</span><textarea name="mensaje" maxlength="400" rows="3" placeholder="${it ? (W === 'auto' ? '¿Aceptan mi auto en parte de pago?' : W === 'prop' ? '¿Cuándo puedo visitarla?' : '¿Tienen stock?') : (W === 'auto' ? 'Ej: SUV automática, hasta $15 millones' : W === 'prop' ? 'Ej: depto 2D en Ñuñoa, hasta $600 mil' : 'Ej: el producto que necesitas')}"></textarea></label>`}
      ${W === 'auto' && !pp ? `<label class="check"><input type="checkbox" name="pp" value="1"><span>Tengo un auto para dejar en parte de pago</span></label>` : ''}
      <input name="web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="err" id="err" hidden></p>
      <button class="btn acc" type="submit">${pp ? 'Pedir mi tasación' : 'Enviar'}</button>
      <p class="legal">Al enviar aceptas que ${esc(D.org.nombre)} use estos datos solo para contactarte por esta consulta.</p>
    </form>`
  const c = capa(html, 'hoja', h => { if (!h && volver && location.hash) { /* vuelve al detalle */ setTimeout(volver, 270) } })
  // fotos del auto en parte de pago: se achican aquí (1280 px, JPG) para que suban rápido
  const fotosPP = []
  const pintaFotos = () => { const g = $('#ppfg', c); if (!g) return; $$('.ppf-x', g).forEach(x => x.remove()); fotosPP.forEach((f, k) => g.insertAdjacentHTML('beforeend', `<span class="ppf-x"><img src="${f}" alt=""><button type="button" data-k="${k}" aria-label="Quitar foto">${ico('x', 14)}</button></span>`)); $$('.ppf-x button', g).forEach(b => b.addEventListener('click', () => { fotosPP.splice(+b.dataset.k, 1); pintaFotos() })); const add = $('.ppf-add', g); if (add) add.hidden = fotosPP.length >= 6 }
  const fi = $('#ppfi', c)
  if (fi) fi.addEventListener('change', async () => { for (const f of [...fi.files].slice(0, 6 - fotosPP.length)) { try { fotosPP.push(await achicar(f)) } catch (e) { aviso('Una foto no se pudo leer') } } fi.value = ''; pintaFotos() })
  $('#form', c).addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, b = $('button[type=submit]', f), er = $('#err', f), v = Object.fromEntries(new FormData(f))
    if (String(v.nombre).trim().length < 2 || String(v.fono).replace(/\D/g, '').length < 8) { er.textContent = 'Escribe tu nombre y un teléfono válido.'; er.hidden = false; return }
    b.disabled = true; b.textContent = pp && fotosPP.length ? 'Enviando fotos…' : 'Enviando…'; er.hidden = true
    if (pp && String(v.ppm || '').trim().length < 3) { er.textContent = 'Cuéntanos la marca y el modelo de tu auto.'; er.hidden = false; b.disabled = false; b.textContent = pp ? 'Pedir mi tasación' : 'Enviar'; return }
    const mensaje = pp ? `Quiere tasar su auto para parte de pago: ${String(v.ppm).trim()}${v.ppa ? ' ' + String(v.ppa).trim() : ''}${v.ppk ? ', ' + String(v.ppk).trim() + ' km' : ''}.` : [v.pp ? 'Tiene un auto para dejar en parte de pago.' : '', String(v.mensaje || '').trim()].filter(Boolean).join(' ')
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: v.nombre, fono: v.fono, mensaje, web: v.web, s: S, v: V || undefined, i: it ? it.id : undefined, fotos: pp && fotosPP.length ? fotosPP : undefined }) }), j = await r.json()
      if (!r.ok) throw new Error(j.error || 'No se pudo enviar')
      f.innerHTML = `<div class="listo">${ico('ok', 36)}<h2>¡Listo, ${esc(String(v.nombre).trim().split(' ')[0])}!</h2><p>${pp ? 'Te enviamos la tasación muy pronto.' : vend && D.quien !== 'empresa' ? esc(vend.nombre.split(' ')[0]) + ' te va a contactar muy pronto.' : 'Te vamos a contactar muy pronto.'}</p><button type="button" class="btn ghost" data-cerrar>Seguir viendo</button></div>`
      $$('[data-cerrar]', f).forEach(x => x.addEventListener('click', () => cerrar()))
    } catch (x) { er.textContent = x.message || 'No se pudo enviar. Inténtalo de nuevo.'; er.hidden = false; b.disabled = false; b.textContent = pp ? 'Pedir mi tasación' : 'Enviar' }
  })
}

// achica una foto a 1280 px en JPG (las del celular pesan varios MB)
function achicar(file, max = 1280) {
  return new Promise((ok, mal) => {
    const u = URL.createObjectURL(file), im = new Image()
    im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); ok(cv.toDataURL('image/jpeg', 0.78)) }
    im.onerror = () => { URL.revokeObjectURL(u); mal(new Error('foto')) }
    im.src = u
  })
}
function aviso(t) { const a = document.createElement('div'); a.className = 'aviso'; a.textContent = t; document.body.appendChild(a); requestAnimationFrame(() => a.classList.add('in')); setTimeout(() => { a.classList.remove('in'); setTimeout(() => a.remove(), 300) }, 1800) }

// #i=<id> abre el detalle (enlace compartido o botón atrás)
function ruta() {
  const m = location.hash.match(/^#i=(.+)$/), id = m ? decodeURIComponent(m[1]) : ''
  const abierto = $('#capa .panel') && $('#capa .panel').dataset.id
  if (id && D.items.some(x => x.id === id)) { if (abierto !== id) abrir(id, true) } else if (!$('#capa').hidden && $('#capa').classList.contains('det')) cerrar(true)
}
addEventListener('popstate', () => D && ruta())

// color de la empresa: si es muy claro, el texto encima va oscuro
function colores(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return
  const n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255, lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  const R = document.documentElement.style
  R.setProperty('--acc', '#' + m[1]); R.setProperty('--acc-ink', lum > 0.55 ? '#141900' : '#FFFFFF'); R.setProperty('--acc-txt', lum > 0.32 ? '#' + m[1] : '#F5F2EB')
}

async function cargar() {
  if (!API.startsWith('http') || !S) return error('Catálogo no encontrado')
  try { const r = await fetch(`${API}?s=${encodeURIComponent(S)}${V ? '&v=' + encodeURIComponent(V) : ''}`); D = await r.json(); if (!r.ok) throw new Error(D.error || 'error') }
  catch (e) { D = null; return error(e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos cargar el catálogo') }
  W = TXT[D.w] ? D.w : 'auto'; T = TXT[W]
  colores(D.org.accent || { auto: '#C8F03C', prop: '#B7A6FF', tienda: '#FF8A6B' }[W]); pintar()
}
function error(t) { $('#app').className = 'vacio'; $('#app').innerHTML = `<div class="nada"><h1>${esc(t)}</h1><p>Puede que el enlace no esté completo o que la empresa haya pausado su catálogo. Escríbele a quien te lo envió.</p></div>` }
cargar()
