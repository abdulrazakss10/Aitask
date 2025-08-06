const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const pdfController = require('../controllers/pdfController');

// Upload PDF
router.post('/upload', upload.single('pdf'), pdfController.uploadPDF);

// Get PDF info
router.get('/:documentId', pdfController.getPDFInfo);

module.exports = router;
