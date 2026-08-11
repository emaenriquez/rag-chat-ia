import express from "express";
import cors from 'cors'
import helmet from 'cookie-parser'
import cookieParser from "cookie-parser";
import { env } from './config/env.js'
import router from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timeStamp: new Date().toISOString() })
})

app.use('/api/v1', router)
app.use(errorHandler)

export default app