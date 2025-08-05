const vectorStore = require('../services/vectorStore');
const aiService = require('../services/aiService');

class ChatController {
    async queryDocument(req, res) {
        try {
            const { documentId, query } = req.body;

            if (!documentId || !query) {
                return res.status(400).json({
                    error: 'Document ID and query are required'
                });
            }

            console.log(`Query for document ${documentId}: ${query}`);

            // Search for relevant chunks
            const relevantChunks = await vectorStore.searchSimilar(documentId, query, 5);

            if (relevantChunks.length === 0) {
                return res.json({
                    response: "I couldn't find relevant information in the document to answer your question.",
                    citations: []
                });
            }

            // Generate response using AI
            const aiResponse = await aiService.generateResponse(query, relevantChunks);

            // Extract page numbers for citations
            const citations = relevantChunks
                .map(chunk => ({ page: chunk.pageNumber }))
                .filter((citation, index, self) =>
                    index === self.findIndex(c => c.page === citation.page)
                );

            res.json({
                response: aiResponse,
                citations,
                sourceChunks: relevantChunks.length
            });

        } catch (error) {
            console.error('Chat query error:', error);
            res.status(500).json({
                error: 'Failed to process query',
                message: error.message
            });
        }
    }
}

module.exports = new ChatController();
