import { Router } from 'express'
import authRoutes from './auth.routes.js'
import documentRoutes from './document.routes.js'
import chatRoutes from './chat.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/documents', documentRoutes)
router.use('/chats', chatRoutes)

export default router
