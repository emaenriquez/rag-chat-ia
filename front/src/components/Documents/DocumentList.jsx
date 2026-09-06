function formatSize(bytes) {
  if (!bytes) return '-'
  const n = Number(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentList({ documents, onDelete, onReprocess }) {
  if (!documents.length) {
    return (
      <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-xl text-zinc-500 mb-3">
          📚
        </div>
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          No tienes documentos aún
        </h3>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto">
          Sube tus archivos PDF, Word o de texto plano para alimentar la base vectorial del chat con IA.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/30">
              <th className="px-5 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Tamaño</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Subido</th>
              <th className="px-5 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {documents.map((doc) => {
              const ext = doc.originalName.split('.').pop()?.toUpperCase() || 'FILE'

              return (
                <tr
                  key={doc.id}
                  className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">
                        {ext.slice(0, 3)}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-xs" title={doc.originalName}>
                        {doc.originalName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-400 dark:text-zinc-500">
                    {doc.mimeType?.split('/').pop()}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-400 dark:text-zinc-500">
                    {formatSize(doc.fileSize)}
                  </td>
                  <td className="px-4 py-3.5">
                    {doc.status === 'processed' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Procesado
                      </span>
                    )}
                    {doc.status === 'processing' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Procesando
                      </span>
                    )}
                    {doc.status === 'uploaded' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2.5 py-0.5 text-[11px] font-medium">
                        Subido
                      </span>
                    )}
                    {doc.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 text-[11px] font-medium">
                        Error
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400 dark:text-zinc-500 font-mono">
                    {new Date(doc.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {doc.status !== 'processing' && (
                        <button
                          onClick={() => onReprocess(doc.id)}
                          className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Reprocesar documento"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar documento"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
