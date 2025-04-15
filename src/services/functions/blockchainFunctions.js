import { ethers } from 'ethers';

const NETWORK_URLS = {
  'sepolia': process.env.SEPOLIA_RPC_URL,
  'ethereum': process.env.ETHEREUM_RPC_URL,
  'polygon': process.env.POLYGON_RPC_URL,
  'arbitrum': process.env.ARBITRUM_RPC_URL
};

export const blockchainFunctions = {
  async getWalletBalance(params) {
    const { address } = params;
    try {
      const provider = new ethers.JsonRpcProvider(NETWORK_URLS['sepolia']);
      const balance = await provider.getBalance(address);
      return {
        balance: ethers.formatEther(balance),
        address,
        chain: 'sepolia'
      };
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }
};