import mongoose from 'mongoose';
import { ALLOWED_MODELS } from '../utils/constants.js';

// Define the Assistant schema with necessary fields and validation
const assistantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  instructions: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    enum: ALLOWED_MODELS,
    default: 'gpt-4'
  },
  tools: [{
    type: {
      type: String,
      required: true,
      enum: ['code_interpreter', 'retrieval', 'function']
    },
    function: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  openaiAssistantId: {
    type: String
  },
  codeName: {
    type: String,
    required: true,
    trim: true
  },
  userAddress: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  availableFunctions: {
    type: Object,
    default: {}
  },
  createdBy: {
    type: String,
    required: true,
  },
  llmModel: {
    type: String,
    required: true,
    trim: true
  },
  llmProvider: {
    type: String,
    required: true,
    trim: true
  },
  categories: {
    type: [String],
    default: []
  },
  tokenName: {
    type: String,
    trim: true
  },
  tokenAddress: {
    type: String,
    default: null
  },
  totalSupply: {
    type: Number,
    default: 0
  },
  tokenSymbol: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Export the Assistant model
export const Assistant = mongoose.model('Assistant', assistantSchema);