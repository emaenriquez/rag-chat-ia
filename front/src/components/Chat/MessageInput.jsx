import { useState, useRef } from 'react'

export function MessageInput({ onSend, disabled, placeholder = 'Escribe tu pregunta o consulta tus documentos...' }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const handleSubmit = (e) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Outer shell double-bezel */}
      <div className="p-1 rounded-2xl md:rounded-3xl bg-zinc-200/50 dark:bg-zinc-800/40 ring-1 ring-zinc-300/40 dark:ring-white/10 transition-all focus-within:ring-zinc-400 dark:focus-within:ring-zinc-600">
        {/* Inner container */}
        <div className="rounded-[calc(1.5rem-0.25rem)] bg-white dark:bg-[#1e1e22] border border-zinc-200/60 dark:border-white/5 p-2 md:p-3 shadow-sm prompt-card-shadow">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <div />

            {/* Lado derecho: Selector y botón enviar */}
            <div className="flex items-center gap-2">

              {/* Botón enviar circular estilo Image 1 & 2 */}
              <button
                type="submit"
                disabled={disabled || !text.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                title="Enviar mensaje"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
