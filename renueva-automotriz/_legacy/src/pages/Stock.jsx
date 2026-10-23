import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { useNegocio } from '../hooks/useNegocio.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { getRubro, estadoLabel, estadoTone } from '../lib/rubros.js'
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

function emptyForm(rubroKey) {
  return {
    rubro: rubroKey, nombre: '', sku: '', atributos: {},
    costo: 0, pagos_compra: [{ metodo: 'efectivo', monto: 0 }],
    prov_nombre: '', prov_fono: '', vendedor_compra_id: '', notas: '',
    fecha_ingreso: hoyISO(), stock_cantidad: 1,
  }
}

export default function Stock() {
  const { rol } = useAuth()
  const { rubrosActivos } = useNegocio()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [rubroTab, setRubroTab] = useState('todos')
  const [filtro, setFiltro] = useState('todos')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [form, setForm] = useState(emptyForm(rubrosActivos[0] || 'automotriz'))
  const [saving, setSaving] = useState(false)

  const multiRubro = rubrosActivos.length > 1

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: v }] = await Promise.all([
      supabase.from('items').select('*').order('created_at', { ascending: false }),
      supabase.from('vendedores').select('*').eq('activo', true),
    ])
    setItems(a || [])
    setVendedores(v || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtrados = items.filter((it) => {
    if (rubroTab !== 'todos' && it.rubro !== rubroTab) return false
    if (filtro === 'disponible' && it.estado !== 'disponible') return false
    if (filtro === 'no_disponible' && it.estado === 'disponible') return false
    if (!q.trim()) return true
    const s = q.toLowerCase()
    const enAtributos = Object.values(it.atributos || {}).some((v) => String(v).toLowerCase().includes(s))
    return [it.nombre, it.sku].some((f) => (f || '').toLowerCase().includes(s)) || enAtributos
  })

  function openNuevo() {
    setForm(emptyForm(rubroTab !== 'todos' ? rubroTab : (rubrosActivos[0] || 'automotriz')))
    setSheetOpen(true)
  }

  const rubroForm = getRubro(form.rubro)

  function setAtributo(key, value) {
    setForm((f) => ({ ...f, atributos: { ...f.atributos, [key]: value } }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!pagosCuadran(form.pagos_compra, form.costo)) {
      toast.error('Los pagos de compra deben sumar exacto al costo')
      return
    }
    for (const campo of rubroForm.campos) {
      if (campo.required && !form.atributos[campo.key]) {
        toast.error(`Falta el campo "${campo.label}"`)
        return
      }
    }
    setSaving(true)
    const stockCantidad = rubroForm.usaStock ? Math.max(1, Number(form.stock_cantidad) || 1) : 1
    const payload = {
      rubro: form.rubro, nombre: form.nombre, sku: form.sku, atributos: form.atributos,
      costo: form.costo, costo_unitario: form.costo / stockCantidad,
      pagos_compra: form.pagos_compra,
      prov_nombre: form.prov_nombre, prov_fono: form.prov_fono,
      vendedor_compra_id: form.vendedor_compra_id || null,
      notas: form.notas, fecha_ingreso: form.fecha_ingreso, estado: 'disponible',
      stock_cantidad: stockCantidad, stock_inicial: stockCantidad,
    }
    const { error } = await supabase.from('items').insert(payload)
    setSaving(false)
    if (error) {
      toast.error('Error al guardar: ' + error.message)
    } else {
      toast.success(`${rubroForm.itemLabel} ingresado a stock`)
      setSheetOpen(false)
      load()
    }
  }

  return (
    <>
      <Header title="📦 Stock" right={rol === 'admin' && (
        <button onClick={openNuevo} className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white text-lg leading-none">+</button>
      )} />

      <div className="px-4 py-3 space-y-3">
        {multiRubro && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            <button
              onClick={() => setRubroTab('todos')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${rubroTab === 'todos' ? 'bg-accent text-white' : 'bg-white/5 text-white/50'}`}
            >
              Todos
            </button>
            {rubrosActivos.map((rk) => {
              const r = getRubro(rk)
              return (
                <button
                  key={rk}
                  onClick={() => setRubroTab(rk)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${rubroTab === rk ? 'bg-accent text-white' : 'bg-white/5 text-white/50'}`}
                >
                  {r.emoji} {r.label}
                </button>
              )
            })}
          </div>
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          {[
            { k: 'todos', label: 'Todos' },
            { k: 'disponible', label: 'Disponibles' },
            { k: 'no_disponible', label: 'No disponibles' },
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
          <Empty icon="📦" title="No hay ítems" subtitle="Ajusta los filtros o ingresa uno nuevo" />
        ) : (
          <div className="space-y-2">
            {filtrados.map((it) => {
              const r = getRubro(it.rubro)
              return (
                <button
                  key={it.id}
                  onClick={() => setDetalle(it)}
                  className="w-full text-left rounded-2xl bg-surface border border-white/5 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{multiRubro && `${r.emoji} `}{it.nombre}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {it.sku && `${it.sku} · `}
                      {r.usaStock ? `${it.stock_cantidad} un. disponibles` : Object.values(it.atributos || {}).filter(Boolean).slice(0, 2).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{clp(it.precio_venta || it.costo)}</p>
                    <Pip tone={estadoTone(it.estado)}>{estadoLabel(it)}</Pip>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={`Ingresar ${rubroForm.itemLabel.toLowerCase()}`}>
        <form onSubmit={handleSave} className="space-y-3">
          {multiRubro && (
            <FSel
              label="Rubro" required value={form.rubro}
              onChange={(v) => setForm({ ...emptyForm(v) })}
              options={rubrosActivos.map((rk) => ({ value: rk, label: `${getRubro(rk).emoji} ${getRubro(rk).label}` }))}
            />
          )}

          <label className="block">
            <span className="block text-xs text-white/50 mb-1">Nombre *</span>
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder={rubroForm.nombrePlaceholder} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            {rubroForm.campos.map((campo) => (
              <div key={campo.key} className={campo.col === 3 ? '' : 'col-span-2'}>
                {campo.type === 'select' ? (
                  <FSel
                    label={campo.label} required={campo.required}
                    value={form.atributos[campo.key] || ''}
                    onChange={(v) => setAtributo(campo.key, v)}
                    options={campo.options.map((o) => ({ value: o, label: o }))}
                  />
                ) : (
                  <label className="block">
                    <span className="block text-xs text-white/50 mb-1">{campo.label}{campo.required && ' *'}</span>
                    <input
                      required={campo.required}
                      type={campo.type === 'number' ? 'number' : 'text'}
                      value={form.atributos[campo.key] ?? ''}
                      onChange={(e) => setAtributo(campo.key, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>

          <label className="block">
            <span className="block text-xs text-white/50 mb-1">{rubroForm.skuLabel}</span>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
          </label>

          <div className={`grid ${rubroForm.usaStock ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <FMoney label="Costo total" required value={form.costo} onChange={(v) => setForm({ ...form, costo: v })} />
            {rubroForm.usaStock && (
              <label className="block">
                <span className="block text-xs text-white/50 mb-1">Cantidad ingresada *</span>
                <input required type="number" min="1" value={form.stock_cantidad} onChange={(e) => setForm({ ...form, stock_cantidad: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
              </label>
            )}
          </div>

          <div>
            <span className="block text-xs text-white/50 mb-1">Pagos de compra (deben sumar el costo total) *</span>
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

      <Sheet open={!!detalle} onClose={() => setDetalle(null)} title={detalle ? detalle.nombre : ''}>
        {detalle && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-white/40">Estado</span><Pip tone={estadoTone(detalle.estado)}>{estadoLabel(detalle)}</Pip></div>
            {getRubro(detalle.rubro).campos.map((campo) => (
              <div key={campo.key} className="flex justify-between">
                <span className="text-white/40">{campo.label}</span>
                <span className="text-white">{detalle.atributos?.[campo.key] ?? '—'}</span>
              </div>
            ))}
            <div className="flex justify-between"><span className="text-white/40">{getRubro(detalle.rubro).skuLabel}</span><span className="text-white">{detalle.sku || '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Costo total</span><span className="text-white">{clp(detalle.costo)}</span></div>
            {getRubro(detalle.rubro).usaStock && (
              <div className="flex justify-between"><span className="text-white/40">Stock disponible</span><span className="text-white">{detalle.stock_cantidad} / {detalle.stock_inicial}</span></div>
            )}
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
