// Select genérico. options: [{value, label}]
export default function FSel({ label, value, onChange, options = [], placeholder = 'Selecciona...', required = false, disabled = false }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-white/50 mb-1">{label}{required && ' *'}</span>}
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-50 appearance-none"
      >
        <option value="" disabled className="bg-surface">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
