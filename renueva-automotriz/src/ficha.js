// Página pública de un auto, propiedad o producto: la abre el código QR o el enlace compartido.
// Muestra fotos, precio y datos, y deja contactar al vendedor por WhatsApp o con un formulario.
import './ficha.css'

const API = (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/ficha'
const q = new URLSearchParams(location.search), O = q.get('o') || '', I = q.get('i') || ''
const $ = s => document.querySelector(s)
const esc = s => String(s ?? '').replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]))
const fmt = n => '$' + Math.round(n || 0).toLocaleString('es-CL')
const ok = v => v != null && v !== '' && v !== '—' && v !== '-'
const CAMPOS = {
  auto: [['anio', 'Año'], ['km', 'Kilometraje', v => Number(v).toLocaleString('es-CL') + ' km'], ['transmision', 'Transmisión'], ['combustible', 'Combustible'], ['color', 'Color'], ['tipo', 'Carrocería']],
  prop: [['tipo', 'Tipo'], ['comuna', 'Comuna'], ['dorm', 'Dormitorios'], ['banos', 'Baños'], ['m2c', 'Construidos', v => v + ' m²'], ['m2t', 'Terreno', v => v + ' m²']],
  tienda: [['marca', 'Marca'], ['categoria', 'Categoría'], ['variante', 'Variante']],
}
const ICO = {
  wa: '<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20Z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2L9 8.5Z"/>',
  tel: '<path d="M7 3.5h3l1.3 4L9.5 9.2a11 11 0 0 0 5.3 5.3l1.7-1.8 4 1.3v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 5.5 5.1 1.5 1.5 0 0 1 7 3.5Z"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', share: '<path d="M12 15V4"/><path d="M8 7.5 12 3.5l4 4"/><path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1"/>',
}
const ico = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`

function error(t) { $('#f').className = 'vacio'; $('#f').innerHTML = `<div class="nada"><h1>${esc(t)}</h1><p>Puede que ya se haya vendido o que el enlace no esté completo. Escríbele a quien te lo envió.</p></div>` }

async function cargar() {
  if (!API.startsWith('http') || !O || !I) { error('Publicación no encontrada'); return }
  let d
  try { const r = await fetch(`${API}?o=${encodeURIComponent(O)}&i=${encodeURIComponent(I)}`); d = await r.json(); if (!r.ok) throw new Error(d.error || 'error') }
  catch (e) { error(e && e.message && !/fetch/i.test(e.message) ? e.message : 'No pudimos cargar la publicación'); return }
  pintar(d)
}

// color de la empresa: si es muy claro u oscuro, el texto encima cambia para que se lea
function colores(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return
  const n = parseInt(m[1], 16), lum = (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255, R = document.documentElement.style
  R.setProperty('--acc', '#' + m[1]); R.setProperty('--acc-ink', lum > 0.55 ? '#141900' : '#FFFFFF')
}
function pintar({ org, item: it, vend, cat }) {
  colores(org.accent || { auto: '#C8F03C', prop: '#B7A6FF', tienda: '#FF8A6B' }[it.w])
  const s = it.specs || {}, titulo = it.w === 'auto' && ok(s.marca) ? [s.marca, s.modelo].filter(ok).join(' ') : it.nombre
  const sub = it.w === 'auto' ? [s.anio, ok(s.km) && Number(s.km).toLocaleString('es-CL') + ' km'].filter(ok).join(' · ') : it.w === 'prop' ? [s.tipo, s.comuna].filter(ok).join(' · ') : s.categoria || ''
  const precio = it.precio ? fmt(it.precio) + (it.op === 'Arriendo' ? ' /mes' : '') : 'Consultar precio'
  const datos = (CAMPOS[it.w] || []).filter(([k]) => ok(s[k])).map(([k, l, f]) => `<div><span>${l}</span><b>${esc(f ? f(s[k]) : s[k])}</b></div>`).join('')
  const fono = vend && vend.fono ? vend.fono.replace(/\D/g, '') : '', wa = fono ? `https://wa.me/${fono.length === 9 ? '56' + fono : fono}?text=${encodeURIComponent(`Hola${vend.nombre ? ' ' + vend.nombre.split(' ')[0] : ''}, vi ${titulo}${it.w === 'auto' && ok(s.anio) ? ' ' + s.anio : ''} en la página de ${org.nombre}. ¿Sigue disponible?`)}` : ''
  document.title = `${titulo} · ${org.nombre}`
  const op = it.w === 'prop' ? (it.op === 'Arriendo' ? 'En arriendo' : 'En venta') : it.estado === 'reservado' ? 'Reservado' : 'Disponible'
  $('#f').className = 'ficha'
  $('#f').innerHTML = `
    <header class="top"><div class="marca">${org.logo ? `<img src="${esc(org.logo)}" alt="">` : `<span class="ini">${esc(org.nombre.slice(0, 2).toUpperCase())}</span>`}<b>${esc(org.nombre)}</b></div><button class="ib" id="compartir" aria-label="Compartir">${ico('share', 18)}</button></header>
    <section class="fotos" id="fotos">${it.fotos.length ? it.fotos.map((u, k) => `<img src="${esc(u)}" alt="Foto ${k + 1}" ${k ? 'loading="lazy"' : ''}>`).join('') : '<div class="sinfoto">Fotos pronto</div>'}</section>
    ${it.fotos.length > 1 ? `<div class="pts" id="pts">${it.fotos.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div>` : ''}
    <section class="info">
      <span class="chip ${it.estado === 'reservado' ? 'res' : ''}">${op}</span>
      <h1>${esc(titulo)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}
      <p class="precio">${precio}</p>
      ${datos ? `<div class="datos">${datos}</div>` : ''}
      ${it.notas ? `<p class="notas">${esc(it.notas)}</p>` : ''}
    </section>
    <section class="contacto">
      ${vend ? `<div class="vend"><span class="av">${vend.foto ? `<img src="${esc(vend.foto)}" alt="">` : esc((vend.nombre || 'G').split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><div><b>${esc(vend.nombre)}</b><small>${esc(org.nombre)}</small></div></div>` : ''}
      ${wa ? `<a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ico('wa')}Escribir por WhatsApp</a><a class="btn ghost" href="tel:+${fono.length === 9 ? '56' + fono : fono}">${ico('tel')}Llamar</a>` : ''}
      <form id="form" class="form" novalidate>
        <h2>¿Te interesa? Te contactamos</h2>
        <label><span>Nombre</span><input name="nombre" autocomplete="name" maxlength="60" required></label>
        <label><span>Teléfono</span><input name="fono" autocomplete="tel" inputmode="tel" maxlength="24" placeholder="+56 9 …" required></label>
        <label><span>Mensaje (opcional)</span><textarea name="mensaje" maxlength="400" rows="3" placeholder="${it.w === 'auto' ? '¿Aceptan auto en parte de pago?' : '¿Cuándo puedo visitarla?'}"></textarea></label>
        <input name="web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="err" id="err" hidden></p>
        <button class="btn primary" type="submit">Enviar consulta</button>
      </form>
    </section>
    ${cat && /^[a-z0-9-]+$/.test(cat) ? `<a class="vercat" href="/c/${cat}">Ver ${it.w === 'prop' ? 'todas las propiedades' : it.w === 'auto' ? 'todos los autos' : 'todo el catálogo'} de ${esc(org.nombre)}</a>` : ''}
    <footer class="pie">${esc(org.nombre)} · publicado con <b>gestix</b></footer>`
  // puntos de la galería
  const g = $('#fotos'), pts = document.querySelectorAll('#pts i')
  { const im = g.querySelector('img'), ya = () => g.classList.add('ok'); !im || (im.complete && im.naturalWidth) ? ya() : (im.addEventListener('load', ya, { once: true }), im.addEventListener('error', ya, { once: true })) }
  if (pts.length) g.addEventListener('scroll', () => { const k = Math.round(g.scrollLeft / g.clientWidth); pts.forEach((p, j) => p.classList.toggle('on', j === k)) }, { passive: true })
  $('#compartir').addEventListener('click', async () => { try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); $('#compartir').classList.add('ok') } } catch (e) { } })
  $('#form').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, b = f.querySelector('button'), er = $('#err'), v = Object.fromEntries(new FormData(f))
    if (String(v.nombre).trim().length < 2 || String(v.fono).replace(/\D/g, '').length < 8) { er.textContent = 'Escribe tu nombre y un teléfono válido.'; er.hidden = false; return }
    b.disabled = true; b.textContent = 'Enviando…'; er.hidden = true
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...v, o: O, i: I }) }), j = await r.json()
      if (!r.ok) throw new Error(j.error || 'No se pudo enviar')
      f.outerHTML = `<div class="listo">${ico('ok', 28)}<h2>¡Listo, ${esc(String(v.nombre).split(' ')[0])}!</h2><p>${vend ? esc(vend.nombre.split(' ')[0]) : 'Un vendedor'} te va a contactar muy pronto.</p></div>`
    } catch (x) { er.textContent = x.message || 'No se pudo enviar. Inténtalo de nuevo.'; er.hidden = false; b.disabled = false; b.textContent = 'Enviar consulta' }
  })
}
cargar()
