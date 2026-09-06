import { z } from 'zod'

export const CreateChatSchema = z.object({
  title: z.string().trim().max(100).optional(),
  documentIds: z.array(z.string()).optional()
})

export const UpdateChatSourcesSchema = z.object({
  documentIds: z.array(z.string())
})

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío')
})

export type CreateChatInput = z.infer<typeof CreateChatSchema>
export type UpdateChatSourcesInput = z.infer<typeof UpdateChatSourcesSchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>
