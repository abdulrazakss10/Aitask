class VectorStore {
    constructor() {
        this.documents = new Map();
        this.chunks = new Map();
    }

    async storeDocument(documentId, chunks, metadata) {
        try {
            this.documents.set(documentId, {
                id: documentId,
                metadata,
                chunkIds: chunks.map(chunk => chunk.id)
            });

            // Store chunks with simple keyword-based indexing
            chunks.forEach(chunk => {
                const keywords = this.extractKeywords(chunk.text);
                this.chunks.set(chunk.id, {
                    ...chunk,
                    documentId,
                    keywords
                });
            });

            console.log(`Stored ${chunks.length} chunks for document ${documentId}`);
        } catch (error) {
            throw new Error(`Failed to store document: ${error.message}`);
        }
    }

    async searchSimilar(documentId, query, limit = 5) {
        try {
            const queryKeywords = this.extractKeywords(query.toLowerCase());
            const documentChunks = Array.from(this.chunks.values())
                .filter(chunk => chunk.documentId === documentId);

            // Simple keyword-based similarity scoring
            const scoredChunks = documentChunks.map(chunk => {
                const score = this.calculateSimilarity(queryKeywords, chunk.keywords, chunk.text, query);
                return { ...chunk, score };
            });

            // Sort by score and return top results
            return scoredChunks
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .filter(chunk => chunk.score > 0);

        } catch (error) {
            throw new Error(`Failed to search similar chunks: ${error.message}`);
        }
    }

    async getDocumentInfo(documentId) {
        return this.documents.get(documentId);
    }

    extractKeywords(text) {
        // Simple keyword extraction (remove common words)
        const commonWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
        ]);

        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.has(word))
            .slice(0, 20); // Keep top 20 keywords
    }

    calculateSimilarity(queryKeywords, chunkKeywords, chunkText, query) {
        let score = 0;

        // Keyword matching
        const keywordMatches = queryKeywords.filter(qw =>
            chunkKeywords.some(cw => cw.includes(qw) || qw.includes(cw))
        );
        score += keywordMatches.length * 2;

        // Direct text matching (case insensitive)
        const lowerChunkText = chunkText.toLowerCase();
        const lowerQuery = query.toLowerCase();

        // Exact phrase matching
        if (lowerChunkText.includes(lowerQuery)) {
            score += 10;
        }

        // Individual query word matching
        const queryWords = lowerQuery.split(/\s+/);
        queryWords.forEach(word => {
            if (word.length > 2 && lowerChunkText.includes(word)) {
                score += 1;
            }
        });

        return score;
    }
}

module.exports = new VectorStore();