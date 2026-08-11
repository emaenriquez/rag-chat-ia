import { Response, Request, NextFunction } from "express";

export const errorHandler = (res: Response, req: Request, next: NextFunction, err: Error): void => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    })

}





