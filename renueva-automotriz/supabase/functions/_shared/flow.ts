// Cliente de la API de Flow (https://www.flow.cl/docs/api.html).
// Todas las llamadas llevan apiKey y se firman con HMAC-SHA256 usando la secretKey:
// parámetros ordenados alfabéticamente, concatenados nombre+valor.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

export const FLOW_API_KEY = Deno.env.get('FLOW_API_KEY') ?? ''
const FLOW_SECRET_KEY = Deno.env.get('FLOW_SECRET_KEY') ?? ''
const BASE = Deno.env.get('FLOW_API_URL') || (Deno.env.get('FLOW_SANDBOX') === '1' ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api')
export const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '')
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
export const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/flow-webhook`
export const flowConfigured = () => !!(FLOW_API_KEY && FLOW_SECRET_KEY)

export const admin = () => createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } })

async function sign(params: Record<string, string>) {
  const toSign = Object.keys(params).sort().map(k => k + params[k]).join('')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(FLOW_SECRET_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function flow(method: 'GET' | 'POST', path: string, params: Record<string, string | number | undefined> = {}) {
  const p: Record<string, string> = { apiKey: FLOW_API_KEY }
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) p[k] = String(v)
  p.s = await sign(p)
  const body = new URLSearchParams(p)
  const res = method === 'GET'
    ? await fetch(`${BASE}${path}?${body}`)
    : await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body })
  const text = await res.text()
  let json: any
  try { json = JSON.parse(text) } catch { json = { message: text } }
  if (!res.ok) throw new Error(`Flow ${path}: ${json.message ?? res.status} (${json.code ?? res.status})`)
  return json
}

export const planIdFlow = (plan: string, ciclo: string) => `renueva_${plan}_${ciclo === 'anual' ? 'a' : 'm'}`
// fechas de Flow vienen como "2026-11-23 00:00:00" en hora de Chile
export const flowDate = (s?: string | null) => (s ? new Date(s.replace(' ', 'T') + '-03:00').toISOString() : null)

// Lee la suscripción en Flow y deja la empresa al día (pagado_hasta, cancelación).
export async function syncOrg(db: ReturnType<typeof admin>, org: any) {
  if (!org.flow_subscription_id) return null
  const sub = await flow('GET', '/subscription/get', { subscriptionId: org.flow_subscription_id })
  const upd: Record<string, unknown> = { flow_cancelada: sub.cancel_at_period_end == 1 || sub.status == 4 }
  // activa (1) o en trial (2): pagada hasta el fin del período, salvo que tenga cobros vencidos (morose = 1)
  if ((sub.status == 1 || sub.status == 2) && sub.morose != 1 && sub.period_end) upd.pagado_hasta = flowDate(sub.period_end)
  // historial: cada importe pagado queda registrado una sola vez
  const pagados = (sub.invoices ?? []).filter((i: any) => i.status == 1)
  if (pagados.length) await db.from('pagos').upsert(pagados.map((i: any) => ({
    org_id: org.id, proveedor: 'flow', referencia: 'inv-' + i.id, monto: Math.round(Number(i.amount) || 0), estado: 'pagado',
    periodo_hasta: flowDate(i.period_end), detalle: { subject: i.subject, period_start: i.period_start },
  })), { onConflict: 'proveedor,referencia', ignoreDuplicates: true })
  await db.from('orgs').update(upd).eq('id', org.id)
  return sub
}

export const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}
export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'content-type': 'application/json' } })
