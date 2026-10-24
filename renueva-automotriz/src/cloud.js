// Conexión con Supabase: sesión, empresa, guardado automático, tiempo real, archivos y cobros.
// Sin variables de entorno (o con ?demo en la URL) la app corre en modo demo, sin guardar nada.
import { createClient } from '@supabase/supabase-js'
import { setupNative, APP_URL, NATIVE } from './native.js'

const URL_ = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const params = new URLSearchParams(location.search)
const mode = !URL_ || !KEY || params.has('demo') ? 'demo' : 'cloud'
const sb = mode === 'cloud' ? createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null

const BUCKET = 'archivos'
const SIGN_TTL = 60 * 60 * 24 * 7
let refs = null          // referencias a los datos de la app (RV.bind)
let orgId = null
let snapshot = new Map() // "col/id" -> JSON guardado en el servidor
let timer = null, flushing = false, again = false, failures = 0
const signed = new Map() // ruta -> url firmada
const signing = new Set()

// en el iPhone la app corre desde el teléfono: los enlaces que se comparten apuntan a la versión web
const webUrl = () => NATIVE ? APP_URL + '/' : location.origin + location.pathname
const errMsg = e => (e && (e.message || e.error_description || e.msg)) || 'Error de conexión'
const fail = e => { throw new Error(errMsg(e)) }
const isMissingFn = e => e && (e.code === 'PGRST202' || e.code === '42883' || /Could not find the function|does not exist/i.test(e.message || ''))

// invitación que viene en el enlace (?inv=token): se recuerda hasta que la persona entre
if (params.get('inv')) { try { localStorage.setItem('renueva_inv', params.get('inv')) } catch (e) { } }
const pendingInvite = () => { try { return localStorage.getItem('renueva_inv') } catch (e) { return null } }
const clearInvite = () => { try { localStorage.removeItem('renueva_inv') } catch (e) { } }

function cleanUrl() {
  const keep = new URLSearchParams(location.search); ['inv', 'billing', 'msg', 'registro', 'code'].forEach(k => keep.delete(k))
  const q = keep.toString(); history.replaceState(null, '', location.pathname + (q ? '?' + q : ''))
}

/* ---------------------------------------------------------------- sesión */
async function session() { const { data } = await sb.auth.getSession(); return data.session }

async function init() {
  if (mode === 'demo') return { mode }
  let recovery = /type=recovery/.test(location.hash)
  sb.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') { recovery = true; RV.onRecovery && RV.onRecovery() } })
  const s = await session()
  if (!s) return { mode, gate: params.has('registro') || pendingInvite() ? 'registro' : 'login', invite: !!pendingInvite() }
  if (recovery) return { mode, gate: 'nueva-clave' }
  return enter()
}

// con sesión: aceptar invitación pendiente, leer el contexto y cargar los datos
let autoAceptada = false
async function enter() {
  const s = await session(); if (!s) return { mode, gate: 'login' }
  const inv = pendingInvite()
  if (inv) {
    const { error } = await sb.rpc('aceptar_invitacion', { p_token: inv, p_nombre: s.user.user_metadata?.nombre || '' })
    clearInvite()
    if (error && !/ya pertenece/.test(error.message)) RV.lastError = error.message
  }
  const { data: ctx, error } = await sb.rpc('mi_contexto')
  if (error) return isMissingFn(error) ? { mode, gate: 'setup' } : { mode, gate: 'error', error: errMsg(error) }
  if (params.get('billing') === 'error') {
    RV.lastError = 'El pago no se completó' + (params.get('msg') ? ': ' + params.get('msg') : '. Puedes intentarlo de nuevo.')
    params.delete('billing')
  }
  if (params.get('billing') === 'ok' && ctx && ctx.org) { params.delete('billing'); await billing('sync').catch(() => { }); cleanUrl(); return enter() }
  cleanUrl()
  // con una sola invitación esperando, entra directo a esa empresa
  if (ctx && !ctx.org && !ctx.inactivo && ctx.invitaciones && ctx.invitaciones.length === 1 && !autoAceptada) {
    autoAceptada = true
    const { error: e2 } = await sb.rpc('aceptar_invitacion', { p_token: ctx.invitaciones[0].token, p_nombre: s.user.user_metadata?.nombre || '' })
    if (!e2) return enter()
    RV.lastError = e2.message
  }
  if (!ctx || !ctx.org) return { mode, gate: 'onboarding', ctx, user: s.user }
  orgId = ctx.org.id
  const data = await loadAll()
  subscribe()
  RV.pagos = ctx.pagos || []
  return { mode, ctx, data, user: s.user }
}

