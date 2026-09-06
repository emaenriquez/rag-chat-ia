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
    setError('')
    setUploading(true)

    try {
      const res = await documentService.upload(file)
      const newDoc = res.document
      if (newDoc) {
        setDocuments(prev => [newDoc, ...prev])
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

  const filteredDocs = documents.filter(doc =>
    doc.originalName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4" onClick={onCancel}>
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Fuentes del Chat</h3>
              <p className="text-xs text-slate-400">Ajusta los documentos asociados a esta conversación</p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden p-6 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              {selectedIds.length} archivos vinculados
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Seleccionar todos
              </button>
              <span className="text-slate-600 text-xs">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Search + Upload */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nombre..."
                className="w-full rounded-lg border border-slate-700/80 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500"
              />
            </div>
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
              {uploading ? <Spinner size="sm" /> : <span>+ Subir</span>}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 divide-y divide-slate-800/80 p-1 min-h-[160px] max-h-[300px]">
            {loadingDocs ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No hay documentos para mostrar</p>
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
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-violet-950/40 hover:bg-violet-900/30'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
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
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-slate-200 truncate" title={doc.originalName}>
                          {doc.originalName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatSize(doc.fileSize)}
                        </span>
                      </div>
                    </div>
                    <div>
                      {doc.status === 'processed' ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          Listo
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          {doc.status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

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
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
            >
              {saving && <Spinner size="sm" />}
              <span>Guardar Fuentes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
