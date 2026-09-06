export function ChatList({ chats, activeChatId, onSelect, onDelete }) {
  if (!chats.length) {
    return (
      <p className="px-3 py-6 text-center text-sm text-slate-500">
        No hay conversaciones aún
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {chats.map((chat) => {
        const docCount = chat._count?.chatDocuments ?? chat.chatDocuments?.length ?? 0
        return (
          <li
            key={chat.id}
            className={`group flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
              chat.id === activeChatId
                ? 'bg-violet-600/20 text-violet-300'
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
            onClick={() => onSelect(chat.id)}
          >
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-sm font-medium">{chat.title || 'Nuevo Chat'}</span>
              <span className="text-[11px] text-slate-500">
                {docCount > 0 ? `${docCount} ${docCount === 1 ? 'fuente' : 'fuentes'}` : 'Todas las fuentes'}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(chat.id)
              }}
              className="ml-2 hidden shrink-0 rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-400 group-hover:block"
              title="Eliminar chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
