export const ALLOWED_MODELS = ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-1106-preview'];

export const ERROR_MESSAGES = {
  INVALID_MODEL: 'Invalid model specified',
  ASSISTANT_NOT_FOUND: 'Assistant not found',
  THREAD_NOT_FOUND: 'Thread not found',
  OPENAI_ERROR: 'OpenAI API error occurred',
  DATABASE_ERROR: 'Database operation failed',
  BLOCKCHAIN_ERROR: 'Blockchain operation failed'
};

export const AVAILABLE_FUNCTIONS = {
  getWalletBalance: {
    name: 'getWalletBalance',
    description: 'Get the balance of an Ethereum wallet address on a specific chain',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'The Ethereum wallet address'
        },
        chain: {
          type: 'string',
          enum: ['Sepolia'],
          description: 'The blockchain network'
        }
      },
      required: ['address', 'chain']
    }
  }
};