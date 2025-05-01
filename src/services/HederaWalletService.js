import crypto from 'crypto';
import { UserWallet } from '../models/UserWallet.js';
import { Client, TokenCreateTransaction, TokenType, TokenSupplyType, TransferTransaction, Hbar, AccountId } from '@hashgraph/sdk';

export class HederaWalletService {
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_KEY;
    }

    async getHederaClient(userId) {
        const userWallet = await UserWallet.findOne({ userId });
        if (!userWallet) {
            throw new Error('User wallet not found');
        }

        const decryptedPrivateKey = this.decryptPrivateKey(userWallet.privateKey);
        
        // Create Hedera client
        const client = Client.forName(userWallet.network);
        client.setOperator(
            AccountId.fromString(userWallet.walletAddress),
            decryptedPrivateKey
        );
        
        return client;
    }

    async transferToken(userId, data) {
        const client = await this.getHederaClient(userId);
        
        // Create transfer transaction
        const transferTx = new TransferTransaction()
            .addTokenTransfer(data.tokenId, AccountId.fromString(userId), -data.amount)
            .addTokenTransfer(data.tokenId, AccountId.fromString(data.toAddress), data.amount)
            .freezeWith(client);

        // Sign and execute transaction
        const signedTx = await transferTx.sign(decryptedPrivateKey);
        const result = await signedTx.execute(client);

        // Update transaction history
        await this.updateTransactionHistory(userId, {
            type: 'transfer',
            amount: data.amount,
            tokenId: data.tokenId,
            status: 'completed'
        });

        return result;
    }

    async createToken(userId, options) {
        const client = await this.getHederaClient(userId);
        
        // Create token transaction
        const tokenCreateTx = new TokenCreateTransaction()
            .setTokenName(options.name)
            .setTokenSymbol(options.symbol)
            .setTokenType(TokenType.FungibleCommon)
            .setDecimals(8)
            .setInitialSupply(options.initialSupply)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(options.maxSupply || options.initialSupply)
            .setTreasuryAccountId(AccountId.fromString(userId))
            .freezeWith(client);

        // Sign and execute transaction
        const signedTx = await tokenCreateTx.sign(decryptedPrivateKey);
        const result = await signedTx.execute(client);

        // Get token ID from receipt
        const receipt = await result.getReceipt(client);
        const tokenId = receipt.tokenId.toString();

        // Update transaction history
        await this.updateTransactionHistory(userId, {
            type: 'createToken',
            tokenId: tokenId,
            status: 'completed'
        });

        return { tokenId };
    }

    async getWalletBalance(userId) {
        const client = await this.getHederaClient(userId);
        const accountId = AccountId.fromString(userId);
        
        // Get HBAR balance
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(client);
        
        const hbarBalance = accountInfo.balance.toString();
        
        // Get token balances
        const tokenBalances = await new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);
        
        // Update balance in database
        await this.updateTokenBalances(userId, tokenBalances.tokens);
        
        return { hbar: hbarBalance, tokens: tokenBalances.tokens };
    }

    async updateTokenBalances(userId, tokenBalances) {
        await UserWallet.findOneAndUpdate(
            { userId },
            {
                'hederaFeatures.tokenBalances': tokenBalances,
                'hederaFeatures.lastBalanceUpdate': new Date()
            }
        );
    }

    async updateTransactionHistory(userId, transaction) {
        await UserWallet.findOneAndUpdate(
            { userId },
            {
                $push: {
                    'hederaFeatures.transactionHistory': {
                        ...transaction,
                        timestamp: new Date()
                    }
                }
            }
        );
    }

    decryptPrivateKey(encryptedKey) {
        const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
        return decipher.update(encryptedKey, 'hex', 'utf8') + decipher.final('utf8');
    }
} 