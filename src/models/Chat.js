import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  // Add other fields as necessary
}, {
  timestamps: true
});

export const Chat = mongoose.model('Chat', chatSchema); 