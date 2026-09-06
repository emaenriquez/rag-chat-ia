import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { ChatList } from '../Chat/ChatList'

export function Sidebar({
  chats = [],
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  chatsLoading,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [search, setSearch] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Iniciales del usuario
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'
  const userName = user?.email ? user.email.split('@')[0] : 'Usuario'

  return (
    <>
      {/* Backdrop para mobile */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#161618] border-r border-zinc-200/80 dark:border-zinc-800/70 transition-all duration-300 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64 lg:w-72'}`}
      >
        {/* Cabecera: Logo y botón colapsar */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-100 dark:border-zinc-800/40">
          <Link to="/chats" className="flex items-center gap-2.5 min-w-0 group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs transition-transform group-hover:scale-105">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
                  RAG Chat IA
                </span>
              </div>
            )}
          </Link>

          {/* Botón cerrar en mobile */}
          <button
            onClick={onCloseMobile}
            className="flex md:hidden h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Botón Principal: + Nuevo chat */}
        <div className="px-3 pt-3.5 pb-2">
          <button
            onClick={onNewChat}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 px-3.5 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-2xs transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] ${
              isCollapsed ? 'px-0' : ''
            }`}
            title="Crear nuevo chat"
          >
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {!isCollapsed && <span>Nuevo chat</span>}
          </button>
        </div>

        {/* Navegación y Búsqueda rápida */}
        {!isCollapsed && (
          <div className="px-3 py-1.5 space-y-1">
            {/* Buscador de chats */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar chats..."
                className="w-full rounded-xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-transparent dark:border-zinc-800/30 px-3 py-1.5 pl-8 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-300 dark:focus:border-zinc-700 transition-all"
              />
              <svg
                className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Accesos rápidos */}
            {/* <div className="pt-1 flex flex-col gap-0.5">
              <NavLink
                to="/chats"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive && !activeChatId
                      ? 'bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`
                }
              >
                <svg className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Inicio / Chats</span>
              </NavLink>

            </div> */}
          </div>
        )}

        {/* Sección Recientes */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                Recientes
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {chats.length}
              </span>
            </div>
          )}

          {!isCollapsed ? (
            <ChatList
              chats={chats}
              activeChatId={activeChatId}
              onSelect={onSelectChat}
              onDelete={onDeleteChat}
              filterText={search}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              {chats.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  title={c.title || 'Chat'}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs transition-colors ${
                    c.id === activeChatId
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  💬
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tarjeta de estado: Base Documental (Estilo Lumen AI Trial del mockup) */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px]">
                  ✓
                </div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  RAG IA Workspace
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Consulta y analiza múltiples fuentes documentales al instante.
              </p>
              <Link
                to="/documents"
                className="inline-flex items-center text-[11px] font-medium text-zinc-900 dark:text-zinc-200 hover:underline pt-0.5"
              >
                Gestionar fuentes →
              </Link>
            </div>
          </div>
        )}

        {/* Perfil de usuario y controles inferiores */}
        <div className="border-t border-zinc-100 dark:border-zinc-800/60 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {userInitial}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {userName}
                  </span>
                  <span className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                    {user?.email}
                  </span>
                </div>
              )}
            </div>

            {/* Controles: Theme Toggle y Logout */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={toggleTheme}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              >
                {theme === 'dark' ? (
                  // Sol para cambiar a claro
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  // Luna para cambiar a oscuro
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              <button
                onClick={logout}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                title="Cerrar sesión"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
