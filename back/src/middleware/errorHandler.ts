import { Response, Request, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    // Log completo para depuración en el servidor
    console.error(`[ERROR] ${req.method} ${req.path}:`, err?.stack || err?.message || err)

    const status = (typeof err.status === 'number' && err.status >= 400 && err.status < 500)
        ? err.status
        : 500

    // Si es un error de cliente (4xx) se mantiene el mensaje, de lo contrario se usa mensaje genérico seguro
    const message = status < 500 && err?.message
        ? err.message
        : 'Error interno del servidor'

    res.status(status).json({
        success: false,
        message,
    })
}





