import { useState, useEffect, useCallback } from 'react'
import { documentService } from '../services/documentService'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await documentService.getAll()
      setDocuments(data.documents)
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const upload = useCallback(async (file) => {
    const data = await documentService.upload(file)
    setDocuments((prev) => [data.document, ...prev])
    return data.document
  }, [])

  const deleteDoc = useCallback(async (id) => {
    await documentService.delete(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const reprocess = useCallback(async (id) => {
    await documentService.reprocess(id)
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'processing' } : d)),
    )
  }, [])

  return { documents, loading, upload, deleteDoc, reprocess, refresh: fetchDocs }
}
