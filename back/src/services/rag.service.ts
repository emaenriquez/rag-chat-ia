import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database.js';
import { geminiService } from './gemini.service.js';
import { r2Service } from './r2.service.js';

// Simple text splitter with overlap
function splitTextIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        let chunk = text.slice(i, i + chunkSize);

        // If this isn't the last chunk, try to break at a natural boundary (newline or space)
        if (i + chunkSize < text.length) {
            const lastNewline = chunk.lastIndexOf('\n');
            const lastSpace = chunk.lastIndexOf(' ');
            const breakPoint = lastNewline > chunk.length - 200 ? lastNewline : (lastSpace > chunk.length - 100 ? lastSpace : -1);

            if (breakPoint !== -1) {
                chunk = chunk.slice(0, breakPoint);
                i += breakPoint - overlap; // Move i forward, but step back for overlap
            } else {
                i += chunkSize - overlap;
            }
        } else {
            i += chunkSize;
        }

        chunks.push(chunk.trim());
    }
    return chunks;
}

export const ragService = {
    /**
     * Extracts text from a document, splits it, gets embeddings, and saves to DB.
     */
    async processDocument(documentId: string): Promise<void> {
        console.log(`\n[RAG Pipeline] Iniciando procesamiento para el documento ID: ${documentId}`);
        // 1. Fetch document metadata
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            console.error(`[RAG Pipeline] Error: Documento ${documentId} no encontrado en la base de datos.`);
            throw new Error('Documento no encontrado en la base de datos');
        }

        try {
            // Update status
            await prisma.document.update({
                where: { id: documentId },
                data: { status: 'processing' }
            });
            console.log(`[RAG Pipeline] Estado actualizado a 'processing'. Extrayendo texto del archivo: ${document.originalName}`);

            // 2. Read and extract text from Cloudflare R2
            const fileBuffer = await r2Service.getFileBuffer(document.storagePath);
            let text = '';
            if (document.mimeType === 'application/pdf') {
                const data = await pdfParse(fileBuffer);
                text = data.text;
                console.log(`[RAG Pipeline] PDF extraído con éxito desde R2. Longitud del texto: ${text.length} caracteres.`);
            } else {
                // Assume txt/md
                text = fileBuffer.toString('utf-8');
                console.log(`[RAG Pipeline] Archivo de texto leído con éxito desde R2. Longitud: ${text.length} caracteres.`);
            }

            // 3. Split text into chunks
            const chunks = splitTextIntoChunks(text);
            console.log(`[RAG Pipeline] Texto dividido en ${chunks.length} fragmentos (chunks). Iniciando generación de embeddings...`);

            // 4. Get embeddings and save
            for (let i = 0; i < chunks.length; i++) {
                const content = chunks[i];
                if (!content) continue;

                // Log progress
                console.log(`[RAG Pipeline] Procesando chunk ${i + 1}/${chunks.length}...`);

                // Get embedding vector from Gemini
                const embeddingVector = await geminiService.getEmbedding(content);

                // Format vector for pgvector: '[1.1, 2.2, 3.3]'
                const embeddingString = `[${embeddingVector.join(',')}]`;

                // Estimate tokens roughly (1 token ~= 4 characters)
                const tokens = Math.ceil(content.length / 4);

                const chunkId = uuidv4();

                // Save to DB using raw SQL to support the vector cast
                await prisma.$executeRaw`
                    INSERT INTO document_chunks (id, document_id, chunk_index, content, tokens, embedding, created_at)
                    VALUES (${chunkId}, ${documentId}, ${i}, ${content}, ${tokens}, ${embeddingString}::vector, NOW())
                `;
            }

            // Mark as processed
            await prisma.document.update({
                where: { id: documentId },
                data: { status: 'processed' }
            });
            console.log(`[RAG Pipeline] ✅ Procesamiento completado. El documento ${document.originalName} está listo para el chat.\n`);

        } catch (error) {
            console.error(`\n[RAG Pipeline] ❌ Error procesando documento ${documentId}:`, error);
            await prisma.document.update({
                where: { id: documentId },
                data: { status: 'failed' }
            });
        }
    },

    /**
     * Searches for chunks similar to the query embedding.
     * Optionally filters by document IDs and user ID.
     */
    async searchSimilarChunks(
        queryEmbedding: number[],
        limit = 5,
        documentIds?: string[],
        userId?: string
    ): Promise<any[]> {
        const embeddingString = `[${queryEmbedding.join(',')}]`;

        if (documentIds && documentIds.length > 0) {
            if (userId) {
                return await prisma.$queryRaw<any[]>`
                    SELECT dc.id, dc.document_id, dc.content, 
                           1 - (dc.embedding <=> ${embeddingString}::vector) as similarity
                    FROM document_chunks dc
                    INNER JOIN documents d ON dc.document_id = d.id
                    WHERE d.user_id = ${userId}
                      AND dc.document_id = ANY(${documentIds}::text[])
                    ORDER BY dc.embedding <=> ${embeddingString}::vector
                    LIMIT ${limit}
                `;
            } else {
                return await prisma.$queryRaw<any[]>`
                    SELECT dc.id, dc.document_id, dc.content, 
                           1 - (dc.embedding <=> ${embeddingString}::vector) as similarity
                    FROM document_chunks dc
                    WHERE dc.document_id = ANY(${documentIds}::text[])
                    ORDER BY dc.embedding <=> ${embeddingString}::vector
                    LIMIT ${limit}
                `;
            }
        }

        if (userId) {
            return await prisma.$queryRaw<any[]>`
                SELECT dc.id, dc.document_id, dc.content, 
                       1 - (dc.embedding <=> ${embeddingString}::vector) as similarity
                FROM document_chunks dc
                INNER JOIN documents d ON dc.document_id = d.id
                WHERE d.user_id = ${userId}
                ORDER BY dc.embedding <=> ${embeddingString}::vector
                LIMIT ${limit}
            `;
        }

        // Fallback if no userId or documentIds (backward-compatible)
        const results = await prisma.$queryRaw<any[]>`
            SELECT id, document_id, content, 
                   1 - (embedding <=> ${embeddingString}::vector) as similarity
            FROM document_chunks
            ORDER BY embedding <=> ${embeddingString}::vector
            LIMIT ${limit}
        `;

        return results;
    }
};
