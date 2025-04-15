import { openaiClient } from '../../config/openai.js';
import { ERROR_MESSAGES } from '../../utils/constants.js';

export async function createAssistant({ name, instructions, model, tools }) {
  try {
    return await openaiClient.beta.assistants.create({
      name,
      instructions,
      model,
      tools: tools.map(tool => ({
        type: tool.type,
        ...(tool.function && { function: tool.function })
      }))
    });
  } catch (error) {
    console.error('OpenAI Assistant Creation Error:', error);
    throw new Error(`${ERROR_MESSAGES.OPENAI_ERROR}: ${error.message}`);
  }
}