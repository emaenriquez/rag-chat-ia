export function ChatList({ chats, activeChatId, onSelect, onDelete, filterText = '' }) {
  const filteredChats = filterText.trim()
    ? chats.filter((c) =>
        (c.title || 'Nuevo Chat').toLowerCase().includes(filterText.toLowerCase().trim())
      )
    : chats

  if (!chats.length) {
    return (
      <div className="py-8 px-3 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Sin conversaciones recientes</p>
      </div>
    )
  }

  if (!filteredChats.length) {
    return (
      <div className="py-6 px-3 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No hay resultados para "{filterText}"</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {filteredChats.map((chat) => {
        const docCount = chat._count?.chatDocuments ?? chat.chatDocuments?.length ?? 0
        const isActive = chat.id === activeChatId

        return (
          <li
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`group relative flex items-center justify-between rounded-xl px-2.5 py-2 cursor-pointer transition-all duration-150 ${
              isActive
                ? 'bg-zinc-200/70 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex flex-col min-w-0 flex-1 pr-2">
              <span className="truncate text-xs tracking-tight">
                {chat.title || 'Conversación sin título'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                  {docCount > 0 ? `${docCount} doc${docCount > 1 ? 's' : ''}` : 'Todos los docs'}
                </span>
              </div>
            </div>

            {/* Acciones en hover */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(chat.id)
              }}
              className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 transition-all"
              title="Eliminar chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
