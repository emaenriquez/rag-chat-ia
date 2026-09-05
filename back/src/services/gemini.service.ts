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

    async generateChatResponse(prompt: string, context: string): Promise<string> {
        const systemInstruction = `Eres un asistente de IA útil. Responde siempre en español.
Usa el siguiente contexto extraído de los documentos del usuario para responder su pregunta.
Si la respuesta NO se encuentra en el contexto proporcionado, responde EXACTAMENTE con:
"Lo siento, esa información no se encuentra en los archivos cargados."
No inventes información ni respondas fuera del contexto dado.

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
