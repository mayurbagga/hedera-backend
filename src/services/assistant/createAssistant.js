import { Assistant } from '../../models/Assistant.js';
import { ERROR_MESSAGES } from '../../utils/constants.js';

export async function createAssistant(assistantData) {
  try {
    return await Assistant.create(assistantData);
  } catch (error) {
    console.error('Database Create Error:', error);
    throw new Error(`${ERROR_MESSAGES.DATABASE_ERROR}: ${error.message}`);
  }
}