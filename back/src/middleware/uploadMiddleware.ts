import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from '../models/document.schema.js'
import { env } from '../config/env.js'
import { Request, Response, NextFunction } from 'express'
import { unknown } from 'zod'

// Configuración de dónde y cómo guardar los archivos
const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        cb(null, env.uploadDir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLocaleLowerCase()
        const filename = `${uuid()}${ext}`
        cb(null, filename)
    }
})

// Filtro de tipo de archivo
const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const isAllowedMime = (ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)
    const ext = path.extname(file.originalname).toLowerCase()
    const isAllowedExt = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
    if (isAllowedMime && isAllowedExt) {
        cb(null, true)
    } else {
        cb(new Error(`Tipo de archivo no permitido. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`))
    }
}

// Instancia de Multer

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.maxFileSizeMb * 1024 * 1024,
        files: 1
    }
})

export const hadleUploadError = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
                success: false,
                message: `Archivo muy grande. Máximo ${env.maxFileSizeMb}MB`,
            })
            return
        }
        res.status(400).json({ success: false, message: err.message })
        return
    }
    if (err instanceof Error) {
        res.status(400).json({
            success: false,
            message: err.message || 'Error al subir el archivo',
        })
        return
    }
    next(err)
}

