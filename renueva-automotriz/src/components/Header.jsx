import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Header({ title, right }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {profile?.nombre && <p className="text-[11px] text-white/40">{profile.nombre}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <button
          onClick={() => navigate('/ajustes')}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-sm"
          title="Ajustes"
        >
          ⚙️
        </button>
        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-rose-300 hover:bg-rose-500/10 text-sm"
          title="Cerrar sesión"
        >
          ⏻
        </button>
      </div>
    </header>
  )
}