const signIn = async (email, password) => { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) fail(error) }
const signUp = async (email, password, nombre) => {
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { nombre }, emailRedirectTo: webUrl() } })
  if (error) fail(error)
  return { needsConfirm: !data.session }
}
const resetPassword = async email => { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: webUrl() }); if (error) fail(error) }
const updatePassword = async password => { const { error } = await sb.auth.updateUser({ password }); if (error) fail(error); history.replaceState(null, '', location.pathname) }
async function logout() { try { await flush() } catch (e) { } await sb.auth.signOut(); location.href = location.pathname }

async function createOrg(nombre, mundos, nombreAdmin) {
  const { error } = await sb.rpc('crear_organizacion', { p_nombre: nombre, p_mundos: mundos, p_nombre_admin: nombreAdmin }); if (error) fail(error)
}
async function acceptInvite(token) { const { error } = await sb.rpc('aceptar_invitacion', { p_token: token, p_nombre: '' }); if (error) fail(error) }
async function context() { const { data, error } = await sb.rpc('mi_contexto'); if (error) fail(error); RV.pagos = (data && data.pagos) || []; return data }

/* ---------------------------------------------------------------- datos */
async function loadAll() {
  const rows = []; const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await sb.from('docs').select('col,id,data,dueno').eq('org_id', orgId).range(from, from + page - 1)
    if (error) fail(error)
    rows.push(...data); if (data.length < page) break
  }
  snapshot = new Map()
  const out = { items: [], ventas: [], gastos: [], equipo: [], leads: [], rems: [], contactos: [], cat: null, prefs: null }
  rows.forEach(r => {
    snapshot.set(r.col + '/' + r.id, sig(r))
    if (r.col === 'config') out[r.id] = r.data; else if (out[r.col]) out[r.col].push(r.data)
  })
  await signPaths(collectPaths(out))
  return out
}

// el estado actual de la app, como filas de la tabla docs
// firma de una fila: datos + dueño (si cambia cualquiera de los dos, se vuelve a guardar)
const sig = r => JSON.stringify(r.data) + '\u0001' + (r.dueno || '')
function currentRows() {
  const m = new Map()
  Object.entries(refs.COLS).forEach(([col, arr]) => arr.forEach(x => { if (x && x.id) m.set(col + '/' + x.id, { col, id: String(x.id), mundo: x.w || null, data: x, dueno: refs.duenoOf(col, x) }) }))
  if (refs.isAdmin()) {
    m.set('config/cat', { col: 'config', id: 'cat', mundo: null, data: refs.CAT })
    m.set('config/prefs', { col: 'config', id: 'prefs', mundo: null, data: refs.PREFS })
  }
  return m
}

function dirty() {
  if (mode !== 'cloud' || !refs || !orgId) return
  clearTimeout(timer); timer = setTimeout(() => flush().catch(() => { }), 700)
}

