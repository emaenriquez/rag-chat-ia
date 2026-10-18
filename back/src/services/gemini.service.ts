import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

export const geminiService = {

    async getEmbedding(text: string): Promise<number[]> {
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

        const result = await model.embedContent({
            content: { role: 'user', parts: [{ text }] },
            outputDimensionality: 768,
        } as any);
        const embedding = result.embedding;

        if (!embedding || !embedding.values) {
            throw new Error('No se recibió el embedding de Gemini');
        }

        // Retorna el vector de embeddings (768 dimensiones para coincidir con la columna pgvector)
        return embedding.values;
    },

    async generateChatResponse(prompt: string, context: string, history = ''): Promise<string> {
        const systemInstruction = `Eres un asistente de IA útil. Responde siempre en español.
Usa el contexto extraído de los documentos para responder.
Interpreta órdenes como "dame", "explica" y "resume" como solicitudes de información.
Usa el historial solo para entender referencias breves como "eso" o "lo anterior".
Responde directamente. No describas tu proceso de búsqueda.
Cada bloque de contexto incluye una fuente. Conserva esa atribución.
Si la consulta menciona varios documentos, separa respuesta por fuente.
No mezcles StockPoint, tesis ni documentación del proyecto RAG.
Si "documentación" puede referir a más de un archivo, pide el nombre del archivo.
Si un dato no aparece en una fuente, indícalo para esa fuente sin completarlo con otra.
Si la respuesta no se encuentra en el contexto relevante, responde EXACTAMENTE con:
"Lo siento, esa información no se encuentra en los archivos cargados."
No inventes información ni uses conocimiento externo.

Historial reciente:
${history || '(sin historial relevante)'}

Contexto:
${context}`;

        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-3.5-flash-lite',
                systemInstruction: systemInstruction
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('[Gemini] Error al generar respuesta:', error);
            return 'Lo siento, ocurrió un error al generar la respuesta.';
        }
    }
};
