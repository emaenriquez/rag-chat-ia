# 📡 Documentación de la API — RAG Backend

**Base URL**: `http://localhost:3000/api/v1`  
**Versión**: `1.0.0`  
**Formato**: JSON  
**Autenticación**: Bearer Token (JWT)

---

## Índice

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Registro de Usuario](#registro-de-usuario)
   - [Inicio de Sesión](#inicio-de-sesión)
   - [Renovar Access Token](#renovar-access-token)
   - [Obtener Perfil del Usuario](#obtener-perfil-del-usuario)
   - [Cerrar Sesión](#cerrar-sesión)
4. [Formato de Respuestas](#formato-de-respuestas)
5. [Códigos de Error](#códigos-de-error)
6. [Rate Limiting](#rate-limiting)
7. [Modelos de Datos](#modelos-de-datos)
8. [Variables de Entorno](#variables-de-entorno)
9. [Ejemplos con cURL](#ejemplos-con-curl)

---

## Información General

### Convenciones

- Todas las rutas de la API están prefijadas con `/api/v1`.
- Todas las respuestas siguen el formato estándar con el campo `success: boolean`.
- Las fechas se devuelven en formato **ISO 8601** (`2026-08-11T16:10:40.000Z`).
- Los IDs son **UUID v4** (`550e8400-e29b-41d4-a716-446655440000`).
- Los refresh tokens se transmiten exclusivamente vía **cookies HTTP-only**.
- Los access tokens se transmiten vía header `Authorization: Bearer <token>`.

### Headers Requeridos

| Header           | Valor                      | Cuándo                               |
|------------------|----------------------------|--------------------------------------|
| `Content-Type`   | `application/json`         | En todas las peticiones con body      |
| `Authorization`  | `Bearer <access_token>`    | En endpoints que requieren autenticación |

### Cookies

| Cookie          | Descripción                          | Configuración                           |
|-----------------|--------------------------------------|-----------------------------------------|
| `refreshToken`  | Token opaco para renovar la sesión   | `httpOnly`, `secure` (prod), `sameSite: strict`, 30 días |

---

## Autenticación

La API usa un sistema de **JWT con rotación de refresh tokens**:

1. El usuario se autentica con `POST /auth/login` y recibe:
   - Un **access token** (JWT, corta duración: 15 min) en el body de la respuesta.
   - Un **refresh token** (opaco, larga duración: 30 días) en una cookie HTTP-only.

2. Para acceder a rutas protegidas, el cliente envía el access token en el header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

3. Cuando el access token expira, el cliente llama a `POST /auth/refresh` para obtener uno nuevo. El refresh token anterior se invalida y se emite uno nuevo (**rotación**).

### Estructura del JWT (Access Token)

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User ID
  "email": "usuario@ejemplo.com",                  // Email del usuario
  "iat": 1723392640,                                // Issued At (Unix timestamp)
  "exp": 1723393540                                 // Expiration (Unix timestamp)
}
```

---

## Endpoints

---

### Health Check

Verifica que el servidor está funcionando correctamente.

```
GET /health
```

> **Nota**: Este endpoint está en la raíz, no bajo `/api/v1`.

#### Respuesta exitosa — `200 OK`

```json
{
  "status": "ok",
  "timeStamp": "2026-08-11T19:10:40.000Z"
}
```

---

### Registro de Usuario

Crea una nueva cuenta de usuario.

```
POST /api/v1/auth/register
```

#### Headers

| Header         | Valor              | Requerido |
|----------------|--------------------| --------- |
| `Content-Type` | `application/json` | ✅        |

#### Body (JSON)

| Campo      | Tipo     | Requerido | Reglas de Validación                                                              |
|------------|----------|-----------|-----------------------------------------------------------------------------------|
| `email`    | `string` | ✅        | Formato de email válido                                                           |
| `password` | `string` | ✅        | Mínimo 8 caracteres, al menos 1 mayúscula, al menos 1 número                     |

#### Ejemplo de body

```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123"
}
```

#### Respuesta exitosa — `201 Created`

```json
{
  "success": true,
  "message": "usuario creado"
}
```

#### Respuestas de error

**`400 Bad Request`** — Validación fallida
```json
{
  "success": false,
  "message": "validacion error",
  "errors": {
    "email": ["Email Invalido"],
    "password": ["minimo 8 caracteres", "Debe tener al menos una mayúscula"]
  }
}
```

**`409 Conflict`** — Email ya registrado
```json
{
  "success": false,
  "messsage": "emaiil ya esta registrado"
}
```

**`429 Too Many Requests`** — Rate limit excedido
```json
{
  "success": false,
  "message": "Demasiados intentos de registro, por favor intente nuevamente más tarde"
}
```

#### Rate Limit

| Ventana | Máximo |
|---------|--------|
| 1 hora  | 10 peticiones |

---

### Inicio de Sesión

Autentica a un usuario existente y devuelve tokens de acceso.

```
POST /api/v1/auth/login
```

#### Headers

| Header         | Valor              | Requerido |
|----------------|--------------------| --------- |
| `Content-Type` | `application/json` | ✅        |

#### Body (JSON)

| Campo      | Tipo     | Requerido | Reglas de Validación     |
|------------|----------|-----------|--------------------------|
| `email`    | `string` | ✅        | Formato de email válido  |
| `password` | `string` | ✅        | No vacío (mínimo 1 char) |

#### Ejemplo de body

```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123"
}
```

#### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzdWFyaW9AZWplbXBsby5jb20iLCJpYXQiOjE3MjMzOTI2NDAsImV4cCI6MTcyMzM5MzU0MH0.xxxxx",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com"
  }
}
```

**Cookies establecidas**:
```
Set-Cookie: refreshToken=abc123...hex...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000000; Path=/
```

#### Respuestas de error

**`400 Bad Request`** — Validación fallida
```json
{
  "success": false,
  "message": "validacion error",
  "errors": {
    "email": ["Invalid email"]
  }
}
```

**`401 Unauthorized`** — Credenciales inválidas
```json
{
  "success": false,
  "message": "credenciales invalidas"
}
```

**`429 Too Many Requests`** — Rate limit excedido
```json
{
  "success": false,
  "message": "Demasiados intentos de inicio de sesión, por favor intente nuevamente más tarde"
}
```

#### Rate Limit

| Ventana     | Máximo |
|-------------|--------|
| 15 minutos  | 5 peticiones |

---

### Renovar Access Token

Usa el refresh token (cookie) para obtener un nuevo access token. Implementa **rotación de refresh tokens**: el token anterior se invalida y se emite uno nuevo.

```
POST /api/v1/auth/refresh
```

#### Headers

No requiere headers especiales. El refresh token se envía automáticamente via cookie.

#### Cookies requeridas

| Cookie         | Descripción            |
|----------------|------------------------|
| `refreshToken` | Token de refresco activo |

#### Body

No requiere body.

#### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Cookies actualizadas**:
```
Set-Cookie: refreshToken=nuevo_token_hex...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000000; Path=/
```

#### Respuestas de error

**`401 Unauthorized`** — Token no proporcionado o inválido/expirado
```json
{
  "success": false,
  "message": "refresh token invalido"
}
```

```json
{
  "success": false,
  "message": "refresh token"
}
```

**`429 Too Many Requests`** — Rate limit excedido
```json
{
  "success": false,
  "message": "Rate limit de refresh token excedido."
}
```

#### Rate Limit

| Ventana | Máximo |
|---------|--------|
| 1 hora  | 30 peticiones |

#### Notas importantes

- Cada refresh genera un **nuevo par de tokens** (access + refresh).
- El refresh token anterior queda **invalidado** permanentemente.
- Si un refresh token es usado dos veces, la segunda vez falla (detección de robo de token).

---

### Obtener Perfil del Usuario

Retorna la información del usuario autenticado.

```
GET /api/v1/auth/me
```

#### Headers

| Header          | Valor                     | Requerido |
|-----------------|---------------------------| --------- |
| `Authorization` | `Bearer <access_token>`   | ✅        |

#### Body

No requiere body.

#### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "createdAt": "2026-08-11T19:10:40.000Z"
  }
}
```

#### Respuestas de error

**`401 Unauthorized`** — Token no proporcionado
```json
{
  "success": false,
  "message": "token no proporcionado"
}
```

**`401 Unauthorized`** — Token inválido o expirado
```json
{
  "success": false,
  "message": "token invalido"
}
```

**`404 Not Found`** — Usuario no encontrado en la base de datos
```json
{
  "success": false,
  "message": "usuario no encontrado"
}
```

---

### Cerrar Sesión

Invalida el refresh token del usuario y limpia la cookie.

```
POST /api/v1/auth/logout
```

#### Headers

| Header          | Valor                     | Requerido |
|-----------------|---------------------------| --------- |
| `Authorization` | `Bearer <access_token>`   | ✅        |

#### Body

No requiere body.

#### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "sesion cerrada"
}
```

**Cookies eliminadas**:
```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

#### Respuestas de error

**`401 Unauthorized`** — Token no proporcionado o inválido
```json
{
  "success": false,
  "message": "token no proporcionado"
}
```

#### Notas

- El refresh token almacenado en la base de datos se elimina.
- La cookie `refreshToken` se limpia del navegador.
- El access token (JWT) **sigue siendo válido** hasta que expire. Para invalidarlo antes, el frontend debe descartarlo localmente.

---

## Formato de Respuestas

Todas las respuestas siguen un formato consistente:

### Respuesta exitosa

```json
{
  "success": true,
  "message": "descripción opcional",
  "data": {}
}
```

### Respuesta de error

```json
{
  "success": false,
  "message": "descripción del error",
  "errors": {}
}
```

### Campos comunes

| Campo     | Tipo      | Presente en | Descripción                                    |
|-----------|-----------|-------------|------------------------------------------------|
| `success` | `boolean` | Siempre     | Indica si la operación fue exitosa              |
| `message` | `string`  | Siempre     | Mensaje descriptivo                             |
| `errors`  | `object`  | Solo errores de validación | Errores por campo del body |

---

## Códigos de Error

| Código | Significado             | Cuándo se usa                                             |
|--------|-------------------------|-----------------------------------------------------------|
| `200`  | OK                      | Operación exitosa                                          |
| `201`  | Created                 | Recurso creado exitosamente (registro)                     |
| `400`  | Bad Request             | Datos de entrada inválidos (validación Zod)                |
| `401`  | Unauthorized            | Sin token, token expirado, credenciales inválidas          |
| `404`  | Not Found               | Recurso no encontrado                                      |
| `409`  | Conflict                | Recurso ya existe (email duplicado)                        |
| `429`  | Too Many Requests       | Rate limit excedido                                        |
| `500`  | Internal Server Error   | Error interno no manejado                                  |

---

## Rate Limiting

La API implementa limitación de tasa por IP para prevenir abuso.

| Endpoint        | Ventana de tiempo | Máximo de peticiones | Propósito                   |
|-----------------|-------------------|----------------------|-----------------------------|
| `POST /login`   | 15 minutos        | 5                    | Prevenir fuerza bruta       |
| `POST /register`| 1 hora            | 10                   | Prevenir spam de cuentas    |
| `POST /refresh` | 1 hora            | 30                   | Limitar renovaciones        |
| Chat (futuro)   | 1 minuto          | 30                   | Limitar consultas al chat   |

### Headers de Rate Limit

Cuando se usa `standardHeaders: true`, la respuesta incluye:

| Header                | Descripción                                       |
|-----------------------|---------------------------------------------------|
| `RateLimit-Limit`     | Número máximo de peticiones en la ventana actual   |
| `RateLimit-Remaining` | Peticiones restantes en la ventana actual          |
| `RateLimit-Reset`     | Timestamp Unix cuando la ventana se reinicia       |

---

## Modelos de Datos

### User

| Campo         | Tipo       | Descripción                        |
|---------------|------------|------------------------------------|
| `id`          | `UUID`     | Identificador único                |
| `email`       | `string`   | Email del usuario (único)          |
| `passwordHash`| `string`   | Hash bcrypt de la contraseña       |
| `createdAt`   | `DateTime` | Fecha de creación                  |
| `updatedAt`   | `DateTime` | Fecha de última actualización      |

### RefreshToken

| Campo       | Tipo       | Descripción                          |
|-------------|------------|--------------------------------------|
| `id`        | `UUID`     | Identificador único                  |
| `userId`    | `UUID`     | Referencia al usuario (FK)           |
| `tokenHash` | `string`  | Hash SHA-256 del token               |
| `expiresAt` | `DateTime`| Fecha de expiración                  |
| `createdAt` | `DateTime`| Fecha de creación                    |

### Document

| Campo         | Tipo        | Descripción                           |
|---------------|-------------|---------------------------------------|
| `id`          | `UUID`      | Identificador único                   |
| `userId`      | `UUID`      | Referencia al usuario (FK)            |
| `filename`    | `string`    | Nombre del archivo en el sistema      |
| `originalName`| `string`    | Nombre original del archivo           |
| `mimeType`    | `string?`   | Tipo MIME del archivo                 |
| `fileSize`    | `BigInt?`   | Tamaño en bytes                       |
| `storagePath` | `string`    | Ruta de almacenamiento                |
| `status`      | `string`    | Estado del procesamiento (`uploaded`, etc.) |
| `createdAt`   | `DateTime`  | Fecha de creación                     |
| `updatedAt`   | `DateTime`  | Fecha de última actualización         |

### DocumentChunk

| Campo        | Tipo       | Descripción                              |
|--------------|------------|------------------------------------------|
| `id`         | `UUID`     | Identificador único                      |
| `documentId` | `UUID`    | Referencia al documento (FK)             |
| `chunkIndex` | `int`     | Índice del fragmento dentro del documento |
| `content`    | `string`  | Contenido textual del fragmento          |
| `tokens`     | `int`     | Cantidad de tokens del fragmento         |
| `createdAt`  | `DateTime`| Fecha de creación                        |

### Chat

| Campo       | Tipo       | Descripción                      |
|-------------|------------|----------------------------------|
| `id`        | `UUID`     | Identificador único              |
| `userId`    | `UUID`     | Referencia al usuario (FK)       |
| `title`     | `string?`  | Título del chat (opcional)       |
| `createdAt` | `DateTime` | Fecha de creación                |
| `updatedAt` | `DateTime` | Fecha de última actualización    |

### Message

| Campo       | Tipo       | Descripción                              |
|-------------|------------|------------------------------------------|
| `id`        | `UUID`     | Identificador único                      |
| `chatId`    | `UUID`     | Referencia al chat (FK)                  |
| `role`      | `string`   | Rol del mensaje (`user`, `assistant`, etc.) |
| `content`   | `string`   | Contenido del mensaje                    |
| `createdAt` | `DateTime` | Fecha de creación                        |

### SourceReference

| Campo            | Tipo       | Descripción                                 |
|------------------|------------|---------------------------------------------|
| `id`             | `UUID`     | Identificador único                         |
| `messageId`      | `UUID`     | Referencia al mensaje (FK)                  |
| `chunkId`        | `UUID`     | Referencia al fragmento de documento (FK)   |
| `similarityScore`| `Decimal?` | Score de similaridad del chunk con la query |

### AuditLog

| Campo       | Tipo       | Descripción                          |
|-------------|------------|--------------------------------------|
| `id`        | `UUID`     | Identificador único                  |
| `userId`    | `UUID?`    | Referencia al usuario (FK, opcional) |
| `action`    | `string`   | Acción realizada                     |
| `entity`    | `string?`  | Entidad afectada                     |
| `entityId`  | `string?`  | ID de la entidad afectada            |
| `metadata`  | `JSON?`    | Datos adicionales de la acción       |
| `createdAt` | `DateTime` | Fecha de creación                    |

---

## Variables de Entorno

| Variable              | Requerida | Default                      | Descripción                              |
|-----------------------|-----------|------------------------------|------------------------------------------|
| `PORT`                | ❌        | `3000`                       | Puerto del servidor HTTP                  |
| `NODE_ENV`            | ❌        | `development`                | Entorno de ejecución                      |
| `DATABASE_URL`        | ✅        | —                            | URL de conexión a PostgreSQL              |
| `JWT_SECRET`          | ✅        | —                            | Clave secreta para firmar access tokens   |
| `JWT_REFRESH_SECRET`  | ✅        | —                            | Clave secreta para refresh tokens         |
| `JWT_ACCESS_EXPIRES`  | ❌        | `15m`                        | Duración del access token                 |
| `JWT_REFRESH_EXPIRES` | ❌        | `30d`                        | Duración del refresh token                |
| `FRONTEND_URL`        | ❌        | `http://localhost:5173`      | URL del frontend (para CORS)              |

### Ejemplo de `.env`

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:root@localhost:5432/ragvector
JWT_SECRET=cambia_esto_por_un_string_aleatorio_muy_largo_aqui
JWT_REFRESH_SECRET=otro_string_diferente_aleatorio_muy_largo_aqui
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
FRONTEND_URL=http://localhost:5173
```

---

## Ejemplos con cURL

### Registro

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123"
  }'
```

> `-c cookies.txt` guarda las cookies (incluido el refreshToken) en un archivo.

### Obtener perfil

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Renovar token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

> `-b cookies.txt` envía las cookies guardadas. `-c cookies.txt` actualiza con la nueva cookie.

### Cerrar sesión

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -b cookies.txt
```

### Health check

```bash
curl http://localhost:3000/health
```

---

## Resumen de Endpoints

| Método | Endpoint                    | Auth  | Rate Limit        | Descripción                  |
|--------|-----------------------------|-------|--------------------|------------------------------|
| `GET`  | `/health`                   | ❌    | —                  | Estado del servidor           |
| `POST` | `/api/v1/auth/register`     | ❌    | 10/hora            | Registrar usuario             |
| `POST` | `/api/v1/auth/login`        | ❌    | 5/15min            | Iniciar sesión                |
| `POST` | `/api/v1/auth/refresh`      | 🍪    | 30/hora            | Renovar access token          |
| `GET`  | `/api/v1/auth/me`           | 🔑    | —                  | Obtener perfil del usuario    |
| `POST` | `/api/v1/auth/logout`       | 🔑    | —                  | Cerrar sesión                 |

**Leyenda**: ❌ = Sin auth | 🔑 = Bearer Token | 🍪 = Cookie (refreshToken)