async function flush() {
  if (mode !== 'cloud' || !refs || !orgId) return
  if (flushing) { again = true; return }
  flushing = true; setStatus('guardando')
  try {
    const cur = currentRows(), up = [], del = []
    cur.forEach((r, k) => { const j = sig(r); if (snapshot.get(k) !== j) up.push({ ...r, j }) })
    snapshot.forEach((_, k) => { if (!cur.has(k) && !(k.startsWith('config/') && !refs.isAdmin())) del.push(k) })
    for (let i = 0; i < up.length; i += 200) {
      const chunk = up.slice(i, i + 200)
      const { error } = await sb.from('docs').upsert(chunk.map(r => ({ org_id: orgId, col: r.col, id: r.id, mundo: r.mundo, data: r.data, dueno: r.dueno || null, updated_at: new Date().toISOString() })), { onConflict: 'org_id,col,id' })
      if (error) throw error
      chunk.forEach(r => snapshot.set(r.col + '/' + r.id, r.j))
    }
    const byCol = {}; del.forEach(k => { const [c, ...id] = k.split('/'); (byCol[c] = byCol[c] || []).push(id.join('/')) })
    for (const [c, ids] of Object.entries(byCol)) {
      const { error } = await sb.from('docs').delete().eq('org_id', orgId).eq('col', c).in('id', ids)
      if (error) throw error
      ids.forEach(id => snapshot.delete(c + '/' + id))
    }
    failures = 0; setStatus(up.length || del.length ? 'guardado' : 'ok')
  } catch (e) {
    failures++
    if (e && (e.code === '42501' || /row-level security/i.test(e.message || ''))) {
      // el servidor rechazó el cambio (permiso o plan vencido): volvemos a lo que hay guardado
      setStatus('error', 'No tienes permiso para ese cambio. Se restauraron los datos.')
      await reload()
    } else {
      setStatus('error', navigator.onLine === false ? 'Sin conexión: se guardará al volver' : 'No se pudo guardar, reintentando…')
      clearTimeout(timer); timer = setTimeout(() => flush().catch(() => { }), Math.min(30000, 2000 * 2 ** failures))
    }
  } finally {
    flushing = false
    if (again) { again = false; dirty() }
  }
}

async function reload() {
  const data = await loadAll(); refs.applyData(data)
}

function setStatus(s, msg) { RV.status = s; if (RV.onStatus) RV.onStatus(s, msg) }
window.addEventListener('online', () => dirty())
window.addEventListener('beforeunload', e => { if (mode === 'cloud' && (flushing || timer) && hasPending()) { e.preventDefault(); e.returnValue = '' } })
function hasPending() { if (!refs || !orgId) return false; const cur = currentRows(); for (const [k, r] of cur) if (snapshot.get(k) !== sig(r)) return true; return false }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush().catch(() => { }) })

/* ---------------------------------------------------------------- tiempo real */
let channel = null
function subscribe() {
  if (channel) sb.removeChannel(channel)
  channel = sb.channel('docs-' + orgId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: 'org_id=eq.' + orgId }, p => {
      const row = p.eventType === 'DELETE' ? p.old : p.new; if (!row || !row.col) return
      const k = row.col + '/' + row.id
      if (p.eventType === 'DELETE') { if (!snapshot.has(k)) return; snapshot.delete(k); refs.applyRemote(row.col, row.id, null); return }
      const j = sig(row); if (snapshot.get(k) === j) return
      snapshot.set(k, j)
      signPaths(collectPaths({ x: [row.data] })).finally(() => refs.applyRemote(row.col, row.id, row.data))
    })
    .subscribe()
}

