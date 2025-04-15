import mongoose from 'mongoose';
import { ALLOWED_MODELS } from '../../utils/constants.js';

export const assistantSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  model: { 
    type: String, 
    required: [true, 'Model is required'],
    enum: ALLOWED_MODELS,
    default: 'gpt-4'
  },
  instructions: { 
    type: String, 
    required: [true, 'Instructions are required'],
    trim: true
  },
  tools: { 
    type: [{ 
      type: { type: String, required: true },
      function: { type: Object }
    }], 
    default: []
  },
  openaiAssistantId: { 
    type: String, 
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  llmModel: {
    type: String,
    required: [true, 'LLM Model is required'],
    trim: true
  },
  llmProvider: {
    type: String,
    required: [true, 'LLM Provider is required'],
    trim: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});