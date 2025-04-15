import { Conversation } from '../models/conversationModel.js';

export const getConversationByThreadId = async (req, res) => {
  try {
    const { threadId } = req.params;
    const conversation = await Conversation.findOne({ threadId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.status(200).json(conversation.messages);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving conversation', error });
  }
};

export const addMessageToConversation = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { role, content } = req.body;

    const conversation = await Conversation.findOne({ threadId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.messages.push({ role, content, timestamp: new Date() });
    await conversation.save();

    res.status(200).json({ message: 'Message added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding message', error });
  }
}; 