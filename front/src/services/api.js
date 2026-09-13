const API_URL = import.meta.env.VITE_API_URL

let accessToken = localStorage.getItem('token') || null

export function setToken(token) {
  accessToken = token
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}

export function getToken() {
  if (!accessToken) {
    accessToken = localStorage.getItem('token')
  }
  return accessToken
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Session expired')
  const data = await res.json()
  setToken(data.accessToken)
  return data.accessToken
}

async function request(endpoint, options = {}) {
  const { headers = {}, auth = true, ...rest } = options
  const token = getToken()

  if (auth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(rest.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  let res
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      headers,
      credentials: 'include',
      ...rest,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.')
  }

  // Auto-refresh on 401 si la petición requería auth y teníamos token previo
  if (res.status === 401 && auth && token) {
    try {
      const newToken = await refreshAccessToken()
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(`${API_URL}${endpoint}`, {
        headers,
        credentials: 'include',
        ...rest,
      })
    } catch {
      setToken(null)
      localStorage.removeItem('user')
      throw new Error('Sesión expirada')
    }
  }

  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message = data?.message || (res.status >= 500 ? 'Error interno del servidor' : 'Error en la solicitud')
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  get: (endpoint, opts) => request(endpoint, { method: 'GET', ...opts }),
  post: (endpoint, body, opts) =>
    request(endpoint, {
      method: 'POST',
      body: body != null ? JSON.stringify(body) : undefined,
      ...opts,
    }),
  put: (endpoint, body, opts) =>
    request(endpoint, {
      method: 'PUT',
      body: body != null ? JSON.stringify(body) : undefined,
      ...opts,
    }),
  delete: (endpoint, opts) => request(endpoint, { method: 'DELETE', ...opts }),
  upload: (endpoint, file) => {
    const form = new FormData()
    form.append('file', file)
    return request(endpoint, { method: 'POST', body: form })
  },
}
