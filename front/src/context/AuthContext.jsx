import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { setToken, getToken, refreshAccessToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')

    const restoreSession = async () => {
      try {
        if (!getToken()) await refreshAccessToken()
        const data = await authService.me()
        setUser(data.user)
      } catch {
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    setToken(data.accessToken)
    setUser(data.user)
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
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
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
