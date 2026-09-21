# --- Etapa 1: Construcción (Builder) ---
FROM node:20-slim AS builder

# Instalar OpenSSL necesario para que Prisma compile sus binarios
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiar configuración de Prisma y TypeScript
COPY prisma ./prisma/
COPY prisma.config.ts tsconfig.json ./

# Generar el cliente tipado de Prisma
RUN npx prisma generate

# Copiar el código fuente
COPY src ./src

# Compilar TypeScript a JavaScript (crea la carpeta dist/)
RUN npm run build

# Limpiar dependencias de desarrollo para aligerar la imagen
RUN npm prune --omit=dev


# --- Etapa 2: Imagen Final para Producción (Runner) ---
FROM node:20-slim AS runner

# OpenSSL para el runtime del cliente de Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar solo lo estrictamente necesario desde la etapa de construcción
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Carpeta para almacenamiento de archivos temporales si se requiere
RUN mkdir -p storage/documents

EXPOSE 3000

# Arranca tu servidor Express en producción
CMD ["npm", "start"]
