# 📖 Explicación Detallada del Código — RAG Backend

## Índice

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Flujo General de la Aplicación](#flujo-general-de-la-aplicación)
4. [Archivos de Configuración Raíz](#archivos-de-configuración-raíz)
5. [Capa de Configuración (`src/config/`)](#capa-de-configuración)
6. [Capa de Modelos / Schemas (`src/models/`)](#capa-de-modelos--schemas)
7. [Capa de Middleware (`src/middleware/`)](#capa-de-middleware)
8. [Capa de Controladores (`src/controller/`)](#capa-de-controladores)
9. [Capa de Rutas (`src/routes/`)](#capa-de-rutas)
10. [Punto de Entrada de la App (`src/app.ts`)](#punto-de-entrada-de-la-app)
11. [Servidor (`src/server.ts`)](#servidor)
12. [Esquema de Base de Datos (`prisma/schema.prisma`)](#esquema-de-base-de-datos)
13. [Diagrama de Flujo de Autenticación](#diagrama-de-flujo-de-autenticación)

---

## Visión General del Proyecto

Este proyecto es un **backend API REST** construido con **Node.js + TypeScript** usando el framework **Express 5**. Sirve como la capa de servidor para una aplicación de **RAG (Retrieval-Augmented Generation)**, un sistema que permite a los usuarios subir documentos, hacerles preguntas y obtener respuestas basadas en el contenido de esos documentos usando inteligencia artificial.

### Stack Tecnológico

| Tecnología          | Propósito                                         |
|---------------------|---------------------------------------------------|
| **Express 5**       | Framework HTTP para manejar rutas y middleware     |
| **TypeScript**      | Tipado estático sobre JavaScript                   |
| **Prisma 7**        | ORM para interactuar con PostgreSQL                |
| **PostgreSQL**      | Base de datos relacional                           |
| **Zod 4**           | Validación de datos de entrada (schemas)           |
| **bcryptjs**        | Hashing seguro de contraseñas                      |
| **jsonwebtoken**    | Generación y verificación de JWT (access tokens)   |
| **helmet**          | Cabeceras HTTP de seguridad                        |
| **cors**            | Control de acceso entre orígenes (Cross-Origin)    |
| **express-rate-limit** | Protección contra abuso (rate limiting)         |
| **cookie-parser**   | Lectura de cookies HTTP (refresh tokens)           |
| **multer**          | Manejo de subida de archivos (preparado, no usado aún) |

---

## Estructura de Carpetas

```
back/
├── prisma/
│   ├── schema.prisma          # Definición del esquema de la base de datos
│   └── migrations/            # Migraciones generadas por Prisma
├── src/
│   ├── config/
│   │   ├── database.ts        # Conexión a PostgreSQL con Prisma Client
│   │   └── env.ts             # Carga y validación de variables de entorno
│   ├── controller/
│   │   └── authController.ts  # Lógica de negocio de autenticación
│   ├── middleware/
│   │   ├── autheticate.ts     # Middleware para verificar JWT en rutas protegidas
│   │   ├── errorHandler.ts    # Middleware global para capturar errores
│   │   ├── rateLimit.ts       # Limitadores de tasa para prevenir abuso
│   │   └── validate.ts        # Middleware genérico de validación con Zod
│   ├── models/
│   │   └── auth.schema.ts     # Schemas Zod para validar datos de autenticación
│   ├── routes/
│   │   ├── auth.routes.ts     # Definición de rutas de autenticación
│   │   └── index.ts           # Agrupador central de todas las rutas
│   ├── app.ts                 # Configuración de Express (middlewares, rutas)
│   └── server.ts              # Punto de entrada: arranca el servidor
├── .env                       # Variables de entorno (NO versionar)
├── package.json               # Dependencias y scripts npm
├── prisma.config.ts           # Configuración de Prisma 7
└── tsconfig.ts                # Configuración de TypeScript
```

---

## Flujo General de la Aplicación

```
1. server.ts se ejecuta
   ├── Carga variables de entorno (env.ts)
   ├── Conecta a PostgreSQL vía Prisma (database.ts)
   └── Arranca Express en el puerto configurado

2. Una petición HTTP llega al servidor
   ├── Pasa por middlewares globales (app.ts):
   │   ├── helmet()        → Seguridad de cabeceras
   │   ├── cors()          → Validación de origen
   │   ├── express.json()  → Parsea body JSON
   │   ├── express.urlencoded() → Parsea body URL-encoded
   │   └── cookieParser()  → Parsea cookies
   │
   ├── Si la ruta es GET /health → Responde estado del servidor
   │
   ├── Si la ruta comienza con /api/v1 → Entra al router principal (routes/index.ts)
   │   └── /api/v1/auth/* → Entra a auth.routes.ts
   │       ├── Middleware de validación (validate.ts + auth.schema.ts)
   │       ├── Middleware de rate limiting (rateLimit.ts)
   │       ├── Middleware de autenticación (autheticate.ts) [solo rutas protegidas]
   │       └── Controlador (authController.ts) → Ejecuta la lógica de negocio
   │
   └── Si ocurre un error → errorHandler.ts lo captura y responde
```

---

## Archivos de Configuración Raíz

### `package.json`

Define las dependencias del proyecto y los scripts de ejecución.

```json
"scripts": {
    "dev": "nodemon --exec tsx src/server.ts",  // Desarrollo con hot-reload
    "build": "tsc",                              // Compila TypeScript a JavaScript
    "start": "node dist/server.js",              // Ejecuta la versión compilada
    "db:generate": "prisma generate",            // Genera el Prisma Client
    "db:migrate": "prisma migrate dev",          // Crea/aplica migraciones
    "db:studio": "prisma studio"                 // Abre el explorador visual de datos
}
```

- **`npm run dev`**: Usa `nodemon` para reiniciar automáticamente cuando detecta cambios en archivos `.ts` o `.json`. Usa `tsx` como ejecutor de TypeScript sin necesidad de compilar previamente.
- **`type: "module"`**: El proyecto usa ESModules (`import/export`) en lugar de CommonJS (`require/module.exports`).

---

### `tsconfig.ts`

Configura el compilador de TypeScript:

```json
{
    "compilerOptions": {
        "target": "ES2022",              // Código generado compatible con ES2022
        "module": "NodeNext",            // Sistema de módulos nativo de Node.js
        "moduleResolution": "NodeNext",  // Resolución de módulos estilo Node.js moderno
        "rootDir": "./src",              // Carpeta raíz del código fuente
        "outDir": "./dist",              // Carpeta de salida para código compilado
        "strict": true,                  // Modo estricto de TypeScript
        "esModuleInterop": true,         // Interoperabilidad con módulos CommonJS
        "skipLibCheck": true             // No verifica tipos de archivos .d.ts externos
    },
    "include": ["src/**/*"],             // Solo compila archivos dentro de src/
    "exclude": ["node_modules", "dist"]  // Ignora estas carpetas
}
```

---

### `prisma.config.ts`

Archivo de configuración de **Prisma 7** (nueva versión). Define dónde encontrar el esquema y las migraciones, y de dónde obtener la URL de conexión a la base de datos.

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",     // Ubicación del esquema
  migrations: {
    path: "prisma/migrations",        // Ubicación de las migraciones
  },
  datasource: {
    url: process.env["DATABASE_URL"], // URL de conexión desde .env
  },
});
```

> **Nota**: En Prisma 7 la URL del datasource se configura aquí en lugar de en `schema.prisma`. Esta es una **breaking change** respecto a versiones anteriores.

---

### `.env`

Variables de entorno que configuran el comportamiento de la aplicación:

| Variable              | Descripción                                     | Valor ejemplo                                    |
|-----------------------|-------------------------------------------------|--------------------------------------------------|
| `PORT`                | Puerto del servidor HTTP                         | `3000`                                           |
| `NODE_ENV`            | Entorno de ejecución                             | `development`                                    |
| `DATABASE_URL`        | URL de conexión a PostgreSQL                     | `postgresql://postgres:root@localhost:5432/ragvector` |
| `JWT_SECRET`          | Clave secreta para firmar access tokens          | (cadena aleatoria larga)                          |
| `JWT_REFRESH_SECRET`  | Clave secreta para refresh tokens                | (cadena aleatoria diferente)                      |
| `JWT_ACCESS_EXPIRES`  | Tiempo de vida del access token                  | `15m`                                            |
| `JWT_REFRESH_EXPIRES` | Tiempo de vida del refresh token                 | `30d`                                            |
| `FRONTEND_URL`        | URL del frontend (para configurar CORS)          | `http://localhost:5173`                           |

---

## Capa de Configuración

### `src/config/env.ts`

**Propósito**: Carga, valida y centraliza el acceso a todas las variables de entorno.

```typescript
import 'dotenv/config';
```
- Carga las variables del archivo `.env` al `process.env` al momento de importar este módulo.

#### `function required(key: string): string`
- **Qué hace**: Busca una variable de entorno por nombre. Si no existe, **lanza un error** que detiene la aplicación inmediatamente.
- **Por qué existe**: Falla rápido al arrancar en lugar de fallar después con errores crípticos en tiempo de ejecución.
- **Parámetro**: `key` — El nombre de la variable de entorno (ej: `"JWT_SECRET"`).
- **Retorna**: El valor de la variable como string.

#### `export const env`
- **Qué hace**: Exporta un objeto con todas las variables de entorno ya parseadas y tipadas.
- **Campos**:
  - `port`: Número del puerto (default: `3000`).
  - `nodeEnv`: Entorno (`"development"` por defecto).
  - `databaseUrl`: URL de la base de datos (**requerida**).
  - `jwtSecret`: Clave secreta para JWT (**requerida**).
  - `jwtRefreshSecret`: Clave para refresh tokens (**requerida**).
  - `jwtAccessExpires`: Duración del access token (default: `"15m"`).
  - `jwtRefreshExpires`: Duración del refresh token (default: `"30d"`).
  - `frontendUrl`: URL del frontend para CORS (default: `"http://localhost:5173"`).

---

### `src/config/database.ts`

**Propósito**: Crea y exporta una instancia única del Prisma Client para interactuar con PostgreSQL.

```typescript
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
```
- **`PrismaPg`**: Adaptador de Prisma 7 que usa el driver nativo `pg` (node-postgres) en lugar del binario propio de Prisma. Esto da más control sobre la conexión.

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
```
- **Patrón Singleton**: Almacena la instancia de Prisma en `globalThis` para evitar crear múltiples conexiones durante hot-reload en desarrollo. Cuando `nodemon` reinicia el proceso, el módulo se re-evalúa, pero `globalThis` persiste en el mismo proceso.

```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ['query', 'error', 'warn'] })
```
- **Qué hace**: Reutiliza la instancia existente o crea una nueva.
- **`log: ['query', 'error', 'warn']`**: Activa logging de todas las queries SQL, errores y advertencias de Prisma en la consola.

```typescript
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
```
- En producción **no** guarda la referencia global (no es necesario porque no hay hot-reload).

---

## Capa de Modelos / Schemas

### `src/models/auth.schema.ts`

**Propósito**: Define las reglas de validación para los datos de entrada de autenticación usando **Zod**.

#### `registerSchema`
```typescript
export const registerSchema = z.object({
    email: z.string().email({ message: 'Email Invalido' }),
    password: z.string()
        .min(8, { message: 'minimo 8 caracteres' })
        .regex(/[A-Z]/, { message: 'Debe tener al menos una mayúscula' })
        .regex(/[0-9]/, { message: 'Debe tener al menos un número' }),
})
```
- **Qué valida**:
  - `email`: Debe ser un string con formato de email válido.
  - `password`: Mínimo 8 caracteres, al menos una letra mayúscula, al menos un número.
- **Cuándo se usa**: En la ruta `POST /api/v1/auth/register`.

#### `loginSchema`
```typescript
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
})
```
- **Qué valida**:
  - `email`: Formato de email válido.
  - `password`: Al menos 1 carácter (no vacío). La validación es menos estricta porque el login solo necesita verificar contra la base de datos.
- **Cuándo se usa**: En la ruta `POST /api/v1/auth/login`.

#### Tipos inferidos
```typescript
export type registerSchema = z.infer<typeof registerSchema>
export type loginSchema = z.infer<typeof loginSchema>
```
- **Qué hacen**: Generan tipos TypeScript automáticamente desde los schemas Zod. Así el tipo de datos siempre está sincronizado con las reglas de validación.

---

## Capa de Middleware

### `src/middleware/validate.ts`

**Propósito**: Middleware genérico que valida el `req.body` contra cualquier schema Zod.

#### `validate(schema: z.ZodSchema)`
```typescript
export const validate = (schema: z.ZodSchema) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body)
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: 'validacion error',
                errors: result.error.flatten().fieldErrors,
            })
            return;
        }
        req.body = result.data
        next()
    }
