import FMoney from './FMoney.jsx'
import FSel from './FSel.jsx'
import PBtn from './PBtn.jsx'
import { clp } from '../../lib/format.js'

// pagos: [{ metodo, monto }]
// metodos: [{value, label}]
// target: monto que la suma de pagos debe igualar
export default function PagosBlock({ pagos, onChange, metodos, target }) {
  const total = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
  const diff = (Number(target) || 0) - total
  const cuadra = diff === 0 && pagos.length > 0

  function updatePago(idx, patch) {
    const next = pagos.map((p, i) => (i === idx ? { ...p, ...patch } : p))
    onChange(next)
  }

  function addPago() {
    onChange([...pagos, { metodo: metodos[0]?.value || '', monto: 0 }])
  }

  function removePago(idx) {
    onChange(pagos.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      {pagos.map((pago, idx) => (
        <div key={idx} className="flex gap-2 items-end">
          <div className="flex-1">
            <FSel
              label={idx === 0 ? 'Método' : undefined}
              value={pago.metodo}
              onChange={(v) => updatePago(idx, { metodo: v })}
              options={metodos}
            />
          </div>
          <div className="flex-1">
            <FMoney
              label={idx === 0 ? 'Monto' : undefined}
              value={pago.monto}
              onChange={(v) => updatePago(idx, { monto: v })}
            />
          </div>
          <button
            type="button"
            onClick={() => removePago(idx)}
            className="w-9 h-9 mb-0.5 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
          >
            ✕
          </button>
        </div>
      ))}

      <PBtn variant="outline" full onClick={addPago}>+ Agregar forma de pago</PBtn>

      <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium ${cuadra ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
        <span>Total pagos: {clp(total)}</span>
        <span>{cuadra ? '✓ Cuadra' : diff > 0 ? `Falta ${clp(diff)}` : `Sobra ${clp(-diff)}`}</span>
      </div>
    </div>
  )
}

export function pagosCuadran(pagos, target) {
  const total = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
  return pagos.length > 0 && total === (Number(target) || 0)
}
