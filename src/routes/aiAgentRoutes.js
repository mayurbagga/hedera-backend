import express from 'express';
import { handleAIRequest } from '../controllers/aiAgentController.js';

const router = express.Router();

router.post('/chat', handleAIRequest);

export default router; 