import { Chat } from '../models/chatModel.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { openai } from '../config/openai.js';

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

export const handleChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Create a new chat message
    const chatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Save to chat history
    const chat = await Chat.findOneAndUpdate(
      { userId },
      { 
        $push: { messages: chatMessage },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Do not handle any Hedera-related queries - those should be handled by the HederaChatService."
        },
        { role: "user", content: message }
      ]
    });

    const aiResponse = completion.choices[0].message.content;

    // Save AI response
    await Chat.findByIdAndUpdate(
      chat._id,
      {
        $push: {
          messages: {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
          }
        }
      }
    );

    return res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error handling chat message:', error);
    return res.status(400).json({ error: error.message });
  }
}; 