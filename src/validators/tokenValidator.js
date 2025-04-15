export function validateTokenInfo(data) {
  const errors = [];

  if (!data.tokenName?.trim()) {
    errors.push('Token name is required');
  }

  if (typeof data.tokenSupply !== 'number' || data.tokenSupply < 0) {
    errors.push('Token supply must be a non-negative number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}