import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useToast } from '../components/ui/Toast.jsx'
import Header from '../components/Header.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import PBtn from '../components/ui/PBtn.jsx'
import FMoney from '../components/ui/FMoney.jsx'
import FSel from '../components/ui/FSel.jsx'
import Pip from '../components/ui/Pip.jsx'
import Empty from '../components/ui/Empty.jsx'
import { clp } from '../lib/format.js'

function emptyForm() {
  return { nombre: '', fono: '', comision_tipo: 'pct', comision_valor: 0, activo: true }
}

export default function Equipo() {
  const toast = useToast()
  const [vendedores, setVendedores] = useState([])
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [{ data: v }, { data: ve }] = await Promise.all([
      supabase.from('vendedores').select('*').order('nombre'),
      supabase.from('ventas').select('*'),
    ])
    setVendedores(v || [])
    setVentas(ve || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const ventasMes = ventas.filter((v) => {
    const f = new Date(v.fecha)
    return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()
  })
  const totalMes = ventasMes.reduce((acc, v) => acc + (Number(v.precio_venta) || 0), 0)

  function statsDe(vendedorId) {
    const propias = ventasMes.filter((v) => v.vendedor_id === vendedorId)
    const ventasTotal = propias.reduce((acc, v) => acc + (Number(v.precio_venta) || 0), 0)
    const comision = propias.reduce((acc, v) => acc + (Number(v.comision) || 0), 0)
    const participacion = totalMes > 0 ? (ventasTotal / totalMes) * 100 : 0
    return { cantidad: propias.length, ventasTotal, comision, participacion }
  }

  function openNuevo() {
    setEditando(null)
    setForm(emptyForm())
    setSheetOpen(true)
  }

  function openEditar(v) {
    setEditando(v)
    setForm({ nombre: v.nombre, fono: v.fono || '', comision_tipo: v.comision_tipo, comision_valor: v.comision_valor, activo: v.activo })
    setSheetOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      nombre: form.nombre, fono: form.fono,
      comision_tipo: form.comision_tipo, comision_valor: Number(form.comision_valor) || 0,
      activo: form.activo,
    }
    const { error } = editando
      ? await supabase.from('vendedores').update(payload).eq('id', editando.id)
      : await supabase.from('vendedores').insert(payload)
    setSaving(false)
    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      toast.success(editando ? 'Vendedor actualizado' : 'Vendedor creado')
      setSheetOpen(false)
      load()
    }
  }

  return (
    <>
      <Header title="👥 Equipo" right={
        <button onClick={openNuevo} className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white text-lg leading-none">+</button>
      } />

      <div className="px-4 py-3 space-y-4">
        {loading ? (
          <p className="text-white/40 text-sm text-center py-8">Cargando...</p>
        ) : vendedores.length === 0 ? (
          <Empty icon="👥" title="Sin vendedores" subtitle="Agrega el primer integrante del equipo" />
        ) : (
          <div className="space-y-2">
            {vendedores.map((v) => {
              const s = statsDe(v.id)
              return (
                <button key={v.id} onClick={() => openEditar(v)} className="w-full text-left rounded-2xl bg-surface border border-white/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{v.nombre}</p>
                      {!v.activo && <Pip tone="neutral">inactivo</Pip>}
                    </div>
                    <p className="text-xs text-white/50">{v.comision_tipo === 'pct' ? `${v.comision_valor}%` : clp(v.comision_valor)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div>
                      <p className="text-[10px] text-white/40">Ventas</p>
                      <p className="text-xs font-semibold text-white">{s.cantidad}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Comisión</p>
                      <p className="text-xs font-semibold text-emerald-400">{clp(s.comision)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Participación</p>
                      <p className="text-xs font-semibold text-white">{s.participacion.toFixed(0)}%</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="rounded-2xl bg-surface border border-white/5 p-4">
          <p className="text-xs text-white/40 mb-3">Comisiones a pagar este mes</p>
          {vendedores.filter((v) => statsDe(v.id).comision > 0).length === 0 ? (
            <p className="text-white/30 text-xs">Sin comisiones generadas este mes</p>
          ) : (
            <div className="divide-y divide-white/5">
              {vendedores.filter((v) => statsDe(v.id).comision > 0).map((v) => (
                <div key={v.id} className="py-2 flex justify-between text-sm">
                  <span className="text-white/80">{v.nombre}</span>
                  <span className="text-white font-semibold">{clp(statsDe(v.id).comision)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editando ? 'Editar vendedor' : 'Nuevo vendedor'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Nombre *</span>
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Fono</span>
            <input value={form.fono} onChange={(e) => setForm({ ...form, fono: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>
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
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm text-white/70">Activo</span>
          </label>
          <PBtn type="submit" full disabled={saving}>{saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear vendedor'}</PBtn>
        </form>
      </Sheet>
    </>
  )
}
