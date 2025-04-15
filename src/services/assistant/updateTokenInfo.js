import { Assistant } from '../../models/Assistant.js';
import { ERROR_MESSAGES } from '../../utils/constants.js';
import { validateTokenInfo } from '../../validators/tokenValidator.js';

export async function updateTokenInfo(id, tokenData) {
  try {
    // Validate token data
    const { isValid, errors } = validateTokenInfo(tokenData);
    if (!isValid) {
      throw new Error(errors.join(', '));
    }

    const assistant = await Assistant.findById(id);
    if (!assistant) {
      throw new Error(ERROR_MESSAGES.ASSISTANT_NOT_FOUND);
    }

    const updatedAssistant = await Assistant.findByIdAndUpdate(
      id,
      { 
        $set: {
          tokenName: tokenData.tokenName,
          tokenSupply: tokenData.tokenSupply
        }
      },
      { new: true, runValidators: true }
    );

    return updatedAssistant;
  } catch (error) {
    console.error('Update Token Info Error:', error);
    throw new Error(`${ERROR_MESSAGES.UPDATE_ERROR}: ${error.message}`);
  }
}