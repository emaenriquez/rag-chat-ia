import { Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../config/database.js'

// ─────────────────────────────────────────────
// POST /api/v1/documents
// Subir un nuevo documento
// ─────────────────────────────────────────────
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    // Multer ya procesó el archivo y lo guardó en req.file
    if (!req.file) {
        res.status(400).json({ success: false, message: 'No se recibió ningún archivo' })
        return
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file
    const userId = req.user!.sub

    // Verificar si el usuario ya subió un archivo con el mismo nombre
    const existingDocument = await prisma.document.findFirst({
        where: {
            userId,
            originalName: originalname,
        },
    })

    if (existingDocument) {
        // Eliminar el archivo físico recién subido por multer para no acumular basura
        try {
            await fs.unlink(filePath)
        } catch (error) {
            console.error(`[ERROR] No se pudo eliminar el archivo duplicado: ${filePath}`, error)
        }

        res.status(409).json({
            success: false,
            message: `El archivo "${originalname}" ya fue subido anteriormente.`,
        })
        return
    }

    const document = await prisma.document.create({
        data: {
            userId,
            filename,           // nombre generado (uuid.ext)
            originalName: originalname, // nombre original del usuario
            mimeType: mimetype,
            fileSize: BigInt(size),
            storagePath: filePath,
            status: 'uploaded',
        },
        select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    res.status(201).json({
        success: true,
        message: 'Documento subido correctamente',
        document: {
            ...document,
            fileSize: document.fileSize?.toString(), // BigInt → string para JSON
        },
    })
}

// ─────────────────────────────────────────────
// GET /api/v1/documents
// Listar documentos del usuario autenticado
// ─────────────────────────────────────────────
export const listDocuments = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub

    const documents = await prisma.document.findMany({
        where: { userId },
        select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    res.json({
        success: true,
        documents: documents.map((doc) => ({
            ...doc,
            fileSize: doc.fileSize?.toString(),
        })),
    })
}

// ─────────────────────────────────────────────
// GET /api/v1/documents/:id
// Obtener detalle de un documento
// ─────────────────────────────────────────────
export const getDocument = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const userId = req.user!.sub

    const document = await prisma.document.findFirst({
        where: { id, userId }, // userId garantiza que solo ves tus propios documentos
        select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            storagePath: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            chunks: {
                select: { id: true, chunkIndex: true, tokens: true },
                orderBy: { chunkIndex: 'asc' },
            },
        },
    })

    if (!document) {
        res.status(404).json({ success: false, message: 'Documento no encontrado' })
        return
    }

    res.json({
        success: true,
        document: {
            ...document,
            fileSize: document.fileSize?.toString(),
            storagePath: undefined, // Nunca exponer la ruta física al cliente
        },
    })
}

// ─────────────────────────────────────────────
// DELETE /api/v1/documents/:id
// Eliminar documento + archivo físico del disco
// ─────────────────────────────────────────────
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const userId = req.user!.sub

    // Buscar el documento (verificar que pertenece al usuario)
    const document = await prisma.document.findFirst({
        where: { id, userId },
        select: { id: true, storagePath: true },
    })

    if (!document) {
        res.status(404).json({ success: false, message: 'Documento no encontrado' })
        return
    }

    // Eliminar de la BD (cascade elimina chunks y embeddings)
    await prisma.document.delete({ where: { id } })

    // Eliminar el archivo físico del disco
    try {
        await fs.unlink(document.storagePath)
    } catch {
        // Si el archivo no existe, no es un error crítico
        console.warn(`[WARN] No se pudo eliminar archivo: ${document.storagePath}`)
    }

    res.json({ success: true, message: 'Documento eliminado correctamente' })
}

// ─────────────────────────────────────────────
// POST /api/v1/documents/:id/reprocess
// Marcar documento para reprocesar pipeline RAG
// ─────────────────────────────────────────────
export const reprocessDocument = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const userId = req.user!.sub

    const document = await prisma.document.findFirst({
        where: { id, userId },
        select: { id: true, status: true },
    })

    if (!document) {
        res.status(404).json({ success: false, message: 'Documento no encontrado' })
        return
    }

    // Solo se puede reprocesar si está en estado 'processed' o 'failed'
    if (document.status === 'processing') {
        res.status(409).json({
            success: false,
            message: 'El documento ya está siendo procesado',
        })
        return
    }

    // Actualizar estado a 'uploaded' para que el pipeline lo tome
    // (en la Fase RAG se implementará el pipeline real)
    await prisma.document.update({
        where: { id },
        data: { status: 'uploaded' },
    })

    res.json({
        success: true,
        message: 'Documento marcado para reprocesar. El pipeline RAG lo tomará pronto.',
    })
}