import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validate = (shema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
    const result = shema.safeParse(req.body)
    if (!result.success) {
        res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: result.error.flatten().fieldErrors,
        })
        return;
    }

    req.body = result.data
    next()

}