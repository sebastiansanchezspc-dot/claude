// Catálogo en línea de una empresa: todo el stock disponible de un mundo (autos, propiedades o productos).
//   GET  ?s=<slug>[&v=<vendedor>]          → lista para buscar y filtrar (foto de portada con enlace temporal)
//   GET  ?s=<slug>&i=<ítem>[&v=<vendedor>] → detalle de un ítem con todas sus fotos
//   POST { s, v?, i?, nombre, fono, mensaje } → deja la consulta en Clientes (del vendedor del enlace o del ítem)
// Solo responde si el catálogo está activo. Publica una lista blanca de campos: nunca costos, patente,
// rol de avalúo, dirección exacta, propietario, vencimientos ni notas internas.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } })
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
const json = (b: unknown, s = 200, cache = false) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': cache ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' : 'no-store' } })
const SLUG = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/
const ID = /^[a-z0-9]{2,40}$/i
const NO_DISP = ['vendido', 'arrendado', 'agotado']
// campos que se pueden publicar, por mundo
const PUB: Record<string, string[]> = {
  auto: ['marca', 'modelo', 'version', 'anio', 'km', 'color', 'tipo', 'transmision', 'combustible', 'puertas', 'motor'],
  prop: ['operacion', 'tipo', 'comuna', 'm2c', 'm2t', 'dorm', 'banos', 'estac', 'bodega'],
  tienda: ['marca', 'categoria', 'variante'],
}
const limpio = (s: unknown, n: number) => String(s ?? '').replace(/[<>"'`\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n)
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : null }
const NO_ENCONTRADO = 'Este catálogo no está disponible'
type Item = Record<string, any>
type Vend = { id: string, nombre: string, fono?: string, email?: string, w: string, activo?: boolean }

const ipDe = (req: Request) => (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'sin-ip'
const permitir = async (k: string, max: number, ventana: string) => (await db.rpc('permitir', { p_k: k, p_max: max, p_ventana: ventana })).data === true

async function catalogo(slug: string) {
  if (!SLUG.test(slug)) return null
  const { data: c } = await db.from('catalogos').select('org_id,mundo,activo').eq('slug', slug).maybeSingle()
  if (!c || !c.activo) return null
  const { data: org } = await db.from('orgs').select('id,nombre,suspendida').eq('id', c.org_id).maybeSingle()
  if (!org || org.suspendida) return null
  const { data: esc } = await db.rpc('org_escribible', { p_org: org.id })
  if (esc === false) return null // prueba vencida o sin pago: el catálogo se pausa
  const { data: pr } = await db.from('docs').select('data').eq('org_id', org.id).eq('col', 'config').eq('id', 'prefs').maybeSingle()
  const prefs = pr?.data ?? {}
  return { org, w: c.mundo as string, prefs, cfg: (prefs.cat?.[c.mundo] ?? {}) as Record<string, any> }
}

// qué estados se publican lo decide la empresa: reservados (sí por defecto) y en taller o preparación (no por defecto)
const disponible = (it: Item, w: string, cfg: any = {}) => it && it.w === w && it.aprob !== 'pendiente' && it.web !== false && !NO_DISP.includes(it.estado)
  && !(it.estado === 'reservado' && cfg.res === false) && !(it.estado === 'taller' && cfg.taller !== true) && !(w === 'tienda' && !(Number(it.stock) > 0))
const estadoPub = (e: string) => e === 'reservado' ? 'reservado' : e === 'taller' ? 'taller' : 'disponible'

async function equipo(o: string, w: string) {
  const { data } = await db.from('docs').select('id,data').eq('org_id', o).eq('col', 'equipo')
  return (data ?? []).map(r => ({ ...r.data, id: r.id }) as Vend).filter(e => e && e.w === w && e.activo !== false)
}

// solo rutas de la misma empresa (nunca firma archivos de otra)
async function firmar(org: string, paths: string[]) {
  const re = new RegExp('^' + org + '/[0-9a-f-]{36}\\.(jpg|png)$', 'i')
  const ok = [...new Set(paths.filter(p => typeof p === 'string' && re.test(p)))]
  const out: Record<string, string> = {}
  for (let k = 0; k < ok.length; k += 200) {
    const { data } = await db.storage.from('archivos').createSignedUrls(ok.slice(k, k + 200), 60 * 60 * 3)
    ;(data ?? []).forEach(d => { if (d.signedUrl && d.path) out[d.path] = d.signedUrl.startsWith('http') ? d.signedUrl : Deno.env.get('SUPABASE_URL') + '/storage/v1' + d.signedUrl })
  }
  return out
}

function publico(it: Item, w: string) {
  const s = it.specs ?? {}, specs: Record<string, unknown> = {}
  ;(PUB[w] ?? []).forEach(k => { const v = s[k]; if (v != null && v !== '' && v !== '—' && v !== '-' && typeof v !== 'object') specs[k] = typeof v === 'number' ? v : limpio(v, 60) })
  return { id: String(it.id), w, nombre: limpio(it.nombre, 80), precio: num(it.precio), op: it.op === 'Arriendo' || it.op === 'Venta' ? it.op : null, estado: estadoPub(it.estado), specs, ingreso: typeof it.ingreso === 'string' ? it.ingreso.slice(0, 10) : null }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const ip = ipDe(req)
    if (req.method === 'GET') {
      if (!(await permitir('cg:' + ip, 240, '1 minute'))) return json({ error: 'Demasiadas visitas seguidas. Espera un momento.' }, 429)
      const u = new URL(req.url), slug = u.searchParams.get('s') ?? '', v = u.searchParams.get('v') ?? '', i = u.searchParams.get('i') ?? ''
      const c = await catalogo(slug)
      if (!c) return json({ error: NO_ENCONTRADO }, 404)
      const { org, w, prefs, cfg } = c
      // diseño de las fotos: imagen con la plantilla elegida (generada en la app) como portada
      const dis = typeof cfg.tpl === 'string' && cfg.tpl !== '' ? (it: Item) => (typeof it.catImg === 'string' ? it.catImg : null) : () => null
      // el contacto de toda la página es quien compartió el enlace: un vendedor (v=<id>), el dueño (v=adm) o la empresa
      const eq = await equipo(org.id, w), delLink = ID.test(v) && v !== 'emp' && v !== 'adm' ? eq.find(x => x.id === v) : null
      const contacto = (x?: { nombre?: string, fono?: string } | null) => x && x.fono ? { nombre: limpio(x.nombre, 40), fono: limpio(x.fono, 24) } : null
      const empresa = { nombre: org.nombre, fono: cfg.fono }, dueno = { nombre: cfg.admNombre || org.nombre, fono: cfg.admFono || cfg.fono }
      const general = contacto(delLink) || (v === 'adm' ? contacto(dueno) : null) || contacto(empresa) || contacto(eq.find(x => x.fono)) || null
      const quien = delLink ? 'vendedor' : v === 'adm' && cfg.admFono ? 'dueno' : contacto(empresa) || !general ? 'empresa' : 'vendedor'
      const cu = prefs.cat?.[w]?.cuota
      const fin = w === 'auto' && cu && cu.on ? { pie: num(cu.pie) ?? 30, tasa: num(cu.tasa) ?? 1.6, plazo: num(cu.plazo) ?? 48 } : null

      if (i) {
        if (!ID.test(i)) return json({ error: 'No encontrado' }, 404)
        const { data: row } = await db.from('docs').select('data').eq('org_id', org.id).eq('col', 'items').eq('id', i).maybeSingle()
        const it = row?.data
        if (!disponible(it, w, cfg)) return json({ error: 'Esta publicación ya no está disponible' }, 404)
        const fotos = [...(dis(it) ? [dis(it)] : []), ...(it.fotos ?? [])].slice(0, 15), urls = await firmar(org.id, fotos)
        return json({ item: { ...publico(it, w), fotos: fotos.map((f: string) => urls[f]).filter(Boolean), notas: limpio(it.notasPub ?? '', 600) }, vend: general }, 200, true)
      }

      const { data: rows } = await db.from('docs').select('data').eq('org_id', org.id).eq('col', 'items').eq('mundo', w).limit(1000)
      const items = (rows ?? []).map(r => r.data as Item).filter(it => disponible(it, w, cfg))
        .sort((a, b) => String(b.ingreso ?? '').localeCompare(String(a.ingreso ?? ''))).slice(0, 400)
      const logo = typeof prefs.logo === 'string' ? prefs.logo : null
      const portada = (it: Item) => dis(it) || (it.fotos ?? [])[0]
      const urls = await firmar(org.id, [...items.map(portada), ...(logo ? [logo] : [])].filter(Boolean))
      const hex = (x: unknown) => typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x) ? x : null
      const acc = hex(cfg.color) || hex(prefs.accent?.[w])
      return json({
        org: { nombre: limpio(org.nombre, 80), logo: logo ? urls[logo] ?? null : null, accent: acc },
        w, contacto: general, quien, fin, pp: w === 'auto' && cfg.pp !== false, diseno: !!(cfg.tpl && items.some(it => dis(it))),
        items: items.map(it => ({ ...publico(it, w), foto: urls[portada(it)] ?? null, dis: !!(dis(it) && urls[dis(it) as string]), nf: (it.fotos ?? []).length })),
      }, 200, true)
    }

    if (req.method === 'POST') {
      const b = await req.json().catch(() => ({}))
      if (b.web) return json({ ok: true }) // trampa para bots: campo oculto con contenido
      const nombre = limpio(b.nombre, 60), fono = limpio(b.fono, 24).replace(/[^\d+ ()-]/g, ''), mensaje = limpio(b.mensaje, 400)
      if (nombre.length < 2 || fono.replace(/\D/g, '').length < 8) return json({ error: 'Escribe tu nombre y un teléfono válido' }, 400)
      const c = await catalogo(String(b.s ?? ''))
      if (!c) return json({ error: NO_ENCONTRADO }, 404)
      const { org, w } = c
      let it: Item | null = null
      if (b.i) {
        if (!ID.test(String(b.i))) return json({ error: 'No encontrado' }, 404)
        const { data: row } = await db.from('docs').select('data').eq('org_id', org.id).eq('col', 'items').eq('id', String(b.i)).maybeSingle()
        it = row?.data ?? null
        if (!disponible(it as Item, w, c.cfg)) return json({ error: 'Esta publicación ya no está disponible' }, 404)
      }
      // límites silenciosos: no se le enseña al bot dónde está el tope
      if (!(await permitir('cp:' + ip, 5, '1 hour')) || !(await permitir('co:' + org.id, 150, '1 day')) || (it && !(await permitir('ci:' + org.id + ':' + it.id, 30, '1 day')))) return json({ ok: true })
      const desde = new Date(Date.now() - 864e5).toISOString()
      const { count } = await db.from('docs').select('id', { count: 'exact', head: true }).eq('org_id', org.id).eq('col', 'leads').gte('updated_at', desde).eq('data->>fono', fono)
      if ((count ?? 0) >= 3) return json({ ok: true })
      // la consulta queda para quien compartió el enlace (si fue el dueño o la empresa, la ve el administrador)
      const eq = await equipo(org.id, w), vend = ID.test(String(b.v ?? '')) ? eq.find(x => x.id === b.v) ?? null : null
      const now = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 16) // hora de Chile aproximada (UTC−3)
      const id = 'l' + crypto.randomUUID().replace(/-/g, '').slice(0, 20)
      const txt = it ? `Consulta desde el catálogo por ${limpio(it.nombre, 80)}` : 'Consulta general desde el catálogo'
      // fotos del auto en parte de pago (solo JPG, hasta 6 y 2 MB cada una); se guardan en la carpeta de la empresa
      const fotos: string[] = []
      if (Array.isArray(b.fotos)) for (const f of b.fotos.slice(0, 6)) {
        const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(f)); if (!m || m[1].length > 2_800_000) continue
        const bin = Uint8Array.from(atob(m[1]), ch => ch.charCodeAt(0)); if (bin[0] !== 0xFF || bin[1] !== 0xD8) continue
        const path = `${org.id}/${crypto.randomUUID()}.jpg`
        const { error: eUp } = await db.storage.from('archivos').upload(path, bin, { contentType: 'image/jpeg', upsert: false })
        if (!eUp) fotos.push(path); else console.error('foto parte de pago', eUp.message)
      }
      const lead = { id, w, nombre, fono, itemId: it ? it.id : null, origen: 'Catálogo web', ...(fotos.length ? { fotos } : {}), etapa: 'nuevo', ts: now, creado: now, vend: vend?.nombre ?? '', nota: mensaje, temp: 'caliente', motivo: null, nueva: true,
        log: [{ ts: now, tipo: 'entrada', txt: txt + (mensaje ? ': ' + mensaje : '') + (fotos.length ? ` (${fotos.length} foto${fotos.length > 1 ? 's' : ''})` : '') }] }
      const { error } = await db.from('docs').insert({ org_id: org.id, col: 'leads', id, mundo: w, data: lead, dueno: vend?.email ? String(vend.email).toLowerCase() : null })
      if (error) throw error
      return json({ ok: true })
    }
    return json({ error: 'Método no permitido' }, 405)
  } catch (e) {
    console.error(e)
    return json({ error: 'No pudimos completar la solicitud. Inténtalo de nuevo.' }, 500)
  }
})
