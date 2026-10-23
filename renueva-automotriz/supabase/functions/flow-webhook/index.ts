// Flow llama a esta función (sin sesión de usuario):
//  · ?t=register&org=… → vuelve el navegador del cliente después de registrar su tarjeta:
//    se crea la suscripción y se redirige a la app.
//  · sin parámetros → aviso de pago de un plan (urlCallback): se consulta el pago y se actualiza la empresa.
// Nunca se confía en lo que llega: todo se vuelve a consultar a Flow con la firma propia.
import { admin, APP_URL, flow, planIdFlow, syncOrg } from '../_shared/flow.ts'

const back = (ok: boolean, msg = '') => new Response(null, { status: 303, headers: { location: `${APP_URL || '/'}/?billing=${ok ? 'ok' : 'error'}${msg ? '&msg=' + encodeURIComponent(msg) : ''}` } })

Deno.serve(async req => {
  const url = new URL(req.url)
  const form = await req.formData().catch(() => null)
  const token = String(form?.get('token') ?? url.searchParams.get('token') ?? '')
  const db = admin()
  try {
    if (url.searchParams.get('t') === 'register') {
      const orgId = url.searchParams.get('org') ?? ''
      const { data: org } = await db.from('orgs').select('*').eq('id', orgId).single()
      if (!org || !token) return back(false, 'Solicitud no válida')
      const reg = await flow('GET', '/customer/getRegisterStatus', { token })
      if (String(reg.status) !== '1' || reg.customerId !== org.flow_customer_id) return back(false, 'No se registró la tarjeta')
      const pend = org.plan_pendiente ?? { plan: org.plan, ciclo: org.ciclo, mundos: org.mundos }
      if (!org.flow_subscription_id || org.flow_cancelada) {
        const sub = await flow('POST', '/subscription/create', { planId: planIdFlow(pend.plan, pend.ciclo), customerId: org.flow_customer_id, trial_period_days: 0 })
        // acceso provisorio de 3 días hasta que Flow confirme el primer cobro
        await db.from('orgs').update({ plan: pend.plan, ciclo: pend.ciclo, mundos: pend.mundos, flow_subscription_id: sub.subscriptionId, flow_cancelada: false, plan_pendiente: null,
          pagado_hasta: new Date(Math.max(Date.now() + 3 * 864e5, org.pagado_hasta ? new Date(org.pagado_hasta).getTime() : 0)).toISOString() }).eq('id', org.id)
        await syncOrg(db, { ...org, flow_subscription_id: sub.subscriptionId }).catch(e => console.error('sync', e))
      }
      return back(true)
    }

    // aviso de pago de una suscripción
    if (!token) return new Response('falta token', { status: 400 })
    const pay = await flow('GET', '/payment/getStatus', { token })
    let orgs: any[] = []
    if (pay.payer) {
      const { data: m } = await db.from('miembros').select('org_id').eq('rol', 'admin').ilike('email', pay.payer)
      if (m?.length) orgs = (await db.from('orgs').select('*').in('id', m.map(x => x.org_id)).not('flow_subscription_id', 'is', null)).data ?? []
    }
    // si no se pudo identificar por correo, se revisan todas las suscripciones (pocas empresas: es barato)
    if (!orgs.length) orgs = (await db.from('orgs').select('*').not('flow_subscription_id', 'is', null)).data ?? []
    for (const o of orgs) await syncOrg(db, o).catch(e => console.error('sync', o.id, e))
    return new Response('OK')
  } catch (e) {
    console.error(e)
    if (url.searchParams.get('t') === 'register') return back(false, 'Error al confirmar con Flow')
    return new Response('error', { status: 500 })
  }
})
