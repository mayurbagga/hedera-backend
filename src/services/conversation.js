import { Conversation } from '../models/conversationModel.js';

// Create a new conversation
export async function createConversation(threadId) {
  const conversation = new Conversation({ threadId, messages: [] });
  await conversation.save();
  return conversation;
}

// Add a message to a conversation
export async function addMessageToConversation(threadId, role, content) {
  let conversation = await Conversation.findOne({ threadId });
  if (!conversation) {
    conversation = await createConversation(threadId);
  }
  conversation.messages.push({ role, content });
  await conversation.save();
  return conversation;
}

// Retrieve conversation history
export async function getConversationHistory(threadId) {
  const conversation = await Conversation.findOne({ threadId });
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  return conversation.messages;
} 