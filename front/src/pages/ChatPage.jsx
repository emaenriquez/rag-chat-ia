import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChats } from '../hooks/useChats'
import { useChat } from '../hooks/useChat'
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
  const { chats, loading: chatsLoading, createChat, deleteChat } = useChats()
  const { chat, messages, sources, loading: chatLoading, sending, sendMessage, updateSources } = useChat(chatId)
  const bottomRef = useRef(null)

  // Modal states
  const [showNewChat, setShowNewChat] = useState(false)
  const [showManageSources, setShowManageSources] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // chatId to delete

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewChat = () => setShowNewChat(true)

  const handleCreateChat = async ({ title, documentIds }) => {
    setShowNewChat(false)
    const newChat = await createChat(title || undefined, documentIds)
    navigate(`/chats/${newChat.id}`)
  }

  const handleSelectChat = (id) => navigate(`/chats/${id}`)

  const handleRequestDelete = (id) => setDeleteTarget(id)

  const handleConfirmDelete = async () => {
    const id = deleteTarget
    setDeleteTarget(null)
    await deleteChat(id)
    if (id === chatId) navigate('/chats')
  }

  const handleSend = async (content) => {
    if (!chatId) {
      // Si no hay chat activo, abrir el modal de nuevo chat
      setShowNewChat(true)
      return
    }
    await sendMessage(content)
  }

  // Fuentes configuradas en el chat activo
  const configuredDocs = chat?.chatDocuments?.map((cd) => cd.document).filter(Boolean) || []
  const configuredDocIds = configuredDocs.map((d) => d.id)

  // Deduplicar fuentes referenciadas en la última respuesta
  const uniqueSources = sources.length
    ? [...new Map(sources.map((s) => [s.id, s])).values()]
    : []

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar
        chats={chats}
        activeChatId={chatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleRequestDelete}
        onNewChat={handleNewChat}
        chatsLoading={chatsLoading}
      />

      {/* Main area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {chatId && (
          /* Header del chat con fuentes activas */
          <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xs px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-sm font-semibold text-slate-100 truncate">
                    {chat?.title || 'Nuevo Chat'}
                  </h2>
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400">
                    <span className="shrink-0 text-slate-500">Fuentes:</span>
                    {configuredDocs.length > 0 ? (
                      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                        {configuredDocs.map((doc) => (
                          <span
                            key={doc.id}
                            className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 font-medium text-violet-300 shrink-0"
                            title={doc.originalName}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <span className="max-w-[130px] truncate">{doc.originalName}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 font-medium text-slate-300">
                        <span>🌐</span> Todas tus fuentes
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón para gestionar fuentes */}
              <button
                onClick={() => setShowManageSources(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-violet-500/50 hover:bg-slate-700/90 hover:text-violet-200 transition-all shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>Editar fuentes</span>
              </button>
            </div>

            {/* Si la última respuesta citó fuentes, las mostramos */}
            {uniqueSources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Citas de la última respuesta:</span>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueSources.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!chatId ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-100">RAG Chat IA</h2>
            <p className="max-w-md text-center text-sm text-slate-400 leading-relaxed">
              Inicia una conversación eligiendo las fuentes documentales con las que deseas chatear, o consulta directamente todos tus archivos.
            </p>
            <button
              onClick={handleNewChat}
              className="mt-2 flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-600/25 transition-all hover:bg-violet-500 hover:shadow-violet-600/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Crear nuevo chat</span>
            </button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {chatLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <p className="text-sm text-slate-400">
                    {configuredDocs.length > 0
                      ? `Chat listo con ${configuredDocs.length} ${configuredDocs.length === 1 ? 'fuente seleccionada' : 'fuentes seleccionadas'}. Escribe tu primera pregunta.`
                      : 'No hay mensajes aún. Escribe tu primera pregunta.'}
                  </p>
                </div>
              ) : (
                <div className="mx-auto flex max-w-3xl flex-col gap-4">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      createdAt={msg.createdAt}
                    />
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md bg-slate-800/80 px-4 py-3 flex items-center gap-2 border border-slate-700/60">
                        <Spinner size="sm" />
                        <span className="text-xs text-slate-400">Buscando en tus fuentes y redactando...</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-800 bg-slate-900/50 px-4 py-4">
              <div className="mx-auto max-w-3xl">
                <MessageInput onSend={handleSend} disabled={sending} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal para Crear Nuevo Chat con Selección de Fuentes */}
      <NewChatModal
        open={showNewChat}
        onConfirm={handleCreateChat}
        onCancel={() => setShowNewChat(false)}
      />

      {/* Modal para Gestionar Fuentes del Chat Activo */}
      <ManageSourcesModal
        open={showManageSources}
        currentDocIds={configuredDocIds}
        onSave={updateSources}
        onCancel={() => setShowManageSources(false)}
      />

      {/* Modal de confirmación para eliminar chat */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar chat"
        message="¿Estás seguro de que quieres eliminar este chat? Se perderán todos los mensajes."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
