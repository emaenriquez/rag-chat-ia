# RAG Chat IA

> Sistema de Inteligencia Artificial para consultas documentales mediante **Retrieval-Augmented Generation (RAG)**.

---

## El Problema

Los modelos de lenguaje (LLMs) como Gemini tienen un conocimiento general hasta cierta fecha de corte, pero **no conocen el contenido de tus propios documentos**. Si quieres hacerle preguntas a un contrato, un manual técnico, un PDF de recursos humanos o cualquier archivo privado, el modelo simplemente no tiene esa información.

Además, los LLMs pueden **alucinar** (inventar respuestas con confianza), lo que es inaceptable en contextos donde la precisión importa.

---

## La Solución

**RAG Chat IA** resuelve esto implementando el patrón **Retrieval-Augmented Generation**:

1. **El usuario sube sus documentos** (PDF, TXT, Markdown).
2. El sistema **extrae el texto**, lo divide en fragmentos (_chunks_) con solapamiento para no perder contexto entre bloques.
3. Cada fragmento se convierte en un **vector de embeddings** de 768 dimensiones usando el modelo `gemini-embedding-001` de Google.
4. Esos vectores se almacenan en **PostgreSQL con la extensión `pgvector`**, que permite búsquedas de similitud semántica eficientes.
5. Cuando el usuario hace una pregunta en el chat, la pregunta también se convierte en un embedding y se buscan los fragmentos **más similares** usando la distancia coseno (`<=>`).
6. Los fragmentos relevantes se inyectan como **contexto** en el prompt enviado a `gemini-3.5-flash-lite`.
7. El modelo responde **únicamente en base a ese contexto**, y si la información no está en los documentos, lo indica explícitamente.

Este flujo garantiza respuestas **precisas, trazables y ancladas en el contenido real** de los documentos del usuario.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (React + Vite)                 │
│  Login / Register → Subir Docs → Seleccionar Docs → Chat   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST API
┌──────────────────────────▼──────────────────────────────────┐
│              BACKEND (Node.js + Express 5 + TypeScript)     │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Auth Module │  │ Docs Module  │  │   Chat Module     │  │
│  │  /auth      │  │  /documents  │  │   /chats (RAG)    │  │
│  └─────────────┘  └──────┬───────┘  └────────┬──────────┘  │
│                          │                   │             │
│                   ┌──────▼──────┐   ┌────────▼──────────┐  │
│                   │  RAG Service │   │  Gemini Service   │  │
│                   │  (pipeline) │   │  (embed + chat)   │  │
│                   └──────┬──────┘   └───────────────────┘  │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │  R2 Service │                           │
│                   │ (archivos)  │                           │
│                   └─────────────┘                           │
└───────────┬─────────────────────────────────────────────────┘
            │
┌───────────▼───────────────────┐   ┌─────────────────────────┐
│  PostgreSQL + pgvector        │   │   Cloudflare R2 (S3)    │
│  - users, documents, chunks   │   │   - Almacenamiento de   │
│  - chats, messages            │   │     archivos originales │
│  - embeddings vector(768)     │   └─────────────────────────┘
└───────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnología                        | Uso                                                                  |
| --------------------------------- | -------------------------------------------------------------------- |
| **Node.js + TypeScript**          | Servidor y lógica de negocio                                         |
| **Express 5**                     | Framework HTTP                                                       |
| **Prisma 7**                      | ORM y migraciones de base de datos                                   |
| **PostgreSQL + pgvector**         | Base de datos relacional con soporte de vectores                     |
| **Google Generative AI (Gemini)** | Embeddings (`gemini-embedding-001`) y chat (`gemini-3.5-flash-lite`) |
| **Cloudflare R2**                 | Almacenamiento de archivos (compatible con S3)                       |
| **AWS SDK v3**                    | Cliente para interactuar con Cloudflare R2                           |
| **pdf-parse**                     | Extracción de texto desde PDFs                                       |
| **JWT + Cookies HttpOnly**        | Autenticación segura con refresh tokens                              |
| **bcryptjs**                      | Hash de contraseñas                                                  |
| **Zod**                           | Validación de esquemas y datos de entrada                            |
| **Helmet + CORS**                 | Seguridad HTTP                                                       |
| **express-rate-limit**            | Protección ante abuso de API                                         |
| **Swagger UI**                    | Documentación interactiva de la API                                  |

### Frontend

| Tecnología            | Uso                         |
| --------------------- | --------------------------- |
| **React 19 + Vite 8** | Interfaz de usuario         |
| **React Router v7**   | Navegación SPA              |
| **TailwindCSS v4**    | Estilos y diseño responsive |

---

## 📂 Estructura del Proyecto

```
RAG/
├── back/                        # Backend (API REST + RAG Pipeline)
│   ├── src/
│   │   ├── app.ts               # Configuración de Express
│   │   ├── server.ts            # Punto de entrada
│   │   ├── config/              # Variables de entorno, DB, Swagger
│   │   ├── routes/              # auth, documents, chats
│   │   ├── controller/          # Lógica de cada endpoint
│   │   ├── services/
│   │   │   ├── rag.service.ts   # Pipeline RAG completo
│   │   │   ├── gemini.service.ts# Embeddings + generación de chat
│   │   │   └── r2.service.ts    # Subida/descarga de archivos
│   │   ├── middleware/          # Auth, error handler, validaciones
│   │   └── models/              # Tipos e interfaces TypeScript
│   ├── prisma/
│   │   └── schema.prisma        # Modelos: User, Document, Chunk, Chat...
│   └── docs/
│       └── api_documentacion.md # Documentación completa de la API
│
└── front/                       # Frontend React
    └── src/
        ├── pages/               # Login, Register, Documents, Chat
        ├── components/          # Componentes reutilizables
        ├── hooks/               # Custom hooks
        ├── context/             # Estado global (auth, etc.)
        └── services/            # Llamadas a la API
```

## Seguridad

- **JWT**: Access token de corta duración + Refresh token rotativo almacenado en Cookie HttpOnly.
- **bcryptjs**: Las contraseñas nunca se almacenan en texto plano.
- **Helmet**: Cabeceras HTTP de seguridad.
- **Rate Limiting**: Protección contra abuso en endpoints críticos.
- **Zod**: Validación estricta de todos los datos de entrada.
- **CORS**: Configurado para permitir solo orígenes autorizados.
- **Aislamiento de datos**: Cada usuario solo accede a sus propios documentos y chats.

---
