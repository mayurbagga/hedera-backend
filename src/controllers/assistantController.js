import { assistantService } from '../services/assistantService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { Chat } from '../models/chatModel.js';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // Ensure this environment variable is set
});

export const openaiClient = {
  async createAssistant(data) {
    try {
      // Use a model that you have access to
      const modelToUse = data.model || 'gpt-3.5-turbo'; // Default to a model you have access to

      const response = await client.chat.completions.create({
        model: modelToUse,
        messages: [{ role: 'system', content: `Create an assistant named ${data.name}` }],
      });

      console.log('OpenAI Response:', JSON.stringify(response, null, 2)); // Log the entire response

      // Adjust the extraction logic based on the actual response structure
      const openaiAssistantId = response.id || response.data?.id || response.choices?.[0]?.id;
      if (!openaiAssistantId) {
        throw new Error('OpenAI response does not contain an assistant ID');
      }

      return openaiAssistantId; // Return the assistant ID
    } catch (error) {
      console.error('Error creating assistant in OpenAI:', error);
      throw error;
    }
  },

  async sendMessage(model, message) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: message }],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error communicating with OpenAI:', error);
      throw error;
    }
  },
};

export const assistantController = {
  create: [
    authenticateToken,
    asyncHandler(async (req, res) => {
      // console.log('Request payload:', req.body);
      // console.log('Creating Assistant with data:', req.body);
      const assistant = await assistantService.create(req.body);
      res.status(201).json({ success: true, data: assistant });
    })
  ],

  list: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categories = req.query.category ? req.query.category.split(',') : [];

    const { assistants, total } = await assistantService.list(page, limit, categories);
    const response = assistants.map(assistant => ({
      ...assistant,
      imageUrl: assistant.imageUrl,
      createdBy: assistant.createdBy,
      instructions: assistant.instructions,
      codeName: assistant.codeName,
      model: assistant.model,
      tools: assistant.tools,
      availableFunctions: assistant.availableFunctions,
      userAddress: assistant.userAddress,
      tokenName: assistant.tokenName,
      tokenAddress: assistant.tokenAddress,
      totalSupply: assistant.totalSupply,
      tokenSymbol: assistant.tokenSymbol
    }));
    
    res.status(200).json({
      success: true,
      data: response,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const assistant = await assistantService.getById(req.params.id);
    res.status(200).json({ success: true, data: assistant });
  }),

  update: asyncHandler(async (req, res) => {
    const updateData = {
      ...req.body,
      tokenName: req.body.tokenName,
      tokenAddress: req.body.tokenAddress,
      totalSupply: req.body.totalSupply,
      tokenSymbol: req.body.tokenSymbol
    };

    const updatedAssistant = await assistantService.update(req.params.id, updateData);
    res.status(200).json({ success: true, data: updatedAssistant });
  }),

  updateToken: asyncHandler(async (req, res) => {
    const updatedAssistant = await assistantService.updateToken(req.params.id, req.body);
    res.status(200).json({ success: true, data: updatedAssistant });
  }),

  delete: asyncHandler(async (req, res) => {
    await assistantService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Assistant deleted successfully' });
  }),

  getThreadIdByAssistantId: asyncHandler(async (req, res) => {
    const threadId = await assistantService.getThreadIdByAssistantId(req.params.assistantId);
    res.status(200).json({ success: true, data: { threadId } });
  }),

  getByUserAddress: asyncHandler(async (req, res) => {
    const { userAddress } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { assistants, total } = await assistantService.getByUserAddress(userAddress, page, limit);
    res.status(200).json({
      success: true,
      data: assistants,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  handleChatMessage: asyncHandler(async (req, res) => {
    const { threadId, userId, message } = req.body;

    console.log('Using thread ID:', threadId);

    if (!threadId) {
      return res.status(400).json({ success: false, message: 'Invalid thread ID' });
    }

    try {
      const assistant = await assistantService.getByThreadId(threadId);
      if (!assistant) {
        return res.status(404).json({ success: false, message: `No thread found with id '${threadId}'` });
      }

      const { llmProvider, llmModel } = assistant;

      let responseMessage;
      switch (llmProvider) {
        case 'openai':
          responseMessage = await openaiClient.sendMessage(llmModel, message);
          break;
        default:
          throw new Error('Unsupported LLM provider');
      }

      // Save chat to the database
      const chat = new Chat({ threadId, userId, message, response: responseMessage });
      await chat.save();

      res.status(200).json({ success: true, message: 'Chat processed successfully', response: responseMessage });
    } catch (error) {
      console.error('Error processing chat message:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch a response from AI', response: 'Hi there! How can I assist you today?' });
    }
  })
};



// nameserver 127.0.0.53
// options edns0 trust-ad