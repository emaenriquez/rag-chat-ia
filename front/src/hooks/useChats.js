import { useState, useEffect, useCallback } from 'react'
import { chatService } from '../services/chatService'

export function useChats() {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchChats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await chatService.getAll()
      setChats(data.chats)
    } catch {
      setChats([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const createChat = useCallback(async (title, documentIds) => {
    const data = await chatService.create(title, documentIds)
    setChats((prev) => [data.chat, ...prev])
    return data.chat
  }, [])

  const deleteChat = useCallback(async (id) => {
    await chatService.delete(id)
    setChats((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { chats, loading, createChat, deleteChat, refresh: fetchChats }
}
