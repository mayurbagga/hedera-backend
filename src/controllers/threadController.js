import { asyncHandler } from '../utils/asyncHandler.js';
import { threadService } from '../services/threadService.js';

export const threadController = {
  create: asyncHandler(async (req, res) => {
    console.log('Received assistantId:', req.params.assistantId);
    const thread = await threadService.createThread(req.params.assistantId);
    res.status(201).json({ success: true, data: thread });
  }),

  sendMessage: asyncHandler(async (req, res) => {
    const response = await threadService.sendMessage(
      req.params.threadId, 
      req.body.message,
      req.user?.address || req.body.userAddress  // Get user address from either authenticated user or request body
    );
    res.status(200).json({ success: true, data: response });
  }),

  getMessages: asyncHandler(async (req, res) => {
    const messages = await threadService.getMessages(req.params.threadId);
    res.status(200).json({ success: true, data: messages });
  })
};