import { api } from './api'

export const documentService = {
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (file) => api.upload('/documents', file),
  delete: (id) => api.delete(`/documents/${id}`),
  reprocess: (id) => api.post(`/documents/${id}/reprocess`),
}
