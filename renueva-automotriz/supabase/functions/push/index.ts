// Notificaciones push de Gestix.
//   action "cron"   → (pg_cron, cada minuto, con x-cron-key) envía los recordatorios que vencieron
//   action "clave"  → (usuario con sesión) devuelve la clave pública para suscribir el celular
//   action "prueba" → (usuario con sesión) envía una notificación de prueba a sus celulares
// Las claves VAPID se generan aquí la primera vez y quedan en push_config (nunca salen del servidor).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { b64u, sendPush, type Vapid } from '../_shared/webpush.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } })
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

async function config(): Promise<Vapid & { cronKey: string }> {
  const { data: c, error } = await db.from('push_config').select('*').eq('id', 1).single()
  if (error || !c) throw new Error('Falta push_config')
  if (!c.vapid_public || !c.vapid_private) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair
    const pub = b64u.enc(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)))
    const priv = (await crypto.subtle.exportKey('jwk', kp.privateKey)).d as string
    // solo la primera vez (si otra llamada ya las creó, se usan esas)
    await db.from('push_config').update({ vapid_public: pub, vapid_private: priv }).eq('id', 1).is('vapid_public', null)
    return config()
  }
  return { publicKey: c.vapid_public, privateKey: c.vapid_private, subject: c.subject, cronKey: c.cron_key }
}

async function enviar(lista: { endpoint: string; p256dh: string; auth: string; title: string; body: string; url?: string; tag?: string }[], v: Vapid) {
  let ok = 0, bajas = 0, fallas = 0
  await Promise.all(lista.map(async s => {
    try {
      const st = await sendPush(s, { title: s.title, body: s.body, url: s.url || '/', tag: s.tag }, v)
      if (st >= 200 && st < 300) ok++
      else if (st === 404 || st === 410) { bajas++; await db.from('push_subs').delete().eq('endpoint', s.endpoint) } // el celular ya no la usa
      else fallas++
    } catch { fallas++ }
  }))
  return { ok, bajas, fallas }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    const v = await config()

    if (action === 'cron') {
      if (req.headers.get('x-cron-key') !== v.cronKey) return json({ error: 'Sin permiso' }, 403)
      const { data, error } = await db.rpc('push_pendientes')
      if (error) throw error
      return json({ enviados: await enviar(data ?? [], v) })
    }

    // acciones del usuario: se valida su sesión
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: u } = await db.auth.getUser(token)
    if (!u?.user) return json({ error: 'Sesión no válida' }, 401)
    if (action === 'clave') return json({ publicKey: v.publicKey })
    if (action === 'prueba') {
      const { data: subs } = await db.from('push_subs').select('endpoint,p256dh,auth').eq('user_id', u.user.id)
      if (!subs?.length) return json({ error: 'Este celular aún no está registrado' }, 400)
      const r = await enviar(subs.map(s => ({ ...s, title: 'Notificaciones activadas', body: 'Así te avisaremos de tus recordatorios, aunque la app esté cerrada.', tag: 'prueba' })), v)
      return json(r)
    }
    return json({ error: 'Acción desconocida' }, 400)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
