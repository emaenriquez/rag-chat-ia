import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Spinner } from '../components/ui/Spinner'

export function RegisterPage() {
  const { isAuthenticated, loading: authLoading, register } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fbfbfa] dark:bg-[#131315]">
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
      await register(email, password)
      navigate('/login')
    } catch (err) {
      if (err.errors) {
        const msgs = Object.values(err.errors).flat().join('. ')
        setError(msgs)
      } else {
        setError(err.message || 'Error al registrar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfbfa] dark:bg-[#131315] text-zinc-900 dark:text-zinc-100 px-4 transition-colors duration-200 relative">
      {/* Botón flotante tema */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Cambiar tema"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-sm">
        <div className="p-1 rounded-[1.75rem] bg-zinc-200/50 dark:bg-zinc-800/40 ring-1 ring-zinc-300/40 dark:ring-white/10">
          <div className="rounded-[1.5rem] bg-white dark:bg-[#18181b] border border-zinc-200/70 dark:border-white/5 p-7 shadow-xl prompt-card-shadow">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-base font-semibold shadow-xs">
                ✦
              </div>
              <h1 className="text-xl font-serif tracking-tight text-zinc-900 dark:text-zinc-100 font-normal">
                Crear cuenta
              </h1>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Comienza a consultar tus documentos con IA
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 py-2.5 text-xs font-semibold shadow-xs transition-all hover:opacity-90 active:scale-98 disabled:opacity-40"
              >
                {loading && <Spinner size="sm" />}
                <span>Crear cuenta</span>
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
