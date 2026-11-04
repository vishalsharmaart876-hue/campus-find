const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  toggleBlock
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/conversations', protect, getOrCreateConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, sendMessage);
router.put('/conversations/:id/block', protect, toggleBlock);

module.exports = router;
