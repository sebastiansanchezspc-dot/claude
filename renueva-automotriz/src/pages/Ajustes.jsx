import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { useNegocio } from '../hooks/useNegocio.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { THEMES } from '../lib/themes.js'
import { RUBROS_LIST } from '../lib/rubros.js'
import Header from '../components/Header.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import PBtn from '../components/ui/PBtn.jsx'
import FSel from '../components/ui/FSel.jsx'
import Pip from '../components/ui/Pip.jsx'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'readonly', label: 'Solo lectura' },
]

export default function Ajustes() {
  const { rol, signOut } = useAuth()
  const { themeKey, setTheme } = useTheme()
  const { rubrosActivos, updateRubros, nombreNegocio, updateNombre } = useNegocio()
  const toast = useToast()
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [nuevoRol, setNuevoRol] = useState('vendedor')
  const [inviting, setInviting] = useState(false)
  const [nombreNegocioInput, setNombreNegocioInput] = useState(nombreNegocio)

  useEffect(() => { setNombreNegocioInput(nombreNegocio) }, [nombreNegocio])

  async function toggleRubro(key) {
    const activo = rubrosActivos.includes(key)
    const next = activo ? rubrosActivos.filter((r) => r !== key) : [...rubrosActivos, key]
    if (next.length === 0) {
      toast.error('Debe quedar al menos un rubro activo')
      return
    }
    const { error } = await updateRubros(next)
    if (error) toast.error(error.message)
    else toast.success('Rubros actualizados')
  }

  async function handleNombreBlur() {
    if (nombreNegocioInput.trim() && nombreNegocioInput !== nombreNegocio) {
      const { error } = await updateNombre(nombreNegocioInput.trim())
      if (!error) toast.success('Nombre del negocio actualizado')
    }
  }

  useEffect(() => {
    if (rol !== 'admin') return
    supabase.from('profiles').select('*').order('created_at').then(({ data }) => setUsuarios(data || []))
  }, [rol])

  async function handleInvite(e) {
    e.preventDefault()
    setInviting(true)
    const { error } = await supabase.auth.admin?.inviteUserByEmail
      ? await supabase.auth.admin.inviteUserByEmail(email, { data: { nombre, rol: nuevoRol } })
      : { error: { message: 'La invitación requiere una Edge Function con service_role (ver README).' } }
    setInviting(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Invitación enviada')
      setSheetOpen(false)
      setEmail(''); setNombre('')
    }
  }

  async function updateRol(userId, rolNuevo) {
    const { error } = await supabase.from('profiles').update({ rol: rolNuevo }).eq('id', userId)
    if (error) toast.error(error.message)
    else {
      setUsuarios((u) => u.map((x) => (x.id === userId ? { ...x, rol: rolNuevo } : x)))
      toast.success('Rol actualizado')
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <Header title="⚙️ Ajustes" />
      <div className="px-4 py-4 space-y-5">
        {rol === 'admin' && (
          <div>
            <label className="block mb-3">
              <span className="block text-xs text-white/50 mb-1">Nombre del negocio</span>
              <input
                value={nombreNegocioInput}
                onChange={(e) => setNombreNegocioInput(e.target.value)}
                onBlur={handleNombreBlur}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              />
            </label>
            <p className="text-xs text-white/40 mb-2 px-1">Rubros activos</p>
            <div className="rounded-2xl bg-surface border border-white/5 divide-y divide-white/5">
              {RUBROS_LIST.map((r) => {
                const activo = rubrosActivos.includes(r.key)
                return (
                  <button
                    key={r.key}
                    onClick={() => toggleRubro(r.key)}
                    className="w-full flex items-center justify-between px-3.5 py-3 text-left"
                  >
                    <div>
                      <p className="text-sm text-white/90">{r.emoji} {r.label}</p>
                      <p className="text-[11px] text-white/40">{r.itemLabelPlural}</p>
                    </div>
                    <span className={`w-10 h-6 rounded-full relative transition ${activo ? 'bg-accent' : 'bg-white/10'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${activo ? 'left-[18px]' : 'left-0.5'}`} />
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-white/30 mt-2 px-1">
              Cada rubro activo agrega su propia pestaña y campos en Stock (Autos, Propiedades o Productos).
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-white/40 mb-2 px-1">Tema de color</p>
          <div className="grid grid-cols-5 gap-2.5">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className="flex flex-col items-center gap-1"
                title={t.label}
              >
                <span
                  className="w-11 h-11 rounded-full border-2 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${t.bg} 50%, ${t.surface} 50%)`,
                    borderColor: themeKey === t.key ? t.accent : 'transparent',
                  }}
                >
                  <span className="w-4 h-4 rounded-full" style={{ background: t.accent }} />
                </span>
                <span className="text-[10px] text-white/50">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {rol === 'admin' && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs text-white/40">Usuarios</p>
              <button onClick={() => setSheetOpen(true)} className="text-[11px] text-accent">+ Invitar</button>
            </div>
            <div className="rounded-2xl bg-surface border border-white/5 divide-y divide-white/5">
              {usuarios.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-3.5 py-3">
                  <div>
                    <p className="text-sm text-white/90">{u.nombre || u.id.slice(0, 8)}</p>
                    <Pip tone={u.rol}>{u.rol}</Pip>
                  </div>
                  <FSel
                    value={u.rol}
                    onChange={(v) => updateRol(u.id, v)}
                    options={ROLES}
                  />
                </div>
              ))}
              {usuarios.length === 0 && <p className="text-white/30 text-xs px-3.5 py-4">Sin usuarios aún</p>}
            </div>
          </div>
        )}

        <PBtn variant="danger" full onClick={handleLogout}>Cerrar sesión</PBtn>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Invitar usuario">
        <form onSubmit={handleInvite} className="space-y-3">
          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Email *</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>
          <FSel label="Rol" value={nuevoRol} onChange={setNuevoRol} options={ROLES} />
          <PBtn type="submit" full disabled={inviting}>{inviting ? 'Enviando...' : 'Enviar invitación'}</PBtn>
          <p className="text-[11px] text-white/30">
            Nota: invitar usuarios requiere el service_role key, que no debe exponerse en el frontend.
            Configura una Edge Function de Supabase para esto (ver README).
          </p>
        </form>
      </Sheet>
    </>
  )
}
