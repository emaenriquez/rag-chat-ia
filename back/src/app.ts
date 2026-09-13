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

// Helmet con configuración ajustada para permitir scripts/estilos de Swagger UI
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
)
app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Documentación de Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timeStamp: new Date().toISOString() })
})

app.use('/api/v1', router)
app.use(errorHandler)

export default app