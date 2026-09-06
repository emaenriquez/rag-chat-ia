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
export const getChat = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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
export const deleteChat = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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
export const sendMessage = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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

    // 3. Obtener el embedding del mensaje del usuario
    const { geminiService } = await import('../services/gemini.service.js')
    const { ragService } = await import('../services/rag.service.js')

    let assistantContent = ''
    let similarChunks = []

    try {
        const queryEmbedding = await geminiService.getEmbedding(content)

        // 4. Buscar fragmentos relevantes en la base de datos (Top 5)
        similarChunks = await ragService.searchSimilarChunks(queryEmbedding, 5)

        if (similarChunks.length === 0) {
            // Cortocircuito: sin contexto no tiene sentido llamar al modelo
            assistantContent = 'Lo siento, esa información no se encuentra en los archivos cargados.'
        } else {
            // Construir el contexto uniendo los fragmentos
            const contextText = similarChunks.map(c => c.content).join('\n\n---\n\n')

            // 5. Generar la respuesta usando Gemini
            assistantContent = await geminiService.generateChatResponse(content, contextText)
        }

    } catch (error: any) {
        console.error('[Chat] Error en el pipeline RAG:', error)
        assistantContent = 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta nuevamente.'
    }

    // 6. Guardar la respuesta del asistente
    const assistantMessage = await prisma.message.create({
        data: {
            chatId: id,
            role: 'assistant',
            content: assistantContent
        }
    })

    // 7. Guardar referencias (SourceReferences) si hubo contexto encontrado
    if (similarChunks.length > 0) {
        const sourcesData = similarChunks.map(chunk => ({
            messageId: assistantMessage.id,
            chunkId: chunk.id,
            similarityScore: chunk.similarity
        }))

        await prisma.sourceReference.createMany({
            data: sourcesData
        })
    }

    // 8. Actualizar el updatedAt del chat
    await prisma.chat.update({
        where: { id },
        data: { updatedAt: new Date() }
    })

    // 9. Obtener nombres de documentos fuente
    const sourceDocIds = [...new Set(similarChunks.map(c => c.document_id))]
    let sources: { id: string; name: string; similarity: number }[] = []
    if (sourceDocIds.length > 0) {
        const docs = await prisma.document.findMany({
            where: { id: { in: sourceDocIds } },
            select: { id: true, originalName: true }
        })
        const docMap = Object.fromEntries(docs.map(d => [d.id, d.originalName]))
        sources = similarChunks.map(c => ({
            id: c.document_id,
            name: docMap[c.document_id] || 'Desconocido',
            similarity: Number(c.similarity)
        }))
    }

    res.status(201).json({
        success: true,
        userMessage,
        assistantMessage,
        sources
    })
}
