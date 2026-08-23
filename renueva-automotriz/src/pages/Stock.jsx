import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import Header from '../components/Header.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import PBtn from '../components/ui/PBtn.jsx'
import FMoney from '../components/ui/FMoney.jsx'
import FSel from '../components/ui/FSel.jsx'
import Pip from '../components/ui/Pip.jsx'
import Empty from '../components/ui/Empty.jsx'
import PagosBlock, { pagosCuadran } from '../components/ui/PagosBlock.jsx'
import { clp, fechaCL, hoyISO } from '../lib/format.js'

const METODOS_COMPRA = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
]

const TIPOS = ['Sedán', 'SUV', 'Hatchback', 'Pickup', 'Furgón', 'Camioneta', 'Otro'].map((t) => ({ value: t, label: t }))

const emptyForm = () => ({
  marca: '', modelo: '', anio: '', km: '', patente: '', tipo: '', color: '',
  costo: 0, pagos_compra: [{ metodo: 'efectivo', monto: 0 }],
  prov_nombre: '', prov_fono: '', vendedor_compra_id: '', notas: '',
  fecha_ingreso: hoyISO(),
})

export default function Stock() {
  const { rol } = useAuth()
  const toast = useToast()
  const [autos, setAutos] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: v }] = await Promise.all([
      supabase.from('autos').select('*').order('created_at', { ascending: false }),
      supabase.from('vendedores').select('*').eq('activo', true),
    ])
    setAutos(a || [])
    setVendedores(v || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtrados = autos.filter((a) => {
    if (filtro !== 'todos' && a.estado !== filtro) return false
    if (!q.trim()) return true
    const s = q.toLowerCase()
    return [a.marca, a.modelo, a.patente].some((f) => (f || '').toLowerCase().includes(s))
  })

  function openNuevo() {
    setForm(emptyForm())
    setSheetOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!pagosCuadran(form.pagos_compra, form.costo)) {
      toast.error('Los pagos de compra deben sumar exacto al costo')
      return
    }
    setSaving(true)
    const payload = {
      marca: form.marca, modelo: form.modelo, anio: Number(form.anio) || null,
      km: Number(form.km) || 0, patente: form.patente, tipo: form.tipo, color: form.color,
      costo: form.costo, pagos_compra: form.pagos_compra,
      prov_nombre: form.prov_nombre, prov_fono: form.prov_fono,
      vendedor_compra_id: form.vendedor_compra_id || null,
      notas: form.notas, fecha_ingreso: form.fecha_ingreso, estado: 'disponible',
    }
    const { error } = await supabase.from('autos').insert(payload)
    setSaving(false)
    if (error) {
      toast.error('Error al guardar: ' + error.message)
    } else {
      toast.success('Auto ingresado a stock')
      setSheetOpen(false)
      load()
    }
  }

  return (
    <>
      <Header title="🚗 Stock" right={rol === 'admin' && (
        <button onClick={openNuevo} className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white text-lg leading-none">+</button>
      )} />

      <div className="px-4 py-3 space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar marca, modelo o patente..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          {[
            { k: 'todos', label: 'Todos' },
            { k: 'disponible', label: 'Disponibles' },
            { k: 'vendido', label: 'Vendidos' },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFiltro(f.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${filtro === f.k ? 'bg-accent text-white' : 'bg-white/5 text-white/50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-white/40 text-sm text-center py-8">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <Empty icon="🚗" title="No hay autos" subtitle="Ajusta los filtros o ingresa un auto nuevo" />
        ) : (
          <div className="space-y-2">
            {filtrados.map((a) => (
              <button
                key={a.id}
                onClick={() => setDetalle(a)}
                className="w-full text-left rounded-2xl bg-surface border border-white/5 p-3.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{a.marca} {a.modelo} <span className="text-white/40 font-normal">'{String(a.anio).slice(-2)}</span></p>
                  <p className="text-[11px] text-white/40 mt-0.5">{a.patente} · {a.km?.toLocaleString('es-CL')} km</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{clp(a.estado === 'vendido' ? a.precio_venta : a.costo)}</p>
                  <Pip tone={a.estado}>{a.estado}</Pip>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Ingresar auto">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Marca *</span>
              <input required value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Modelo *</span>
              <input required value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Año *</span>
              <input required type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Km</span>
              <input type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Color</span>
              <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Patente *</span>
              <input required value={form.patente} onChange={(e) => setForm({ ...form, patente: e.target.value.toUpperCase() })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
            <FSel label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} options={TIPOS} />
          </div>

          <FMoney label="Costo" required value={form.costo} onChange={(v) => setForm({ ...form, costo: v })} />

          <div>
            <span className="block text-xs text-white/50 mb-1">Pagos de compra (deben sumar el costo) *</span>
            <PagosBlock pagos={form.pagos_compra} onChange={(p) => setForm({ ...form, pagos_compra: p })} metodos={METODOS_COMPRA} target={form.costo} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Proveedor</span>
              <input value={form.prov_nombre} onChange={(e) => setForm({ ...form, prov_nombre: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Fono proveedor</span>
              <input value={form.prov_fono} onChange={(e) => setForm({ ...form, prov_fono: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
          </div>

          <FSel label="Vendedor que gestionó" value={form.vendedor_compra_id} onChange={(v) => setForm({ ...form, vendedor_compra_id: v })} options={vendedores.map((v) => ({ value: v.id, label: v.nombre }))} placeholder="Sin asignar" />

          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Notas</span>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>

          <PBtn type="submit" full disabled={saving}>{saving ? 'Guardando...' : 'Ingresar a stock'}</PBtn>
        </form>
      </Sheet>

      <Sheet open={!!detalle} onClose={() => setDetalle(null)} title={detalle ? `${detalle.marca} ${detalle.modelo}` : ''}>
        {detalle && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-white/40">Estado</span><Pip tone={detalle.estado}>{detalle.estado}</Pip></div>
            <div className="flex justify-between"><span className="text-white/40">Año</span><span className="text-white">{detalle.anio}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Patente</span><span className="text-white">{detalle.patente}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Km</span><span className="text-white">{detalle.km?.toLocaleString('es-CL')}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Tipo</span><span className="text-white">{detalle.tipo || '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Color</span><span className="text-white">{detalle.color || '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Costo</span><span className="text-white">{clp(detalle.costo)}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Ingreso</span><span className="text-white">{fechaCL(detalle.fecha_ingreso)}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Proveedor</span><span className="text-white">{detalle.prov_nombre || '—'} {detalle.prov_fono ? `(${detalle.prov_fono})` : ''}</span></div>
            {detalle.estado === 'vendido' && (
              <>
                <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-white/40">Precio venta</span><span className="text-white">{clp(detalle.precio_venta)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Fecha venta</span><span className="text-white">{fechaCL(detalle.fecha_venta)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Cliente</span><span className="text-white">{detalle.cliente_nombre || '—'}</span></div>
              </>
            )}
            {detalle.notas && <div><span className="text-white/40 block mb-1">Notas</span><p className="text-white/80">{detalle.notas}</p></div>}
          </div>
        )}
      </Sheet>
    </>
  )
}
