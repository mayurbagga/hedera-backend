import { Assistant } from '../../models/Assistant.js';
import { ERROR_MESSAGES } from '../../utils/constants.js';

export async function getAllAssistants(query = {}) {
  try {
    return await Assistant.find({ isActive: true, ...query })
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    console.error('Database Query Error:', error);
    throw new Error(`${ERROR_MESSAGES.DATABASE_ERROR}: ${error.message}`);
  }
}