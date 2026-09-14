import { Router } from 'express'
import {
    createChat,
    listChats,
    getChat,
    deleteChat,
    sendMessage,
    updateChatSources
} from '../controller/chatController.js'
import { authenticate } from '../middleware/autheticate.js'
import { validate } from '../middleware/validate.js'
import { chatLimiter } from '../middleware/rateLimit.js'
import { CreateChatSchema, SendMessageSchema, UpdateChatSourcesSchema } from '../models/chat.schema.js'

const router = Router()

router.use(authenticate)

/**
 * @openapi
 * /api/v1/chats:
 *   post:
 *     summary: Crear una nueva conversación de chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Análisis de contrato
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Chat creado
 */
router.post('/', validate(CreateChatSchema), createChat)

/**
 * @openapi
 * /api/v1/chats:
 *   get:
 *     summary: Listar todas las conversaciones del usuario
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de chats
 */
router.get('/', listChats)

/**
 * @openapi
 * /api/v1/chats/{id}:
 *   get:
 *     summary: Obtener el historial completo y fuentes de una conversación
 *     tags: [Chats]
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
 *         description: Chat encontrado
 */
router.get('/:id', getChat)

/**
 * @openapi
 * /api/v1/chats/{id}/sources:
 *   put:
 *     summary: Actualizar los documentos vinculados a una conversación
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentIds]
 *             properties:
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Fuentes actualizadas
 */
router.put('/:id/sources', validate(UpdateChatSourcesSchema), updateChatSources)

/**
 * @openapi
 * /api/v1/chats/{id}:
 *   delete:
 *     summary: Eliminar una conversación y sus mensajes
 *     tags: [Chats]
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
 *         description: Chat eliminado
 */
router.delete('/:id', deleteChat)

/**
 * @openapi
 * /api/v1/chats/{id}/messages:
 *   post:
 *     summary: Enviar un mensaje al asistente IA dentro de un chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: ¿Cuáles son las cláusulas de confidencialidad en los documentos?
 *     responses:
 *       200:
 *         description: Respuesta generada por la IA mediante RAG
 */
router.post('/:id/messages', chatLimiter, validate(SendMessageSchema), sendMessage)

export default router
