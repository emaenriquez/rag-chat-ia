# 🤖 RAG Chat IA — Backend & API

Sistema de Inteligencia Artificial para consultas documentales mediante **Retrieval-Augmented Generation (RAG)**, construido con **Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL + pgvector** y **Google Generative AI (Gemini)**.

---

## 📚 Documentación del Proyecto

Toda la documentación detallada se encuentra en la carpeta [`back/docs/`](file:///c:/Users/Usuario/Desktop/RAG/back/docs/):

1. 📡 **[Documentación de la API (Endpoints, Contratos y cURL)](file:///c:/Users/Usuario/Desktop/RAG/back/docs/api_documentacion.md)**
   - Especificación completa de rutas, payloads y respuestas.
   - Módulos de Autenticación (`/auth`), Documentos (`/documents`) y Chat & RAG (`/chats`).
   - Políticas de seguridad, cookies HttpOnly, rate limiting y variables de entorno.

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ o Bun
- PostgreSQL con la extensión `vector` habilitada (`pgvector`)
- API Key de Google Generative AI (Gemini)

### Instalación y Configuración

```bash
# Navegar al directorio del backend
cd back

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env # o editar .env directamente

# Ejecutar migraciones de Prisma
npm run db:migrate

# Iniciar en modo desarrollo
npm run dev
```
