import { ethers } from 'ethers';

const NETWORK_URLS = {
  'ethereum': process.env.ETH_RPC_URL,
  'sepolia': process.env.SEPOLIA_RPC_URL,
  'polygon': process.env.POLYGON_RPC_URL,
  'arbitrum': process.env.ARBITRUM_RPC_URL
};

export function getProvider(chain) {
  const url = NETWORK_URLS[chain.toLowerCase()];
  if (!url) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return new ethers.JsonRpcProvider(url);
}