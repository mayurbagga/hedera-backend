import { Assistant } from '../../models/Assistant.js';
import { openai } from '../../config/openai.js';
import { ERROR_MESSAGES } from '../../utils/constants.js';

export async function updateAssistant(id, updateData) {
  try {
    const assistant = await Assistant.findById(id);
    
    if (!assistant) {
      throw new Error(ERROR_MESSAGES.ASSISTANT_NOT_FOUND);
    }

    // Update OpenAI assistant if name, instructions, model, or tools are being updated
    if (updateData.name || updateData.instructions || updateData.model || updateData.tools) {
      await openai.beta.assistants.update(
        assistant.openaiAssistantId,
        {
          name: updateData.name || assistant.name,
          instructions: updateData.instructions || assistant.instructions,
          model: updateData.model || assistant.model,
          tools: updateData.tools || assistant.tools
        }
      );
    }

    // Update MongoDB document
    if (updateData.availableFunctions) {
      updateData.$set = updateData.$set || {};
      updateData.$set.availableFunctions = updateData.availableFunctions;
    }

    const updatedAssistant = await Assistant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return updatedAssistant;
  } catch (error) {
    console.error('Update Assistant Error:', error);
    throw new Error(`${ERROR_MESSAGES.UPDATE_ERROR}: ${error.message}`);
  }
}