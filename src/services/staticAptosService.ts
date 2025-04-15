import { Injectable } from '@nestjs/common';
import { Account, Aptos, AptosConfig, Network, MoveStructId } from '@aptos-labs/ts-sdk';
import { AgentRuntime, LocalSigner } from 'move-agent-kit-fullstack';

@Injectable()
export class StaticAptosService {
  public async getStaticResponse(walletAddress: string) {
    const signer = new LocalSigner({} as Account);

    console.log('signer ===========>>>>>>>>>>', signer);

    const aptos = new Aptos(
      new AptosConfig({
        network: Network.MAINNET,
      })
    );

    const agent = new AgentRuntime(signer, aptos);

    console.log('agent ===========>>>>>>>>', agent);

    const responses = [];

    // Directly handle the 'aptos_balance' case with static values
    const actionType = 'aptos_balance';
    const values = ['0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>']; // Example Aptos coin type

    switch (actionType) {
      case 'aptos_balance': {
        const args = values as [string];
        const mint = args[0];

        if (mint) {
          let balance: number;
          if (mint.split('::').length !== 3) {
            const balances = await agent.aptos.getCurrentFungibleAssetBalances({
              options: {
                where: {
                  owner_address: {
                    _eq: walletAddress,
                  },
                  asset_type: { _eq: mint },
                },
              },
            });

            balance = balances[0].amount ?? 0;
          } else {
            balance = await agent.aptos.getAccountCoinAmount({
              accountAddress: walletAddress as string,
              coinType: mint as MoveStructId,
            });
          }

          const tokenDetails = await agent.getTokenDetails(mint);

          responses.push(balance);
        } else {
          const balance = await agent.aptos.getAccountAPTAmount({
            accountAddress: walletAddress as string,
          });

          responses.push(balance);
        }
        break;
      }
      // Add more cases if needed
    }

    return responses;
  }
} 