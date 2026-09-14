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
import { ManageSourcesModal } from '../components/Chat/ManageSourcesModal'
import { Spinner } from '../components/ui/Spinner'
import { ConfirmModal } from '../components/ui/ConfirmModal'

export function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { chats, loading: chatsLoading, createChat, deleteChat } = useChats()
  const { chat, messages, sources, loading: chatLoading, sending, sendMessage, updateSources } = useChat(chatId)
  const bottomRef = useRef(null)

  // Estados de modales y mobile
  const [showNewChat, setShowNewChat] = useState(false)
  const [showManageSources, setShowManageSources] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Texto del prompt central cuando no hay mensajes
  const [heroPrompt, setHeroPrompt] = useState('')

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
    if (!content.trim()) return

    if (!chatId) {
      // Si no hay chat activo, crear uno automáticamente y enviar el mensaje
      const newChat = await createChat(content.slice(0, 30) || 'Nuevo Chat')
      navigate(`/chats/${newChat.id}`)
      // Esperar brevemente a que el hook monte el nuevo chat y enviar
      setTimeout(async () => {
        try {
          await sendMessage(content)
        } catch {}
      }, 300)
      return
    }

    await sendMessage(content)
  }

  // Fuentes configuradas en el chat activo
  const configuredDocs = chat?.chatDocuments?.map((cd) => cd.document).filter(Boolean) || []
  const configuredDocIds = configuredDocs.map((d) => d.id)

  // // Sugerencias de prompt (estilo pills de Image 1 & 2)
  // const SUGGESTIONS = [
  //   { label: 'Resumir documento', icon: '📄', prompt: 'Genera un resumen ejecutivo destacando los puntos clave de los documentos.' },
  //   { label: 'Búsqueda profunda', icon: '🔍', prompt: '¿Cuáles son los principales hallazgos, fechas y datos relevantes en los archivos?' },
  //   { label: 'Extraer datos clave', icon: '📊', prompt: 'Extrae una lista de datos numéricos, métricas y conclusiones importantes.' },
  //   { label: 'Redactar reporte', icon: '✍️', prompt: 'Redacta un informe estructurado basado en la información disponible.' },
  // ]

  const handleHeroSubmit = async (e) => {
    e?.preventDefault()
    const promptToSend = heroPrompt.trim()
    if (!promptToSend) return
    setHeroPrompt('')
    await handleSend(promptToSend)
  }

  const handleApplySuggestion = (suggestionPrompt) => {
    setHeroPrompt(suggestionPrompt)
  }

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

                {/* <button
                  onClick={() => setShowManageSources(true)}
                  className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  Editar fuentes
                </button> */}
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
        {!chatId || (!chatLoading && messages.length === 0) ? (
          /* ESTADO VACÍO / HERO (COPIA EXACTA DEL MOCKUP IMÁGENES 1 Y 2) */
          <div className="flex-1 overflow-y-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center animate-fade-in">
              {/* Saludo Editorial en Serif (Good Morning, Mithila) */}
              <h1 className="text-3xl md:text-5xl font-serif text-zinc-900 dark:text-zinc-100 tracking-tight text-center mb-8 font-normal">
                {getGreeting()}
              </h1>

              {/* Caja de Prompt Flotante Central (Double-Bezel Architecture) */}
              <div className="w-full">
                <form
                  onSubmit={handleHeroSubmit}
                  className="p-1 rounded-[1.75rem] bg-zinc-200/50 dark:bg-zinc-800/40 ring-1 ring-zinc-300/40 dark:ring-white/10 transition-all focus-within:ring-zinc-400 dark:focus-within:ring-zinc-600"
                >
                  <div className="rounded-[1.5rem] bg-white dark:bg-[#1f1f23] border border-zinc-200/70 dark:border-white/5 p-4 shadow-xl prompt-card-shadow">
                    <textarea
                      value={heroPrompt}
                      onChange={(e) => setHeroPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleHeroSubmit(e)
                        }
                      }}
                      placeholder="¿En qué puedo ayudarte hoy?"
                      rows={2}
                      className="w-full resize-none bg-transparent px-1 py-1 text-sm md:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none leading-relaxed"
                    />

                    {/* Barra de controles interior */}
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                      {/* Botón + para agregar fuentes o crear chat */}
                      <button
                        type="button"
                        onClick={handleNewChat}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Seleccionar fuentes para la consulta"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>

                      {/* Selector de modo, micrófono y botón circular de enviar */}
                      <div className="flex items-center gap-2">


                        {/* Botón Enviar Circular */}
                        <button
                          type="submit"
                          disabled={!heroPrompt.trim()}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
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
                  onOpenSources={() => setShowManageSources(true)}
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

      <ManageSourcesModal
        open={showManageSources}
        currentDocIds={configuredDocIds}
        onSave={updateSources}
        onCancel={() => setShowManageSources(false)}
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
