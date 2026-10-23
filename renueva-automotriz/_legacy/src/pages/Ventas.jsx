import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { getRubro } from '../lib/rubros.js'
import Header from '../components/Header.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import PBtn from '../components/ui/PBtn.jsx'
import FMoney from '../components/ui/FMoney.jsx'
import FSel from '../components/ui/FSel.jsx'
import Empty from '../components/ui/Empty.jsx'
import PagosBlock, { pagosCuadran } from '../components/ui/PagosBlock.jsx'
import { clp, fechaCL, hoyISO } from '../lib/format.js'

const METODOS_VENTA = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'credito_automotriz', label: 'Crédito Automotriz' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
  { value: 'cheque', label: 'Cheque' },
]

function emptyForm() {
  return {
    item_id: '', fecha: hoyISO(), vendedor_id: '',
    precio_venta: 0, comision_tipo: 'pct', comision_valor: 0, cantidad: 1,
    pagos: [{ metodo: 'efectivo', monto: 0 }],
    cliente_nombre: '', cliente_fono: '',
  }
}

function calcComision(tipo, valor, precioVenta) {
  if (tipo === 'pct') return Math.round((Number(valor) || 0) / 100 * (Number(precioVenta) || 0))
  return Number(valor) || 0
}

function VentaForm({ initial, itemsDisponibles, vendedores, onCancel, onSaved, isEdit }) {
  const toast = useToast()
  const [form, setForm] = useState(initial || emptyForm())
  const [saving, setSaving] = useState(false)

  const itemSeleccionado = useMemo(
    () => itemsDisponibles.find((a) => a.id === form.item_id),
    [itemsDisponibles, form.item_id]
  )
  const rubro = itemSeleccionado ? getRubro(itemSeleccionado.rubro) : null

  const costoUnitario = itemSeleccionado?.costo_unitario ?? initial?.costo ?? 0
  const cantidad = rubro?.usaStock ? Math.max(1, Number(form.cantidad) || 1) : 1
  const costo = costoUnitario * cantidad
  const comision = calcComision(form.comision_tipo, form.comision_valor, form.precio_venta)
  const ganancia = (Number(form.precio_venta) || 0) - costo - comision
  const stockMax = itemSeleccionado ? itemSeleccionado.stock_cantidad : 1

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.item_id) { toast.error('Selecciona un ítem'); return }
    if (!form.vendedor_id) { toast.error('Selecciona un vendedor'); return }
    if (!pagosCuadran(form.pagos, form.precio_venta)) {
      toast.error('Los pagos deben sumar exacto al precio de venta')
      return
    }
    if (rubro?.usaStock && !isEdit && cantidad > stockMax) {
      toast.error(`Solo quedan ${stockMax} unidades disponibles`)
      return
    }
    setSaving(true)

    const payload = {
      item_id: form.item_id, fecha: form.fecha, vendedor_id: form.vendedor_id,
      pagos: form.pagos, cliente_nombre: form.cliente_nombre, cliente_fono: form.cliente_fono,
      comision_tipo: form.comision_tipo, comision_valor: form.comision_valor,
      precio_venta: form.precio_venta, costo, ganancia, comision, cantidad,
    }

    if (isEdit) {
      const { error } = await supabase.from('ventas').update(payload).eq('id', form.id)
      if (error) { toast.error('Error: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('ventas').insert(payload)
      if (error) { toast.error('Error: ' + error.message); setSaving(false); return }

      if (rubro?.usaStock) {
        const restante = stockMax - cantidad
        await supabase.from('items').update({
          stock_cantidad: Math.max(0, restante),
          estado: restante <= 0 ? 'agotado' : 'disponible',
        }).eq('id', form.item_id)
      } else {
        await supabase.from('items').update({
          estado: 'vendido', precio_venta: form.precio_venta, fecha_venta: form.fecha,
          vendedor_venta_id: form.vendedor_id, cliente_nombre: form.cliente_nombre, cliente_fono: form.cliente_fono,
        }).eq('id', form.item_id)
      }
    }

    setSaving(false)
    toast.success(isEdit ? 'Venta actualizada' : 'Venta registrada')
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FSel
        label="Ítem" required disabled={isEdit}
        value={form.item_id}
        onChange={(v) => setForm({ ...form, item_id: v, cantidad: 1 })}
        options={itemsDisponibles.map((it) => ({ value: it.id, label: `${getRubro(it.rubro).emoji} ${it.nombre}${it.sku ? ' · ' + it.sku : ''}` }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-white/50 mb-1">Fecha *</span>
          <input required type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
        </label>
        <FSel label="Vendedor" required value={form.vendedor_id} onChange={(v) => setForm({ ...form, vendedor_id: v })} options={vendedores.map((v) => ({ value: v.id, label: v.nombre }))} />
      </div>

      {rubro?.usaStock && (
        <label className="block">
          <span className="block text-xs text-white/50 mb-1">Cantidad * (disponibles: {stockMax})</span>
          <input required type="number" min="1" max={isEdit ? undefined : stockMax} disabled={isEdit} value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-50" />
        </label>
      )}

      <FMoney label="Precio de venta (total)" required value={form.precio_venta} onChange={(v) => setForm({ ...form, precio_venta: v })} />

      <div className="grid grid-cols-2 gap-3">
        <FSel label="Tipo comisión" value={form.comision_tipo} onChange={(v) => setForm({ ...form, comision_tipo: v })} options={[{ value: 'pct', label: '% Porcentaje' }, { value: 'monto', label: 'Monto fijo' }]} />
        {form.comision_tipo === 'pct' ? (
          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Comisión %</span>
            <input type="number" step="0.1" min="0" value={form.comision_valor} onChange={(e) => setForm({ ...form, comision_valor: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>
        ) : (
          <FMoney label="Comisión $" value={form.comision_valor} onChange={(v) => setForm({ ...form, comision_valor: v })} />
        )}
      </div>

      <div className="rounded-xl bg-white/5 px-3 py-2 flex justify-between text-xs">
        <span className="text-white/50">Comisión: <b className="text-white">{clp(comision)}</b></span>
        <span className="text-white/50">Ganancia est.: <b className={ganancia >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{clp(ganancia)}</b></span>
      </div>

      <div>
        <span className="block text-xs text-white/50 mb-1">Pagos del cliente (deben sumar el precio) *</span>
        <PagosBlock pagos={form.pagos} onChange={(p) => setForm({ ...form, pagos: p })} metodos={METODOS_VENTA} target={form.precio_venta} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-white/50 mb-1">Cliente</span>
          <input value={form.cliente_nombre} onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
        </label>
        <label className="block">
          <span className="block text-xs text-white/50 mb-1">Fono cliente</span>
          <input value={form.cliente_fono} onChange={(e) => setForm({ ...form, cliente_fono: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
        </label>
      </div>

      <div className="flex gap-2">
        <PBtn variant="outline" className="flex-1" onClick={onCancel}>Cancelar</PBtn>
        <PBtn type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar venta'}</PBtn>
      </div>
    </form>
  )
}

export default function Ventas() {
  const { rol } = useAuth()
  const [ventas, setVentas] = useState([])
  const [items, setItems] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mesOffset, setMesOffset] = useState(0)

  async function load() {
    setLoading(true)
    const [{ data: v }, { data: a }, { data: ve }] = await Promise.all([
      supabase.from('ventas').select('*').order('fecha', { ascending: false }),
      supabase.from('items').select('*'),
      supabase.from('vendedores').select('*').eq('activo', true),
    ])
    setVentas(v || [])
    setItems(a || [])
    setVendedores(ve || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const mesRef = new Date(now.getFullYear(), now.getMonth() - mesOffset, 1)
  const ventasMes = ventas.filter((v) => {
    const f = new Date(v.fecha)
    return f.getMonth() === mesRef.getMonth() && f.getFullYear() === mesRef.getFullYear()
  })
  const misVentas = rol === 'vendedor'
    ? ventasMes.filter((v) => v.vendedor_id && vendedores.some((ve) => ve.id === v.vendedor_id))
    : ventasMes

  const kpis = misVentas.reduce((acc, v) => {
    acc.bruto += Number(v.precio_venta) || 0
    acc.ganancia += Number(v.ganancia) || 0
    acc.comisiones += Number(v.comision) || 0
    return acc
  }, { bruto: 0, ganancia: 0, comisiones: 0 })

  const itemsDisponibles = items.filter((a) => a.estado === 'disponible' || a.id === editando?.item_id)

  function openNueva() {
    setEditando(null)
    setSheetOpen(true)
  }

  function openEditar(v) {
    setEditando({ ...v })
    setSheetOpen(true)
  }

  function handleSaved() {
    setSheetOpen(false)
    load()
  }

  return (
    <>
      <Header title="💰 Ventas" right={rol !== 'readonly' && (
        <button onClick={openNueva} className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white text-lg leading-none">+</button>
      )} />

      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setMesOffset((o) => o + 1)} className="w-8 h-8 rounded-full bg-white/5 text-white/60">‹</button>
          <p className="text-sm font-semibold text-white capitalize">
            {mesRef.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </p>
          <button onClick={() => setMesOffset((o) => Math.max(0, o - 1))} disabled={mesOffset === 0} className="w-8 h-8 rounded-full bg-white/5 text-white/60 disabled:opacity-30">›</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-surface border border-white/5 p-2.5 text-center">
            <p className="text-[10px] text-white/40">Bruto</p>
            <p className="text-xs font-bold text-white mt-0.5">{clp(kpis.bruto)}</p>
          </div>
          <div className="rounded-xl bg-surface border border-white/5 p-2.5 text-center">
            <p className="text-[10px] text-white/40">Ganancia</p>
            <p className="text-xs font-bold text-emerald-400 mt-0.5">{clp(kpis.ganancia)}</p>
          </div>
          <div className="rounded-xl bg-surface border border-white/5 p-2.5 text-center">
            <p className="text-[10px] text-white/40">Comisiones</p>
            <p className="text-xs font-bold text-white mt-0.5">{clp(kpis.comisiones)}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-white/40 text-sm text-center py-8">Cargando...</p>
        ) : misVentas.length === 0 ? (
          <Empty icon="💰" title="Sin ventas este mes" />
        ) : (
          <div className="space-y-2">
            {misVentas.map((v) => {
              const item = items.find((a) => a.id === v.item_id)
              return (
                <button key={v.id} onClick={() => openEditar(v)} className="w-full text-left rounded-2xl bg-surface border border-white/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      {item ? `${getRubro(item.rubro).emoji} ${item.nombre}` : 'Ítem'}
                      {v.cantidad > 1 && <span className="text-white/40 font-normal"> ×{v.cantidad}</span>}
                    </p>
                    <p className="text-sm font-bold text-white">{clp(v.precio_venta)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-white/40">{v.cliente_nombre || 'Sin cliente'} · {fechaCL(v.fecha)}</p>
                    <p className="text-[11px] text-emerald-400">+{clp(v.ganancia)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editando ? 'Editar venta' : 'Registrar venta'}>
        <VentaForm
          key={editando?.id || 'nueva'}
          initial={editando}
          isEdit={!!editando}
          itemsDisponibles={itemsDisponibles}
          vendedores={vendedores}
          onCancel={() => setSheetOpen(false)}
          onSaved={handleSaved}
        />
      </Sheet>
    </>
  )
}
