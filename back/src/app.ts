import express from "express";
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js'
import router from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { swaggerSpec } from './config/swagger.js'

const app = express()
app.set('trust proxy', 1) // Soluciona el error del rate-limit en Render

// Helmet con CSP global habilitado
app.use(helmet())

// CSP permisivo sólo para Swagger UI (scripts/estilos inline necesarios)
app.use(
    '/api-docs',
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc:  ["'self'", "'unsafe-inline'"],
                styleSrc:   ["'self'", "'unsafe-inline'"],
                imgSrc:     ["'self'", "data:"],
            },
        },
    })
)
app.use(
    cors({
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
            if (!origin) return callback(null, true)
            const cleanOrigin = origin.replace(/\/$/, '')
            const cleanFrontend = (env.frontendUrl || '').replace(/\/$/, '')
            const allowed =
                cleanOrigin === cleanFrontend ||
                cleanOrigin.endsWith('.vercel.app') ||
                (env.nodeEnv !== 'production' && (
                    cleanOrigin.includes('localhost') ||
                    cleanOrigin.includes('127.0.0.1')
                ))
            if (allowed) return callback(null, origin)
            return callback(new Error(`CORS: origen no permitido: ${cleanOrigin}`))
        },
        credentials: true,
    })
)
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Swagger UI sólo en entornos no-productivos
if (env.nodeEnv !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.send(swaggerSpec)
    })
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timeStamp: new Date().toISOString() })
})

app.use('/api/v1', router)
app.use(errorHandler)

export default app