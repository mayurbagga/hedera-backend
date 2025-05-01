import express from 'express';
import { assistantController } from '../controllers/assistantController.js';
import { HederaChatService } from '../services/HederaChatService.js';

const router = express.Router();
const hederaChatService = new HederaChatService();

/**
 * @swagger
 * /api/assistants:
 *   post:
 *     summary: Create a new assistant
 *     tags: [Assistants]
 *     responses:
 *       201:
 *         description: Assistant created successfully
 */
router.post('/', assistantController.create);

/**
 * @swagger
 * /api/assistants:
 *   get:
 *     summary: Get all assistants with optional category filter
 *     tags: [Assistants]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category to filter assistants by
 *     responses:
 *       200:
 *         description: List of assistants retrieved successfully
 */
router.get('/', assistantController.list);

/**
 * @swagger
 * /api/assistants/{id}:
 *   get:
 *     summary: Get assistant by ID
 *     tags: [Assistants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assistant retrieved successfully
 */
router.get('/:id', assistantController.getById);

/**
 * @swagger
 * /api/assistants/{id}:
 *   put:
 *     summary: Update assistant by ID
 *     tags: [Assistants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assistant updated successfully
 */
router.put('/:id', assistantController.update);

/**
 * @swagger
 * /api/assistants/{id}/token:
 *   patch:
 *     summary: Update assistant token
 *     tags: [Assistants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assistant token updated successfully
 */
router.patch('/:id/token', assistantController.updateToken);

router.delete('/:id', assistantController.delete);

router.get('/:assistantId/threadId', assistantController.getThreadIdByAssistantId);

router.get('/address/:userAddress', assistantController.getByUserAddress);

// Handle Hedera operations through prompts
router.post('/:assistantId/prompt', async (req, res) => {
    try {
        const { prompt } = req.body;
        const userId = req.user.id;

        // Check if it's a Hedera-related query
        const hederaKeywords = ['balance', 'hbar', 'token', 'wallet', 'transfer', 'hedera'];
        const isHederaQuery = hederaKeywords.some(keyword => prompt.toLowerCase().includes(keyword));

        if (isHederaQuery) {
            console.log('Routing Hedera query to HederaChatService:', prompt);
            const response = await hederaChatService.handleChatMessage(userId, prompt);
            return res.json({
                message: response,
                operation: 'hedera_chat',
                data: response,
                error: false
            });
        }

        // For non-Hedera queries, use the regular assistant handler
        const result = await assistantController.handleChatMessage(req, res);
        return result;
    } catch (error) {
        console.error('Error in prompt handler:', error);
        res.status(400).json({ 
            error: true,
            message: error.message 
        });
    }
});

export default router;