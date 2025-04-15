import { createPublicClient, http } from 'viem';
import { 
  sepolia, 
  mainnet, 
bscTestnet,
bsc,
  baseSepolia, 
  base, 
   

  
  // Add other chains as needed
} from 'viem/chains'; // Import specific chains

export const getBalanceTool = {
  definition: {
    type: 'function',
    function: {
      name: 'get_balance',
      description: 'Get native token balance of a wallet address on any network',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The wallet address to check'
          },
          chain: {
            type: 'string',
            description: 'The chain to check the balance on'
          }
        },
        required: ['address', 'chain']
      }
    }
  },
  handler: async ({ address, chain }) => {
    console.log('getBalance handler called with address:', address, 'and chain:', chain);
    
    try {
      // Create a mapping of supported chains
      const supportedChains = {
        sepolia, 
        mainnet, 
      bscTestnet,
      bsc,
        baseSepolia, 
        base, 
       
        
        // Add other chains as needed
      };

      const selectedChain = supportedChains[chain]; // Dynamically select the chain
      if (!selectedChain) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      console.log('Using RPC URL:', selectedChain.rpc); // Log the RPC URL
      
      const client = createPublicClient({
        chain: selectedChain,
        transport: http({ url: selectedChain.rpc }) // Use the appropriate RPC URL
      });
      
      console.log('Fetching balance for address:', address);
      const balance = await client.getBalance({ address });
      
      const result = {
        balance: balance.toString(),
        address,
        chain: chain
      };
      console.log('Balance result:', result);
      
      return result;
    } catch (error) {
      console.error('Error in getBalance handler:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }
};