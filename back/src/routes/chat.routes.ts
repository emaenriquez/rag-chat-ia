import { Router } from 'express'
import {
    createChat,
    listChats,
    getChat,
    deleteChat,
    sendMessage
} from '../controller/chatController.js'
import { authenticate } from '../middleware/autheticate.js'
import { validate } from '../middleware/validate.js'
import { chatLimiter } from '../middleware/rateLimit.js'
import { CreateChatSchema, SendMessageSchema } from '../models/chat.schema.js'

const router = Router()

router.use(authenticate)

router.post('/', validate(CreateChatSchema), createChat)
router.get('/', listChats)
router.get('/:id', getChat)
router.delete('/:id', deleteChat)
router.post('/:id/messages', chatLimiter, validate(SendMessageSchema), sendMessage)

export default router
