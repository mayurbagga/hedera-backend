import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  assistantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assistant',
    required: true
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true
  },
  userId: {
    type: String,  // Changed from ObjectId to String since we're using wallet addresses
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
chatSchema.index({ assistantId: 1, threadId: 1, userId: 1 });
chatSchema.index({ 'messages.timestamp': -1 });

export const Chat = mongoose.model('Chat', chatSchema); 