import { Response, Request, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err?.message || err)

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : (err?.message || 'Error interno'),
    })
}





