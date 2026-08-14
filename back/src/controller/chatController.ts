import { Request, Response } from 'express'
import { prisma } from '../config/database.js'

// POST /api/v1/chats
export const createChat = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub
    const { title } = req.body

    const chat = await prisma.chat.create({
        data: {
            userId,
            title: title || 'Nuevo Chat'
        },
        select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true
        }
    })

    res.status(201).json({ success: true, chat })
}

// GET /api/v1/chats
export const listChats = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub

    const chats = await prisma.chat.findMany({
        where: { userId },
        select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
    })

    res.json({ success: true, chats })
}

// GET /api/v1/chats/:id
export const getChat = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const userId = req.user!.sub

    const chat = await prisma.chat.findFirst({
        where: { id, userId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    role: true,
                    content: true,
                    createdAt: true
                }
            }
        }
    })

    if (!chat) {
        res.status(404).json({ success: false, message: 'Chat no encontrado' })
        return
    }

    res.json({ success: true, chat })
}

// DELETE /api/v1/chats/:id
export const deleteChat = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const userId = req.user!.sub

    const chat = await prisma.chat.findFirst({
        where: { id, userId }
    })

    if (!chat) {
        res.status(404).json({ success: false, message: 'Chat no encontrado' })
        return
    }

    await prisma.chat.delete({
        where: { id }
    })

    res.json({ success: true, message: 'Chat eliminado' })
}

// POST /api/v1/chats/:id/messages
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const userId = req.user!.sub
    const { content } = req.body

    // 1. Verificar que el chat existe y pertenece al usuario
    const chat = await prisma.chat.findFirst({
        where: { id, userId }
    })

    if (!chat) {
        res.status(404).json({ success: false, message: 'Chat no encontrado' })
        return
    }

    // 2. Guardar el mensaje del usuario
    const userMessage = await prisma.message.create({
        data: {
            chatId: id,
            role: 'user',
            content
        }
    })

    // 3. Generar respuesta "mock" (simulada) del asistente
    // En la Fase 4, aquí se llamará al pipeline RAG real.
    const assistantContent = `[Mock] Esta es una respuesta simulada para tu mensaje: "${content}". En la fase 4 implementaremos el pipeline RAG real aquí.`

    // 4. Guardar la respuesta del asistente
    const assistantMessage = await prisma.message.create({
        data: {
            chatId: id,
            role: 'assistant',
            content: assistantContent
        }
    })

    // 5. Actualizar el updatedAt del chat
    await prisma.chat.update({
        where: { id },
        data: { updatedAt: new Date() }
    })

    res.status(201).json({
        success: true,
        userMessage,
        assistantMessage
    })
}
