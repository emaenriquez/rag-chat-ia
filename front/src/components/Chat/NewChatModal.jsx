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

export function NewChatModal({ open, onConfirm, onCancel }) {
  const [title, setTitle] = useState('')
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setTitle('')
      setSelectedIds([])
      setSearch('')
      setUploadError('')
      return
    }

    const loadDocuments = async () => {
      setLoadingDocs(true)
      try {
        const data = await documentService.getAll()
        const docs = data.documents || []
        setDocuments(docs)
        const readyIds = docs.filter((d) => d.status === 'processed').map((d) => d.id)
        setSelectedIds(readyIds)
      } catch (err) {
        console.error('Error cargando documentos:', err)
        setDocuments([])
      } finally {
        setLoadingDocs(false)
      }
    }

    loadDocuments()
  }, [open])

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
    setUploadError('')
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
      setUploadError(err.message || 'Error al subir el archivo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({
      title: title.trim() || undefined,
      documentIds: selectedIds,
    })
  }

  const filteredDocs = documents.filter((doc) =>
    doc.originalName.toLowerCase().includes(search.toLowerCase())
  )

  const processedCount = documents.filter((d) => d.status === 'processed').length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xs p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xl rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              ✦
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Iniciar nuevo chat
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Selecciona las fuentes documentales para esta conversación
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden p-6 gap-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Título de la conversación (opcional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Análisis de balances, Contratos 2026..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
            />
          </div>

          {/* Selección de Fuentes */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <span>Archivos a consultar</span>
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                  {selectedIds.length} seleccionados
                </span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={processedCount === 0}
                  className="text-zinc-600 dark:text-zinc-400 hover:underline disabled:opacity-40"
                >
                  Seleccionar todos
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={selectedIds.length === 0}
                  className="text-zinc-500 dark:text-zinc-500 hover:underline disabled:opacity-40"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Barra de búsqueda y botón subir */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar archivos..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-400"
                />
              </div>

              {/* Botón rápido para subir documento */}
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
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 shrink-0"
              >
                {uploading ? (
                  <Spinner size="sm" />
                ) : (
                  <span>+ Subir</span>
                )}
              </button>
            </div>

            {uploadError && (
              <div className="mb-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400">
                {uploadError}
              </div>
            )}

            {/* Lista de Documentos con scroll */}
            <div className="flex-1 overflow-y-auto border border-zinc-200/80 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 divide-y divide-zinc-200/60 dark:divide-zinc-800/60 p-1">
              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Spinner size="md" />
                  <span className="text-xs text-zinc-400">Cargando documentos...</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {search ? 'Sin resultados para este filtro' : 'No hay documentos disponibles'}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
                    Sube documentos PDF o texto para comenzar a chatear con ellos.
                  </p>
                </div>
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
                        {/* Checkbox minimalista */}
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

                        {/* Nombre y peso */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate" title={doc.originalName}>
                            {doc.originalName}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                            {formatSize(doc.fileSize)}
                          </span>
                        </div>
                      </div>

                      {/* Estado pastel */}
                      <div className="shrink-0 ml-2">
                        {doc.status === 'processed' ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                            Listo
                          </span>
                        ) : doc.status === 'processing' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-medium">
                            <Spinner size="sm" className="h-2.5 w-2.5" /> Procesando
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

            {selectedIds.length === 0 && documents.length > 0 && (
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                ℹ️ Si no seleccionas archivos específicos, el chat consultará todos tus documentos procesados.
              </p>
            )}
          </div>

          {/* Footer botones */}
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
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-xs font-semibold shadow-xs hover:opacity-90 active:scale-98 transition-all"
            >
              <span>
                {selectedIds.length > 0
                  ? `Iniciar Chat (${selectedIds.length} ${selectedIds.length === 1 ? 'fuente' : 'fuentes'})`
                  : 'Iniciar Chat con todas'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
