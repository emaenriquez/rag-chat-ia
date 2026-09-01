# 📖 Explicación Detallada del Código — RAG Backend

## 📑 Índice

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Flujo General de la Arquitectura](#flujo-general-de-la-arquitectura)
5. [Archivos de Configuración Raíz](#archivos-de-configuración-raíz)
6. [Capa de Configuración (`src/config/`)](#capa-de-configuración-srcconfig)
7. [Capa de Modelos y Esquemas Zod (`src/models/`)](#capa-de-modelos-y-esquemas-zod-srcmodels)
8. [Capa de Middleware (`src/middleware/`)](#capa-de-middleware-srcmiddleware)
9. [Capa de Servicios — Motor RAG e IA (`src/services/`)](#capa-de-servicios--motor-rag-e-ia-srcservices)
   - [Gemini Service (`gemini.service.ts`)](#gemini-service-geminiservicets)
   - [RAG Service (`rag.service.ts`)](#rag-service-ragservicets)
10. [Capa de Controladores (`src/controller/`)](#capa-de-controladores-srccontroller)
    - [Auth Controller (`authController.ts`)](#auth-controller-authcontrollerts)
    - [Document Controller (`documentController.ts`)](#document-controller-documentcontrollerts)
    - [Chat Controller (`chatController.ts`)](#chat-controller-chatcontrollerts)
11. [Capa de Rutas (`src/routes/`)](#capa-de-rutas-srcroutes)
12. [Punto de Entrada de la App (`src/app.ts`) y Servidor (`src/server.ts`)](#punto-de-entrada-de-la-app-y-servidor)
13. [Esquema de Base de Datos y pgvector (`prisma/schema.prisma`)](#esquema-de-base-de-datos-y-pgvector-prismaschemaprisma)
14. [Diagramas de Flujo Detallados](#diagramas-de-flujo-detallados)
    - [1. Autenticación y Rotación de Refresh Tokens](#1-diagrama-de-autenticación-y-rotación-de-tokens)
    - [2. Pipeline de Procesamiento e Ingesta de Documentos (RAG)](#2-diagrama-del-pipeline-de-procesamiento-rag)
    - [3. Consulta en el Chat con Búsqueda Vectorial y Generación LLM](#3-diagrama-de-consulta-en-el-chat-y-respuesta-rag)

---

## Visión General del Proyecto

Este proyecto es un **backend API REST** de alto rendimiento construido con **Node.js, TypeScript y Express 5**. Implementa un sistema de **Retrieval-Augmented Generation (RAG)** completo:

1. **Gestión de Identidad & Seguridad**: Autenticación segura mediante JWTs de corta duración y Refresh Tokens opacos en cookies HttpOnly con rotación criptográfica.
2. **Ingesta de Documentos**: Carga y almacenamiento en disco de documentos (`.pdf`, `.docx`, `.txt`, `.md`), control de extensiones y tamaños máximos.
3. **Pipeline RAG Asíncrono**: Extracción de texto (con soporte PDF mediante `pdf-parse`), particionamiento semántico (*chunking*) con solapamiento (*overlap*), y generación de embeddings vectoriales de 768 dimensiones utilizando Google Gemini (`gemini-embedding-001`).
4. **Base de Datos Vectorial**: Almacenamiento e indexación de vectores mediante PostgreSQL con la extensión **`pgvector`**.
5. **Chat Inteligente**: Búsqueda por similitud semántica de distancia coseno (`<=>`), inyección de contexto dinámico y síntesis de respuestas mediante el modelo LLM `gemini-3.5-flash-lite`, guardando auditoría de referencias (*SourceReferences*).

---

## Stack Tecnológico

| Tecnología / Librería | Propósito |
|-----------------------|-----------|
| **Node.js & Express 5** | Entorno de ejecución y framework HTTP moderno para manejo de rutas y middlewares. |
| **TypeScript** | Tipado estático y robustez en tiempo de desarrollo y compilación. |
| **Prisma 7 ORM** | Capa de abstracción y mapeo objeto-relacional para PostgreSQL. |
| **PostgreSQL + pgvector** | Base de datos relacional y motor de búsqueda vectorial por similitud semántica. |
| **@google/generative-ai** | SDK oficial de Google AI para generación de embeddings (`gemini-embedding-001`) y respuestas LLM (`gemini-3.5-flash-lite`). |
| **pdf-parse** | Extracción y lectura de texto en documentos PDF en memoria. |
| **Multer** | Middleware para gestión de carga de archivos `multipart/form-data`. |
| **Zod** | Declaración e inferencia de esquemas con validación estricta de payloads. |
| **bcryptjs & jsonwebtoken** | Hashing criptográfico de contraseñas y firma/verificación de tokens JWT. |
| **helmet, cors, cookie-parser** | Cabeceras de seguridad HTTP, control CORS y lectura de cookies. |
| **express-rate-limit** | Limitación de frecuencia de peticiones para prevenir abuso y controlar costos. |

---

## Estructura de Carpetas

```
back/
├── prisma/
│   ├── schema.prisma              # Esquema de datos Prisma y configuración de extension pgvector
│   └── migrations/                # Historial de migraciones SQL aplicadas
├── storage/
│   └── documents/                 # Directorio de almacenamiento físico de archivos subidos
├── docs/
│   ├── api_documentacion.md       # Documentación de endpoints y contratos de la API
│   └── explicacion_codigo.md      # Este documento: explicación arquitectónica y técnica
├── src/
│   ├── config/
│   │   ├── database.ts            # Instancia única de PrismaClient
│   │   └── env.ts                 # Carga y validación de variables de entorno
│   ├── models/
│   │   ├── auth.schema.ts         # Schemas Zod para registro y login
│   │   ├── chat.schema.ts         # Schemas Zod para creación de chat y mensajes
│   │   └── document.schema.ts     # Constantes MIME, extensiones y tipos de documentos
│   ├── middleware/
│   │   ├── autheticate.ts         # Verificación de JWT en header Authorization
│   │   ├── errorHandler.ts        # Manejo global y centralizado de excepciones
│   │   ├── rateLimit.ts           # Limitadores de frecuencia por endpoint
│   │   ├── uploadMiddleware.ts    # Configuración de Multer, filtro de tipos y control de errores
│   │   └── validate.ts            # Middleware genérico para ejecutar validaciones Zod
│   ├── services/
│   │   ├── gemini.service.ts      # Cliente de Google Generative AI (Embeddings y LLM)
│   │   └── rag.service.ts         # Pipeline de ingesta, chunking e indexación/búsqueda pgvector
│   ├── controller/
│   │   ├── authController.ts      # Lógica de registro, login, refresh, perfil y logout
│   │   ├── documentController.ts  # Subida, listado, detalle, borrado y reprocesamiento
│   │   └── chatController.ts      # Hilos de conversación, envío de mensajes y consulta RAG
│   ├── routes/
│   │   ├── auth.routes.ts         # Definición de rutas del módulo de autenticación
│   │   ├── document.routes.ts     # Definición de rutas de documentos y carga
│   │   ├── chat.routes.ts         # Definición de rutas de chat y mensajería
│   │   └── index.ts               # Agrupador central bajo el prefijo /api/v1
│   ├── app.ts                     # Configuración de Express, middlewares globales y healthcheck
│   └── server.ts                  # Inicialización y arranque del servidor HTTP
├── .env                           # Variables de entorno secretas (no versionadas)
├── package.json                   # Manifiesto de dependencias y scripts
├── prisma.config.ts               # Configuración central de Prisma 7
└── tsconfig.ts                    # Configuración del compilador TypeScript
```

---

## Flujo General de la Arquitectura

```
                       ┌────────────────────────┐
                       │     Cliente (SPA/UI)   │
                       └───────────┬────────────┘
                                   │  HTTP / HTTPS
                                   ▼
                       ┌────────────────────────┐
                       │   Express App (app.ts) │
                       │  - Helmet / CORS       │
                       │  - JSON / CookieParser │
                       └───────────┬────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     /api/v1/auth         /api/v1/documents       /api/v1/chats
     (auth.routes.ts)     (document.routes.ts)   (chat.routes.ts)
              │                    │                    │
              │ [authenticate]     │ [Multer / Storage] │ [RateLimit + validate]
              ▼                    ▼                    ▼
     authController.ts    documentController.ts  chatController.ts
              │                    │                    │
              │                    ├────────────────────┘
              │                    ▼
              │            ┌─────────────────────────────┐
              │            │  RAG & AI Services          │
              │            │  - rag.service.ts           │
              │            │  - gemini.service.ts        │
              │            └──────────────┬──────────────┘
              │                           │
              ▼                           ▼
     ┌───────────────────────────────────────────────────────────┐
     │              PostgreSQL + Prisma ORM + pgvector           │
     │  - Users & Refresh Tokens                                 │
     │  - Documents & Document Chunks (vector 768dim)            │
     │  - Chats, Messages & Source References                    │
     └───────────────────────────────────────────────────────────┘
```

---

## Archivos de Configuración Raíz

### `package.json`
- Configurado con `"type": "module"` para soporte nativo de ECMAScript Modules (`import`/`export`).
- Scripts principales:
  - `npm run dev`: Ejecuta el servidor en desarrollo con `nodemon` y `tsx` para transpilación instantánea y hot-reload.
  - `npm run build`: Compila el código fuente a JavaScript puro en la carpeta `dist/`.
  - `npm run start`: Ejecuta la versión compilada en producción.
  - `npm run db:generate` / `db:migrate`: Sincronización del cliente Prisma y migraciones SQL.

### `prisma.config.ts`
Define la configuración programática para **Prisma 7**:
```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

---

## Capa de Configuración (`src/config/`)

### `src/config/env.ts`
Centraliza la lectura y validación de variables de entorno del sistema. Contiene la función `required(key)` que interrumpe el arranque inmediatamente si falta alguna variable crítica.

```typescript
export const env = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: required('DATABASE_URL'),
    jwtSecret: required('JWT_SECRET'),
    jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
    jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5500',
    uploadDir: process.env.UPLOAD_DIR || 'storage/documents',
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 20,
    geminiApiKey: required('GEMINI_API_KEY')
};
```

### `src/config/database.ts`
Inicializa y exporta una instancia singleton de `PrismaClient` para reutilizar el pool de conexiones a PostgreSQL.

---

## Capa de Modelos y Esquemas Zod (`src/models/`)

### `src/models/auth.schema.ts`
- **`registerSchema`**: Exige email válido y contraseña mínima de 8 caracteres con al menos una mayúscula y un número.
- **`loginSchema`**: Valida que email y password estén presentes.

### `src/models/chat.schema.ts`
- **`CreateChatSchema`**: Valida la creación de un nuevo chat (`title` opcional).
- **`SendMessageSchema`**: Valida que `content` sea una cadena no vacía (`min(1)`).

### `src/models/document.schema.ts`
- **`ALLOWED_MIME_TYPES`**: Lista blanca de tipos MIME permitidos (`application/pdf`, `.docx`, `text/plain`, `text/markdown`).
- **`ALLOWED_EXTENSIONS`**: Lista de extensiones (`.pdf`, `.docx`, `.txt`, `.md`).
- Tipos TypeScript para el ciclo de vida del documento: `DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'failed'`.

---

## Capa de Middleware (`src/middleware/`)

### `src/middleware/autheticate.ts`
Intercepta la petición, extrae el token del header `Authorization: Bearer <token>`, lo verifica con `jsonwebtoken` usando `env.jwtSecret` y adjunta el payload en `req.user`. Si el token es inválido o no existe, responde con código `401 Unauthorized`.

### `src/middleware/validate.ts`
Middleware de orden superior que recibe un schema de Zod y valida el `req.body`. Si la validación falla, formatea los mensajes por campo y devuelve `400 Bad Request` sin llegar al controlador.

### `src/middleware/uploadMiddleware.ts`
Configura la subida de archivos mediante `multer`:
1. **`storage`**: Guarda los archivos en la carpeta configurada (`env.uploadDir`), asignando un nombre único mediante UUID v4 (`${uuid()}${ext}`) para evitar colisiones y caracteres inválidos.
2. **`fileFilter`**: Valida de forma estricta que tanto el MIME Type como la extensión del archivo pertenezcan a la lista blanca.
3. **`limits`**: Limita el tamaño del archivo a `env.maxFileSizeMb` megabytes y a 1 solo archivo por petición.
4. **`hadleUploadError`**: Atrapa errores de Multer (como archivo demasiado grande `LIMIT_FILE_SIZE`) o rechazos del filtro, respondiendo en formato JSON con `400 Bad Request`.

### `src/middleware/rateLimit.ts`
Configura limitadores de tasa basados en IP:
- **`LoginLimiter`**: 5 peticiones / 15 minutos.
- **`registerLimiter`**: 10 peticiones / 1 hora.
- **`refreshLimiter`**: 30 peticiones / 1 hora.
- **`chatLimiter`**: 30 peticiones / 1 minuto (protege el consumo de la API de Google Gemini).

### `src/middleware/errorHandler.ts`
Middleware global de captura de excepciones no controladas. Evita que el servidor se caiga y retorna una respuesta limpia `500 Internal Server Error`.

---

## Capa de Servicios — Motor RAG e IA (`src/services/`)

Esta capa contiene la lógica central del sistema de inteligencia artificial y procesamiento de lenguaje natural.

### Gemini Service (`gemini.service.ts`)

Encapsula la comunicación directa con la API de **Google Generative AI**:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);
```

#### Métodos:
1. **`getEmbedding(text: string): Promise<number[]>`**:
   - Utiliza el modelo especializado **`gemini-embedding-001`**.
   - Genera un vector con dimensionalidad exacta de **768 valores numéricos** (`outputDimensionality: 768`), alineado con la columna `vector(768)` de PostgreSQL.
   - Retorna el vector de coma flotante para su indexación o búsqueda por similitud.

2. **`generateChatResponse(prompt: string, context: string): Promise<string>`**:
   - Utiliza el modelo LLM **`gemini-3.5-flash-lite`**.
   - Define una directiva de sistema (*System Instruction*) estricta:
     > *"You are a helpful AI assistant. Use the following context retrieved from the user's documents to answer their question. If the answer is not in the context, say that you don't know based on the provided documents."*
   - Inyecta el contexto obtenido de los fragmentos más relevantes y envía el mensaje del usuario para generar una respuesta fundamentada (*grounded*).

---

### RAG Service (`rag.service.ts`)

Implementa el pipeline completo de ingesta, fragmentación, generación de vectores y recuperación por similitud.

#### 1. Particionamiento de Texto con Overlap (`splitTextIntoChunks`)
```typescript
function splitTextIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[]
```
- Divide el texto continuo en bloques de máximo 1000 caracteres.
- Mantiene un solapamiento (*overlap*) de 200 caracteres entre fragmentos contiguos para preservar el contexto en los límites de cada fragmento.
- **Corte Inteligente**: Busca activamente saltos de línea (`\n`) o espacios cercanos al límite para no partir palabras u oraciones a la mitad.

#### 2. Procesamiento de Documentos (`processDocument(documentId: string)`)
- **Paso 1**: Obtiene los metadatos del documento desde la base de datos y actualiza su estado a `processing`.
- **Paso 2**: Lee el archivo físico del disco:
  - Si es un PDF (`application/pdf`), procesa el buffer con la librería `pdf-parse` para extraer el texto.
  - Si es texto plano o Markdown, realiza lectura directa UTF-8 con `fs/promises`.
- **Paso 3**: Ejecuta `splitTextIntoChunks(text)` sobre el texto extraído.
- **Paso 4**: Itera sobre cada fragmento:
  - Llama a `geminiService.getEmbedding(content)` para obtener el vector de 768 dimensiones.
  - Formatea el vector como string compatible con pgvector: `'[v1, v2, ..., v768]'`.
  - Estima los tokens aproximados (`content.length / 4`).
  - Realiza una inserción SQL directa mediante `prisma.$executeRaw`:
    ```sql
    INSERT INTO document_chunks (id, document_id, chunk_index, content, tokens, embedding, created_at)
    VALUES (${chunkId}, ${documentId}, ${i}, ${content}, ${tokens}, ${embeddingString}::vector, NOW())
    ```
- **Paso 5**: Marca el estado del documento como `processed` al terminar exitosamente, o como `failed` en caso de error.

#### 3. Búsqueda Semántica Vectorial (`searchSimilarChunks`)
```typescript
async searchSimilarChunks(queryEmbedding: number[], limit = 5): Promise<any[]>
```
- Convierte el embedding de la pregunta en formato `vector`.
- Ejecuta una consulta SQL optimizada con Prisma:
  ```sql
  SELECT id, document_id, content, 
         1 - (embedding <=> ${embeddingString}::vector) as similarity
  FROM document_chunks
  ORDER BY embedding <=> ${embeddingString}::vector
  LIMIT ${limit}
  ```
- El operador `<=>` calcula la **distancia coseno** entre el vector de la pregunta y los vectores almacenados. Ordenar de menor a mayor distancia equivale a buscar los fragmentos más cercanos semánticamente.
- Calcula el puntaje de similitud coseno como `1 - distancia`.

---

## Capa de Controladores (`src/controller/`)

### Auth Controller (`authController.ts`)
- **`register`**: Valida duplicados, hashea la contraseña con `bcrypt.hash(..., 12)` y crea el usuario.
- **`login`**: Verifica credenciales con `bcrypt.compare`, genera access token (JWT), genera refresh token aleatorio, guarda el hash SHA-256 en la tabla `refresh_tokens`, y responde estableciendo la cookie HTTP-only.
- **`refresh`**: Lee la cookie, valida el hash del token en la base de datos y que no esté expirado, **elimina el token usado** y genera un nuevo par (rotación estricta de tokens).
- **`me`**: Retorna la información básica del usuario autenticado (`req.user.sub`).
- **`logout`**: Elimina el registro del refresh token de la base de datos y limpia la cookie del cliente.

---

### Document Controller (`documentController.ts`)

Controla el ciclo de vida de los archivos y su conexión con el pipeline RAG:

- **`uploadDocument`**:
  - Verifica la recepción del archivo desde `req.file`.
  - Comprueba si el usuario ya subió previamente un archivo con el mismo nombre (`originalName`). En caso afirmativo, **elimina el archivo físico recién cargado** para evitar archivos huérfanos y devuelve `409 Conflict`.
  - Crea el registro del documento en la tabla `documents` con estado inicial `uploaded`.
  - Dispara el procesamiento asíncrono en segundo plano:
    ```typescript
    ragService.processDocument(document.id).catch(console.error);
    ```
  - Responde de inmediato con `201 Created`, sin bloquear la conexión HTTP del cliente.
- **`listDocuments`**: Consulta y retorna todos los documentos pertenecientes al `userId` autenticado, convirtiendo `fileSize` (BigInt) a string.
- **`getDocument`**: Devuelve los detalles de un documento específico y su lista de `chunks` (índice y tokens), asegurando que pertenezca al usuario autenticado y ocultando la ruta física interna en el servidor (`storagePath`).
- **`deleteDocument`**:
  - Elimina el registro de la base de datos (eliminando en cascada chunks y vectores gracias a `onDelete: Cascade`).
  - Elimina el archivo del sistema de archivos local (`fs.unlink`).
- **`reprocessDocument`**: Permite reiniciar el pipeline RAG si un documento falló o requiere actualización, validando que no se encuentre ya en estado `processing`.

---

### Chat Controller (`chatController.ts`)

Maneja las conversaciones, el historial de mensajes y la orquestación RAG para generación de respuestas:

- **`createChat`**: Crea una nueva sesión de conversación asociada al usuario autenticado.
- **`listChats`**: Lista los chats del usuario ordenados por `updatedAt` descendente.
- **`getChat`**: Obtiene un chat por ID con todos sus mensajes ordenados cronológicamente (`createdAt asc`).
- **`deleteChat`**: Elimina el chat y todos sus mensajes asociados en cascada.
- **`sendMessage`**: Orquesta el flujo completo de consulta inteligente:
  1. Verifica la existencia y pertenencia del chat.
  2. Guarda el mensaje del usuario con `role: 'user'`.
  3. Solicita a `geminiService.getEmbedding(content)` el vector de la pregunta.
  4. Llama a `ragService.searchSimilarChunks(queryEmbedding, 5)` para recuperar los 5 fragmentos de mayor relevancia.
  5. Concatena los textos de los chunks como contexto y solicita la respuesta al LLM mediante `geminiService.generateChatResponse(content, contextText)`.
  6. Guarda la respuesta generada con `role: 'assistant'`.
  7. Registra en la tabla `source_references` la relación entre el mensaje del asistente y cada chunk utilizado, junto con su puntaje de similitud (`similarityScore`).
  8. Actualiza la marca de tiempo `updatedAt` del chat.
  9. Devuelve tanto el mensaje del usuario como la respuesta del asistente en una sola respuesta atómica.

---

## Capa de Rutas (`src/routes/`)

### `src/routes/index.ts`
Punto de entrada de enrutamiento que monta todos los submódulos:
```typescript
import { Router } from 'express'
import authRoutes from './auth.routes.js'
import documentRoutes from './document.routes.js'
import chatRoutes from './chat.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/documents', documentRoutes)
router.use('/chats', chatRoutes)

export default router
```

### `src/routes/document.routes.ts`
Aplica el middleware `authenticate` a todas las rutas. En la ruta de subida, encadena:
```typescript
router.post('/', upload.single('file'), hadleUploadError, uploadDocument)
```

### `src/routes/chat.routes.ts`
Protege todas las rutas con autenticación y aplica `chatLimiter` y `validate(SendMessageSchema)` en el endpoint de mensajes:
```typescript
router.post('/:id/messages', chatLimiter, validate(SendMessageSchema), sendMessage)
```

---

## Punto de Entrada de la App y Servidor

### `src/app.ts`
Configura Express con la pila de middlewares globales de seguridad:
- `helmet()`: Cabeceras de protección HTTP.
- `cors()`: Configurado con `origin: env.frontendUrl` y `credentials: true`.
- `express.json({ limit: '10kb' })`: Limita el tamaño del payload JSON para prevenir DoS.
- `cookieParser()`: Habilita el parseo de cookies para refresh tokens.
- Rutas: `/health` y `/api/v1`.
- `errorHandler`: Middleware final para atrapar errores.

### `src/server.ts`
Verifica la conexión a PostgreSQL con `prisma.$connect()` antes de escuchar peticiones en el puerto asignado.

---

## Esquema de Base de Datos y pgvector (`prisma/schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  extensions = [vector]
}
```

### Modelos y Definición Vectorial

- **`DocumentChunk`**:
  ```prisma
  model DocumentChunk {
    id         String   @id @default(uuid())
    documentId String   @map("document_id")
    chunkIndex Int      @map("chunk_index")
    content    String
    tokens     Int      @default(0)
    embedding  Unsupported("vector(768)")?
    createdAt  DateTime @default(now()) @map("created_at")
    document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
    sourceReferences SourceReference[]
    @@map("document_chunks")
  }
  ```
  La columna `embedding` utiliza el tipo nativo `vector(768)` provisto por la extensión `pgvector` en PostgreSQL.

- **`SourceReference`**:
  Almacena la trazabilidad de cada respuesta del asistente:
  ```prisma
  model SourceReference {
    id              String   @id @default(uuid())
    messageId       String   @map("message_id")
    chunkId         String   @map("chunk_id")
    similarityScore Decimal? @map("similarity_score")
    message         Message       @relation(fields: [messageId], references: [id], onDelete: Cascade)
    chunk           DocumentChunk @relation(fields: [chunkId], references: [id], onDelete: Cascade)
    @@map("source_references")
  }
  ```

---

## Diagramas de Flujo Detallados

### 1. Diagrama de Autenticación y Rotación de Tokens

```
Cliente                           Servidor (Auth)                    PostgreSQL
   │                                     │                               │
   │── POST /api/v1/auth/login ─────────>│                               │
   │   { email, password }               │── Busca usuario por email ───>│
   │                                     │<── Retorna user + hash ───────│
   │                                     │── Compara hash (bcrypt)       │
   │                                     │── Genera AccessToken (JWT)    │
   │                                     │── Genera RefreshToken opaco   │
   │                                     │── Guarda hash SHA-256 ───────>│
   │<── 200 OK (AccessToken en body + ───│                               │
   │    Cookie HttpOnly refreshToken)    │                               │
   │                                     │                               │
   │── POST /api/v1/auth/refresh ───────>│ (Con Cookie refreshToken)     │
   │                                     │── Busca hash en DB ──────────>│
   │                                     │<── Token válido y no expirado─│
   │                                     │── Borra RefreshToken usado ──>│
   │                                     │── Genera nuevo par de tokens  │
   │                                     │── Inserta nuevo hash ────────>│
   │<── 200 OK (Nuevo AccessToken + ─────│                               │
   │    Nueva Cookie refreshToken)       │                               │
```

---

### 2. Diagrama del Pipeline de Procesamiento RAG

```
Cliente                           Document Controller            RAG Service               Gemini API / DB
   │                                       │                          │                           │
   │── POST /api/v1/documents ────────────>│                          │                           │
   │   (multipart/form-data: archivo)      │                          │                           │
   │                                       │── Multer guarda en disco │                           │
   │                                       │── Inserta en tabla docs  │                           │
   │                                       │   (status: 'uploaded')   │                           │
   │                                       │                          │                           │
   │                                       │── Dispara en segundo ───>│                           │
   │                                       │   plano processDocument()│                           │
   │<── 201 Created (Inmediato) ───────────│                          │                           │
   │                                                                  │                           │
   │                                                                  │── Extrae texto (pdf-parse)│
   │                                                                  │── splitTextIntoChunks()   │
   │                                                                  │   (1000 chars, 200 ovlp)  │
   │                                                                  │                           │
   │                                                                  │── Bucle por cada chunk:   │
   │                                                                  │   │── getEmbedding() ────>│ (Gemini API)
   │                                                                  │   │<── vector 768dim ─────│
   │                                                                  │   │                       │
   │                                                                  │   └── INSERT SQL Raw ────>│ (PostgreSQL
   │                                                                  │       (::vector cast)     │  pgvector)
   │                                                                  │                           │
   │                                                                  │── UPDATE document         │
   │                                                                  │   status = 'processed' ──>│
```

---

### 3. Diagrama de Consulta en el Chat y Respuesta RAG

```
Cliente                         Chat Controller                  RAG & Gemini Service               PostgreSQL (pgvector)
   │                                   │                                  │                                  │
   │── POST /chats/:id/messages ──────>│                                  │                                  │
   │   { content: "¿Cómo...?" }        │                                  │                                  │
   │                                   │── Guarda User Message ───────────┼─────────────────────────────────>│
   │                                   │                                  │                                  │
   │                                   │── 1. geminiService.getEmbedding->│                                  │
   │                                   │      de la pregunta              │── Llama a Gemini Embedding ─────>│
   │                                   │<─────────────────────────────────│   (Retorna vector 768dim)        │
   │                                   │                                  │                                  │
   │                                   │── 2. ragService.searchSimilar───>│                                  │
   │                                   │      Chunks(queryVector, 5)      │── SELECT ... ORDER BY ──────────>│
   │                                   │                                  │   embedding <=> vector LIMIT 5   │
   │                                   │<─────────────────────────────────│<── 5 chunks más relevantes ──────│
   │                                   │                                  │                                  │
   │                                   │── 3. Construye prompt context    │                                  │
   │                                   │── 4. geminiService.generate─────>│                                  │
   │                                   │      ChatResponse(prompt, context)── LLM (gemini-3.5-flash-lite)──>│
   │                                   │<─────────────────────────────────│<── Respuesta generada ───────────│
   │                                   │                                  │                                  │
   │                                   │── 5. Guarda Assistant Message ───┼─────────────────────────────────>│
   │                                   │── 6. Guarda Source References ───┼─────────────────────────────────>│
   │                                   │── 7. Actualiza updatedAt chat ───┼─────────────────────────────────>│
   │                                   │                                  │                                  │
   │<── 201 Created (User Message + ───│                                  │                                  │
   │    Assistant Message con RAG)     │                                  │                                  │
```
