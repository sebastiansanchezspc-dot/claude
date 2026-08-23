import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

const ALL_TABS = [
  { to: '/', emoji: '🏠', label: 'Resumen', roles: ['admin', 'vendedor', 'readonly'] },
  { to: '/stock', emoji: '🚗', label: 'Stock', roles: ['admin', 'vendedor', 'readonly'] },
  { to: '/ventas', emoji: '💰', label: 'Ventas', roles: ['admin', 'vendedor', 'readonly'] },
  { to: '/caja', emoji: '🧮', label: 'Caja', roles: ['admin'] },
  { to: '/equipo', emoji: '👥', label: 'Equipo', roles: ['admin'] },
]

export default function TabBar() {
  const { rol } = useAuth()
  const tabs = ALL_TABS.filter((t) => t.roles.includes(rol))

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-surface border-t border-white/10 flex z-40 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
              isActive ? 'text-accent' : 'text-white/45'
            }`
          }
        >
          <span className="text-lg leading-none">{tab.emoji}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
