import { Router } from "express";
import { register, login, refresh, me, logout } from '../controller/authController'
import { authenticate } from '../middleware/autheticate.js'
import { validate } from '../middleware/validate.js'
import { LoginLimiter, registerLimiter, refreshLimiter } from '../middleware/rateLimit.js'
import { registerSchema, loginSchema } from '../models/auth.schema.js'

const router = Router()

router.post('/register', validate(registerSchema), registerLimiter, register)
router.post('/login', validate(loginSchema), LoginLimiter, login)
router.post('/refresh', refreshLimiter, refresh)
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)

export default router