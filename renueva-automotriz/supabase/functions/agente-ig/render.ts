// Compone la pieza de Instagram (1080×1350, formato 4:5) a partir de lo que decidió el agente.
// Satori dibuja el diseño como SVG y resvg lo convierte a PNG; todo corre dentro de la función.
import satori from 'npm:satori@0.12.0'
import { initWasm, Resvg } from 'npm:@resvg/resvg-wasm@2.6.2'

export const W = 1080, H = 1350

export type Diseno = {
  foto: number                 // índice de la foto elegida como principal
  encuadre: string             // object-position CSS, ej. "50% 60%"
  estilo: 'oscuro' | 'claro'
  acento: string               // color de la marca (hex)
  etiqueta: string             // cinta superior: "RECIÉN LLEGADO", "ÚNICO DUEÑO"…
  titular: string              // "Toyota RAV4"
  subtitulo: string            // "2021 · 38.500 km · Automático"
  destacados: string[]         // hasta 3 chips cortos
}
export type Pieza = { foto: string; logo: string | null; empresa: string; precio: string | null; d: Diseno }

const FUENTES = [
  ['Montserrat', 800, 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-800-normal.woff'],
  ['Inter', 500, 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.woff'],
  ['Inter', 700, 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'],
] as const
let listo: Promise<{ name: string; data: ArrayBuffer; weight: 500 | 700 | 800; style: 'normal' }[]> | null = null
function preparar() {
  listo ??= (async () => {
    await initWasm(fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm'))
    return Promise.all(FUENTES.map(async ([name, weight, url]) => ({ name, weight, style: 'normal' as const, data: await (await fetch(url)).arrayBuffer() })))
  })()
  return listo
}

// elemento de satori sin React: { type, props: { style, children } }
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]) =>
  ({ type, props: { style: { display: 'flex', ...style }, children: children.flat().filter(c => c !== null && c !== false && c !== '') } })
const img = (src: string, style: Record<string, unknown>) => ({ type: 'img', props: { src, style } })

const hex = (c: string) => /^#[0-9a-f]{6}$/i.test(c) ? c : '#E11D48'
// texto legible encima del color de acento
const sobre = (c: string) => { const n = parseInt(c.slice(1), 16), l = (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; return l > 0.6 ? '#0B0B0F' : '#FFFFFF' }

function diseno({ foto, logo, empresa, precio, d }: Pieza) {
  const ac = hex(d.acento), claro = d.estilo === 'claro'
  const fg = claro ? '#0B0B0F' : '#FFFFFF', fg2 = claro ? '#3F3F46' : 'rgba(255,255,255,0.82)'
  const chips = d.destacados.slice(0, 3).map(t => h('div', {
    padding: '12px 22px', borderRadius: 999, fontFamily: 'Inter', fontWeight: 700, fontSize: 26,
    color: fg, background: claro ? '#F4F4F5' : 'rgba(255,255,255,0.14)', border: claro ? '2px solid #E4E4E7' : '2px solid rgba(255,255,255,0.28)',
  }, t))
  const precioBox = h('div', { flexDirection: 'column', alignItems: 'flex-end' },
    h('div', { fontFamily: 'Inter', fontWeight: 500, fontSize: 24, color: fg2, letterSpacing: 2 }, 'PRECIO'),
    h('div', { fontFamily: 'Montserrat', fontWeight: 800, fontSize: precio ? 64 : 44, color: ac, lineHeight: 1 }, precio || 'Consúltanos'))

  // panel inferior: degradado oscuro sobre la foto, o tarjeta blanca
  const panel = h('div', {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'column', gap: 26,
    padding: claro ? '48px 64px 56px' : '220px 64px 64px',
    background: claro ? '#FFFFFF' : 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.92) 100%)',
    borderTop: claro ? `10px solid ${ac}` : 'none',
  },
    h('div', { fontFamily: 'Montserrat', fontWeight: 800, fontSize: d.titular.length > 18 ? 76 : 92, lineHeight: 1.02, color: fg, letterSpacing: -2 }, d.titular),
    h('div', { fontFamily: 'Inter', fontWeight: 500, fontSize: 34, color: fg2 }, d.subtitulo),
    h('div', { gap: 14, flexWrap: 'wrap' }, chips),
    h('div', { justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
      h('div', { alignItems: 'center', gap: 14, fontFamily: 'Inter', fontWeight: 700, fontSize: 26, color: fg },
        h('div', { width: 14, height: 14, borderRadius: 7, background: ac }), empresa),
      precioBox))

  return h('div', { width: W, height: H, position: 'relative', background: claro ? '#FFFFFF' : '#0B0B0F', fontFamily: 'Inter' },
    img(foto, { position: 'absolute', left: 0, top: 0, width: W, height: claro ? 900 : H, objectFit: 'cover', objectPosition: d.encuadre || '50% 50%' }),
    // franja superior para que logo y cinta se lean sobre cualquier foto
    h('div', { position: 'absolute', left: 0, right: 0, top: 0, height: 220, background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)' }),
    h('div', { position: 'absolute', left: 48, right: 48, top: 44, justifyContent: 'space-between', alignItems: 'center' },
      logo
        ? h('div', { background: '#FFFFFF', borderRadius: 20, padding: '14px 22px', alignItems: 'center' }, img(logo, { height: 72, maxWidth: 300, objectFit: 'contain' }))
        : h('div', { fontFamily: 'Montserrat', fontWeight: 800, fontSize: 34, color: '#FFFFFF' }, empresa),
      d.etiqueta ? h('div', { background: ac, color: sobre(ac), fontFamily: 'Inter', fontWeight: 700, fontSize: 26, letterSpacing: 2, padding: '14px 26px', borderRadius: 999 }, d.etiqueta.toUpperCase()) : null),
    panel)
}

export async function renderPieza(p: Pieza): Promise<Uint8Array> {
  const fonts = await preparar()
  const svg = await satori(diseno(p) as never, { width: W, height: H, fonts })
  return new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
}
