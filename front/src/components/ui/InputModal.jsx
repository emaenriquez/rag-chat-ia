import { useState } from 'react'

export function InputModal({ open, title, placeholder, onConfirm, onCancel }) {
  const [value, setValue] = useState('')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(value.trim())
    setValue('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xs p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
          />
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3.5 py-1.5 text-xs font-semibold shadow-2xs hover:opacity-90 active:scale-98 transition-all"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
