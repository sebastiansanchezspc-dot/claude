export default function Empty({ icon = '📭', title = 'Sin datos', subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-white/70 text-sm font-medium">{title}</p>
      {subtitle && <p className="text-white/40 text-xs mt-1">{subtitle}</p>}
    </div>
  )
}
