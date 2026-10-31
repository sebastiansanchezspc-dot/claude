// Agente de diseño para Instagram.
// Cuando un vehículo recibe fotos nuevas, la base de datos llama a esta función (con x-cron-key).
// El agente (Claude con visión) mira las fotos, elige la mejor y decide encuadre, estilo, textos y caption;
// render.ts compone la pieza 1080×1350 con el logo y colores de la empresa, y se envía por correo
// al vendedor (o a los administradores) con un botón para compartirla por WhatsApp.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import Anthropic from 'npm:@anthropic-ai/sdk@1.3.0'
import { renderPieza, type Diseno } from './render.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } })
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const MAIL_FROM = Deno.env.get('MAIL_FROM') || 'Gestix <onboarding@resend.dev>'
const BUCKET = 'archivos'
const ESPERA_MS = 20000   // las fotos suben de a una: se espera a que termine la tanda
const MAX_FOTOS = 6

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
const firma = (fotos: string[]) => fotos.join('|')
const clp = (n: number) => n > 0 ? '$' + Math.round(n).toLocaleString('es-CL') : null
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

function b64(u: Uint8Array) { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s) }
async function bajar(path: string) {
  const { data, error } = await db.storage.from(BUCKET).download(path)
  if (error || !data) throw new Error('No se pudo leer ' + path)
  return { bytes: new Uint8Array(await data.arrayBuffer()), tipo: data.type || (path.endsWith('.png') ? 'image/png' : path.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg') }
}

/* ---------------------------------------------------------------- el agente */
const SISTEMA = `Eres director de arte senior de una agencia especializada en marketing automotriz en Chile.
Diseñas piezas de Instagram (feed 4:5, 1080×1350) para automotoras que venden autos usados y seminuevos.
Recibes las fotos de un vehículo, sus datos y el logo de la automotora. Tu trabajo:
1. Elegir la foto con más fuerza comercial: auto completo y nítido, ángulo 3/4 delantero ideal, buena luz, sin personas ni patentes en primer plano. Evita fotos de interior, detalles o documentos como portada salvo que no haya otra.
2. Definir el encuadre (CSS object-position) para que el auto quede completo y centrado en el área visible.
   - estilo "claro": la foto ocupa la franja superior 1080×900 (proporción 1,2:1), bueno para fotos horizontales y autos completos.
   - estilo "oscuro": la foto ocupa todo el alto 1080×1350 con un degradado negro abajo; solo si la foto es vertical o el recorte vertical sigue mostrando el auto entero y atractivo.
3. Elegir el color de acento a partir del logo de la empresa (un hex que se lea bien sobre blanco y sobre negro). Sin logo, usa un rojo #E11D48.
4. Escribir textos en español de Chile, profesionales y cercanos, sin exagerar ni inventar:
   - etiqueta: máx. 18 caracteres ("Recién llegado", "Único dueño", "Oportunidad"…). Solo afirma lo que los datos o las fotos respaldan.
   - titular: marca + modelo (+ versión si cabe), máx. 22 caracteres.
   - subtitulo: año · km · transmisión · combustible con los datos que existan, máx. 44 caracteres.
   - destacados: 2 o 3 chips de máx. 18 caracteres basados en los datos, notas o lo que se ve en las fotos.
   - caption: 3 a 6 líneas para Instagram con emojis moderados, llamado a escribir por WhatsApp o visitar la automotora, y 6 a 10 hashtags relevantes al final.
Nunca inventes precio, kilometraje, garantías ni condiciones de financiamiento que no estén en los datos.
Si ninguna foto muestra un vehículo, responde apta=false y explica el motivo en "motivo".`

const ESQUEMA = {
  type: 'object', additionalProperties: false,
  required: ['apta', 'motivo', 'foto', 'encuadre', 'estilo', 'acento', 'etiqueta', 'titular', 'subtitulo', 'destacados', 'caption'],
  properties: {
    apta: { type: 'boolean' }, motivo: { type: 'string' },
    foto: { type: 'integer' }, encuadre: { type: 'string' },
    estilo: { type: 'string', enum: ['oscuro', 'claro'] }, acento: { type: 'string' },
    etiqueta: { type: 'string' }, titular: { type: 'string' }, subtitulo: { type: 'string' },
    destacados: { type: 'array', items: { type: 'string' } }, caption: { type: 'string' },
  },
}
type Decision = Diseno & { apta: boolean; motivo: string; caption: string }

async function dirigir(fotos: string[], logo: { bytes: Uint8Array; tipo: string } | null, datos: Record<string, unknown>): Promise<Decision> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = []
  fotos.forEach((url, i) => { content.push({ type: 'text', text: `Foto ${i}:` }, { type: 'image', source: { type: 'url', url } }) })
  if (logo && logo.tipo !== 'image/svg+xml') content.push({ type: 'text', text: 'Logo de la automotora:' }, { type: 'image', source: { type: 'base64', media_type: logo.tipo as 'image/png', data: b64(logo.bytes) } })
  content.push({ type: 'text', text: 'Datos del vehículo:\n' + JSON.stringify(datos, null, 2) })

  const r = await new Anthropic().beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: ESQUEMA } },
    system: SISTEMA,
    messages: [{ role: 'user', content }],
  } as never) as Anthropic.Beta.BetaMessage
  if (r.stop_reason === 'refusal') throw new Error('El modelo no quiso procesar estas fotos')
  const txt = r.content.find(b => b.type === 'text')
  if (!txt || txt.type !== 'text') throw new Error('El agente no devolvió diseño')
  const d = JSON.parse(txt.text) as Decision
  d.foto = Math.min(Math.max(0, d.foto | 0), fotos.length - 1)
  return d
}

