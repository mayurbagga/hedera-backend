import { openaiClient } from '../config/openai.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

export class OpenAIService {
  static async createAssistant({ name, instructions, model, tools }) {
    try {
      const assistant = await openaiClient.beta.assistants.create({
        name,
        instructions,
        model,
        tools: tools.map(tool => ({
          type: tool.type,
          ...(tool.function && { function: tool.function })
        }))
      });

      return assistant;
    } catch (error) {
      console.error('OpenAI Assistant Creation Error:', error);
      throw new Error(`${ERROR_MESSAGES.OPENAI_ERROR}: ${error.message}`);
    }
  }

  static async deleteAssistant(assistantId) {
    try {
      await openaiClient.beta.assistants.del(assistantId);
    } catch (error) {
      console.error('OpenAI Assistant Deletion Error:', error);
      throw new Error(`${ERROR_MESSAGES.OPENAI_ERROR}: ${error.message}`);
    }
  }

  static async listAssistants() {
    try {
      const response = await openaiClient.beta.assistants.list({
        limit: 100,
        order: 'desc'
      });
      return response.data;
    } catch (error) {
      console.error('OpenAI Assistant List Error:', error);
      throw new Error(`${ERROR_MESSAGES.OPENAI_ERROR}: ${error.message}`);
    }
  }

  static async updateAssistant(assistantId, updateData) {
    try {
      return await openaiClient.beta.assistants.update(assistantId, updateData);
    } catch (error) {
      console.error('OpenAI Assistant Update Error:', error);
      throw new Error(`${ERROR_MESSAGES.OPENAI_ERROR}: ${error.message}`);
    }
  }
}