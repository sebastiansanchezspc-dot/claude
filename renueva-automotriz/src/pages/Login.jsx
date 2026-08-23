import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import PBtn from '../components/ui/PBtn.jsx'
import { useToast } from '../components/ui/Toast.jsx'

export default function Login() {
  const { user, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) {
      toast.error('Credenciales inválidas')
    } else {
      toast.success('Bienvenido')
      navigate('/')
    }
  }

  return (
    <div className="app-shell flex flex-col justify-center px-6 min-h-screen">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🚗</div>
        <h1 className="text-2xl font-bold text-white">Renueva Automotriz</h1>
        <p className="text-white/40 text-sm mt-1">Gestión de stock, ventas y comisiones</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 bg-surface rounded-2xl p-5 border border-white/5">
        <label className="block">
          <span className="block text-xs text-white/50 mb-1">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            placeholder="tucorreo@ejemplo.com"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-white/50 mb-1">Contraseña</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            placeholder="••••••••"
          />
        </label>
        <PBtn type="submit" full disabled={busy}>
          {busy ? 'Ingresando...' : 'Ingresar'}
        </PBtn>
      </form>
    </div>
  )
}
