import { Router } from 'express'
import {
    uploadDocument,
    listDocuments,
    getDocument,
    deleteDocument,
    reprocessDocument,
} from '../controller/documentController.js'
import { authenticate } from '../middleware/autheticate.js'
import { upload, handleUploadError } from '../middleware/uploadMiddleware.js'

const router = Router()

// Todos los endpoints requieren autenticación
router.use(authenticate)

/**
 * @openapi
 * /api/v1/documents:
 *   post:
 *     summary: Subir un documento (PDF, TXT, DOCX, MD)
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Documento subido e iniciado el procesamiento RAG
 *       400:
 *         description: Archivo inválido o no soportado
 */
router.post('/', upload.single('file'), handleUploadError, uploadDocument)

/**
 * @openapi
 * /api/v1/documents:
 *   get:
 *     summary: Listar todos los documentos del usuario
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de documentos recuperada exitosamente
 */
router.get('/', listDocuments)

/**
 * @openapi
 * /api/v1/documents/{id}:
 *   get:
 *     summary: Obtener información detallada de un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Documento encontrado
 *       44:
 *         description: Documento no encontrado
 */
router.get('/:id', getDocument)

/**
 * @openapi
 * /api/v1/documents/{id}:
 *   delete:
 *     summary: Eliminar un documento y sus vectores asociados
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Documento eliminado correctamente
 */
router.delete('/:id', deleteDocument)

/**
 * @openapi
 * /api/v1/documents/{id}/reprocess:
 *   post:
 *     summary: Re-procesar los embeddings de un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Proceso de re-chunking iniciado
 */
router.post('/:id/reprocess', reprocessDocument)

export default router