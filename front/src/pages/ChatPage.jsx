import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChats } from '../hooks/useChats'
import { useChat } from '../hooks/useChat'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sidebar } from '../components/Layout/Sidebar'
import { MessageBubble } from '../components/Chat/MessageBubble'
import { MessageInput } from '../components/Chat/MessageInput'
import { NewChatModal } from '../components/Chat/NewChatModal'
import { Spinner } from '../components/ui/Spinner'
import { ConfirmModal } from '../components/ui/ConfirmModal'

export function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { chats, loading: chatsLoading, createChat, deleteChat } = useChats()
  const { chat, messages, sources, loading: chatLoading, sending, sendMessage } = useChat(chatId)
  const bottomRef = useRef(null)

  // Estados de modales y mobile
  const [showNewChat, setShowNewChat] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Saludo dinámico según la hora
  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = user?.email ? user.email.split('@')[0] : ''
    const formattedName = name ? name.charAt(0).toUpperCase() + name.slice(1) : ''
    
    if (hour < 12) return formattedName ? `Buenos días, ${formattedName}` : 'Buenos días'
    if (hour < 20) return formattedName ? `Buenas tardes, ${formattedName}` : 'Buenas tardes'
    return formattedName ? `Buenas noches, ${formattedName}` : 'Buenas noches'
  }

  // Auto-scroll en nuevos mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleNewChat = () => setShowNewChat(true)

  const handleCreateChat = async ({ title, documentIds }) => {
    if (!documentIds?.length) return
    setShowNewChat(false)
    const newChat = await createChat(title || undefined, documentIds)
    navigate(`/chats/${newChat.id}`)
  }

  const handleSelectChat = (id) => {
    navigate(`/chats/${id}`)
    setMobileSidebarOpen(false)
  }

  const handleRequestDelete = (id) => setDeleteTarget(id)

  const handleConfirmDelete = async () => {
    const id = deleteTarget
    setDeleteTarget(null)
    await deleteChat(id)
    if (id === chatId) navigate('/chats')
  }

  const handleSend = async (content) => {
    if (!chatId || !content.trim()) return
    await sendMessage(content)
  }

  // Fuentes configuradas en el chat activo
  const configuredDocs = chat?.chatDocuments?.map((cd) => cd.document).filter(Boolean) || []

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbfbfa] dark:bg-[#131315] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Barra lateral */}
      <Sidebar
        chats={chats}
        activeChatId={chatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleRequestDelete}
        onNewChat={handleNewChat}
        chatsLoading={chatsLoading}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Área principal */}
      <main className="flex flex-1 flex-col h-full min-w-0 overflow-hidden relative">
        {/* Barra superior de navegación / estado */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/70 dark:border-zinc-800/60 px-4 md:px-6 bg-white/70 dark:bg-[#161619]/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Botón menú mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {chatId ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex flex-col min-w-0">
                  <h2 className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {chat?.title || 'Nuevo Chat'}
                  </h2>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span>Fuentes:</span>
                    {configuredDocs.length > 0 ? (
                      <span className="truncate max-w-[200px] text-zinc-600 dark:text-zinc-300 font-mono">
                        {configuredDocs.map((d) => d.originalName).join(', ')}
                      </span>
                    ) : (
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono">Todas</span>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                  RAG Workspace / Inicio
                </span>
              </div>
            )}
          </div>

          {/* Lado derecho superior (estilo Image 1 & 2: Free plan • Upgrade) */}
          <div className="flex items-center gap-3">

            {/* Quick theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        {!chatId ? (
          /* Estado inicial: las fuentes se eligen antes de crear el chat. */
          <div className="flex-1 overflow-y-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center">
            <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center animate-fade-in">
              <h1 className="text-3xl md:text-5xl font-serif text-zinc-900 dark:text-zinc-100 tracking-tight font-normal">
                {getGreeting()}
              </h1>

              <div className="mt-8 w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-[#18181b]/80 p-6 md:p-8 shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H17a3 3 0 0 1 3 3v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-12Z" />
                    <path d="M8 7h8M8 11h8M8 15h5" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Inicia un nuevo chat
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Selecciona o importa fuentes para comenzar a chatear.
                </p>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Iniciar nuevo chat
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CONVERSACIÓN ACTIVA */
          <>
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
              {chatLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="mx-auto max-w-3xl flex flex-col space-y-1">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      createdAt={msg.createdAt}
                      sources={msg.role === 'assistant' ? sources : []}
                    />
                  ))}

                  {/* Indicador de pensando / generando */}
                  {sending && (
                    <div className="flex items-center gap-2.5 py-3 text-xs text-zinc-400 dark:text-zinc-500 animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                      <span>Consultando y redactando...</span>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input acoplado al pie */}
            <div className="p-4 bg-gradient-to-t from-[#fbfbfa] dark:from-[#131315] via-[#fbfbfa]/90 dark:via-[#131315]/90 to-transparent">
              <div className="mx-auto max-w-3xl">
                <MessageInput
                  onSend={handleSend}
                  disabled={sending}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modales */}
      <NewChatModal
        open={showNewChat}
        onConfirm={handleCreateChat}
        onCancel={() => setShowNewChat(false)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar chat"
        message="¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
