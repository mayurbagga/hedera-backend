import express from 'express';
import { HederaWalletService } from '../services/HederaWalletService.js';
import { SecurityService } from '../services/SecurityService.js';
import { HederaMonitor } from '../services/HederaMonitor.js';
import { EnhancedAssistantService } from '../services/EnhancedAssistantService.js';
import { HederaChatService } from '../services/HederaChatService.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();
const hederaWalletService = new HederaWalletService();
const securityService = new SecurityService();
const hederaMonitor = new HederaMonitor();
const enhancedAssistantService = new EnhancedAssistantService(hederaWalletService, securityService);
const hederaChatService = new HederaChatService();

// Start monitoring
hederaMonitor.startMonitoring();

/**
 * @swagger
 * /api/hedera/transfer:
 *   post:
 *     summary: Transfer tokens
 *     tags: [Hedera]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenId:
 *                 type: string
 *               toAddress:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transfer successful
 */
router.post('/transfer', async (req, res) => {
    try {
        const { tokenId, toAddress, amount } = req.body;
        const userId = req.user.id;

        await securityService.validateOperation(userId, 'transfer');
        await securityService.validateTransferAmount(userId, amount);

        const result = await hederaWalletService.transferToken(userId, {
            tokenId,
            toAddress,
            amount
        });

        hederaMonitor.logOperation({
            userId,
            operation: 'transfer',
            amount,
            tokenId
        });

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/hedera/token/create:
 *   post:
 *     summary: Create a new token
 *     tags: [Hedera]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *               initialSupply:
 *                 type: number
 *     responses:
 *       200:
 *         description: Token created successfully
 */
router.post('/token/create', async (req, res) => {
    try {
        const { name, symbol, initialSupply } = req.body;
        const userId = req.user.id;

        await securityService.validateOperation(userId, 'createToken');

        const result = await hederaWalletService.createToken(userId, {
            name,
            symbol,
            initialSupply
        });

        hederaMonitor.logOperation({
            userId,
            operation: 'createToken',
            tokenId: result.tokenId
        });

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/hedera/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Hedera]
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 */
router.get('/balance', async (req, res) => {
    try {
        const userId = req.user.id;

        await securityService.validateOperation(userId, 'getBalance');

        const balance = await hederaWalletService.getWalletBalance(userId);

        hederaMonitor.logOperation({
            userId,
            operation: 'getBalance'
        });

        res.json(balance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Assistant-specific Hedera operations
router.post('/assistants/:assistantId/transfer', async (req, res) => {
    try {
        const result = await enhancedAssistantService.performHederaOperation(
            req.params.assistantId,
            req.user.id,
            'transfer',
            req.body
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/assistants/:assistantId/token/create', async (req, res) => {
    try {
        const result = await enhancedAssistantService.performHederaOperation(
            req.params.assistantId,
            req.user.id,
            'createToken',
            req.body
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/assistants/:assistantId/balance', async (req, res) => {
    try {
        const result = await enhancedAssistantService.performHederaOperation(
            req.params.assistantId,
            req.user.id,
            'getBalance',
            {}
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Assistant Hedera integration management
router.post('/assistants/:assistantId/enable', async (req, res) => {
    try {
        const result = await enhancedAssistantService.enableHederaIntegration(
            req.params.assistantId,
            req.body
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/assistants/:assistantId/disable', async (req, res) => {
    try {
        const result = await enhancedAssistantService.disableHederaIntegration(
            req.params.assistantId
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Handle Hedera operations through prompts
router.post('/assistants/:assistantId/prompt', async (req, res) => {
    try {
        const result = await enhancedAssistantService.handleHederaPrompt(
            req.params.assistantId,
            req.user.id,
            req.body.prompt
        );
        
        // Return both the formatted response and the operation result
        res.json({
            message: result.response,
            operation: result.operation,
            data: result.result,
            error: result.error || false
        });
    } catch (error) {
        res.status(400).json({ 
            error: true,
            message: error.message 
        });
    }
});

// Update assistant instructions and enable Hedera integration
router.post('/assistants/:assistantId/configure', async (req, res) => {
    try {
        const result = await enhancedAssistantService.updateAssistantHederaInstructions(
            req.params.assistantId
        );
        res.json({
            message: 'Assistant configured for Hedera operations',
            assistant: result
        });
    } catch (error) {
        res.status(400).json({ 
            error: true,
            message: error.message 
        });
    }
});

/**
 * @swagger
 * /api/hedera/chat:
 *   post:
 *     summary: Send a message to the Hedera chat service
 *     tags: [Hedera]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               userAddress:
 *                 type: string
 *               assistantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat response received successfully
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, userAddress, assistantId } = req.body;

        if (!userAddress) {
            return res.status(400).json({ 
                error: true,
                message: 'User address is required. Please provide userAddress in the request body.' 
            });
        }

        console.log('Processing chat request:', { userAddress, assistantId, message });

        // Process the message
        const response = await hederaChatService.handleChatMessage(userAddress, message, assistantId);

        console.log('Chat response:', response);

        // Log the operation
        hederaMonitor.logOperation({
            userAddress,
            assistantId,
            operation: 'chat',
            message
        });

        res.json({ response });
    } catch (error) {
        console.error('Error in chat route:', error);
        res.status(400).json({ 
            error: true,
            message: error.message 
        });
    }
});

export default router; 