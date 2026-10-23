export default function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-app self-end animate-sheet-up">
        <div className="bg-surface rounded-t-2xl border-t border-white/10 max-h-[88vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
            <div className="w-8" />
            <div className="h-1 w-10 rounded-full bg-white/15 absolute left-1/2 -translate-x-1/2 top-2" />
            <h2 className="text-sm font-semibold text-white/90 truncate">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto px-4 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
