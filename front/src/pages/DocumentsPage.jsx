import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocuments } from '../hooks/useDocuments'
import { DocumentList } from '../components/Documents/DocumentList'
import { UploadButton } from '../components/Documents/UploadButton'
import { Spinner } from '../components/ui/Spinner'

export function DocumentsPage() {
  const { documents, loading, upload, deleteDoc, reprocess } = useDocuments()
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

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Back nav */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/chats"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-slate-100">Documentos</h1>
          </div>
          <UploadButton onUpload={handleUpload} disabled={uploading} />
        </header>

        <main className="flex-1 px-6 py-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
              <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-red-200">✕</button>
            </div>
          )}

          {uploading && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-4 py-3 text-sm text-violet-300">
              <Spinner size="sm" /> Subiendo documento...
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
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
    </div>
  )
}
