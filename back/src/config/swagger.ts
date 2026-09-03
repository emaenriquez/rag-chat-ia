import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RAG Chat IA API',
      version: '1.0.0',
      description: 'Documentación de la API de RAG Chat IA con autenticación JWT, gestión de documentos y chat contextual asistido por IA.',
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Introduce tu token JWT de acceso obtenido en /api/v1/auth/login',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Cookie httpOnly para refrescar tokens en /api/v1/auth/refresh',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Descripción del error' },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email Invalido' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            filename: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000.pdf' },
            originalName: { type: 'string', example: 'manual.pdf' },
            mimeType: { type: 'string', example: 'application/pdf' },
            fileSize: { type: 'string', example: '1048576' },
            status: {
              type: 'string',
              enum: ['uploaded', 'processing', 'completed', 'failed'],
              example: 'completed',
            },
            totalChunks: { type: 'integer', example: 12 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            role: { type: 'string', enum: ['user', 'assistant'], example: 'user' },
            content: { type: 'string', example: '¿De qué trata este documento?' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Chat: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            title: { type: 'string', example: 'Consultas sobre contratos' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
