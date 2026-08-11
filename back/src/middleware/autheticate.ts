import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import { env } from "../config/env";


export interface AuthPayload {
    sub: string,
    email: string,
    iat: number,
    exp: number
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'token no proporcionado' })
        return;
    }
    const token = authHeader.split(' ')[1]
    try {
        const payload = jwt.verify(token, env.jwtSecret) as AuthPayload
        req.user = payload;
        next()
    } catch {
        res.status(401).json({ success: false, message: 'token invalido' })

    }
}