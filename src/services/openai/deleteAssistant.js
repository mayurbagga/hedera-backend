import { openaiClient } from '../../config/openai.js';
import { ERROR_MESSAGES } from '../../utils/constants.js';

export async function deleteAssistant(assistantId) {
  try {
    await openaiClient.beta.assistants.del(assistantId);
  } catch (error) {
    console.error('OpenAI Assistant Deletion Error:', error);
    throw new Error(`${ERROR_MESSAGES.OPENAI_ERROR}: ${error.message}`);
  }
}