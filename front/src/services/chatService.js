import { api } from './api'

export const chatService = {
  getAll: () => api.get('/chats'),
  create: (title, documentIds) => api.post('/chats', { title, documentIds }),
  getById: (id) => api.get(`/chats/${id}`),
  delete: (id) => api.delete(`/chats/${id}`),
  sendMessage: (chatId, content) => api.post(`/chats/${chatId}/messages`, { content }),
  updateSources: (id, documentIds) => api.put(`/chats/${id}/sources`, { documentIds }),
}
