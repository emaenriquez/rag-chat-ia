import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'


function generateAccessToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, env.jwtSecret, { expiresIn: env.jwtAccessExpires as jwt.SignOptions['expiresIn'] })
}

async function createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } })
    return token
}

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias en milisegundos
}

export const register = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
        res.status(409).json({ success: false, messsage: 'emaiil ya esta registrado' })
        return
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, createdAt: true }
    })

    res.status(201).json({ success: true, message: 'usuario creado' })

}

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401).json({ success: false, message: 'credenciales invalidas' })
        return
    }
    const accessToken = generateAccessToken(user.id, user.email)
    const refreshToken = await createRefreshToken(user.id)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.json({ success: true, accessToken, user: { id: user.id, email: user.email } })
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.refreshToken as string | undefined
    if (!token) {
        res.status(401).json({ success: false, message: 'refresh token invalido' })
        return
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const stored = await prisma.refreshToken.findFirst({
        where: {
            tokenHash,
            expiresAt: {
                gt: new Date()
            }
        },
        include: {
            user: { select: { id: true, email: true } }
        }
    })

    if (!stored) {
        res.status(401).json({ success: false, message: 'refresh token' })
        return
    }

    await prisma.refreshToken.delete({
        where: {
            id: stored.id,
        }
    })
    const newAcessToken = generateAccessToken(stored.user.id, stored.user.email)
    const newRefreshToken = await createRefreshToken(stored.user.id)

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)
    res.json({ success: true, accessToken: newAcessToken })

}

export const me = async (req: Request, res: Response): Promise<void> => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.sub },
        select: { id: true, email: true, createdAt: true }
    })
    if (!user) {
        res.status(404).json({ success: false, message: 'usuario no encontrado' })
        return
    }
    res.json({ success: true, user })
}

export const logout = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.refreshToken as string | undefined
    if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        await prisma.refreshToken.deleteMany({ where: { tokenHash } })
    }
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'sesion cerrada' })
}