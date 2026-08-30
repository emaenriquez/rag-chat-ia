import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(env.geminiApiKey);

export const geminiService = {
    /**
     * Gets an embedding vector for a given text.
     * Uses the text-embedding-004 model which outputs 768 dimensions.
     */
    async getEmbedding(text: string): Promise<number[]> {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        
        const result = await model.embedContent(text);
        const embedding = result.embedding;

        if (!embedding || !embedding.values) {
            throw new Error('No embedding was returned from Gemini.');
        }

        // Return the embedding vector
        return embedding.values;
    },

    /**
     * Generates a chat response based on the retrieved context and the user's prompt.
     * Uses the gemini-2.0-flash-exp model (or falls back to gemini-1.5-flash if not available).
     */
    async generateChatResponse(prompt: string, context: string): Promise<string> {
        const systemInstruction = `You are a helpful AI assistant. Use the following context retrieved from the user's documents to answer their question. If the answer is not in the context, say that you don't know based on the provided documents.\n\nContext:\n${context}`;

        // Try gemini-2.0-flash-exp first, fall back to gemini-1.5-flash if needed
        let modelName = 'gemini-2.0-flash-exp';
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: systemInstruction
            });
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            // If model not found, try fallback
            if (error?.message?.includes('not found')) {
                modelName = 'gemini-1.5-flash';
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemInstruction
                });
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            }
            throw error;
        }
    }
};
