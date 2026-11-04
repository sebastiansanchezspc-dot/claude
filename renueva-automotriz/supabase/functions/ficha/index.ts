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

async function cargar(o: string, i: string) {
  if (!UUID.test(o) || !ID.test(i)) return null
  const { data: org } = await db.from('orgs').select('id,nombre,suspendida').eq('id', o).maybeSingle()
  if (!org || org.suspendida) return null
  const { data: row } = await db.from('docs').select('data,mundo').eq('org_id', o).eq('col', 'items').eq('id', i).maybeSingle()
  const it = row?.data
  if (!it || it.aprob === 'pendiente' || ['vendido', 'arrendado', 'agotado'].includes(it.estado)) return null
  return { org, it }
}

async function firmar(paths: string[]) {
  const ok = paths.filter(p => typeof p === 'string' && !p.startsWith('data:') && !p.includes('..'))
  if (!ok.length) return {} as Record<string, string>
  const { data } = await db.storage.from('archivos').createSignedUrls(ok, 60 * 60 * 6)
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
    if (req.method === 'GET') {
      const u = new URL(req.url), r = await cargar(u.searchParams.get('o') ?? '', u.searchParams.get('i') ?? '')
      if (!r) return json({ error: 'Esta publicación ya no está disponible' }, 404)
      const { org, it } = r
      const { data: pr } = await db.from('docs').select('data').eq('org_id', org.id).eq('col', 'config').eq('id', 'prefs').maybeSingle()
      const logo = pr?.data?.logo ?? null, fotos = (it.fotos ?? []).slice(0, 12)
      const urls = await firmar([...fotos, ...(logo ? [logo] : [])])
      const v = await vendedor(org.id, it.w, it.gestor)
      const { direccion: _dir, ...s } = it.specs ?? {}   // la dirección exacta no se publica
      return json({
        org: { nombre: org.nombre, logo: logo ? urls[logo] ?? null : null, mundo: MUNDO[it.w] ?? '' },
        item: { w: it.w, nombre: it.nombre, sku: it.w === 'auto' ? null : it.sku, precio: it.precio || null, op: it.op ?? null, estado: it.estado, specs: s, fotos: fotos.map((f: string) => urls[f]).filter(Boolean), notas: limpio(it.notasPub ?? '', 600) },
        vend: v ? { nombre: v.nombre, fono: v.fono || '' } : null,
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
      // como máximo 3 consultas por teléfono al día en la misma empresa
      const desde = new Date(Date.now() - 864e5).toISOString()
      const { count } = await db.from('docs').select('id', { count: 'exact', head: true }).eq('org_id', org.id).eq('col', 'leads').gte('updated_at', desde).eq('data->>fono', fono)
      if ((count ?? 0) >= 3) return json({ ok: true })
      const v = await vendedor(org.id, it.w, it.gestor)
      const now = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 16) // hora de Chile aproximada (UTC−3)
      const id = 'l' + Date.now().toString(36) + Math.floor(Math.random() * 99)
      const lead = { id, w: it.w, nombre, fono, itemId: it.id, origen: 'Página web', etapa: 'nuevo', ts: now, creado: now, vend: v?.nombre ?? '', nota: mensaje, temp: 'caliente', motivo: null, nueva: true,
        log: [{ ts: now, tipo: 'entrada', txt: `Consulta desde la página web${mensaje ? ': ' + mensaje : ''}` }] }
      const { error } = await db.from('docs').insert({ org_id: org.id, col: 'leads', id, mundo: it.w, data: lead, dueno: v?.email ? String(v.email).toLowerCase() : null, updated_at: new Date().toISOString() })
      if (error) throw error
      return json({ ok: true })
    }
    return json({ error: 'Método no permitido' }, 405)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
