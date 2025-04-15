import express from 'express';
import { getConversationByThreadId, addMessageToConversation } from '../controllers/conversationController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Route to get conversation by threadId
router.get('/:threadId', authenticateToken, getConversationByThreadId);

// Route to add a message to a conversation
router.post('/:threadId/messages', addMessageToConversation);

export default router; 