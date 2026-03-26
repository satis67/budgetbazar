const express = require('express'); const router = express.Router(); const { sendMessage, getChatHistory } = require('../controllers/chatController'); const { protect } = require('../middleware/authMiddleware');
router.route('/').post(protect, sendMessage); router.route('/:userId').get(protect, getChatHistory); module.exports = router;
