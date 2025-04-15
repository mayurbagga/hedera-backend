import { ethers } from 'ethers';
import { getProvider } from '../utils/provider.js';

export const readContractTool = {
  definition: {
    type: 'function',
    function: {
      name: 'read_contract',
      description: 'Read data from a smart contract',
      parameters: {
        type: 'object',
        properties: {
          contractAddress: {
            type: 'string',
            description: 'The contract address'
          },
          abi: {
            type: 'string',
            description: 'Contract ABI for the function'
          },
          functionName: {
            type: 'string',
            description: 'Name of the function to call'
          },
          args: {
            type: 'array',
            description: 'Function arguments',
            items: {
              type: 'string'
            }
          },
          chain: {
            type: 'string',
            enum: ['Ethereum', 'Sepolia', 'Polygon', 'Arbitrum'],
            description: 'The blockchain network'
          }
        },
        required: ['contractAddress', 'abi', 'functionName', 'args', 'chain']
      }
    }
  },
  handler: async ({ contractAddress, abi, functionName, args, chain }) => {
    const provider = getProvider(chain);
    const contract = new ethers.Contract(contractAddress, JSON.parse(abi), provider);
    const result = await contract[functionName](...args);
    return {
      result: result.toString(),
      contractAddress,
      functionName,
      args,
      chain
    };
  }
};