```
- **Qué hace**: Es una **Higher-Order Function** (función que retorna otra función). Recibe un schema Zod y retorna un middleware de Express.
- **Flujo**:
  1. Usa `safeParse()` para validar sin lanzar excepciones.
  2. Si la validación **falla**: Responde con `400 Bad Request` y los errores detallados por campo.
  3. Si la validación **pasa**: Reemplaza `req.body` con los datos sanitizados (Zod puede transformar/limpiar datos) y llama a `next()`.
- **`flatten().fieldErrors`**: Transforma los errores de Zod en un objeto simple `{ campo: ["error1", "error2"] }` fácil de consumir desde el frontend.

---

### `src/middleware/autheticate.ts`

**Propósito**: Protege rutas verificando que el request incluya un JWT válido.

#### `interface AuthPayload`
```typescript
export interface AuthPayload {
    sub: string,    // ID del usuario
    email: string,  // Email del usuario
    iat: number,    // Issued At (cuándo se creó el token)
    exp: number     // Expiration (cuándo expira)
}
```
- Define la estructura del payload decodificado del JWT.

#### Extensión de tipos de Express
```typescript
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload
        }
    }
}
```
- **Qué hace**: Extiende la interfaz `Request` de Express globalmente para agregar la propiedad `user`. Esto permite acceder a `req.user` en cualquier controlador sin errores de TypeScript.

> **⚠️ Nota**: Hay una inconsistencia en el código. La declaración global define `auser?` (línea 16 del archivo original), pero el middleware asigna a `req.user` (línea 30). Los controladores también usan `req.user`. Esto funciona porque TypeScript no verifica estrictamente las propiedades extra en runtime.

#### `authenticate(req, res, next)`
```typescript
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'token no proporcionado' })
        return;
    }
    const token = authHeader.split(' ')[1]
    try {
        const payload = jwt.verify(token, env.jwtSecret) as AuthPayload
        req.user = payload;
        next()
    } catch {
        res.status(401).json({ success: false, message: 'token invalido' })
    }
}
```
- **Flujo**:
  1. Extrae el header `Authorization`.
  2. Verifica que comience con `"Bearer "`. Si no, responde `401`.
  3. Extrae el token (todo lo que va después de `"Bearer "`).
  4. Usa `jwt.verify()` para decodificar y verificar la firma del token.
  5. Si es válido, adjunta el payload a `req.user` y llama a `next()`.
  6. Si `verify()` lanza error (token expirado, firma inválida, etc.), responde `401`.

---

### `src/middleware/errorHandler.ts`

**Propósito**: Middleware global para capturar errores no manejados en la aplicación.

#### `errorHandler(res, req, next, err)`
```typescript
export const errorHandler = (res: Response, req: Request, next: NextFunction, err: Error): void => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : err.message,
    })
}
```
- **Qué hace**: Captura cualquier error que se propague sin ser manejado.
- **En desarrollo**: Muestra el mensaje de error real en la respuesta (útil para debugging).
- **En producción**: Muestra un mensaje genérico para no exponer detalles internos.

> **⚠️ Bug detectado**: La firma de los parámetros está invertida. Express espera `(err, req, res, next)` pero el código tiene `(res, req, next, err)`. Esto puede causar que el error handler no funcione correctamente.

---

### `src/middleware/rateLimit.ts`

**Propósito**: Define limitadores de tasa para prevenir abuso en diferentes endpoints.

#### `LoginLimiter`
```typescript
export const LoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // Ventana de 15 minutos
    max: 5,                     // Máximo 5 intentos por ventana
    standardHeaders: true,      // Envía headers RateLimit-* estándar
    legacyHeaders: false,       // No envía headers X-RateLimit-* legacy
    message: { success: false, message: 'Demasiados intentos de inicio de sesión...' }
})
```
- **Uso**: Protege `POST /login`. Un usuario no puede intentar más de 5 logins cada 15 minutos.

#### `registerLimiter`
```typescript
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // Ventana de 1 hora
    max: 10,                    // Máximo 10 registros por hora
    message: { ... }
})
```
- **Uso**: Protege `POST /register`. Previene la creación masiva de cuentas.

#### `refreshLimiter`
```typescript
export const refreshLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // Ventana de 1 hora
    max: 30,                    // Máximo 30 refreshes por hora
    message: { ... }
})
```
- **Uso**: Protege `POST /refresh`. Limita la cantidad de veces que se puede renovar un token.

#### `chatLimiter`
```typescript
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000,  // Ventana de 1 minuto
    max: 30,               // Máximo 30 consultas por minuto
    message: { ... }
})
```
- **Uso**: Preparado para proteger endpoints de chat (aún no implementados en las rutas).

---

## Capa de Controladores

### `src/controller/authController.ts`

**Propósito**: Contiene toda la lógica de negocio de autenticación. Es el archivo más denso del proyecto.

---

#### `generateAccessToken(userId: string, email: string): string`
```typescript
function generateAccessToken(userId: string, email: string): string {
    return jwt.sign(
        { sub: userId, email },
        env.jwtSecret,
        { expiresIn: env.jwtAccessExpires as jwt.SignOptions['expiresIn'] }
    )
}
```
- **Qué hace**: Genera un **JWT access token** firmado con `jwtSecret`.
- **Payload del token**: `{ sub: "user-uuid", email: "user@email.com" }`.
- **Expiración**: Configurable vía `.env` (default: 15 minutos).
- **Uso**: Se llama en `login` y `refresh` para generar nuevos access tokens.

---

#### `createRefreshToken(userId: string): Promise<string>`
```typescript
async function createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex')              // 1
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')  // 2
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)                      // 3
    await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } }) // 4
    return token                                                      // 5
}
```
- **Flujo**:
  1. Genera 64 bytes aleatorios y los convierte a hexadecimal → el **refresh token raw**.
  2. Hashea el token con SHA-256 → el **hash** que se almacena en la base de datos.
  3. Calcula la fecha de expiración: 30 días desde ahora.
  4. Guarda el hash en la tabla `refresh_tokens`.
  5. Retorna el token **raw** (sin hashear) para enviarlo al cliente via cookie.
- **Seguridad**: Solo se almacena el hash. Si la base de datos se compromete, los tokens raw no se exponen.

---

#### `COOKIE_OPTIONS`
```typescript
const COOKIE_OPTIONS = {
    httpOnly: true,                          // No accesible desde JavaScript del navegador
    secure: env.nodeEnv === 'production',    // Solo HTTPS en producción
    sameSite: 'strict' as const,             // No se envía en requests cross-site
    maxAge: 30 * 24 * 60 * 60 * 1000         // 30 días en milisegundos
}
```
- Configuración de la cookie del refresh token con las mejores prácticas de seguridad:
  - **`httpOnly`**: Previene ataques XSS (JavaScript no puede leer la cookie).
  - **`secure`**: Solo se transmite sobre HTTPS (activo solo en producción).
  - **`sameSite: 'strict'`**: La cookie no se envía en requests desde otros dominios (previene CSRF).

---

#### `register(req, res)`
```typescript
export const register = async (req: Request, res: Response): Promise<void> => { ... }
```
- **Endpoint**: `POST /api/v1/auth/register`
- **Flujo**:
  1. Extrae `email` y `password` del body (ya validados por `validate(registerSchema)`).
  2. Busca si ya existe un usuario con ese email.
  3. Si existe → responde `409 Conflict`.
  4. Hashea la contraseña con bcrypt (factor de costo 12).
  5. Crea el usuario en la base de datos.
  6. Responde `201 Created` con un mensaje de éxito.
- **Nota**: No inicia sesión automáticamente; el usuario debe hacer login después.

---

#### `login(req, res)`
```typescript
export const login = async (req: Request, res: Response): Promise<void> => { ... }
```
- **Endpoint**: `POST /api/v1/auth/login`
- **Flujo**:
  1. Busca el usuario por email.
  2. Si no existe o la contraseña no coincide → responde `401 Unauthorized`.
  3. Genera un access token (JWT).
  4. Crea un refresh token y lo almacena en la base de datos.
  5. Envía el refresh token como **cookie HTTP-only**.
  6. Responde con el access token en el body JSON y los datos básicos del usuario.

---

#### `refresh(req, res)`
```typescript
export const refresh = async (req: Request, res: Response): Promise<void> => { ... }
```
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Flujo (Rotación de Refresh Token)**:
  1. Lee el refresh token de la cookie.
  2. Si no hay cookie → responde `401`.
  3. Hashea el token con SHA-256 y busca en la base de datos.
  4. Verifica que no esté expirado (`expiresAt > now`).
  5. Si no se encuentra o está expirado → responde `401`.
  6. **Elimina** el refresh token usado (ya no es válido).
  7. Genera un **nuevo** access token y un **nuevo** refresh token.
  8. Envía el nuevo refresh token como cookie y el access token en el body.
- **Seguridad**: Este patrón de **rotación de tokens** invalida el token anterior. Si un atacante roba un refresh token y lo usa, el token legítimo del usuario se invalida, lo cual es detectable.

---

#### `me(req, res)`
```typescript
export const me = async (req: Request, res: Response): Promise<void> => { ... }
```
- **Endpoint**: `GET /api/v1/auth/me`
- **Requiere autenticación**: Sí (middleware `authenticate`).
- **Flujo**:
  1. Extrae el `userId` del payload JWT (`req.user!.sub`).
  2. Busca el usuario en la base de datos.
  3. Si no existe → responde `404`.
  4. Responde con `id`, `email` y `createdAt` del usuario.
- **Uso típico**: El frontend llama a este endpoint al cargar la app para verificar si la sesión es válida.

---

#### `logout(req, res)`
```typescript
export const logout = async (req: Request, res: Response): Promise<void> => { ... }
```
- **Endpoint**: `POST /api/v1/auth/logout`
- **Requiere autenticación**: Sí (middleware `authenticate`).
- **Flujo**:
  1. Lee el refresh token de la cookie.
  2. Si existe, hashea el token y elimina todos los registros que coincidan en la base de datos.
  3. Limpia la cookie `refreshToken` del navegador.
  4. Responde con mensaje de éxito.
- **Nota**: `deleteMany` en lugar de `delete` para manejar el caso de que existan duplicados.

---

## Capa de Rutas

### `src/routes/index.ts`

**Propósito**: Punto central de enrutamiento. Agrupa todas las sub-rutas bajo el prefijo `/api/v1`.

```typescript
const router = Router()
router.use('/auth', authRoutes)  // Todas las rutas de auth se montan bajo /auth
export default router
```
- **Resultado**: Las rutas de autenticación quedan en `/api/v1/auth/*`.
- **Escalabilidad**: Para agregar nuevas funcionalidades (ej: documentos, chats), se agregan aquí:
  ```typescript
  router.use('/documents', documentRoutes)
  router.use('/chats', chatRoutes)
  ```

---

### `src/routes/auth.routes.ts`

**Propósito**: Define las rutas específicas de autenticación y les aplica los middlewares correspondientes.

```typescript
const router = Router()

router.post('/register', validate(registerSchema), registerLimiter, register)
router.post('/login',    validate(loginSchema),    LoginLimiter,    login)
router.post('/refresh',  refreshLimiter,            refresh)
router.get('/me',        authenticate,              me)
router.post('/logout',   authenticate,              logout)
```

| Ruta             | Método | Middlewares                                    | Controlador | Auth requerida |
|------------------|--------|------------------------------------------------|-------------|----------------|
| `/register`      | POST   | `validate(registerSchema)` → `registerLimiter` | `register`  | ❌             |
| `/login`         | POST   | `validate(loginSchema)` → `LoginLimiter`       | `login`     | ❌             |
| `/refresh`       | POST   | `refreshLimiter`                               | `refresh`   | ❌ (usa cookie) |
| `/me`            | GET    | `authenticate`                                 | `me`        | ✅ (Bearer JWT) |
| `/logout`        | POST   | `authenticate`                                 | `logout`    | ✅ (Bearer JWT) |

**Orden de middlewares**: Cada request pasa por los middlewares de izquierda a derecha. Si uno falla, los siguientes no se ejecutan.

---

## Punto de Entrada de la App

### `src/app.ts`

**Propósito**: Crea y configura la aplicación Express con todos los middlewares globales.

```typescript
const app = express()

// === Middlewares de seguridad y parsing ===
app.use(helmet())                                              // Cabeceras de seguridad
app.use(cors({ origin: env.frontendUrl, credentials: true }))  // CORS configurado
app.use(express.json({ limit: '10kb' }))                       // Parsea JSON (max 10kb)
app.use(express.urlencoded({ extended: true }))                // Parsea form data
app.use(cookieParser())                                        // Parsea cookies

// === Health Check ===
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timeStamp: new Date().toISOString() })
})

// === Rutas de la API ===
app.use('/api/v1', router)

// === Error Handler global ===
app.use(errorHandler)
```

> **⚠️ Bug detectado en import**: En la línea 3 del archivo original, `helmet` se importa desde `'cookie-parser'` en lugar de desde `'helmet'`. Esto causa que `helmet()` en realidad ejecute `cookieParser()` dos veces en lugar de aplicar las cabeceras de seguridad de helmet.

- **`express.json({ limit: '10kb' })`**: Limita el tamaño del body JSON a 10KB para prevenir ataques de payload grande.
- **`cors({ origin: env.frontendUrl, credentials: true })`**: Solo acepta requests del frontend configurado y permite envío de cookies.
- **Health check**: Endpoint simple en `/health` (fuera de `/api/v1`) para monitoreo/balanceadores de carga.

---

## Servidor

### `src/server.ts`

**Propósito**: Punto de entrada de la aplicación. Conecta a la base de datos y arranca el servidor HTTP.

```typescript
async function main() {
    try {
        await prisma.$connect();                           // Establece conexión a PostgreSQL
        console.log('Conectado a la base de datos');
        app.listen(env.port, () => {                       // Inicia servidor HTTP
            console.log(`Server en http://localhost:${env.port}`);
            console.log(`API en http://localhost:${env.port}/api/v1`);
        });
    } catch (error) {
        console.error('Error al arrancar:', error);
        await prisma.$disconnect();                        // Cierra conexión limpiamente
        process.exit(1);                                   // Termina el proceso con error
    }
}

main();
```

- **Flujo**:
  1. `prisma.$connect()` establece la conexión a PostgreSQL. Si falla (credenciales incorrectas, DB no disponible), lanza un error.
  2. `app.listen()` arranca el servidor HTTP en el puerto configurado.
  3. Si algo falla, desconecta Prisma y termina el proceso con código de error `1`.

---

## Esquema de Base de Datos

### `prisma/schema.prisma`

Define 7 modelos (tablas) con sus relaciones:

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│    User      │────<│ RefreshToken │     │   AuditLog     │
│             │     └──────────────┘     └────────────────┘
│  id (UUID)  │                                │
│  email      │────<──────────────────────────────
│  passwordHash│
│  createdAt  │────<┌──────────────┐     ┌──────────────────┐
│  updatedAt  │     │   Document   │────<│ DocumentChunk    │
└─────────────┘     │              │     │                  │────<┌──────────────────┐
       │            │  filename    │     │  content         │     │ SourceReference  │
       │            │  storagePath │     │  chunkIndex      │     │                  │
       │            │  status      │     │  tokens          │     │  similarityScore │
       │            └──────────────┘     └──────────────────┘     └──────────────────┘
       │                                                                 │
       └────<┌──────────────┐     ┌──────────────┐                      │
             │    Chat      │────<│   Message    │─────────────────────────
             │              │     │              │
             │  title       │     │  role        │
             │  createdAt   │     │  content     │
             └──────────────┘     └──────────────┘
```

#### Modelos:

| Modelo            | Tabla              | Propósito                                           |
|-------------------|--------------------|-----------------------------------------------------|
| **User**          | `users`            | Usuarios del sistema                                |
| **RefreshToken**  | `refresh_tokens`   | Tokens de refresco para sesiones persistentes       |
| **Document**      | `documents`        | Documentos subidos por el usuario                    |
| **DocumentChunk** | `document_chunks`  | Fragmentos de texto de los documentos (para RAG)     |
| **Chat**          | `chats`            | Conversaciones de chat del usuario                   |
| **Message**       | `messages`         | Mensajes individuales dentro de un chat              |
| **SourceReference** | `source_references` | Referencias a chunks usados como fuente en respuestas |
| **AuditLog**      | `audit_logs`       | Log de auditoría de acciones del usuario             |

#### Relaciones clave:
- `User` → tiene muchos `Document`, `Chat`, `RefreshToken`, `AuditLog`
- `Document` → tiene muchos `DocumentChunk`
- `Chat` → tiene muchos `Message`
- `Message` → tiene muchos `SourceReference`
- `DocumentChunk` → tiene muchos `SourceReference`
- Todas las relaciones usan `onDelete: Cascade` (si se borra un usuario, se borran todos sus datos).

---

## Diagrama de Flujo de Autenticación

### Registro
```
Cliente                          Servidor                        Base de Datos
  │                                │                                │
  │── POST /auth/register ────────>│                                │
  │   { email, password }          │                                │
  │                                │── validate(registerSchema) ──> │
  │                                │── registerLimiter ──────────>  │
  │                                │── busca email existente ──────>│
  │                                │<── null (no existe) ──────────│
  │                                │── bcrypt.hash(password, 12) ──>│
  │                                │── INSERT user ────────────────>│
  │<── 201 { success: true } ─────│                                │
```

### Login
```
Cliente                          Servidor                        Base de Datos
  │                                │                                │
  │── POST /auth/login ──────────>│                                │
  │   { email, password }          │                                │
  │                                │── validate(loginSchema) ─────>│
  │                                │── LoginLimiter ──────────────>│
  │                                │── busca usuario por email ───>│
  │                                │<── user ─────────────────────│
  │                                │── bcrypt.compare() ──────────>│
  │                                │── generateAccessToken() ─────>│
  │                                │── createRefreshToken() ──────>│
  │                                │── INSERT refresh_token ──────>│
  │<── 200 { accessToken, user } ──│                                │
  │   + Cookie: refreshToken       │                                │
```

### Refresh Token (Rotación)
```
Cliente                          Servidor                        Base de Datos
  │                                │                                │
  │── POST /auth/refresh ────────>│                                │
  │   Cookie: refreshToken         │                                │
  │                                │── sha256(token) ─────────────>│
  │                                │── busca hash + no expirado ──>│
  │                                │<── stored token + user ──────│
  │                                │── DELETE token viejo ────────>│
  │                                │── generateAccessToken() ─────>│
  │                                │── createRefreshToken() ──────>│
  │                                │── INSERT nuevo refresh ──────>│
  │<── 200 { accessToken } ───────│                                │
  │   + Cookie: nuevo refreshToken │                                │
```
