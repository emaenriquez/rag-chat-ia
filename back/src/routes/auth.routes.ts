import { Router } from "express";
import { register, login, refresh, me, logout } from '../controller/authController.js'
import { authenticate } from '../middleware/autheticate.js'
import { validate } from '../middleware/validate.js'
import { LoginLimiter, registerLimiter, refreshLimiter } from '../middleware/rateLimit.js'
import { registerSchema, loginSchema } from '../models/auth.schema.js'

const router = Router()

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación o usuario ya existente
 */
router.post('/register', validate(registerSchema), registerLimiter, register)

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve JWT token y asigna cookie httpOnly
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validate(loginSchema), LoginLimiter, login)

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refrescar token de acceso JWT
 *     tags: [Autenticación]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Nuevo token de acceso generado
 *       401:
 *         description: Cookie de refresco inválida o expirada
 */
router.post('/refresh', refreshLimiter, refresh)

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *       401:
 *         description: No autorizado
 */
router.get('/me', authenticate, me)

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada y cookie eliminada
 */
router.post('/logout', authenticate, logout)

export default router