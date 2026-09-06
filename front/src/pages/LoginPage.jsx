import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, Navigate } from 'react-router-dom'
import { Spinner } from '../components/ui/Spinner'

export function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated) return <Navigate to="/chats" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white shadow-lg shadow-violet-600/30">
            R
          </div>
          <h1 className="text-xl font-semibold text-slate-100">RAG Chat IA</h1>
          <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {loading && <Spinner size="sm" />}
            Iniciar sesión
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
