import express from 'express';
import { threadController } from '../controllers/threadController.js';

const router = express.Router();

/**
 * @swagger
 * /threads/{assistantId}:
 *   post:
 *     summary: Create a new thread for an assistant
 *     parameters:
 *       - in: path
 *         name: assistantId
 *         required: true
 *         description: ID of the assistant
 *     responses:
 *       200:
 *         description: Thread created successfully
 */
router.post('/:assistantId', threadController.create);

/**
 * @swagger
 * /threads/{threadId}/messages:
 *   post:
 *     summary: Send a message to a thread
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         description: ID of the thread
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
router.post('/:threadId/messages', threadController.sendMessage);

/**
 * @swagger
 * /threads/{threadId}/messages:
 *   get:
 *     summary: Get all messages in a thread
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         description: ID of the thread
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/:threadId/messages', threadController.getMessages);

export default router;