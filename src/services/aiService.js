const { OpenAI } = require('openai');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateResponse(query, relevantChunks) {
        try {
            if (!process.env.OPENAI_API_KEY) {
                // Fallback response when no API key is provided
                return this.generateFallbackResponse(query, relevantChunks);
            }

            const context = relevantChunks
                .map((chunk, index) => `[Page ${chunk.pageNumber}] ${chunk.text}`)
                .join('\n\n');

            const prompt = `You are a helpful assistant that answers questions about PDF documents. 
Use the following context from the PDF to answer the user's question. Be accurate and cite specific information when possible.

Context from PDF:
${context}

User Question: ${query}

Instructions:
- Answer based only on the provided context
- Be concise but comprehensive
- If the context doesn't contain enough information to answer fully, say so
- Don't make up information not present in the context

Answer:`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that answers questions about PDF documents accurately and concisely.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            });

            return response.choices[0].message.content.trim();

        } catch (error) {
            console.error('AI service error:', error);
            return this.generateFallbackResponse(query, relevantChunks);
        }
    }

    generateFallbackResponse(query, relevantChunks) {
        // Simple fallback when AI service is not available
        const mostRelevantChunk = relevantChunks[0];

        if (!mostRelevantChunk) {
            return "I couldn't find relevant information to answer your question.";
        }

        // Extract a relevant portion of the text
        const chunkText = mostRelevantChunk.text;
        const queryWords = query.toLowerCase().split(/\s+/);

        // Find sentences that contain query words
        const sentences = chunkText.split(/[.!?]+/);
        const relevantSentences = sentences.filter(sentence =>
            queryWords.some(word =>
                word.length > 2 && sentence.toLowerCase().includes(word)
            )
        );

        if (relevantSentences.length > 0) {
            const response = relevantSentences.slice(0, 3).join('. ').trim();
            return response + (response.endsWith('.') ? '' : '.');
        }

        // Fallback to first part of the chunk
        const firstSentences = sentences.slice(0, 2).join('. ').trim();
        return firstSentences + (firstSentences.endsWith('.') ? '' : '.');
    }
}

module.exports = new AIService();
