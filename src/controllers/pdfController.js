const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfProcessor = require('../services/pdfProcessor');
const vectorStore = require('../services/vectorStore');

class PDFController {
    async uploadPDF(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No PDF file uploaded' });
            }

            const documentId = uuidv4();
            const filePath = req.file.path;
            const fileName = req.file.originalname;

            console.log(`Processing PDF: ${fileName}`);

            // Extract text from PDF
            const extractedText = await pdfProcessor.extractText(filePath);

            // Process and chunk the text
            const chunks = await pdfProcessor.processText(extractedText, fileName);

            // Store in vector database
            await vectorStore.storeDocument(documentId, chunks, {
                fileName,
                filePath,
                uploadDate: new Date().toISOString()
            });

            // Return file URL and document ID
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

            res.json({
                message: 'PDF uploaded and processed successfully',
                documentId,
                fileUrl,
                fileName,
                totalChunks: chunks.length
            });

        } catch (error) {
            console.error('PDF upload error:', error);

            // Clean up uploaded file if processing failed
            if (req.file && req.file.path) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (cleanupError) {
                    console.error('File cleanup error:', cleanupError);
                }
            }

            res.status(500).json({
                error: 'Failed to process PDF',
                message: error.message
            });
        }
    }

    async getPDFInfo(req, res) {
        try {
            const { documentId } = req.params;

            const documentInfo = await vectorStore.getDocumentInfo(documentId);

            if (!documentInfo) {
                return res.status(404).json({ error: 'Document not found' });
            }

            res.json(documentInfo);

        } catch (error) {
            console.error('Get PDF info error:', error);
            res.status(500).json({
                error: 'Failed to get PDF info',
                message: error.message
            });
        }
    }
}

module.exports = new PDFController();