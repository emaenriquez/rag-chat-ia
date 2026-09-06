import { api } from './api'

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }, { auth: false }),
  register: (email, password) =>
    api.post('/auth/register', { email, password }, { auth: false }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}
