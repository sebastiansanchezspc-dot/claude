import { numFmt, unFmt } from '../../lib/format.js'

// Input de dinero: muestra $ + puntos de miles en tiempo real.
// value: número crudo (o string de dígitos). onChange recibe número.
export default function FMoney({ label, value, onChange, placeholder = '0', disabled = false, required = false }) {
  const display = value || value === 0 ? numFmt(String(value)) : ''

  function handleChange(e) {
    const raw = unFmt(e.target.value)
    onChange(raw)
  }

  return (
    <label className="block">
      {label && <span className="block text-xs text-white/50 mb-1">{label}{required && ' *'}</span>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">$</span>
        <input
          inputMode="numeric"
          disabled={disabled}
          value={display}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent disabled:opacity-50"
        />
      </div>
    </label>
  )
}
