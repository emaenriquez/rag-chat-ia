const API_URL = import.meta.env.VITE_API_URL

let accessToken = null

export function setToken(token) {
  accessToken = token
}

export function getToken() {
  return accessToken
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Session expired')
  const data = await res.json()
  accessToken = data.accessToken
  return accessToken
}

async function request(endpoint, options = {}) {
  const { headers = {}, auth = true, ...rest } = options

  if (auth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  if (!(rest.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  let res = await fetch(`${API_URL}${endpoint}`, {
    headers,
    credentials: 'include',
    ...rest,
  })

  // Auto-refresh on 401
  if (res.status === 401 && auth) {
    try {
      await refreshAccessToken()
      headers['Authorization'] = `Bearer ${accessToken}`
      res = await fetch(`${API_URL}${endpoint}`, {
        headers,
        credentials: 'include',
        ...rest,
      })
    } catch {
      accessToken = null
      throw new Error('Session expired')
    }
  }

  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
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
  delete: (endpoint, opts) => request(endpoint, { method: 'DELETE', ...opts }),
  upload: (endpoint, file) => {
    const form = new FormData()
    form.append('file', file)
    return request(endpoint, { method: 'POST', body: form })
  },
}
