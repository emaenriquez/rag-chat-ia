import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { geminiService } from './gemini.service.js';
import { r2Service } from './r2.service.js';
import { buildLexicalQuery } from './query.service.js';

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
        limit = 10,
        documentIds?: string[],
        userId?: string,
        searchText = ''
    ): Promise<any[]> {
        const embeddingString = `[${queryEmbedding.join(',')}]`;
        const scope = userId && documentIds?.length
            ? Prisma.sql`d.user_id = ${userId} AND dc.document_id = ANY(${documentIds}::text[])`
            : userId
                ? Prisma.sql`d.user_id = ${userId}`
                : documentIds?.length
                    ? Prisma.sql`dc.document_id = ANY(${documentIds}::text[])`
                    : Prisma.sql`TRUE`;
        const joinDocuments = Prisma.sql`INNER JOIN documents d ON dc.document_id = d.id`;

        const semanticResults = await prisma.$queryRaw<any[]>`
            SELECT dc.id, dc.document_id, dc.chunk_index, dc.content, d.original_name as document_name,
                   1 - (dc.embedding <=> ${embeddingString}::vector) as similarity
            FROM document_chunks dc
            ${joinDocuments}
            WHERE ${scope}
            ORDER BY dc.embedding <=> ${embeddingString}::vector
            LIMIT ${limit}
        `;

        const lexicalQueries = buildLexicalQuery(searchText);
        if (lexicalQueries.length === 0) return semanticResults;

        const patterns = lexicalQueries.map(query => `%${query}%`);
        const conditions = Prisma.join(
            patterns.map(pattern => Prisma.sql`dc.content ILIKE ${pattern}`),
            ' OR '
        );
        const phrasePattern = `%${lexicalQueries[0]}%`;
        const lexicalResults = await prisma.$queryRaw<any[]>`
            SELECT dc.id, dc.document_id, dc.chunk_index, dc.content, d.original_name as document_name,
                   CASE WHEN dc.content ILIKE ${phrasePattern} THEN 1.0 ELSE 0.85 END as similarity
            FROM document_chunks dc
            ${joinDocuments}
            WHERE ${scope} AND (${conditions})
            ORDER BY similarity DESC, dc.chunk_index ASC
            LIMIT ${limit}
        `;

        const merged = new Map<string, any>();
        for (const result of [...semanticResults, ...lexicalResults]) {
            const current = merged.get(result.id);
            if (!current || Number(result.similarity) > Number(current.similarity)) {
                merged.set(result.id, result);
            }
        }

        return [...merged.values()]
            .sort((a, b) => Number(b.similarity) - Number(a.similarity))
            .slice(0, limit);
    }
};