/* ---------------------------------------------------------------- archivos */
function collectPaths(obj) {
  const out = new Set()
  const walk = v => { if (typeof v === 'string') { if (v.startsWith(orgId + '/')) out.add(v) } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk) }
  walk(obj); return [...out]
}
async function signPaths(paths) {
  const need = paths.filter(p => !signed.has(p)); if (!need.length) return
  for (let i = 0; i < need.length; i += 100) {
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(need.slice(i, i + 100), SIGN_TTL)
    ;(data || []).forEach(d => { if (d.signedUrl) signed.set(d.path, d.signedUrl) })
  }
}
function fileUrl(path) {
  if (signed.has(path)) return signed.get(path)
  if (!signing.has(path) && sb) { signing.add(path); signPaths([path]).then(() => { signing.delete(path); if (refs && refs.rerender) refs.rerender() }) }
  return ''
}
async function upload(dataUrl) {
  if (mode !== 'cloud') return dataUrl
  // la foto viene como data: URL; se convierte a archivo sin fetch (la política de seguridad no permite fetch a data:)
  const [head, b64] = dataUrl.split(','), bin = atob(b64), bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const blob = new Blob([bytes], { type: (head.match(/data:([^;]+)/) || [])[1] || 'image/jpeg' })
  const path = `${orgId}/${crypto.randomUUID()}.jpg`
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) fail(error)
  signed.set(path, dataUrl) // mientras tanto se muestra la versión local
  return path
}

/* ---------------------------------------------------------------- usuarios */
async function loadMembers() {
  const { data: raw, error } = await sb.rpc('listar_miembros'); if (error) fail(error)
  const data = refs.deepClean(raw) // nombres y correos vienen de otras personas: se limpian antes de mostrarlos
  const list = [
    ...data.miembros.map(m => ({ ...m, invitado: false })),
    ...data.invitaciones.map(i => ({ id: 'inv:' + i.id, nombre: i.nombre || i.email.split('@')[0], email: i.email, rol: i.rol, mundos: i.mundos, activo: true, invitado: true, token: i.token })),
  ]
  refs.USUARIOS.length = 0; list.forEach(u => refs.USUARIOS.push(u))
  return list
}
const inviteLink = token => `${webUrl()}?inv=${token}`
async function invite({ email, nombre, rol, mundos }) {
  const { data, error } = await sb.rpc('invitar', { p_email: email, p_nombre: nombre, p_rol: rol, p_mundos: mundos }); if (error) fail(error)
  await loadMembers(); return inviteLink(data)
}
async function updateMember(u, { rol, mundos, activo }) {
  if (u.invitado) throw new Error('Es una invitación pendiente: puedes cancelarla y volver a invitar.')
  const { error } = await sb.rpc('actualizar_miembro', { p_user: u.id, p_rol: rol, p_mundos: mundos, p_activo: activo }); if (error) fail(error)
  await loadMembers()
}
async function removeMember(u) {
  const { error } = u.invitado ? await sb.rpc('cancelar_invitacion', { p_id: u.id.slice(4) }) : await sb.rpc('quitar_miembro', { p_user: u.id })
  if (error) fail(error); await loadMembers()
}

