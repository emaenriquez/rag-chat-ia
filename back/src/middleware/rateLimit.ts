import rateLimit from 'express-rate-limit'

export const LoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados intentos de inicio de sesión, por favor intente nuevamente más tarde', }
}
)

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Demasiados intentos de registro, por favor intente nuevamente más tarde', }
})

export const refreshLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Rate limit de refresh token excedido.', }
})

export const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, message: 'Máximo 60 consultas por minuto.', }
})