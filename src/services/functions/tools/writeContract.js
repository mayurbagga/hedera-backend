import { ethers } from 'ethers';
import { getProvider } from '../utils/provider.js';

export const writeContractTool = {
  definition: {
    type: 'function',
    function: {
      name: 'write_contract',
      description: 'Execute a write operation on a smart contract',
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
  handler: async ({ contractAddress, abi, functionName, args, chain, privateKey }) => {
    const provider = getProvider(chain);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, JSON.parse(abi), wallet);
    const tx = await contract[functionName](...args);
    return {
      hash: tx.hash,
      contractAddress,
      functionName,
      args,
      chain
    };
  }
};