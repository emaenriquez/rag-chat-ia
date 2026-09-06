import { api } from './api'

export const chatService = {
  getAll: () => api.get('/chats'),
  create: (title) => api.post('/chats', { title }),
  getById: (id) => api.get(`/chats/${id}`),
  delete: (id) => api.delete(`/chats/${id}`),
  sendMessage: (chatId, content) => api.post(`/chats/${chatId}/messages`, { content }),
}
