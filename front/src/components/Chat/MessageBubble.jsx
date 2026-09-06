export function MessageBubble({ role, content, createdAt }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-600 text-white rounded-br-md'
            : 'bg-slate-700/80 text-slate-200 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {createdAt && (
          <p
            className={`mt-1.5 text-[10px] ${
              isUser ? 'text-violet-200/60' : 'text-slate-500'
            }`}
          >
            {new Date(createdAt).toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  )
}
