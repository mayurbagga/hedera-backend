import { ALLOWED_MODELS } from '../utils/constants.js';

export const validateAssistantInput = (data) => {
  const errors = [];

  if (!data.name?.trim()) {
    errors.push('Name is required');
  }

  if (!data.instructions?.trim()) {
    errors.push('Instructions are required');
  }

  if (!data.model) {
    errors.push('Model is required');
  } else if (!ALLOWED_MODELS.includes(data.model)) {
    errors.push(`Model must be one of: ${ALLOWED_MODELS.join(', ')}`);
  }

  if (!data.tokenName?.trim()) {
    errors.push('Token name is required');
  }

  if (typeof data.tokenSupply !== 'number' || data.tokenSupply < 0) {
    errors.push('Token supply must be a non-negative number');
  }

  if (!Array.isArray(data.tools)) {
    errors.push('Tools must be an array');
  } else {
    data.tools.forEach((tool, index) => {
      if (!tool.type) {
        errors.push(`Tool at index ${index} must have a type`);
      } else if (!['code_interpreter', 'retrieval', 'function'].includes(tool.type)) {
        errors.push(`Invalid tool type at index ${index}`);
      }
      
      if (tool.type === 'function' && !tool.function) {
        errors.push(`Function tool at index ${index} must have a function definition`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};