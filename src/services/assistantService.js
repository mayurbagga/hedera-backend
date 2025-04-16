import { Assistant } from '../models/Assistant.js';
import { openai } from '../config/openai.js';
import { functionDefinitions } from './functions/index.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import { Thread } from '../models/Thread.js';
import { mongoose } from 'mongoose';
import { openaiClient } from '../clients/openaiClient.js';
import { Chat } from '../models/chatModel.js';

export const assistantService = {
  async create(data) {
    try {
      let openaiAssistantId = null;
      let openaiThreadId = null;

      // Create assistant in OpenAI if the provider is OpenAI
      if (data.llmProvider === 'openai') {
        const openaiResponse = await openaiClient.createAssistant({
          name: data.name,
          model: data.llmModel,
          instructions: data.instructions || "You are a helpful assistant.",
          tools: data.tools || []
        });

        // Log the full response for debugging
        console.log('OpenAI Response:', JSON.stringify(openaiResponse, null, 2));

        // Handle both response formats (object or string)
        if (typeof openaiResponse === 'string') {
          openaiAssistantId = openaiResponse;
        } else if (openaiResponse && openaiResponse.id) {
          openaiAssistantId = openaiResponse.id;
        } else {
          console.error('Invalid OpenAI response format:', openaiResponse);
          throw new Error('Invalid OpenAI response format');
        }

        console.log('Created OpenAI assistant with ID:', openaiAssistantId);

        // Create a thread in OpenAI
        const openaiThread = await openai.beta.threads.create();
        if (openaiThread && openaiThread.id) {
          openaiThreadId = openaiThread.id;
          console.log('Created OpenAI thread with ID:', openaiThreadId);
        } else {
          console.error('Invalid OpenAI thread response:', openaiThread);
          throw new Error('Failed to create OpenAI thread');
        }
      }

      // Create assistant in your database
      const assistant = await Assistant.create({
        ...data,
        imageUrl: data.imageUrl,
        availableFunctions: data.availableFunctions,
        codeName: data.codeName,
        createdBy: data.createdBy,
        userAddress: data.userAddress,
        llmModel: data.llmModel,
        llmProvider: data.llmProvider,
        openaiAssistantId,
        instructions: data.instructions || "You are a helpful assistant."
      });

      console.log('Created assistant in database:', assistant._id);
      console.log('Assistant OpenAI ID:', assistant.openaiAssistantId);

      // Create a thread for the new assistant
      const thread = await Thread.create({
        assistantId: assistant._id,
        openaiThreadId
      });

      console.log('Created thread in database:', thread._id);
      console.log('Thread OpenAI ID:', thread.openaiThreadId);

      // Create initial chat document
      const chat = new Chat({
        assistantId: assistant._id,
        threadId: thread._id,
        userId: data.userAddress,
        messages: [],
        status: 'active'
      });
      await chat.save();

      return { assistant, thread };
    } catch (error) {
      console.error('Create Assistant Error:', error.message, error.stack);
      throw new Error('Error creating assistant in database');
    }
  },

  async list(page, limit, categories) {
    const query = categories.length ? { categories: { $in: categories } } : {};
    const assistants = await Assistant.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Assistant.countDocuments(query);
    return { assistants, total };
  },

  async getById(id) {
    const assistant = await Assistant.findById(id);
    if (!assistant) {
      throw new Error(ERROR_MESSAGES.ASSISTANT_NOT_FOUND);
    }
    return assistant;
  },

  async update(id, data) {
    const assistant = await Assistant.findById(id);
    if (!assistant) {
      throw new Error(ERROR_MESSAGES.ASSISTANT_NOT_FOUND);
    }

    // Update OpenAI assistant
    await openai.beta.assistants.update(assistant.openaiAssistantId, {
      name: data.name,
      instructions: data.instructions,
      tools: [
        {
          "type": "function",
          "function": {
            "name": "get_balance",
            "description": "Get native token balance of a wallet address on Sepolia network",
            "parameters": {
              "type": "object",
              "properties": {
                "address": {
                  "type": "string",
                  "description": "The wallet address to check"
                }
              },
              "required": ["address"]
            }
          }
        }
      ]
    });

    // Update assistant in database
    return await Assistant.findByIdAndUpdate(id, {
      ...data,
      llmModel: data.llmModel,
      llmProvider: data.llmProvider
    }, { new: true });
  },

  async delete(id) {
    const assistant = await Assistant.findById(id);
    if (!assistant) {
      throw new Error(ERROR_MESSAGES.ASSISTANT_NOT_FOUND);
    }

    // Delete from OpenAI
    await openai.beta.assistants.del(assistant.openaiAssistantId);

    // Delete from database
    await Assistant.findByIdAndDelete(id);
  },

  async getThreadIdByAssistantId(assistantId) {
    const thread = await Thread.findOne({ assistantId });
    if (!thread) {
      throw new Error('Thread not found for the given assistant ID');
    }
    return thread._id;
  },

  async getByUserAddress(userAddress, page, limit) {
    try {
      const skip = (page - 1) * limit;
      const assistants = await Assistant.find({ userAddress }).skip(skip).limit(limit);
      const total = await Assistant.countDocuments({ userAddress });
      return { assistants, total };
    } catch (error) {
      console.error('Error fetching assistants by userAddress:', error);
      throw new Error('Could not fetch assistants');
    }
  }
};

// async function saveDataToDatabase(data) {
//   try {
//     const newData = new Assistant(data);
//     await newData.save();
//     console.log('Data saved to MongoDB');
//   } catch (error) {
//     console.error('Error saving data to MongoDB:', error);
//   }
// }

// // Example usage
// const data = {
//   name: 'example',
//   instructions: 'example instructions',
//   // ... other fields
// };

// saveDataToDatabase(data);