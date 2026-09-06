import { useState, useEffect, useRef } from 'react'
import { documentService } from '../../services/documentService'
import { Spinner } from '../ui/Spinner'

function formatSize(bytes) {
  if (!bytes) return ''
  const n = Number(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function ManageSourcesModal({ open, currentDocIds = [], onSave, onCancel }) {
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) return

    setSelectedIds(currentDocIds)
    setSearch('')
    setError('')

    const loadDocuments = async () => {
      setLoadingDocs(true)
      try {
        const data = await documentService.getAll()
        setDocuments(data.documents || [])
      } catch (err) {
        console.error('Error cargando documentos:', err)
        setDocuments([])
      } finally {
        setLoadingDocs(false)
      }
    }

    loadDocuments()
  }, [open, currentDocIds])

  if (!open) return null

  const handleToggleDoc = (id, status) => {
    if (status !== 'processed') return
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const readyIds = documents.filter((d) => d.status === 'processed').map((d) => d.id)
    setSelectedIds(readyIds)
  }

  const handleClearAll = () => {
    setSelectedIds([])
  }

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)

    try {
      const res = await documentService.upload(file)
      const newDoc = res.document
      if (newDoc) {
        setDocuments((prev) => [newDoc, ...prev])
        setTimeout(async () => {
          try {
            const data = await documentService.getAll()
            setDocuments(data.documents || [])
            const processed = (data.documents || []).find(
              (d) => d.id === newDoc.id && d.status === 'processed'
            )
            if (processed) {
              setSelectedIds((prev) => [...prev, newDoc.id])
            }
          } catch {}
        }, 2000)
      }
    } catch (err) {
      setError(err.message || 'Error al subir archivo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(selectedIds)
      onCancel()
    } catch (err) {
      setError(err.message || 'Error al actualizar las fuentes')
    } finally {
      setSaving(false)
    }
  }

  const filteredDocs = documents.filter((doc) =>
    doc.originalName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xs p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              📄
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Gestionar fuentes del chat
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ajusta qué documentos consulta esta conversación activa
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden p-6 gap-3">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Acciones de selección */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {selectedIds.length} fuentes seleccionadas
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-zinc-600 dark:text-zinc-400 hover:underline"
              >
                Seleccionar todos
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-zinc-500 dark:text-zinc-500 hover:underline"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Filtro y upload */}
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar archivos..."
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleUploadFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 shrink-0"
            >
              {uploading ? <Spinner size="sm" /> : <span>+ Subir</span>}
            </button>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto border border-zinc-200/80 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 divide-y divide-zinc-200/60 dark:divide-zinc-800/60 p-1">
            {loadingDocs ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <p className="text-center py-6 text-xs text-zinc-400">No se encontraron documentos</p>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedIds.includes(doc.id)
                const isReady = doc.status === 'processed'

                return (
                  <div
                    key={doc.id}
                    onClick={() => handleToggleDoc(doc.id, doc.status)}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                      !isReady
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-zinc-200/70 dark:bg-zinc-800/90'
                        : 'hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 text-white dark:text-zinc-900'
                            : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate" title={doc.originalName}>
                          {doc.originalName}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {formatSize(doc.fileSize)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {doc.status === 'processed' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                          Listo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 text-[10px]">
                          {doc.status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-xs font-semibold shadow-xs hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
            >
              {saving && <Spinner size="sm" />}
              <span>Guardar cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
