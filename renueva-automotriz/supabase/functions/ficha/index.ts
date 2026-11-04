// Ficha pública de un auto, propiedad o producto (la página que abre el código QR).
//   GET  ?o=<empresa>&i=<ítem>   → datos para mostrar (solo lo publicable, fotos con enlace temporal)
//   POST { o, i, nombre, fono, mensaje } → deja la consulta en Clientes del vendedor a cargo
// No necesita sesión: solo muestra ítems disponibles de empresas activas y nunca costos ni datos internos.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } })
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
const json = (b: unknown, s = 200, cache = false) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': cache ? 'public, max-age=60' : 'no-store' } })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ID = /^[a-z0-9]{2,40}$/i
const limpio = (s: unknown, n: number) => String(s ?? '').replace(/[<>"'`\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n)
const MUNDO = { auto: 'Auto', prop: 'Propiedades', tienda: 'Tienda' } as Record<string, string>
// lista blanca de datos publicables (nunca patente, rol de avalúo, dirección ni propietario)
const PUB: Record<string, string[]> = {
  auto: ['marca', 'modelo', 'version', 'anio', 'km', 'color', 'tipo', 'transmision', 'combustible', 'puertas', 'motor'],
  prop: ['operacion', 'tipo', 'comuna', 'm2c', 'm2t', 'dorm', 'banos', 'estac', 'bodega'],
  tienda: ['marca', 'categoria', 'variante'],
}
const ipDe = (req: Request) => (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'sin-ip'
const permitir = async (k: string, max: number, ventana: string) => (await db.rpc('permitir', { p_k: k, p_max: max, p_ventana: ventana })).data === true

async function cargar(o: string, i: string) {
  if (!UUID.test(o) || !ID.test(i)) return null
  const { data: org } = await db.from('orgs').select('id,nombre,suspendida').eq('id', o).maybeSingle()
  if (!org || org.suspendida) return null
  const { data: esc } = await db.rpc('org_escribible', { p_org: o })
  if (esc === false) return null // prueba vencida o sin pago
  const { data: row } = await db.from('docs').select('data,mundo').eq('org_id', o).eq('col', 'items').eq('id', i).maybeSingle()
  const it = row?.data
  if (!it || it.aprob === 'pendiente' || ['vendido', 'arrendado', 'agotado'].includes(it.estado)) return null
  return { org, it }
}

// solo rutas de la misma empresa (nunca firma archivos de otra)
async function firmar(org: string, paths: string[]) {
  const re = new RegExp('^' + org + '/[0-9a-f-]{36}\\.(jpg|png)$', 'i')
  const ok = [...new Set(paths.filter(p => typeof p === 'string' && re.test(p)))]
  if (!ok.length) return {} as Record<string, string>
  const { data } = await db.storage.from('archivos').createSignedUrls(ok, 60 * 60 * 3)
  const out: Record<string, string> = {}
  ;(data ?? []).forEach(d => { if (d.signedUrl && d.path) out[d.path] = d.signedUrl.startsWith('http') ? d.signedUrl : Deno.env.get('SUPABASE_URL') + '/storage/v1' + d.signedUrl })
  return out
}

// vendedor a cargo (para el WhatsApp de la página y para asignar la consulta)
async function vendedor(o: string, w: string, nombre: string) {
  const { data } = await db.from('docs').select('data').eq('org_id', o).eq('col', 'equipo')
  const eq = (data ?? []).map(r => r.data).filter(e => e && e.w === w && e.activo !== false)
  return eq.find(e => e.nombre === nombre) || eq[0] || null
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const ip = ipDe(req)
    if (req.method === 'GET') {
      if (!(await permitir('fg:' + ip, 240, '1 minute'))) return json({ error: 'Demasiadas visitas seguidas. Espera un momento.' }, 429)
      const u = new URL(req.url), r = await cargar(u.searchParams.get('o') ?? '', u.searchParams.get('i') ?? '')
      if (!r) return json({ error: 'Esta publicación ya no está disponible' }, 404)
      const { org, it } = r
      const { data: pr } = await db.from('docs').select('data').eq('org_id', org.id).eq('col', 'config').eq('id', 'prefs').maybeSingle()
      const logo = pr?.data?.logo ?? null, fotos = (it.fotos ?? []).slice(0, 12)
      const urls = await firmar(org.id, [...fotos, ...(typeof logo === 'string' ? [logo] : [])])
      const v = await vendedor(org.id, it.w, it.gestor)
      const { data: cg } = await db.from('catalogos').select('slug').eq('org_id', org.id).eq('mundo', it.w).eq('activo', true).maybeSingle()
      const s: Record<string, unknown> = {}
      ;(PUB[it.w] ?? []).forEach(k => { const v = it.specs?.[k]; if (v != null && v !== '' && typeof v !== 'object') s[k] = typeof v === 'number' ? v : limpio(v, 60) })
      return json({
        org: { nombre: org.nombre, logo: logo ? urls[logo] ?? null : null, mundo: MUNDO[it.w] ?? '' },
        item: { w: it.w, nombre: limpio(it.nombre, 80), sku: it.w === 'tienda' ? limpio(it.sku, 40) : null, precio: Number(it.precio) || null, op: it.op ?? null, estado: it.estado, specs: s, fotos: fotos.map((f: string) => urls[f]).filter(Boolean), notas: limpio(it.notasPub ?? '', 600) },
        vend: v ? { nombre: v.nombre, fono: v.fono || '' } : null,
        cat: cg?.slug ?? null,
      }, 200, true)
    }

    if (req.method === 'POST') {
      const b = await req.json().catch(() => ({}))
      if (b.web) return json({ ok: true }) // trampa para bots: campo oculto con contenido
      const nombre = limpio(b.nombre, 60), fono = limpio(b.fono, 24).replace(/[^\d+ ()-]/g, ''), mensaje = limpio(b.mensaje, 400)
      if (nombre.length < 2 || fono.replace(/\D/g, '').length < 8) return json({ error: 'Escribe tu nombre y un teléfono válido' }, 400)
      const r = await cargar(String(b.o ?? ''), String(b.i ?? ''))
      if (!r) return json({ error: 'Esta publicación ya no está disponible' }, 404)
      const { org, it } = r
      // límites silenciosos por IP, empresa e ítem (no se le enseña al bot dónde está el tope)
      if (!(await permitir('fp:' + ip, 5, '1 hour')) || !(await permitir('fo:' + org.id, 150, '1 day')) || !(await permitir('fi:' + org.id + ':' + it.id, 30, '1 day'))) return json({ ok: true })
      // como máximo 3 consultas por teléfono al día en la misma empresa
      const desde = new Date(Date.now() - 864e5).toISOString()
      const { count } = await db.from('docs').select('id', { count: 'exact', head: true }).eq('org_id', org.id).eq('col', 'leads').gte('updated_at', desde).eq('data->>fono', fono)
      if ((count ?? 0) >= 3) return json({ ok: true })
      const v = await vendedor(org.id, it.w, it.gestor)
      const now = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 16) // hora de Chile aproximada (UTC−3)
      const id = 'l' + crypto.randomUUID().replace(/-/g, '').slice(0, 20)
      const lead = { id, w: it.w, nombre, fono, itemId: it.id, origen: 'Página web', etapa: 'nuevo', ts: now, creado: now, vend: v?.nombre ?? '', nota: mensaje, temp: 'caliente', motivo: null, nueva: true,
        log: [{ ts: now, tipo: 'entrada', txt: `Consulta desde la página web${mensaje ? ': ' + mensaje : ''}` }] }
      const { error } = await db.from('docs').insert({ org_id: org.id, col: 'leads', id, mundo: it.w, data: lead, dueno: v?.email ? String(v.email).toLowerCase() : null })
      if (error) throw error
      return json({ ok: true })
    }
    return json({ error: 'Método no permitido' }, 405)
  } catch (e) {
    console.error(e)
    return json({ error: 'No pudimos completar la solicitud. Inténtalo de nuevo.' }, 500)
  }
})
