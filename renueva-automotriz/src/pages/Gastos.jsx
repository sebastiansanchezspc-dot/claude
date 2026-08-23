import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useToast } from '../components/ui/Toast.jsx'
import Header from '../components/Header.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import PBtn from '../components/ui/PBtn.jsx'
import FMoney from '../components/ui/FMoney.jsx'
import FSel from '../components/ui/FSel.jsx'
import Empty from '../components/ui/Empty.jsx'
import { clp, fechaCL, hoyISO } from '../lib/format.js'

const CATEGORIAS = [
  { value: 'arriendo', label: 'Arriendo', emoji: '🏠' },
  { value: 'sueldo', label: 'Sueldo', emoji: '👤' },
  { value: 'servicio', label: 'Servicios', emoji: '💡' },
  { value: 'marketing', label: 'Marketing', emoji: '📣' },
  { value: 'mantención', label: 'Mantención', emoji: '🔧' },
  { value: 'otro', label: 'Otro', emoji: '📦' },
]

function emptyForm() {
  return { concepto: '', categoria: 'otro', monto: 0, fecha: hoyISO(), es_fijo: false, notas: '' }
}

export default function Gastos() {
  const toast = useToast()
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('gastos').select('*').order('fecha', { ascending: false })
    setGastos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const gastosMes = gastos.filter((g) => {
    const f = new Date(g.fecha)
    return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()
  })
  const totalMes = gastosMes.reduce((acc, g) => acc + (Number(g.monto) || 0), 0)

  const porCategoria = CATEGORIAS.map((c) => ({
    ...c,
    total: gastosMes.filter((g) => g.categoria === c.value).reduce((acc, g) => acc + (Number(g.monto) || 0), 0),
  }))

  function openNuevo() {
    setEditando(null)
    setForm(emptyForm())
    setSheetOpen(true)
  }

  function openEditar(g) {
    setEditando(g)
    setForm({ concepto: g.concepto, categoria: g.categoria, monto: g.monto, fecha: g.fecha, es_fijo: g.es_fijo, notas: g.notas || '' })
    setSheetOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      concepto: form.concepto, categoria: form.categoria, monto: form.monto,
      fecha: form.fecha, es_fijo: form.es_fijo, notas: form.notas,
    }
    const { error } = editando
      ? await supabase.from('gastos').update(payload).eq('id', editando.id)
      : await supabase.from('gastos').insert(payload)
    setSaving(false)
    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      toast.success(editando ? 'Gasto actualizado' : 'Gasto registrado')
      setSheetOpen(false)
      load()
    }
  }

  async function handleDelete() {
    if (!editando) return
    await supabase.from('gastos').delete().eq('id', editando.id)
    toast.success('Gasto eliminado')
    setSheetOpen(false)
    load()
  }

  return (
    <>
      <Header title="📦 Gastos" right={
        <button onClick={openNuevo} className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white text-lg leading-none">+</button>
      } />

      <div className="px-4 py-3 space-y-4">
        <div className="rounded-2xl bg-surface border border-white/5 p-4">
          <p className="text-xs text-white/40 mb-1">Total gastos del mes</p>
          <p className="text-2xl font-bold text-white">{clp(totalMes)}</p>
        </div>

        <div className="rounded-2xl bg-surface border border-white/5 p-4 space-y-3">
          <p className="text-xs text-white/40">Desglose por categoría</p>
          {porCategoria.map((c) => {
            const pct = totalMes > 0 ? (c.total / totalMes) * 100 : 0
            return (
              <div key={c.value}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70">{c.emoji} {c.label}</span>
                  <span className="text-white font-medium">{clp(c.total)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {loading ? (
          <p className="text-white/40 text-sm text-center py-8">Cargando...</p>
        ) : gastosMes.length === 0 ? (
          <Empty icon="📦" title="Sin gastos este mes" />
        ) : (
          <div className="space-y-2">
            {gastosMes.map((g) => {
              const cat = CATEGORIAS.find((c) => c.value === g.categoria)
              return (
                <button key={g.id} onClick={() => openEditar(g)} className="w-full text-left rounded-2xl bg-surface border border-white/5 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{cat?.emoji} {g.concepto}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{fechaCL(g.fecha)} {g.es_fijo && '· fijo'}</p>
                  </div>
                  <p className="text-sm font-semibold text-white">{clp(g.monto)}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editando ? 'Editar gasto' : 'Nuevo gasto'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Concepto *</span>
            <input required value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>
          <FSel label="Categoría" value={form.categoria} onChange={(v) => setForm({ ...form, categoria: v })} options={CATEGORIAS.map((c) => ({ value: c.value, label: `${c.emoji} ${c.label}` }))} />
          <div className="grid grid-cols-2 gap-3">
            <FMoney label="Monto" required value={form.monto} onChange={(v) => setForm({ ...form, monto: v })} />
            <label className="block">
              <span className="block text-xs text-white/50 mb-1">Fecha *</span>
              <input required type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.es_fijo} onChange={(e) => setForm({ ...form, es_fijo: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm text-white/70">Gasto fijo recurrente</span>
          </label>
          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Notas</span>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>
          <div className="flex gap-2">
            {editando && <PBtn variant="danger" onClick={handleDelete}>Eliminar</PBtn>}
            <PBtn type="submit" full disabled={saving}>{saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar gasto'}</PBtn>
          </div>
        </form>
      </Sheet>
    </>
  )
}
