import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

export const geminiService = {

    async getEmbedding(text: string): Promise<number[]> {
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        
        const result = await model.embedContent({
            content: { role: 'user', parts: [{ text }] },
            outputDimensionality: 768,
        });
        const embedding = result.embedding;

        if (!embedding || !embedding.values) {
            throw new Error('No embedding was returned from Gemini.');
        }

        // Return the embedding vector (768 dimensions to match pgvector column)
        return embedding.values;
    },

    async generateChatResponse(prompt: string, context: string): Promise<string> {
        const systemInstruction = `You are a helpful AI assistant. Use the following context retrieved from the user's documents to answer their question. If the answer is not in the context, say that you don't know based on the provided documents.\n\nContext:\n${context}`;

        try {
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-3.5-flash-lite',
                systemInstruction: systemInstruction
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.log('error', error);
        }
    }
};
