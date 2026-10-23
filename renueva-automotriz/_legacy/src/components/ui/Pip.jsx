const COLORS = {
  disponible: 'bg-emerald-500/15 text-emerald-300',
  vendido: 'bg-white/10 text-white/60',
  admin: 'bg-accent/20 text-accent',
  vendedor: 'bg-sky-500/15 text-sky-300',
  readonly: 'bg-white/10 text-white/50',
  ok: 'bg-emerald-500/15 text-emerald-300',
  warn: 'bg-amber-500/15 text-amber-300',
  error: 'bg-rose-500/15 text-rose-300',
  neutral: 'bg-white/10 text-white/70',
}

export default function Pip({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${COLORS[tone] || COLORS.neutral}`}>
      {children}
    </span>
  )
}
