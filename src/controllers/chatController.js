import { Chat } from '../models/chatModel.js';
import { errorHandler } from '../middleware/errorHandler.js';

export const getChats = async (req, res) => {
  try {
    const { userId, assistantId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    let query = { userId };
    if (assistantId) {
      query.assistantId = assistantId;
    }

    const chats = await Chat.find(query)
      .sort({ 'messages.timestamp': -1 })
      .populate('assistantId', 'name')
      .populate('threadId', 'openaiThreadId');

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      userId
    })
      .populate('assistantId', 'name')
      .populate('threadId', 'openaiThreadId');

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
}; 