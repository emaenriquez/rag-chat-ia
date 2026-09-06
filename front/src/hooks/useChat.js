import { useState, useEffect, useCallback } from 'react'
import { chatService } from '../services/chatService'

export function useChat(chatId) {
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!chatId) {
      setChat(null)
      setMessages([])
      setSources([])
      return
    }
    setLoading(true)
    chatService
      .getById(chatId)
      .then((data) => {
        setChat(data.chat)
        setMessages(data.chat.messages || [])
      })
      .catch(() => {
        setChat(null)
        setMessages([])
      })
      .finally(() => setLoading(false))
  }, [chatId])

  const sendMessage = useCallback(
    async (content) => {
      if (!chatId) return
      setSending(true)

      // Optimistic: show user message immediately
      const tempId = `temp-${Date.now()}`
      const optimisticMsg = {
        id: tempId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimisticMsg])

      try {
        const data = await chatService.sendMessage(chatId, content)
        // Replace optimistic msg with real one + add assistant response
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== tempId)
            .concat([data.userMessage, data.assistantMessage]),
        )
        if (data.sources?.length) {
          setSources(data.sources)
        }
        return data
      } catch (err) {
        // Remove optimistic msg on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        throw err
      } finally {
        setSending(false)
      }
    },
    [chatId],
  )

  const updateSources = useCallback(
    async (documentIds) => {
      if (!chatId) return
      const data = await chatService.updateSources(chatId, documentIds)
      setChat(data.chat)
      return data.chat
    },
    [chatId],
  )

  return { chat, messages, sources, loading, sending, sendMessage, updateSources }
}
