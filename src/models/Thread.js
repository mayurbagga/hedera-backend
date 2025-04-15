import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
  assistantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assistant',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed'],
    default: 'active'
  },
  openaiThreadId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

const Thread = mongoose.model('Thread', threadSchema);

export { Thread };