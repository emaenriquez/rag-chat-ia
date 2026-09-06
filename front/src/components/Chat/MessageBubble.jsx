import { useState } from 'react'

export function MessageBubble({ role, content, createdAt, sources = [] }) {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  if (isUser) {
    return (
      <div className="flex justify-end my-1.5 group">
        <div className="max-w-[85%] md:max-w-[70%] rounded-2xl rounded-br-md bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-800 dark:border-zinc-700/70 px-4 py-3 shadow-xs">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">
            {content}
          </p>
          {formattedTime && (
            <div className="flex justify-end mt-1.5">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-400 font-mono">
                {formattedTime}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 my-3 group">
      {/* Avatar Asistente */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-2xs mt-0.5">
        ✦
      </div>

      <div className="flex-1 min-w-0 max-w-[90%] md:max-w-[80%]">
        {/* Contenido del Asistente */}
        <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 px-4 py-3.5 shadow-2xs text-zinc-800 dark:text-zinc-200">
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-sans space-y-2">
            {content}
          </div>

          {/* Fuentes consultadas (si existen) */}
          {sources && sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 block mb-1">
                Fuentes consultadas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sources.map((src, idx) => (
                  <span
                    key={src.id || idx}
                    className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 font-mono"
                  >
                    📄 {src.originalName || src.title || 'Documento'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Barra inferior: hora y botón copiar */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100/60 dark:border-zinc-800/40 text-[10px] text-zinc-400 dark:text-zinc-500">
            <span>{formattedTime || 'Reciente'}</span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200"
              title="Copiar mensaje"
            >
              {copied ? (
                <>
                  <svg className="h-3 w-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-emerald-500 font-medium">Copiado</span>
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
