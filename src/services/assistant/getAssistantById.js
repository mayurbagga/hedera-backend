import { Assistant } from '../../models/Assistant.js';
import { ERROR_MESSAGES } from '../../utils/constants.js';

export async function getAssistantById(id) {
  try {
    const assistant = await Assistant.findOne({ 
      _id: id,
      isActive: true 
    }).lean();
    
    if (!assistant) {
      throw new Error(ERROR_MESSAGES.ASSISTANT_NOT_FOUND);
    }
    
    return assistant;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw new Error(`${ERROR_MESSAGES.DATABASE_ERROR}: ${error.message}`);
  }
}