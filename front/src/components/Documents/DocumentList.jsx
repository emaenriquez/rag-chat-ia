const STATUS_STYLES = {
  uploaded: 'bg-sky-500/20 text-sky-400',
  processing: 'bg-amber-500/20 text-amber-400',
  processed: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
}

const STATUS_LABELS = {
  uploaded: 'Subido',
  processing: 'Procesando',
  processed: 'Procesado',
  failed: 'Error',
}

function formatSize(bytes) {
  const n = Number(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentList({ documents, onDelete, onReprocess }) {
  if (!documents.length) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        No hay documentos. Sube uno para empezar.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Tamaño</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {documents.map((doc) => (
            <tr key={doc.id} className="text-slate-300 transition-colors hover:bg-slate-800/50">
              <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-200">
                {doc.originalName}
              </td>
              <td className="px-4 py-3 text-slate-400">{doc.mimeType?.split('/').pop()}</td>
              <td className="px-4 py-3 text-slate-400">{formatSize(doc.fileSize)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status] || ''}`}
                >
                  {STATUS_LABELS[doc.status] || doc.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {new Date(doc.createdAt).toLocaleDateString('es-AR')}
              </td>
              <td className="flex gap-2 px-4 py-3">
                {doc.status !== 'processing' && (
                  <button
                    onClick={() => onReprocess(doc.id)}
                    className="rounded px-2 py-1 text-xs text-violet-400 hover:bg-violet-500/20 transition-colors"
                    title="Reprocesar"
                  >
                    ↻
                  </button>
                )}
                <button
                  onClick={() => onDelete(doc.id)}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Eliminar"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