/* ---------------------------------------------------------------- entrega */
async function destinatarios(org: string, item: Record<string, any>, dueno: string | null) {
  const propio = (item.creadoPor?.email || dueno || '').toLowerCase()
  if (propio.includes('@')) return [propio]
  const { data } = await db.from('miembros').select('email').eq('org_id', org).eq('rol', 'admin').eq('activo', true)
  return (data ?? []).map(m => m.email).filter(Boolean)
}

async function enviarCorreo(to: string[], empresa: string, titular: string, png: Uint8Array, caption: string, url: string) {
  if (!RESEND_API_KEY) throw new Error('Falta RESEND_API_KEY')
  const wa = 'https://wa.me/?text=' + encodeURIComponent(caption + '\n\n' + url)
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
    <h2 style="margin:0 0 4px">Tu publicación de Instagram está lista</h2>
    <p style="margin:0 0 16px;color:#555">${esc(empresa)} · ${esc(titular)}</p>
    <img src="${url}" alt="Publicación" style="width:100%;border-radius:12px">
    <p style="margin:20px 0 6px;font-weight:bold">Texto para la publicación</p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f4f4f5;padding:14px;border-radius:10px">${esc(caption)}</pre>
    <p><a href="${wa}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Compartir por WhatsApp</a></p>
    <p style="color:#777;font-size:12px">La imagen va adjunta (1080×1350, lista para el feed). El enlace dura 7 días.</p></div>`
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to, subject: `📸 Publicación lista: ${titular}`, html, attachments: [{ filename: 'instagram.png', content: b64(png) }] }),
  })
  if (!r.ok) throw new Error('Correo: ' + r.status + ' ' + (await r.text()).slice(0, 200))
}

/* ---------------------------------------------------------------- proceso */
async function procesar(org: string, itemId: string, sig: string) {
  await new Promise(r => setTimeout(r, ESPERA_MS))
  const { data: doc } = await db.from('docs').select('data,dueno').eq('org_id', org).eq('col', 'items').eq('id', itemId).maybeSingle()
  if (!doc) return
  const item = doc.data as Record<string, any>
  const todas: string[] = (item.fotos ?? []).filter((f: unknown) => typeof f === 'string' && f.startsWith(org + '/'))
  if (firma(todas) !== sig) return // llegaron más fotos: la llamada más nueva se encarga

  // una sola pieza por tanda de fotos (si la base llama dos veces, la segunda no hace nada)
  const { data: fila } = await db.from('ig_piezas').insert({ org_id: org, item_id: itemId, fotos_sig: sig, estado: 'procesando' }).select('id').maybeSingle()
  if (!fila) return
  const fin = (x: Record<string, unknown>) => db.from('ig_piezas').update(x).eq('id', fila.id)

  try {
    const [{ data: o }, { data: prefs }] = await Promise.all([
      db.from('orgs').select('nombre').eq('id', org).single(),
      db.from('docs').select('data').eq('org_id', org).eq('col', 'config').eq('id', 'prefs').maybeSingle(),
    ])
    const empresa = o?.nombre ?? ''
    const logoPath: string | null = prefs?.data?.logo && String(prefs.data.logo).startsWith(org + '/') ? prefs.data.logo : null
    const logo = logoPath ? await bajar(logoPath).catch(() => null) : null

    const elegidas = todas.slice(-MAX_FOTOS) // las más recientes
    const { data: firmadas } = await db.storage.from(BUCKET).createSignedUrls(elegidas, 3600)
    const urls = (firmadas ?? []).map(f => f.signedUrl).filter(Boolean) as string[]
    if (!urls.length) throw new Error('No se pudieron leer las fotos')

    const s = item.specs ?? {}
    const d = await dirigir(urls, logo, {
      nombre: item.nombre, marca: s.marca, modelo: s.modelo, anio: s.anio, km: s.km, color: s.color, tipo: s.tipo,
      transmision: s.transmision, combustible: s.combustible, precio: clp(item.precio) ?? 'sin precio publicado', notas: item.notas || '',
      empresa, color_marca_actual: prefs?.data?.accent?.auto ?? null,
    })
    if (!d.apta) { await fin({ estado: 'omitida', error: d.motivo, diseno: d }); return }

    const foto = await bajar(elegidas[d.foto])
    const png = await renderPieza({
      foto: `data:${foto.tipo};base64,${b64(foto.bytes)}`,
      logo: logo ? `data:${logo.tipo};base64,${b64(logo.bytes)}` : null,
      empresa, precio: clp(item.precio), d,
    })
    const ruta = `${org}/ig/${itemId}-${Date.now()}.png`
    const { error: eUp } = await db.storage.from(BUCKET).upload(ruta, new Blob([png as BlobPart], { type: 'image/png' }), { contentType: 'image/png' })
    if (eUp) throw eUp
    const { data: link } = await db.storage.from(BUCKET).createSignedUrl(ruta, 60 * 60 * 24 * 7)

    const to = await destinatarios(org, item, doc.dueno)
    await fin({ imagen: ruta, caption: d.caption, diseno: d, enviado_a: to })
    if (!to.length) throw new Error('La empresa no tiene a quién enviarle la pieza')
    await enviarCorreo(to, empresa, d.titular, png, d.caption, link?.signedUrl ?? '')
    await fin({ estado: 'enviada' })
  } catch (e) {
    console.error('agente-ig', org, itemId, e)
    await fin({ estado: 'error', error: String((e as Error)?.message ?? e).slice(0, 500) })
  }
}

Deno.serve(async req => {
  const body = await req.json().catch(() => ({}))
  const { data: c } = await db.from('push_config').select('cron_key').eq('id', 1).single()
  if (!c || req.headers.get('x-cron-key') !== c.cron_key) return json({ error: 'Sin permiso' }, 403)
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'Falta ANTHROPIC_API_KEY' }, 503)
  const { org_id, item_id, sig } = body as Record<string, string>
  if (!org_id || !item_id || typeof sig !== 'string') return json({ error: 'Faltan datos' }, 400)
  // se responde al tiro y el trabajo sigue en segundo plano
  // @ts-ignore EdgeRuntime existe en Supabase Edge Functions
  EdgeRuntime.waitUntil(procesar(org_id, item_id, sig))
  return json({ ok: true }, 202)
})
