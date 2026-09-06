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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
          />
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
