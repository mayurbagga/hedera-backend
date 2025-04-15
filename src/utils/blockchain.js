import { ethers } from 'ethers';

const NETWORK_URLS = {
  'sepolia': 'https://eth-sepolia.g.alchemy.com/v2/your-api-key'
};

export async function getWalletBalance(address, chain) {
  try {
    const provider = new ethers.JsonRpcProvider(NETWORK_URLS[chain.toLowerCase()]);
    const balance = await provider.getBalance(address);
    return {
      balance: ethers.formatEther(balance),
      address,
      chain
    };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }
}