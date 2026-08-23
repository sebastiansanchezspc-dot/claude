import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import Header from '../components/Header.jsx'
import Empty from '../components/ui/Empty.jsx'
import Pip from '../components/ui/Pip.jsx'
import { clp, mesCortoNom, fechaCL } from '../lib/format.js'

function monthRange(offset = 0) {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return { start, end, label: mesCortoNom(d.getMonth()), year: d.getFullYear(), monthIdx: d.getMonth() }
}

export default function Dashboard() {
  const { rol } = useAuth()
  const [loading, setLoading] = useState(true)
  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  const [autos, setAutos] = useState([])
  const [seisMeses, setSeisMeses] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { start } = monthRange(5)

      const [{ data: v }, { data: g }, { data: a }] = await Promise.all([
        supabase.from('ventas').select('*').gte('fecha', start.toISOString().slice(0, 10)).order('fecha', { ascending: false }),
        rol === 'admin'
          ? supabase.from('gastos').select('*').gte('fecha', start.toISOString().slice(0, 10))
          : Promise.resolve({ data: [] }),
        supabase.from('autos').select('id, marca, modelo, estado'),
      ])

      setVentas(v || [])
      setGastos(g || [])
      setAutos(a || [])
      setLoading(false)
    }
    load()
  }, [rol])

  const meses = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => monthRange(5 - i))
  }, [])

  const porMes = useMemo(() => {
    return meses.map((m) => {
      const ventasMes = ventas.filter((v) => {
        const f = new Date(v.fecha)
        return f >= m.start && f < m.end
      })
      const gastosMes = gastos.filter((g) => {
        const f = new Date(g.fecha)
        return f >= m.start && f < m.end && g.es_fijo
      })
      const ganancia = ventasMes.reduce((acc, v) => acc + (Number(v.ganancia) || 0), 0)
      const gastoFijo = gastosMes.reduce((acc, g) => acc + (Number(g.monto) || 0), 0)
      return { label: m.label, utilidad: ganancia - gastoFijo, ventasMes }
    })
  }, [meses, ventas, gastos])

  const mesActual = porMes[porMes.length - 1]
  const maxAbs = Math.max(1, ...porMes.map((m) => Math.abs(m.utilidad)))

  const ultimasVentas = [...ventas].slice(0, 4)

  const topVendedor = useMemo(() => {
    const mesActualVentas = mesActual?.ventasMes || []
    const map = {}
    for (const v of mesActualVentas) {
      if (!v.vendedor_id) continue
      map[v.vendedor_id] = (map[v.vendedor_id] || 0) + (Number(v.ganancia) || 0)
    }
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
    return entries[0] || null
  }, [mesActual])

  const hoy = new Date()
  const gastosEsteMes = gastos.filter((g) => {
    const f = new Date(g.fecha)
    return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
  })

  return (
    <>
      <Header title="🏠 Resumen" />
      <div className="px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-surface border border-white/5 p-4">
          <p className="text-xs text-white/40 mb-1">Utilidad neta del mes</p>
          <p className={`text-3xl font-bold ${(mesActual?.utilidad ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {loading ? '···' : clp(mesActual?.utilidad ?? 0)}
          </p>
          <p className="text-[11px] text-white/30 mt-1">Ventas − costos − gastos fijos</p>
        </div>

        {rol === 'admin' && gastosEsteMes.length === 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-xs text-amber-300 flex items-center justify-between gap-2">
            <span>⚠️ No hay gastos registrados este mes</span>
            <Link to="/gastos" className="underline shrink-0">Registrar</Link>
          </div>
        )}

        <div className="rounded-2xl bg-surface border border-white/5 p-4">
          <p className="text-xs text-white/40 mb-3">Últimos 6 meses</p>
          <div className="flex items-end gap-2 h-24">
            {porMes.map((m, i) => {
              const h = Math.max(4, (Math.abs(m.utilidad) / maxAbs) * 88)
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <div
                    className={`w-full rounded-md ${m.utilidad >= 0 ? 'bg-accent' : 'bg-rose-500/70'}`}
                    style={{ height: `${h}px` }}
                    title={clp(m.utilidad)}
                  />
                  <span className="text-[10px] text-white/40">{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {topVendedor && (
          <div className="rounded-2xl bg-surface border border-white/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40">🏆 Top vendedor del mes</p>
              <p className="text-sm font-semibold text-white mt-0.5">{topVendedor[0].slice(0, 8)}…</p>
            </div>
            <p className="text-sm font-bold text-emerald-400">{clp(topVendedor[1])}</p>
          </div>
        )}

        <div className="rounded-2xl bg-surface border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/40">Últimas ventas</p>
            <Link to="/ventas" className="text-[11px] text-accent">Ver todas</Link>
          </div>
          {ultimasVentas.length === 0 ? (
            <Empty icon="💰" title="Sin ventas registradas" />
          ) : (
            <div className="divide-y divide-white/5">
              {ultimasVentas.map((v) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/90">{v.cliente_nombre || 'Cliente'}</p>
                    <p className="text-[11px] text-white/40">{fechaCL(v.fecha)}</p>
                  </div>
                  <p className="text-sm font-semibold text-white">{clp(v.precio_venta)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-surface border border-white/5 p-4 flex items-center justify-between">
          <p className="text-xs text-white/40">Autos en stock disponibles</p>
          <Pip tone="disponible">{autos.filter((a) => a.estado === 'disponible').length}</Pip>
        </div>
      </div>
    </>
  )
}
