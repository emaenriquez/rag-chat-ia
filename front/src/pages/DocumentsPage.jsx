import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocuments } from '../hooks/useDocuments'
import { useTheme } from '../context/ThemeContext'
import { DocumentList } from '../components/Documents/DocumentList'
import { UploadButton } from '../components/Documents/UploadButton'
import { Spinner } from '../components/ui/Spinner'

export function DocumentsPage() {
  const { documents, loading, upload, deleteDoc, reprocess } = useDocuments()
  const { theme, toggleTheme } = useTheme()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (file) => {
    setError('')
    setUploading(true)
    try {
      await upload(file)
    } catch (err) {
      setError(err.message || 'Error al subir el documento')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDoc(id)
    } catch (err) {
      setError(err.message || 'Error al eliminar')
    }
  }

  const handleReprocess = async (id) => {
    try {
      await reprocess(id)
    } catch (err) {
      setError(err.message || 'Error al reprocesar')
    }
  }

  const processedCount = documents.filter((d) => d.status === 'processed').length
  const totalSize = documents.reduce((acc, d) => acc + Number(d.fileSize || 0), 0)

  const formatTotalSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfbfa] dark:bg-[#131315] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/70 dark:border-zinc-800/60 px-6 bg-white/70 dark:bg-[#161619]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            to="/chats"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Volver al chat"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Biblioteca de Documentos
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Archivos indexados para la búsqueda RAG
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Cambiar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <UploadButton onUpload={handleUpload} disabled={uploading} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 shadow-2xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
              Total Archivos
            </span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">
              {documents.length}
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 shadow-2xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
              Procesados & Listos
            </span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {processedCount}
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 shadow-2xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
              Almacenamiento Total
            </span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">
              {formatTotalSize(totalSize)}
            </span>
          </div>
        </div>

        {/* Notificaciones de error o subida */}
        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {uploading && (
          <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 px-4 py-3 text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Spinner size="sm" />
            <span>Subiendo y fragmentando documento para embeddings...</span>
          </div>
        )}

        {/* Tabla de documentos */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            onReprocess={handleReprocess}
          />
        )}
      </main>
    </div>
  )
}
