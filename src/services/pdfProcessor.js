const pdf = require('pdf-parse');
const fs = require('fs');

class PDFProcessor {
    async extractText(filePath) {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);

            return {
                text: data.text,
                numPages: data.numpages,
                info: data.info
            };
        } catch (error) {
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }

    async processText(extractedData, fileName) {
        const { text, numPages } = extractedData;

        // Split text into pages (rough estimation)
        const avgCharsPerPage = text.length / numPages;
        const chunks = [];

        // Split into sentences for better chunking
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        let currentChunk = '';
        let currentPage = 1;
        let charCount = 0;

        for (const sentence of sentences) {
            const sentenceText = sentence.trim() + '.';

            // If adding this sentence would make chunk too long, save current chunk
            if (currentChunk.length + sentenceText.length > 1000 && currentChunk.length > 0) {
                chunks.push({
                    id: `${fileName}-chunk-${chunks.length}`,
                    text: currentChunk.trim(),
                    pageNumber: currentPage,
                    fileName
                });

                currentChunk = sentenceText;
            } else {
                currentChunk += ' ' + sentenceText;
            }

            charCount += sentenceText.length;

            // Estimate page number based on character count
            const estimatedPage = Math.min(Math.ceil(charCount / avgCharsPerPage), numPages);
            currentPage = Math.max(currentPage, estimatedPage);
        }

        // Add the last chunk
        if (currentChunk.trim().length > 0) {
            chunks.push({
                id: `${fileName}-chunk-${chunks.length}`,
                text: currentChunk.trim(),
                pageNumber: currentPage,
                fileName
            });
        }

        return chunks;
    }
}

module.exports = new PDFProcessor();

