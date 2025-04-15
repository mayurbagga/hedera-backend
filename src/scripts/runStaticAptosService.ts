import { StaticAptosService } from '../services/staticAptosService';

async function main() {
  const walletAddress = 'your_wallet_address'; // Replace with the actual wallet address
  const service = new StaticAptosService();

  try {
    const responses = await service.getStaticResponse(walletAddress);
    console.log('Responses:', responses);
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 