/* ---------------------------------------------------------------- plan y cobros */
async function billing(action, body = {}) {
  const { data, error } = await sb.functions.invoke('billing', { body: { action, ...body, returnUrl: location.origin + location.pathname } })
  if (error) {
    let msg = error.message
    try { const j = await error.context.json(); msg = j.error || msg } catch (e) { }
    throw new Error(msg)
  }
  if (data && data.error) throw new Error(data.error)
  return data
}
async function choosePlan({ plan, ciclo, mundos }) {
  await flush().catch(() => { })
  const ctx = await context()
  const o = ctx.org
  const sameWorlds = [...o.mundos].sort().join() === [...mundos].sort().join()
  if (plan === o.plan && ciclo === o.ciclo && !sameWorlds && (o.flow || o.trial_hasta > new Date().toISOString())) {
    const { error } = await sb.rpc('set_mundos', { p_mundos: mundos }); if (error) fail(error)
    await refreshContext(); return { msg: 'Mundos actualizados' }
  }
  try {
    const r = await billing(o.flow ? 'change' : 'checkout', { plan, ciclo, mundos })
    if (r.redirect) return r
    await refreshContext(); return { msg: r.msg }
  } catch (e) {
    if (/no configurad|not configured|Failed to send|FunctionsFetchError|404/i.test(e.message)) {
      // sin pasarela todavía: durante la prueba se deja el plan elegido; el pago se activa desde el panel de la plataforma
      const { error } = await sb.rpc('elegir_plan_prueba', { p_plan: plan, p_ciclo: ciclo, p_mundos: mundos })
      if (error) fail(error)
      await refreshContext()
      return { msg: 'Plan elegido. El pago en línea aún no está activo: te contactaremos para activarlo.' }
    }
    throw e
  }
}
// una vez al día el admin trae el estado de su suscripción (por si se perdió un aviso de Flow)
async function dailySync(ctx) {
  if (!ctx || !ctx.org || !ctx.org.flow || ctx.miembro.rol !== 'admin') return
  const k = 'renueva_sync_' + ctx.org.id, today = new Date().toISOString().slice(0, 10)
  try { if (localStorage.getItem(k) === today) return; localStorage.setItem(k, today) } catch (e) { }
  await billing('sync').then(refreshContext).catch(() => { })
}
/* ---------------------------------------------------------------- eliminar cuenta */
// Admin: cancela la suscripción, borra las fotos de la empresa y luego la empresa completa.
// Vendedor / solo lectura: borra solo su usuario. Al final se cierra la sesión.
async function deleteAccount() {
  await flush().catch(() => { })
  const ctx = await context().catch(() => null)
  if (ctx && ctx.org && ctx.miembro.rol === 'admin') {
    if (ctx.org.flow) await billing('cancel', { now: true }).catch(() => { })
    await removeOrgFiles(ctx.org.id)
  }
  const { data, error } = await sb.rpc('eliminar_mi_cuenta'); if (error) fail(error)
  if (channel) sb.removeChannel(channel)
  orgId = null; snapshot = new Map(); clearTimeout(timer)
  await sb.auth.signOut({ scope: 'local' }).catch(() => { })
  return data
}
async function removeOrgFiles(org) {
  for (let i = 0; i < 200; i++) {
    const { data, error } = await sb.storage.from(BUCKET).list(org, { limit: 100 })
    if (error || !data || !data.length) return
    const { error: e2 } = await sb.storage.from(BUCKET).remove(data.map(f => `${org}/${f.name}`))
    if (e2 || data.length < 100) return
  }
}
async function cancelPlan() { await billing('cancel'); await refreshContext() }
async function refreshContext() { const ctx = await context(); if (refs && refs.applyCtx) refs.applyCtx(ctx) }
async function renameOrg(nombre) { const { error } = await sb.rpc('renombrar_org', { p_nombre: nombre }); if (error) fail(error); await refreshContext() }

/* ---------------------------------------------------------------- plataforma */
async function platformOrgs() { const { data, error } = await sb.rpc('plataforma_orgs'); if (error) fail(error); return refs.deepClean(data) }
async function platformSet(org, cambios) { const { error } = await sb.rpc('plataforma_set_org', { p_org: org, p_cambios: cambios }); if (error) fail(error) }

/* ---------------------------------------------------------------- avisos del celular */
function askNotif() { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => { }) }
function systemNotify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false
  navigator.serviceWorker && navigator.serviceWorker.getRegistration ? navigator.serviceWorker.getRegistration().then(r => r ? r.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' }) : new Notification(title, { body, icon: '/icon-192.png' })).catch(() => { }) : new Notification(title, { body })
  return true
}
if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { }))

export const RV = {
  mode, status: 'ok', pagos: [], lastError: null,
  bind: r => { refs = r },
  init, enter, signIn, signUp, resetPassword, updatePassword, logout, createOrg, acceptInvite, context, pendingInvite,
  dirty, flush, reload, upload, fileUrl,
  loadMembers, invite, updateMember, removeMember,
  choosePlan, cancelPlan, refreshContext, renameOrg, dailySync, deleteAccount,
  platformOrgs, platformSet, billingSetup: () => billing('setup-plans'),
  askNotif, systemNotify,
}
setupNative(RV)
window.RV = RV
