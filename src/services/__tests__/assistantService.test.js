import mongoose from 'mongoose';
import { assistantService } from '../assistantService';
import { Assistant } from '../../models/Assistant';
import { Thread } from '../../models/Thread';
import { openai } from '../../config/openai';

jest.mock('../../models/Assistant', () => ({
  __esModule: true,
  Assistant: {
    create: jest.fn().mockResolvedValue({ _id: 'assistant-id' })
  }
}));

jest.mock('../../models/Thread', () => {
  const mongoose = require('mongoose');
  return {
    __esModule: true,
    Thread: {
      create: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId() })
    }
  };
});

jest.mock('../../config/openai');

// Mock Mongoose connection
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    on: jest.fn(),
    once: jest.fn(),
    readyState: 1
  }
}));

jest.mock('../../models/conversationModel', () => {
  const mongoose = require('mongoose');
  return {
    __esModule: true,
    Conversation: jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true)
    }))
  };
});

describe('Assistant Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new agent successfully', async () => {
    jest.setTimeout(10000); // Increase timeout to 10 seconds

    // Mock OpenAI API response
    openai.beta.assistants.create.mockResolvedValue({ id: 'openai-assistant-id' });
    openai.beta.threads.create.mockResolvedValue({ id: 'openai-thread-id' });

    const data = {
      name: 'Test Agent',
      instructions: 'Test instructions',
      userAddress: '0x123',
      llmModel: 'gpt-4',
      llmProvider: 'openai'
    };

    const result = await assistantService.create(data);

    expect(result).toHaveProperty('_id');
    expect(Assistant.create).toHaveBeenCalledWith(expect.objectContaining(data));
    expect(Thread.create).toHaveBeenCalledWith(expect.objectContaining({ assistantId: 'assistant-id' }));
  });

  // Add more test cases for error handling, edge cases, etc.
}); 