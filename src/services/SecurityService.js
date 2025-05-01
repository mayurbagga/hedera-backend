import { Client, AccountId } from '@hashgraph/sdk';
import { UserWallet } from '../models/UserWallet.js';
import { Assistant } from '../models/Assistant.js';
import { HederaMonitor } from './HederaMonitor.js';

export class SecurityService {
    constructor(hederaMonitor) {
        this.hederaMonitor = hederaMonitor;
        this.allowedOperations = [
            'transfer',
            'createToken',
            'getBalance',
            'airdrop',
            'chat'
        ];
    }

    async validateOperation(userId, operation, assistantId = null) {
        // Check if user has a wallet
        const wallet = await UserWallet.findOne({ userId });
        if (!wallet) {
            throw new Error('User wallet not found');
        }

        // For chat operations, we don't need to validate assistant
        if (operation === 'chat') {
            return true;
        }

        // For non-chat operations, validate assistant
        if (assistantId) {
            // Check if assistant exists and has Hedera integration enabled
            const assistant = await Assistant.findById(assistantId);
            if (!assistant) {
                throw new Error('Assistant not found');
            }

            if (!assistant.hederaIntegration.enabled) {
                throw new Error('Hedera integration is not enabled for this assistant');
            }

            // Check if operation is allowed for this assistant
            if (!assistant.hederaIntegration.allowedOperations.includes(operation)) {
                throw new Error('Operation not allowed for this assistant');
            }
        }

        // Validate operation type
        if (!this.allowedOperations.includes(operation)) {
            throw new Error(`Operation ${operation} is not allowed`);
        }

        // Check rate limits
        const rateLimit = await this.checkRateLimit(userId, operation);
        if (!rateLimit.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds`);
        }

        // Check for suspicious activity
        const suspicious = await this.checkSuspiciousActivity(userId, operation);
        if (suspicious) {
            await this.hederaMonitor.logSuspiciousActivity(userId, operation);
            throw new Error('Suspicious activity detected. Operation blocked');
        }

        return true;
    }

    async checkRateLimit(userId, operation) {
        // Implement rate limiting logic here
        // This is a placeholder - you should implement actual rate limiting
        return {
            allowed: true,
            retryAfter: 0
        };
    }

    async checkSuspiciousActivity(userId, operation) {
        // Implement suspicious activity detection logic here
        // This is a placeholder - you should implement actual detection
        return false;
    }

    async encryptPrivateKey(privateKey) {
        // Implement encryption logic here
        // This is a placeholder - you should implement actual encryption
        return privateKey;
    }

    async decryptPrivateKey(encryptedKey) {
        // Implement decryption logic here
        // This is a placeholder - you should implement actual decryption
        return encryptedKey;
    }
} 