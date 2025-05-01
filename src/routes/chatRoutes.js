import express from 'express';
import { getChats, getChatById, handleChatMessage } from '../controllers/chatController.js';
import { HederaChatService } from '../services/HederaChatService.js';

const router = express.Router();
const hederaChatService = new HederaChatService();

// Get all chats for a user (optionally filtered by assistant)
router.get('/', getChats);

// Get a specific chat by ID
router.get('/:chatId', getChatById);

// Handle new chat messages
router.post('/message', async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        // Check if it's a Hedera-related query
        const hederaKeywords = ['balance', 'hbar', 'token', 'wallet', 'transfer', 'hedera'];
        const isHederaQuery = hederaKeywords.some(keyword => message.toLowerCase().includes(keyword));

        if (isHederaQuery) {
            // Use HederaChatService for Hedera-related queries
            console.log('Routing to HederaChatService:', message);
            const response = await hederaChatService.handleChatMessage(userId, message);
            return res.json({ response });
        }

        // For non-Hedera queries, use the regular chat handler
        const response = await handleChatMessage(req, res);
        return response;
    } catch (error) {
        console.error('Error in chat message route:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router; 