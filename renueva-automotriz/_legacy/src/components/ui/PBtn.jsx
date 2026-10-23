const VARIANTS = {
  primary: 'bg-accent text-white active:opacity-80',
  ghost: 'bg-white/5 text-white/80 active:opacity-80',
  danger: 'bg-rose-500/15 text-rose-300 active:opacity-80',
  outline: 'bg-transparent border border-white/15 text-white/80 active:opacity-80',
}

export default function PBtn({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  full = false,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${full ? 'w-full' : ''} rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
