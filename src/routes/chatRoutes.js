import express from 'express';
import { getChats, getChatById } from '../controllers/chatController.js';

const router = express.Router();

// Get all chats for a user (optionally filtered by assistant)
router.get('/', getChats);

// Get a specific chat by ID
router.get('/:chatId', getChatById);

export default router; 