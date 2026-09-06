import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChats } from '../hooks/useChats'
import { useChat } from '../hooks/useChat'
import { Sidebar } from '../components/Layout/Sidebar'
import { MessageBubble } from '../components/Chat/MessageBubble'
import { MessageInput } from '../components/Chat/MessageInput'
import { Spinner } from '../components/ui/Spinner'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { InputModal } from '../components/ui/InputModal'

export function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { chats, loading: chatsLoading, createChat, deleteChat } = useChats()
  const { messages, sources, loading: chatLoading, sending, sendMessage } = useChat(chatId)
  const bottomRef = useRef(null)

  // Modal states
  const [showNewChat, setShowNewChat] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // chatId to delete

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewChat = () => setShowNewChat(true)

  const handleCreateChat = async (title) => {
    setShowNewChat(false)
    const chat = await createChat(title || undefined)
    navigate(`/chats/${chat.id}`)
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
      // Create chat with the first message as title, then navigate
      const chat = await createChat(content.slice(0, 50))
      navigate(`/chats/${chat.id}`)
      return
    }
    await sendMessage(content)
  }

  // Deduplicate source document names
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
      <main className="flex flex-1 flex-col">
        {/* Sources bar */}
        {chatId && uniqueSources.length > 0 && (
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/50 px-4 py-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-slate-500">Fuentes:</span>
            {uniqueSources.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-violet-600/15 px-2.5 py-0.5 text-xs font-medium text-violet-300"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}

        {!chatId ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-200">RAG Chat IA</h2>
            <p className="max-w-sm text-center text-sm text-slate-500">
              Selecciona un chat o crea uno nuevo para empezar a consultar tus documentos con IA.
            </p>
            <button
              onClick={handleNewChat}
              className="mt-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Nuevo chat
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
                  <p className="text-sm text-slate-500">No hay mensajes aún. Escribe tu primera pregunta.</p>
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
                      <div className="rounded-2xl rounded-bl-md bg-slate-700/80 px-4 py-3">
                        <Spinner size="sm" />
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

      {/* Modals */}
      <InputModal
        open={showNewChat}
        title="Nuevo chat"
        placeholder="Nombre del chat (opcional)"
        onConfirm={handleCreateChat}
        onCancel={() => setShowNewChat(false)}
      />

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
