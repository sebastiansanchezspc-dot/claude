import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Header from '../components/Header.jsx'
import Empty from '../components/ui/Empty.jsx'
import { clp, fechaCL, hoyISO } from '../lib/format.js'

const METODOS = [
  { key: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { key: 'transferencia', label: 'Transferencia', emoji: '🏦' },
  { key: 'credito_automotriz', label: 'Crédito Automotriz', emoji: '📄' },
  { key: 'tarjeta_credito', label: 'Tarjeta de Crédito', emoji: '💳' },
  { key: 'cheque', label: 'Cheque', emoji: '🧾' },
]

function rangoDesdeModo(modo, refDate) {
  const d = new Date(refDate)
  if (modo === 'semana') {
    const dow = (d.getDay() + 6) % 7
    const start = new Date(d); start.setDate(d.getDate() - dow)
    const end = new Date(start); end.setDate(start.getDate() + 7)
    return { start, end }
  }
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return { start, end }
}

export default function Caja() {
  const [ventas, setVentas] = useState([])
  const [autos, setAutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modo, setModo] = useState('mes')
  const [desde, setDesde] = useState(hoyISO())
  const [hasta, setHasta] = useState(hoyISO())

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: v }, { data: a }] = await Promise.all([
        supabase.from('ventas').select('*'),
        supabase.from('autos').select('id, marca, modelo'),
      ])
      setVentas(v || [])
      setAutos(a || [])
      setLoading(false)
    }
    load()
  }, [])

  const { start, end } = useMemo(() => {
    if (modo === 'rango') return { start: new Date(desde), end: new Date(new Date(hasta).getTime() + 86400000) }
    return rangoDesdeModo(modo, new Date())
  }, [modo, desde, hasta])

  const ventasPeriodo = ventas.filter((v) => {
    const f = new Date(v.fecha)
    return f >= start && f < end
  })

  const desglose = METODOS.map((m) => {
    let total = 0
    for (const v of ventasPeriodo) {
      for (const p of v.pagos || []) {
        if (p.metodo === m.key) total += Number(p.monto) || 0
      }
    }
    return { ...m, total }
  })

  const totalGeneral = desglose.reduce((acc, m) => acc + m.total, 0)

  return (
    <>
      <Header title="🧮 Caja" right={
        <Link to="/gastos" className="text-[11px] text-accent px-2 py-1.5 rounded-full bg-white/5">📦 Gastos</Link>
      } />
      <div className="px-4 py-3 space-y-4">
        <div className="flex gap-2">
          {[{ k: 'semana', l: 'Semana' }, { k: 'mes', l: 'Mes' }, { k: 'rango', l: 'Rango' }].map((f) => (
            <button
              key={f.k}
              onClick={() => setModo(f.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${modo === f.k ? 'bg-accent text-white' : 'bg-white/5 text-white/50'}`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {modo === 'rango' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Desde</span>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Hasta</span>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
          </div>
        )}

        <div className="rounded-2xl bg-surface border border-white/5 p-4">
          <p className="text-xs text-white/40 mb-1">Total del período</p>
          <p className="text-2xl font-bold text-white">{clp(totalGeneral)}</p>
        </div>

        <div className="rounded-2xl bg-surface border border-white/5 p-4 space-y-3">
          <p className="text-xs text-white/40">Desglose por método</p>
          {desglose.map((m) => {
            const pct = totalGeneral > 0 ? (m.total / totalGeneral) * 100 : 0
            return (
              <div key={m.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70">{m.emoji} {m.label}</span>
                  <span className="text-white font-medium">{clp(m.total)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl bg-surface border border-white/5 p-4">
          <p className="text-xs text-white/40 mb-2">Movimientos del período</p>
          {loading ? (
            <p className="text-white/40 text-sm text-center py-6">Cargando...</p>
          ) : ventasPeriodo.length === 0 ? (
            <Empty icon="🧮" title="Sin movimientos" />
          ) : (
            <div className="divide-y divide-white/5">
              {ventasPeriodo.map((v) => {
                const auto = autos.find((a) => a.id === v.auto_id)
                return (
                  <div key={v.id} className="py-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/90">{auto ? `${auto.marca} ${auto.modelo}` : 'Venta'}</span>
                      <span className="text-white font-semibold">{clp(v.precio_venta)}</span>
                    </div>
                    <p className="text-[11px] text-white/40">{fechaCL(v.fecha)} · {(v.pagos || []).map((p) => METODOS.find((m) => m.key === p.metodo)?.label).join(', ')}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
