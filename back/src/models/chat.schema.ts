import { z } from 'zod'

export const CreateChatSchema = z.object({
  title: z.string().trim().max(100).optional(),
  documentIds: z.array(z.string().uuid()).max(20).optional()
})

export const UpdateChatSourcesSchema = z.object({
  documentIds: z.array(z.string().uuid()).max(20)
})

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(4000, 'El mensaje no puede superar los 4000 caracteres')
})

export type CreateChatInput = z.infer<typeof CreateChatSchema>
export type UpdateChatSourcesInput = z.infer<typeof UpdateChatSourcesSchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>
