// Acciones de cobro que pide la app (siempre con la sesión del usuario):
//   checkout  → crea el cliente en Flow y devuelve el enlace para registrar la tarjeta
//   change    → cambia el plan de una suscripción activa
//   cancel    → cancela al final del período pagado
//   sync      → trae el estado de la suscripción desde Flow
//   setup-plans (solo plataforma) → crea en Flow los 6 planes (3 planes × mensual/anual)
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { admin, cors, flow, flowConfigured, json, planIdFlow, SUPABASE_URL, syncOrg, WEBHOOK_URL } from '../_shared/flow.ts'

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const auth = req.headers.get('Authorization') ?? ''
    const userDb = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: auth } }, auth: { persistSession: false } })
    const { data: ctx, error: ctxErr } = await userDb.rpc('mi_contexto')
    if (ctxErr || !ctx) return json({ error: 'Sesión no válida' }, 401)
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    const db = admin()

    if (action === 'setup-plans') {
      if (!ctx.plataforma) return json({ error: 'Sin permiso' }, 403)
      if (!flowConfigured()) return json({ error: 'Pagos no configurados: faltan FLOW_API_KEY y FLOW_SECRET_KEY' }, 400)
      const { data: planes } = await db.from('planes').select('*')
      const out: string[] = []
      for (const p of planes ?? []) for (const ciclo of ['mensual', 'anual']) {
        const planId = planIdFlow(p.k, ciclo)
        try {
          await flow('POST', '/plans/create', { planId, name: `Renueva ${p.nombre} ${ciclo}`, currency: 'CLP', amount: ciclo === 'anual' ? p.precio_anual : p.precio_mensual, interval: ciclo === 'anual' ? 4 : 3, urlCallback: WEBHOOK_URL, days_until_due: 3, charges_retries_number: 3 })
          out.push(planId + ': creado')
        } catch (e) { out.push(planId + ': ' + (e as Error).message) }
      }
      return json({ ok: true, planes: out })
    }

    if (!ctx.org) return json({ error: 'Primero crea tu empresa' }, 400)
    if (ctx.miembro.rol !== 'admin') return json({ error: 'Solo el administrador puede gestionar el plan' }, 403)
    const { data: org } = await db.from('orgs').select('*').eq('id', ctx.org.id).single()
    if (!org) return json({ error: 'Empresa no encontrada' }, 404)
    if (!flowConfigured()) return json({ error: 'Pagos en línea no configurados todavía' }, 400)

    if (action === 'sync') { await syncOrg(db, org); return json({ ok: true }) }

    if (action === 'cancel') {
      if (!org.flow_subscription_id) return json({ error: 'No hay una suscripción activa' }, 400)
      await flow('POST', '/subscription/cancel', { subscriptionId: org.flow_subscription_id, at_period_end: 1 })
      await db.from('orgs').update({ flow_cancelada: true }).eq('id', org.id)
      return json({ ok: true })
    }

    // checkout / change: validar plan, mundos y usuarios
    const plan = String(body.plan ?? ''), ciclo = body.ciclo === 'anual' ? 'anual' : 'mensual'
    const mundos: string[] = Array.isArray(body.mundos) ? body.mundos.filter((m: string) => ['auto', 'prop', 'tienda'].includes(m)) : []
    const { data: p } = await db.from('planes').select('*').eq('k', plan).single()
    if (!p) return json({ error: 'Plan no válido' }, 400)
    if (!mundos.length || mundos.length > p.mundos + org.extra_mundos) return json({ error: `Ese plan permite ${p.mundos + org.extra_mundos} mundo(s)` }, 400)
    const { count: activos } = await db.from('miembros').select('*', { count: 'exact', head: true }).eq('org_id', org.id).eq('activo', true)
    const { count: invs } = await db.from('invitaciones').select('*', { count: 'exact', head: true }).eq('org_id', org.id).is('aceptada_at', null)
    if ((activos ?? 0) + (invs ?? 0) > p.usuarios + org.extra_usuarios) return json({ error: `Ese plan permite ${p.usuarios + org.extra_usuarios} usuario(s). Desactiva usuarios primero.` }, 400)

    if (action === 'change' || (action === 'checkout' && org.flow_subscription_id && !org.flow_cancelada)) {
      if (!org.flow_subscription_id) return json({ error: 'No hay una suscripción activa' }, 400)
      await flow('POST', '/subscription/changePlan', { subscriptionId: org.flow_subscription_id, newPlanId: planIdFlow(plan, ciclo) })
      await db.from('orgs').update({ plan, ciclo, mundos }).eq('id', org.id)
      return json({ ok: true, msg: `Listo: tu plan cambia a ${p.nombre}` })
    }

    if (action === 'checkout') {
      let customerId = org.flow_customer_id
      if (!customerId) {
        const { data: adm } = await db.from('miembros').select('nombre,email').eq('org_id', org.id).eq('rol', 'admin').single()
        const c = await flow('POST', '/customer/create', { name: org.nombre, email: adm?.email ?? '', externalId: org.id })
        customerId = c.customerId
      }
      await db.from('orgs').update({ flow_customer_id: customerId, plan_pendiente: { plan, ciclo, mundos } }).eq('id', org.id)
      const r = await flow('POST', '/customer/register', { customerId, url_return: `${WEBHOOK_URL}?t=register&org=${org.id}` })
      return json({ redirect: `${r.url}?token=${r.token}` })
    }

    return json({ error: 'Acción no válida' }, 400)
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message }, 500)
  }
})
