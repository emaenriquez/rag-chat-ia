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

  // Cargar documentos al abrir el modal
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
        // Por defecto pre-seleccionamos todos los documentos ya procesados
        const readyIds = docs.filter(d => d.status === 'processed').map(d => d.id)
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
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const readyIds = documents.filter(d => d.status === 'processed').map(d => d.id)
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
        setDocuments(prev => [newDoc, ...prev])
        // Si ya está o se procesa, lo marcamos o refrescamos la lista
        setTimeout(async () => {
          try {
            const data = await documentService.getAll()
            setDocuments(data.documents || [])
            const processed = (data.documents || []).find(d => d.id === newDoc.id && d.status === 'processed')
            if (processed) {
              setSelectedIds(prev => [...prev, newDoc.id])
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
      documentIds: selectedIds
    })
  }

  const filteredDocs = documents.filter(doc =>
    doc.originalName.toLowerCase().includes(search.toLowerCase())
  )

  const processedCount = documents.filter(d => d.status === 'processed').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4" onClick={onCancel}>
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Iniciar Nuevo Chat</h3>
              <p className="text-xs text-slate-400">Elige qué fuentes documentales consultará la IA</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden p-6 gap-5">
          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Título de la conversación (opcional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Análisis de balances, Normativa interna..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
            />
          </div>

          {/* Selección de Fuentes */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <span>Seleccionar archivos a consultar</span>
                <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                  {selectedIds.length} seleccionados
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={processedCount === 0}
                  className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
                >
                  Seleccionar todos
                </button>
                <span className="text-slate-600 text-xs">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={selectedIds.length === 0}
                  className="text-xs text-slate-400 hover:text-slate-300 disabled:opacity-40 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Barra de búsqueda y botón subir */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar entre tus documentos..."
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500"
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
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-500/50 hover:bg-slate-700/80 transition-colors disabled:opacity-50 shrink-0"
              >
                {uploading ? (
                  <Spinner size="sm" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span>Subir nuevo</span>
              </button>
            </div>

            {uploadError && (
              <div className="mb-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400">
                {uploadError}
              </div>
            )}

            {/* Lista de Documentos con scroll */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 divide-y divide-slate-800/80 p-1">
              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Spinner size="md" />
                  <span className="text-xs text-slate-400">Cargando tus documentos...</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600 mb-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-medium text-slate-400">
                    {search ? 'No se encontraron documentos con ese nombre' : 'No tienes documentos cargados aún'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Sube archivos PDF o texto para que la IA pueda consultarlos y responder preguntas basadas en ellos.
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
                      className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer ${
                        !isReady
                          ? 'opacity-50 cursor-not-allowed bg-slate-900/30'
                          : isSelected
                          ? 'bg-violet-950/40 hover:bg-violet-900/30'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox personalizado */}
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                            isSelected
                              ? 'border-violet-500 bg-violet-600 text-white'
                              : 'border-slate-600 bg-slate-900'
                          }`}
                        >
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>

                        {/* Icono y nombre */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-slate-200 truncate" title={doc.originalName}>
                            {doc.originalName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatSize(doc.fileSize)} • {doc.mimeType?.split('/').pop()}
                          </span>
                        </div>
                      </div>

                      {/* Estado */}
                      <div className="shrink-0 ml-2">
                        {doc.status === 'processed' ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            Listo
                          </span>
                        ) : doc.status === 'processing' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            <Spinner size="sm" className="h-2.5 w-2.5" /> Procesando
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                            {doc.status}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Aviso informativo si no hay selección */}
            {selectedIds.length === 0 && documents.length > 0 && (
              <p className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Si no seleccionas archivos específicos, el chat consultará todos tus documentos procesados.</span>
              </p>
            )}
          </div>

          {/* Footer botones */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors shadow-md shadow-violet-600/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              <span>
                {selectedIds.length > 0
                  ? `Iniciar Chat (${selectedIds.length} ${selectedIds.length === 1 ? 'fuente' : 'fuentes'})`
                  : 'Iniciar Chat con todas las fuentes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
