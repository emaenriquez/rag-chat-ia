import { z } from 'zod'

export const registerSchema = z.object({
    email: z.string().email({ message: 'Email Invalido' }),
    password: z.string().min(8, { message: 'minimo 8 caracteres' }).regex(/[A-Z]/, { message: 'Debe tener al menos una mayúscula' })
        .regex(/[0-9]/, { message: 'Debe tener al menos un número' }),
})

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
})

export type registerSchema = z.infer<typeof registerSchema>

export type loginSchema = z.infer<typeof loginSchema>