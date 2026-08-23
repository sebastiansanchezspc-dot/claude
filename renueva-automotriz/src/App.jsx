import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.jsx'
import TabBar from './components/TabBar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Stock from './pages/Stock.jsx'
import Ventas from './pages/Ventas.jsx'
import Caja from './pages/Caja.jsx'
import Equipo from './pages/Equipo.jsx'
import Gastos from './pages/Gastos.jsx'
import Ajustes from './pages/Ajustes.jsx'

function Shell({ children }) {
  return (
    <div className="app-shell pb-20">
      {children}
      <TabBar />
    </div>
  )
}

function Protected({ roles, children }) {
  const { user, rol, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center text-white/40 text-sm">
        Cargando...
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(rol)) return <Navigate to="/" replace />
  return <Shell>{children}</Shell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/stock" element={<Protected><Stock /></Protected>} />
      <Route path="/ventas" element={<Protected><Ventas /></Protected>} />
      <Route path="/caja" element={<Protected roles={['admin']}><Caja /></Protected>} />
      <Route path="/equipo" element={<Protected roles={['admin']}><Equipo /></Protected>} />
      <Route path="/gastos" element={<Protected roles={['admin']}><Gastos /></Protected>} />
      <Route path="/ajustes" element={<Protected><Ajustes /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
