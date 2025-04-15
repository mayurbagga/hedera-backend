import mongoose from 'mongoose';
import { conversationSchema } from './schemas/ConversationSchema.js';

export const Conversation = mongoose.model('Conversation', conversationSchema); 