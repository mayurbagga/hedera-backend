import express from 'express';
import { assistantController } from '../controllers/assistantController.js';

const router = express.Router();

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

export default router;