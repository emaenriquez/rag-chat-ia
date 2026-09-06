export function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xs p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{message}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-xl px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 dark:bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:opacity-90 active:scale-98 transition-all"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
