import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ChatList } from '../Chat/ChatList'

export function Sidebar({ chats, activeChatId, onSelectChat, onDeleteChat, onNewChat, chatsLoading }) {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
          R
        </div>
        <span className="text-sm font-semibold text-slate-200">RAG Chat IA</span>
      </div>

      {/* New chat */}
      <div className="px-3 py-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-violet-500/50 hover:bg-violet-600/10 hover:text-violet-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nuevo chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelect={onSelectChat}
          onDelete={onDeleteChat}
        />
      </div>

      {/* Bottom nav */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <NavLink
          to="/documents"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          Documentos
        </NavLink>

        <div className="flex items-center justify-between px-3 py-2">
          <span className="truncate text-xs text-slate-500">{user?.email}</span>
          <button
            onClick={logout}
            className="rounded p-1 text-slate-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
            title="Cerrar sesión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
