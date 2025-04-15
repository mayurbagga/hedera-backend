import { Assistant } from '../../models/Assistant.js';
import { ERROR_MESSAGES } from '../../utils/constants.js';

export async function deleteAssistant(id) {
  try {
    const result = await Assistant.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!result) {
      throw new Error(ERROR_MESSAGES.ASSISTANT_NOT_FOUND);
    }

    return result;
  } catch (error) {
    console.error('Database Delete Error:', error);
    throw new Error(`${ERROR_MESSAGES.DATABASE_ERROR}: ${error.message}`);
  }
}