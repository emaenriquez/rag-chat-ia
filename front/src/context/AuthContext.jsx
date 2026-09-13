import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { setToken, getToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  // Recuperar sesión al cargar o recargar la página
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    authService
      .me()
      .then((data) => {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      })
      .catch(() => {
        // Solo si el token es inválido/expirado y el refresh falló se limpia la sesión
        setUser(null)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    setToken(data.accessToken, data.refreshToken)
    setUser(data.user)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }, [])

  const register = useCallback(async (email, password) => {
    return await authService.register(email, password)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    }
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
