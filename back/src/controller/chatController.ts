import { Request, Response } from 'express'
import { prisma } from '../config/database.js'

// POST /api/v1/chats
export const createChat = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub
    const { title, documentIds } = req.body

    // Si se enviaron documentIds, validar que pertenezcan al usuario y estén procesados
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
        const validDocs = await prisma.document.findMany({
            where: {
                id: { in: documentIds },
                userId,
                status: 'processed'
            },
            select: { id: true }
        })

        if (validDocs.length !== documentIds.length) {
            res.status(400).json({
                success: false,
                message: 'Uno o más documentos seleccionados no existen, no te pertenecen o aún no están procesados'
            })
            return
        }
    }

    const chat = await prisma.chat.create({
        data: {
            userId,
            title: title || 'Nuevo Chat',
            ...(documentIds && Array.isArray(documentIds) && documentIds.length > 0 ? {
                chatDocuments: {
                    create: documentIds.map((docId: string) => ({
                        documentId: docId
                    }))
                }
            } : {})
        },
        include: {
            chatDocuments: {
                include: {
                    document: {
                        select: {
                            id: true,
                            originalName: true,
                            status: true,
                            mimeType: true
                        }
                    }
                }
            }
        }
    })

    res.status(201).json({ success: true, chat })
}

// GET /api/v1/chats
export const listChats = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub

    const chats = await prisma.chat.findMany({
        where: { userId },
        include: {
            chatDocuments: {
                include: {
                    document: {
                        select: {
                            id: true,
                            originalName: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    messages: true,
                    chatDocuments: true
                }
            }
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
            chatDocuments: {
                include: {
                    document: {
                        select: {
                            id: true,
                            originalName: true,
                            status: true,
                            mimeType: true
                        }
                    }
                }
            },
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

// PUT /api/v1/chats/:id/sources
// Actualizar las fuentes (documentos) asignadas a un chat
export const updateChatSources = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params
    const userId = req.user!.sub
    const { documentIds } = req.body

    if (!Array.isArray(documentIds)) {
        res.status(400).json({ success: false, message: 'documentIds debe ser un array de identificadores' })
        return
    }

    // 1. Verificar que el chat existe y pertenece al usuario
    const chat = await prisma.chat.findFirst({
        where: { id, userId }
    })

    if (!chat) {
        res.status(404).json({ success: false, message: 'Chat no encontrado' })
        return
    }

    // 2. Si hay documentos seleccionados, validar que pertenezcan al usuario y estén procesados
    if (documentIds.length > 0) {
        const validDocs = await prisma.document.findMany({
            where: {
                id: { in: documentIds },
                userId,
                status: 'processed'
            },
            select: { id: true }
        })

        if (validDocs.length !== documentIds.length) {
            res.status(400).json({
                success: false,
                message: 'Uno o más documentos no son válidos o aún no terminaron de procesarse'
            })
            return
        }
    }

    // 3. Reemplazar asociaciones existentes en una transacción
    await prisma.$transaction([
        prisma.chatDocument.deleteMany({
            where: { chatId: id }
        }),
        ...(documentIds.length > 0 ? [
            prisma.chatDocument.createMany({
                data: documentIds.map((docId: string) => ({
                    chatId: id,
                    documentId: docId
                }))
            })
        ] : [])
    ])

    const updatedChat = await prisma.chat.findUnique({
        where: { id },
        include: {
            chatDocuments: {
                include: {
                    document: {
                        select: {
                            id: true,
                            originalName: true,
                            status: true,
                            mimeType: true
                        }
                    }
                }
            }
        }
    })

    res.json({ success: true, chat: updatedChat })
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

    // 1. Verificar que el chat existe y pertenece al usuario, obteniendo sus fuentes vinculadas
    const chat = await prisma.chat.findFirst({
        where: { id, userId },
        include: {
            chatDocuments: true
        }
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

    const selectedDocIds = chat.chatDocuments.map(cd => cd.documentId)

    try {
        const queryEmbedding = await geminiService.getEmbedding(content)

        // 4. Buscar fragmentos relevantes filtrando por los documentos seleccionados (si los hay) y el usuario
        similarChunks = await ragService.searchSimilarChunks(
            queryEmbedding,
            5,
            selectedDocIds.length > 0 ? selectedDocIds : undefined,
            userId
        )

        if (similarChunks.length === 0) {
            // Cortocircuito: sin contexto no tiene sentido llamar al modelo
            assistantContent = selectedDocIds.length > 0
                ? 'Lo siento, esa información no se encuentra en los archivos seleccionados para este chat.'
                : 'Lo siento, esa información no se encuentra en los archivos cargados.'
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
