import { z } from 'zod'

export const CreateChatSchema = z.object({
  title: z.string().optional()
})

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío')
})

export type CreateChatInput = z.infer<typeof CreateChatSchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>
