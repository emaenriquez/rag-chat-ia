# 📡 Documentación de la API — RAG Backend

**Base URL**: `http://localhost:3000/api/v1`  
**Versión**: `1.0.0`  
**Formato**: JSON / `multipart/form-data` (para upload)  
**Autenticación**: Bearer Token (JWT) + Cookie HttpOnly (Refresh Token)

---

## 📑 Índice

1. [Información General](#información-general)
   - [Convenciones](#convenciones)
   - [Headers Requeridos](#headers-requeridos)
   - [Manejo de Cookies](#manejo-de-cookies)
2. [Autenticación](#autenticación)
   - [Flujo de Autenticación y Tokens](#flujo-de-autenticación-y-tokens)
   - [Estructura del JWT](#estructura-del-jwt-access-token)
3. [Endpoints: Sistema](#endpoints-sistema)
   - [Health Check](#health-check)
4. [Endpoints: Autenticación (`/auth`)](#endpoints-autenticación-auth)
   - [Registro de Usuario](#registro-de-usuario)
   - [Inicio de Sesión](#inicio-de-sesión)
   - [Renovar Access Token](#renovar-access-token)
   - [Obtener Perfil del Usuario](#obtener-perfil-del-usuario)
   - [Cerrar Sesión](#cerrar-sesión)
5. [Endpoints: Documentos & Ingesta (`/documents`)](#endpoints-documentos--ingesta-documents)
   - [Subir Documento](#subir-documento)
   - [Listar Documentos](#listar-documentos)
   - [Obtener Detalle de Documento](#obtener-detalle-de-documento)
   - [Eliminar Documento](#eliminar-documento)
   - [Reprocesar Documento](#reprocesar-documento)
6. [Endpoints: Chat & RAG (`/chats`)](#endpoints-chat--rag-chats)
   - [Crear Nuevo Chat](#crear-nuevo-chat)
   - [Listar Chats](#listar-chats)
   - [Obtener Chat con Mensajes](#obtener-chat-con-mensajes)
   - [Eliminar Chat](#eliminar-chat)
   - [Enviar Mensaje y Consulta RAG](#enviar-mensaje-y-consulta-rag)
7. [Formato de Respuestas y Errores](#formato-de-respuestas-y-errores)
8. [Rate Limiting](#rate-limiting)
9. [Modelos de Datos](#modelos-de-datos)
10. [Variables de Entorno](#variables-de-entorno)
11. [Ejemplos con cURL](#ejemplos-con-curl)
12. [Tabla Resumen de Endpoints](#tabla-resumen-de-endpoints)

---

## Información General

### Convenciones

- Todas las rutas principales de la API están prefijadas con `/api/v1` (a excepción de `/health`).
- Las respuestas JSON siguen el formato estándar con el campo booleano `success`.
- Las fechas se retornan en formato **ISO 8601** (ej. `2026-08-31T20:00:00.000Z`).
- Los identificadores principales son cadenas en formato **UUID v4** (`550e8400-e29b-41d4-a716-446655440000`).
- Los números grandes (`BigInt` como `fileSize`) se serializan a `string` en JSON para evitar pérdida de precisión.
- Rutas protegidas exigen el header `Authorization: Bearer <token>`.
- Los refresh tokens se transmiten exclusivamente vía **cookies HTTP-only** para prevenir ataques XSS.

### Headers Requeridos

| Header          | Valor                       | Aplicabilidad                               |
|-----------------|-----------------------------|---------------------------------------------|
| `Content-Type`  | `application/json`          | Peticiones con body JSON                    |
| `Content-Type`  | `multipart/form-data`       | Subida de archivos (`POST /documents`)      |
| `Authorization` | `Bearer <access_token>`     | En todos los endpoints protegidos           |

### Manejo de Cookies

| Cookie         | Propósito                            | Configuración de Seguridad                                |
|----------------|--------------------------------------|----------------------------------------------------------|
| `refreshToken` | Token opaco para renovación de sesión| `httpOnly: true`, `secure: prod`, `sameSite: strict`, 30 días |

---

## Autenticación

### Flujo de Autenticación y Tokens

1. **Login (`POST /auth/login`)**:
   - Entrega un **Access Token (JWT)** con validez de 15 minutos en el body JSON.
   - Establece una cookie segura `refreshToken` con validez de 30 días.
2. **Acceso a Endpoints Protegidos**:
   - El cliente envía el header `Authorization: Bearer <access_token>`.
3. **Renovación con Rotación (`POST /auth/refresh`)**:
   - El cliente envía la cookie `refreshToken`.
   - El servidor invalida el token actual en la base de datos y emite **un nuevo par** (nuevo JWT + nueva cookie `refreshToken`).

### Estructura del JWT (Access Token)

```json
{
  "sub": "b2f67ac1-4357-4632-bd32-841da926ef91",
  "email": "usuario@ejemplo.com",
  "iat": 1725148800,
  "exp": 1725149700
}
```

---

## Endpoints: Sistema

### Health Check

Comprueba la disponibilidad operativa del servidor.

```http
GET /health
```

> **Nota**: Se encuentra en la raíz del servidor, fuera del prefijo `/api/v1`.

#### Respuesta `200 OK`
```json
{
  "status": "ok",
  "timeStamp": "2026-08-31T23:00:00.000Z"
}
```

---

## Endpoints: Autenticación (`/auth`)

---

### Registro de Usuario

Crea una cuenta de usuario en el sistema.

```http
POST /api/v1/auth/register
```

#### Body (JSON)
| Campo      | Tipo     | Requerido | Validación                                                      |
|------------|----------|-----------|-----------------------------------------------------------------|
| `email`    | `string` | ✅        | Formato de email válido                                         |
| `password` | `string` | ✅        | Mínimo 8 caracteres, al menos 1 letra mayúscula y 1 número     |

```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123"
}
```

#### Respuestas
- **`201 Created`**
  ```json
  {
    "success": true,
    "message": "usuario creado"
  }
  ```
- **`400 Bad Request`** (Validación Zod fallida)
  ```json
  {
    "success": false,
    "message": "validacion error",
    "errors": {
      "email": ["Email Invalido"],
      "password": ["minimo 8 caracteres"]
    }
  }
  ```
- **`409 Conflict`** (Email duplicado)
  ```json
  {
    "success": false,
    "messsage": "emaiil ya esta registrado"
  }
  ```
- **`429 Too Many Requests`** (Límite: 10 peticiones/hora).

---

### Inicio de Sesión

Valida credenciales y genera sesión activa.

```http
POST /api/v1/auth/login
```

#### Body (JSON)
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123"
}
```

#### Respuestas
- **`200 OK`** (Incluye cookie `Set-Cookie: refreshToken=...`)
  ```json
  {
    "success": true,
    "user": {
      "id": "b2f67ac1-4357-4632-bd32-841da926ef91",
      "email": "usuario@ejemplo.com",
      "createdAt": "2026-08-31T20:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **`401 Unauthorized`** (Credenciales inválidas)
  ```json
  {
    "success": false,
    "message": "Credenciales inválidas"
  }
  ```
- **`429 Too Many Requests`** (Límite: 5 peticiones/15 min).

---

### Renovar Access Token

Emite un nuevo Access Token a partir del Refresh Token almacenado en la cookie HTTP-only (con rotación de token).

```http
POST /api/v1/auth/refresh
```

#### Requisitos
- Cookie `refreshToken` enviada en los headers de la solicitud.

#### Respuestas
- **`200 OK`** (Establece nueva cookie con el nuevo refreshToken)
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **`401 Unauthorized`** (Cookie ausente, token inválido o expirado)
  ```json
  {
    "success": false,
    "message": "Refresh token inválido o expirado"
  }
  ```
- **`429 Too Many Requests`** (Límite: 30 peticiones/hora).

---

### Obtener Perfil del Usuario

Retorna los datos del usuario autenticado.

```http
GET /api/v1/auth/me
```

#### Headers
| Header          | Valor                   | Requerido |
|-----------------|-------------------------|-----------|
| `Authorization` | `Bearer <access_token>` | ✅        |

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "user": {
      "id": "b2f67ac1-4357-4632-bd32-841da926ef91",
      "email": "usuario@ejemplo.com",
      "createdAt": "2026-08-31T20:00:00.000Z"
    }
  }
  ```
- **`401 Unauthorized`** (Token ausente o vencido).

---

### Cerrar Sesión

Invalida el refresh token en la base de datos y borra la cookie en el cliente.

```http
POST /api/v1/auth/logout
```

#### Headers
| Header          | Valor                   | Requerido |
|-----------------|-------------------------|-----------|
| `Authorization` | `Bearer <access_token>` | ✅        |

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "message": "Sesión cerrada correctamente"
  }
  ```

---

## Endpoints: Documentos & Ingesta (`/documents`)

Todos los endpoints de documentos requieren autenticación (`Authorization: Bearer <access_token>`).

---

### Subir Documento

Sube un archivo de documento, guarda sus metadatos y dispara de forma asíncrona el pipeline de procesamiento RAG (extracción, chunking y generación de embeddings).

```http
POST /api/v1/documents
```

#### Headers
| Header          | Valor                   | Requerido |
|-----------------|-------------------------|-----------|
| `Authorization` | `Bearer <access_token>` | ✅        |
| `Content-Type`  | `multipart/form-data`   | ✅        |

#### Body (`multipart/form-data`)
| Campo  | Tipo   | Requerido | Descripción                                                              |
|--------|--------|-----------|--------------------------------------------------------------------------|
| `file` | File   | ✅        | Archivo a procesar (`.pdf`, `.docx`, `.txt`, `.md`). Máximo configurable (20MB por defecto). |

#### Tipos MIME y Extensiones Permitidas
- `application/pdf` (`.pdf`)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)
- `text/plain` (`.txt`)
- `text/markdown` (`.md`)

#### Respuestas
- **`201 Created`**
  ```json
  {
    "success": true,
    "message": "Documento subido correctamente. Procesando en segundo plano...",
    "document": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "filename": "d8e234a9-8547-4951-872f-48d6db36d0ab.pdf",
      "originalName": "manual_usuario.pdf",
      "mimeType": "application/pdf",
      "fileSize": "2048576",
      "status": "uploaded",
      "createdAt": "2026-08-31T23:10:00.000Z",
      "updatedAt": "2026-08-31T23:10:00.000Z"
    }
  }
  ```
- **`400 Bad Request`** (Archivo no enviado, formato no permitido o excede el límite de tamaño)
  ```json
  {
    "success": false,
    "message": "Tipo de archivo no permitido. Permitidos: .pdf, .docx, .txt, .md"
  }
  ```
- **`409 Conflict`** (Documento con el mismo nombre ya subido por el usuario)
  ```json
  {
    "success": false,
    "message": "El archivo \"manual_usuario.pdf\" ya fue subido anteriormente."
  }
  ```

---

### Listar Documentos

Devuelve la lista de documentos pertenecientes al usuario autenticado, ordenados cronológicamente descendente.

```http
GET /api/v1/documents
```

#### Headers
| Header          | Valor                   | Requerido |
|-----------------|-------------------------|-----------|
| `Authorization` | `Bearer <access_token>` | ✅        |

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "documents": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "filename": "d8e234a9-8547-4951-872f-48d6db36d0ab.pdf",
        "originalName": "manual_usuario.pdf",
        "mimeType": "application/pdf",
        "fileSize": "2048576",
        "status": "processed",
        "createdAt": "2026-08-31T23:10:00.000Z",
        "updatedAt": "2026-08-31T23:10:15.000Z"
      }
    ]
  }
  ```

---

### Obtener Detalle de Documento

Obtiene la información detallada de un documento específico y el desglose de sus fragmentos (*chunks*) indexados.

```http
GET /api/v1/documents/:id
```

#### Parámetros de Ruta
| Parámetro | Tipo   | Descripción                         |
|-----------|--------|-------------------------------------|
| `id`      | `UUID` | Identificador único del documento   |

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "document": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "filename": "d8e234a9-8547-4951-872f-48d6db36d0ab.pdf",
      "originalName": "manual_usuario.pdf",
      "mimeType": "application/pdf",
      "fileSize": "2048576",
      "status": "processed",
      "createdAt": "2026-08-31T23:10:00.000Z",
      "updatedAt": "2026-08-31T23:10:15.000Z",
      "chunks": [
        {
          "id": "fa12c98d-65b1-41de-84d5-56094b8e21ad",
          "chunkIndex": 0,
          "tokens": 245
        },
        {
          "id": "6c49e29a-24cd-4e89-9836-39185a73e4f1",
          "chunkIndex": 1,
          "tokens": 230
        }
      ]
    }
  }
  ```
- **`404 Not Found`**
  ```json
  {
    "success": false,
    "message": "Documento no encontrado"
  }
  ```

---

### Eliminar Documento

Elimina el documento de la base de datos (con borrado en cascada de sus chunks, embeddings y referencias) y elimina físicamente el archivo del sistema de almacenamiento en disco.

```http
DELETE /api/v1/documents/:id
```

#### Parámetros de Ruta
| Parámetro | Tipo   | Descripción                         |
|-----------|--------|-------------------------------------|
| `id`      | `UUID` | Identificador único del documento   |

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "message": "Documento eliminado correctamente"
  }
  ```
- **`404 Not Found`**
  ```json
  {
    "success": false,
    "message": "Documento no encontrado"
  }
  ```

---

### Reprocesar Documento

Fuerza la re-ejecución del pipeline RAG para un documento (extracción, nuevos embeddings y re-indexación).

```http
POST /api/v1/documents/:id/reprocess
```

#### Parámetros de Ruta
| Parámetro | Tipo   | Descripción                         |
|-----------|--------|-------------------------------------|
| `id`      | `UUID` | Identificador único del documento   |

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "message": "Documento marcado para reprocesar. El pipeline RAG lo tomará pronto."
  }
  ```
- **`409 Conflict`** (Si el documento ya se encuentra en estado `processing`)
  ```json
  {
    "success": false,
    "message": "El documento ya está siendo procesado"
  }
  ```
- **`404 Not Found`**

---

## Endpoints: Chat & RAG (`/chats`)

Todos los endpoints de chat requieren autenticación (`Authorization: Bearer <access_token>`).

---

### Crear Nuevo Chat

Inicia un nuevo hilo de conversación.

```http
POST /api/v1/chats
```

#### Body (JSON)
| Campo         | Tipo       | Requerido | Descripción / Default                                          |
|---------------|------------|-----------|----------------------------------------------------------------|
| `title`       | `string`   | ❌        | Título opcional (Default: `'Nuevo Chat'`)                      |
| `documentIds` | `string[]` | ❌        | Arreglo opcional de UUIDs de documentos a asociar como fuentes |

```json
{
  "title": "Consultas sobre Políticas de Empresa",
  "documentIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

#### Respuestas
- **`201 Created`**
  ```json
  {
    "success": true,
    "chat": {
      "id": "e83e60cb-9861-460d-85fa-7b70bc97eb6d",
      "title": "Consultas sobre Políticas de Empresa",
      "createdAt": "2026-08-31T23:15:00.000Z",
      "updatedAt": "2026-08-31T23:15:00.000Z",
      "chatDocuments": [
        {
          "document": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "originalName": "manual_empleado.pdf",
            "status": "processed",
            "mimeType": "application/pdf"
          }
        }
      ]
    }
  }
  ```

---

### Listar Chats

Obtiene la lista de todas las conversaciones del usuario autenticado ordenadas por su última interacción (`updatedAt` descendente).

```http
GET /api/v1/chats
```

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "chats": [
      {
        "id": "e83e60cb-9861-460d-85fa-7b70bc97eb6d",
        "title": "Consultas sobre Políticas de Empresa",
        "createdAt": "2026-08-31T23:15:00.000Z",
        "updatedAt": "2026-08-31T23:18:22.000Z"
      }
    ]
  }
  ```

---

### Obtener Chat con Mensajes

Recupera el historial completo de mensajes de una conversación ordenados cronológicamente.

```http
GET /api/v1/chats/:id
```

#### Parámetros de Ruta
| Parámetro | Tipo   | Descripción                     |
|-----------|--------|---------------------------------|
| `id`      | `UUID` | Identificador único del chat    |

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "chat": {
      "id": "e83e60cb-9861-460d-85fa-7b70bc97eb6d",
      "title": "Consultas sobre Políticas de Empresa",
      "createdAt": "2026-08-31T23:15:00.000Z",
      "updatedAt": "2026-08-31T23:18:22.000Z",
      "messages": [
        {
          "id": "9f71c4c1-90a6-43b8-a73c-74a49c951010",
          "role": "user",
          "content": "¿Cuál es la política de vacaciones según el manual?",
          "createdAt": "2026-08-31T23:16:00.000Z"
        },
        {
          "id": "11d4e5f2-49aa-4c7a-97a1-8d2a6a682b13",
          "role": "assistant",
          "content": "De acuerdo con el documento provisto, los empleados disponen de 15 días hábiles...",
          "createdAt": "2026-08-31T23:16:03.000Z"
        }
      ]
    }
  }
  ```
- **`404 Not Found`**

---

### Actualizar Fuentes del Chat

Actualiza la lista de documentos vinculados a un chat para filtrar las consultas RAG.

```http
PUT /api/v1/chats/:id/sources
```

#### Parámetros de Ruta
| Parámetro | Tipo   | Descripción                  |
|-----------|--------|------------------------------|
| `id`      | `UUID` | Identificador único del chat |

#### Body (JSON)
| Campo         | Tipo       | Requerido | Descripción                                             |
|---------------|------------|-----------|---------------------------------------------------------|
| `documentIds` | `string[]` | ✅        | Lista de UUIDs de documentos procesados a vincular      |

```json
{
  "documentIds": [
    "550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "chat": {
      "id": "e83e60cb-9861-460d-85fa-7b70bc97eb6d",
      "chatDocuments": [
        {
          "document": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "originalName": "manual_empleado.pdf",
            "status": "processed",
            "mimeType": "application/pdf"
          }
        }
      ]
    }
  }
  ```
- **`400 Bad Request`** (documentos no válidos o sin procesar)
- **`404 Not Found`**

---

### Eliminar Chat

Elimina un chat y todo su historial de mensajes y referencias asociadas.

```http
DELETE /api/v1/chats/:id
```

#### Respuestas
- **`200 OK`**
  ```json
  {
    "success": true,
    "message": "Chat eliminado"
  }
  ```
- **`404 Not Found`**

---

### Enviar Mensaje y Consulta RAG

Envía un mensaje del usuario, ejecuta el pipeline de búsqueda semántica vectorial (pgvector) sobre los documentos del sistema, invoca el modelo de IA Gemini con el contexto recuperado y retorna la respuesta generada junto con el registro de fuentes.

```http
POST /api/v1/chats/:id/messages
```

#### Rate Limiting
- **30 peticiones por minuto**.

#### Body (JSON)
| Campo     | Tipo     | Requerido | Descripción / Validación                |
|-----------|----------|-----------|-----------------------------------------|
| `content` | `string` | ✅        | Texto de la pregunta (mínimo 1 caracter)|

```json
{
  "content": "¿Cómo configuro las credenciales en el sistema?"
}
```

#### Flujo Interno Ejecutado:
1. Registra el mensaje del usuario (`role: 'user'`).
2. Genera el embedding de la pregunta con Google Gemini (`gemini-embedding-001`).
3. Busca los **Top 5 fragmentos más similares** usando distancia coseno sobre PostgreSQL + `pgvector`.
4. Inyecta los fragmentos en el system prompt de Gemini (`gemini-3.5-flash-lite`).
5. Genera y almacena la respuesta del asistente (`role: 'assistant'`).
6. Guarda las referencias en la tabla `source_references` con su score de similitud.
7. Actualiza el `updatedAt` de la conversación.

#### Respuestas
- **`201 Created`**
  ```json
  {
    "success": true,
    "userMessage": {
      "id": "9f71c4c1-90a6-43b8-a73c-74a49c951010",
      "chatId": "e83e60cb-9861-460d-85fa-7b70bc97eb6d",
      "role": "user",
      "content": "¿Cómo configuro las credenciales en el sistema?",
      "createdAt": "2026-08-31T23:16:00.000Z"
    },
    "assistantMessage": {
      "id": "11d4e5f2-49aa-4c7a-97a1-8d2a6a682b13",
      "chatId": "e83e60cb-9861-460d-85fa-7b70bc97eb6d",
      "role": "assistant",
      "content": "Para configurar las credenciales, debes editar el archivo .env e incluir las variables DATABASE_URL y GEMINI_API_KEY según la sección 2 del manual.",
      "createdAt": "2026-08-31T23:16:03.000Z"
    }
  }
  ```
- **`400 Bad Request`** (Validación de body fallida)
- **`404 Not Found`** (Chat no existe o no pertenece al usuario)
- **`429 Too Many Requests`** (Límite por minuto alcanzado)

---

## Formato de Respuestas y Errores

### Respuestas Exitosas
```json
{
  "success": true,
  "data": { ... }
}
```

### Respuestas de Error
```json
{
  "success": false,
  "message": "Descripción clara del motivo del error",
  "errors": { ... } // Opcional, presente en errores de validación Zod
}
```

### Códigos de Estado HTTP Utilizados

| Código | Significado             | Casos de Uso                                               |
|--------|-------------------------|------------------------------------------------------------|
| `200`  | OK                      | Consulta o modificación exitosa                            |
| `201`  | Created                 | Creación de recursos (usuario, chat, mensaje, documento)   |
| `400`  | Bad Request             | Error de sintaxis, validación Zod o tipo de archivo no apto|
| `401`  | Unauthorized            | Token ausente, firma inválida o sesión expirada            |
| `404`  | Not Found               | Recurso no encontrado o no perteneciente al usuario        |
| `409`  | Conflict                | Conflicto de estado (archivo repetido, reproceso en curso)|
| `429`  | Too Many Requests       | Rate limiter superado                                      |
| `500`  | Internal Server Error   | Excepción interna no controlada                            |

---

## Rate Limiting

| Endpoint / Módulo         | Ventana    | Máx. Peticiones | Objetivo                                |
|---------------------------|------------|-----------------|-----------------------------------------|
| `POST /auth/login`        | 15 minutos | 5               | Prevención de ataques de fuerza bruta   |
| `POST /auth/register`     | 1 hora     | 10              | Prevención de creación masiva de bots   |
| `POST /auth/refresh`      | 1 hora     | 30              | Control de rotación de tokens           |
| `POST /chats/:id/messages`| 1 minuto   | 30              | Protección de cuota y costos de IA/LLM  |

---

## Modelos de Datos

### Diagrama Entidad-Relación

```
┌─────────────┐       ┌──────────────┐
│    User     │───<───│ RefreshToken │
└──────┬──────┘       └──────────────┘
       │
       ├──────<───┌──────────────┐       ┌─────────────────┐
       │          │   Document   │───<───│  DocumentChunk  │
       │          └──────────────┘       │ (vector 768dim) │
       │                                 └────────┬────────┘
       │                                          │
       └──────<───┌──────────────┐                │ (1:N)
                  │     Chat     │                │
                  └──────┬───────┘                │
                         │                        │
                         └───<───┌──────────────┐ │
                                 │   Message    │─┴─<───┌─────────────────┐
                                 └──────────────┘       │ SourceReference │
                                                        └─────────────────┘
```

### Especificación de Tablas

#### `users`
- `id` (UUID, PK)
- `email` (String, Unique)
- `password_hash` (String, Hash Bcrypt)
- `created_at` (DateTime), `updated_at` (DateTime)

#### `refresh_tokens`
- `id` (UUID, PK)
- `user_id` (UUID, FK `users.id` ON DELETE CASCADE)
- `token_hash` (String, Hash SHA-256)
- `expires_at` (DateTime), `created_at` (DateTime)

#### `documents`
- `id` (UUID, PK)
- `user_id` (UUID, FK `users.id` ON DELETE CASCADE)
- `filename` (String, UUID generado en disco)
- `original_name` (String, Nombre original)
- `mime_type` (String?)
- `file_size` (BigInt?)
- `storage_path` (String)
- `status` (`uploaded` | `processing` | `processed` | `failed`)
- `created_at` (DateTime), `updated_at` (DateTime)

#### `document_chunks`
- `id` (UUID, PK)
- `document_id` (UUID, FK `documents.id` ON DELETE CASCADE)
- `chunk_index` (Int)
- `content` (String, Texto del fragmento)
- `tokens` (Int)
- `embedding` (`vector(768)`)
- `created_at` (DateTime)

#### `chats`
- `id` (UUID, PK)
- `user_id` (UUID, FK `users.id` ON DELETE CASCADE)
- `title` (String?)
- `created_at` (DateTime), `updated_at` (DateTime)

#### `messages`
- `id` (UUID, PK)
- `chat_id` (UUID, FK `chats.id` ON DELETE CASCADE)
- `role` (`user` | `assistant` | `system`)
- `content` (String)
- `created_at` (DateTime)

#### `source_references`
- `id` (UUID, PK)
- `message_id` (UUID, FK `messages.id` ON DELETE CASCADE)
- `chunk_id` (UUID, FK `document_chunks.id` ON DELETE CASCADE)
- `similarity_score` (Decimal?)

---

## Variables de Entorno

| Variable              | Requerida | Default               | Descripción                                            |
|-----------------------|:---------:|-----------------------|--------------------------------------------------------|
| `PORT`                | ❌        | `3000`                | Puerto HTTP del servidor                               |
| `NODE_ENV`            | ❌        | `development`         | Entorno de ejecución (`development` / `production`)   |
| `DATABASE_URL`        | ✅        | —                     | URL de conexión a PostgreSQL (con extensión pgvector) |
| `JWT_SECRET`          | ✅        | —                     | Clave secreta para firmar Access Tokens (JWT)          |
| `JWT_REFRESH_SECRET`  | ✅        | —                     | Clave secreta para generación de Refresh Tokens        |
| `JWT_ACCESS_EXPIRES`  | ❌        | `15m`                 | Tiempo de expiración del Access Token                  |
| `JWT_REFRESH_EXPIRES` | ❌        | `30d`                 | Tiempo de expiración del Refresh Token                 |
| `FRONTEND_URL`        | ❌        | `http://localhost:5500`| URL permitida por CORS                                |
| `UPLOAD_DIR`          | ❌        | `storage/documents`   | Directorio local de persistencia de archivos subidos   |
| `MAX_FILE_SIZE_MB`    | ❌        | `20`                  | Tamaño máximo permitido por archivo (en MB)            |
| `GEMINI_API_KEY`      | ✅        | —                     | API Key de Google Generative AI (Gemini)               |
| `R2_ACCESS_KEY_ID`    | ✅        | —                     | Access Key ID de Cloudflare R2                         |
| `R2_SECRET_ACCESS_KEY`| ✅        | —                     | Secret Access Key de Cloudflare R2                     |
| `R2_ENDPOINT` / `ENPOINT` | ✅    | —                     | Endpoint URL de Cloudflare R2                          |
| `R2_BUCKET_NAME`      | ❌        | `rag-documents`       | Nombre del Bucket en Cloudflare R2                     |

---

## Ejemplos con cURL

### 1. Autenticación (Registro e Inicio de Sesión)

```bash
# Registro
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@ejemplo.com", "password": "Password123"}'

# Login (guarda cookies en archivo cookies.txt)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "dev@ejemplo.com", "password": "Password123"}'
```

### 2. Subida de Documento para RAG

```bash
curl -X POST http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>" \
  -F "file=@/ruta/a/tu/archivo.pdf"
```

### 3. Listar Documentos y Estado de Procesamiento

```bash
curl -X GET http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>"
```

### 4. Crear un Chat

```bash
curl -X POST http://localhost:3000/api/v1/chats \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Chat de Preguntas Técnicas"}'
```

### 5. Enviar Mensaje con Respuesta RAG

```bash
curl -X POST http://localhost:3000/api/v1/chats/<CHAT_ID>/messages \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"content": "¿Cuáles son los requisitos de instalación detallados en el manual?"}'
```

---

## Tabla Resumen de Endpoints

| Método | Endpoint                             | Auth  | Rate Limit    | Descripción                                           |
|--------|--------------------------------------|:-----:|:-------------:|-------------------------------------------------------|
| `GET`  | `/health`                            | ❌    | —             | Chequeo de estado del servidor                        |
| `POST` | `/api/v1/auth/register`              | ❌    | 10/hora       | Registro de nuevo usuario                             |
| `POST` | `/api/v1/auth/login`                 | ❌    | 5/15min       | Inicio de sesión y entrega de tokens                  |
| `POST` | `/api/v1/auth/refresh`               | 🍪    | 30/hora       | Rotación y renovación de tokens                       |
| `GET`  | `/api/v1/auth/me`                    | 🔑    | —             | Perfil del usuario autenticado                        |
| `POST` | `/api/v1/auth/logout`                | 🔑    | —             | Cierre de sesión e invalidación de token              |
| `POST` | `/api/v1/documents`                  | 🔑    | —             | Subir documento e iniciar ingesta RAG                 |
| `GET`  | `/api/v1/documents`                  | 🔑    | —             | Listar documentos del usuario                         |
| `GET`  | `/api/v1/documents/:id`              | 🔑    | —             | Detalle de documento y fragmentos (*chunks*)          |
| `DELETE`| `/api/v1/documents/:id`             | 🔑    | —             | Eliminar documento y archivo físico                   |
| `POST` | `/api/v1/documents/:id/reprocess`    | 🔑    | —             | Re-ejecutar pipeline RAG para el documento            |
| `POST` | `/api/v1/chats`                      | 🔑    | —             | Crear nueva conversación                              |
| `GET`  | `/api/v1/chats`                      | 🔑    | —             | Listar conversaciones activas                         |
| `GET`  | `/api/v1/chats/:id`                  | 🔑    | —             | Obtener conversación con mensajes completos           |
| `DELETE`| `/api/v1/chats/:id`                 | 🔑    | —             | Eliminar conversación y mensajes asociados            |
| `POST` | `/api/v1/chats/:id/messages`         | 🔑    | 30/min        | Preguntar en el chat (Búsqueda pgvector + LLM Gemini) |

*Leyenda: ❌ = Público | 🔑 = Requiere `Authorization: Bearer <token>` | 🍪 = Requiere cookie `refreshToken`*
