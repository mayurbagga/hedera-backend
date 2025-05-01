import { HederaWalletService } from './HederaWalletService.js';
import { UserWallet } from '../models/UserWallet.js';
import winston from 'winston';

export class HederaMonitor {
    constructor() {
        this.hederaWalletService = new HederaWalletService();
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.File({ filename: 'hedera-operations.log' }),
                new winston.transports.Console()
            ]
        });
        this.operations = new Map();
        this.allowedOperations = [
            'transfer',
            'createToken',
            'getBalance',
            'airdrop',
            'chat'
        ];
    }

    logOperation(data) {
        const { userId, operation, message = null } = data;
        
        if (!this.operations.has(userId)) {
            this.operations.set(userId, []);
        }

        const timestamp = new Date();
        const operationLog = {
            operation,
            timestamp,
            message: operation === 'chat' ? message : null,
            ...data
        };

        this.operations.get(userId).push(operationLog);
        console.log(`Operation logged: ${operation} for user ${userId}`);
    }

    async monitorBalances() {
        const wallets = await UserWallet.find({});
        for (const wallet of wallets) {
            try {
                const balance = await this.hederaWalletService.getWalletBalance(wallet.userId);
                this.logBalance(wallet.userId, balance);
            } catch (error) {
                this.logger.error({
                    type: 'BALANCE_MONITOR_ERROR',
                    userId: wallet.userId,
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }
    }

    logBalance(userId, balance) {
        this.logger.info({
            type: 'BALANCE_UPDATE',
            userId,
            balance,
            timestamp: new Date()
        });
    }

    async checkSuspiciousActivity(userId, operation) {
        const wallet = await UserWallet.findOne({ userId });
        if (!wallet) return false;

        const recentTransactions = wallet.hederaFeatures.transactionHistory
            .filter(t => t.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
            .filter(t => t.type === operation);

        if (recentTransactions.length > 10) {
            this.logger.warn({
                type: 'SUSPICIOUS_ACTIVITY',
                userId,
                operation,
                count: recentTransactions.length,
                timestamp: new Date()
            });
            return true;
        }

        return false;
    }

    async startMonitoring() {
        console.log('Hedera Monitor started');
        // Monitor balances every hour
        setInterval(() => this.monitorBalances(), 60 * 60 * 1000);
        
        // Initial balance check
        await this.monitorBalances();
    }

    logSuspiciousActivity(userId, operation) {
        console.warn(`Suspicious activity detected: ${operation} for user ${userId}`);
    }

    getOperationHistory(userId) {
        return this.operations.get(userId) || [];
    }
} 