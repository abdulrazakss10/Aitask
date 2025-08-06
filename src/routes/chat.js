const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat with PDF
router.post('/query', chatController.queryDocument);

module.exports = router;
    