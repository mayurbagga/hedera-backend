import { HederaWalletService } from './HederaWalletService.js';
import { SecurityService } from './SecurityService.js';
import { Assistant } from '../models/Assistant.js';
import User from '../models/userModel.js';
import { HederaAgentKit } from 'hedera-agent-kit';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/output_parsers';

export class EnhancedAssistantService {
    constructor(hederaWalletService, securityService) {
        this.hederaWalletService = hederaWalletService;
        this.securityService = securityService;
        this.llm = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: "gpt-4-turbo-preview",
            temperature: 0.7,
            modelKwargs: {
                response_format: { type: "json_object" }
            }
        });

        // Define Hedera operation functions
        this.hederaFunctions = [
            {
                name: "get_balance",
                description: "Get the current balance of HBAR and tokens in the wallet",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "transfer_tokens",
                description: "Transfer tokens to another address",
                parameters: {
                    type: "object",
                    properties: {
                        toAddress: {
                            type: "string",
                            description: "The recipient's address"
                        },
                        amount: {
                            type: "number",
                            description: "The amount of tokens to transfer"
                        },
                        tokenId: {
                            type: "string",
                            description: "The ID of the token to transfer"
                        }
                    },
                    required: ["toAddress", "amount", "tokenId"]
                }
            },
            {
                name: "create_token",
                description: "Create a new token",
                parameters: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the token"
                        },
                        symbol: {
                            type: "string",
                            description: "The symbol of the token"
                        },
                        initialSupply: {
                            type: "number",
                            description: "The initial supply of the token"
                        }
                    },
                    required: ["name", "symbol", "initialSupply"]
                }
            }
        ];
    }

    async getHederaAgent(userId) {
        // Get user's Hedera credentials
        const user = await User.findById(userId).select('+privateKey');
        if (!user) {
            throw new Error('User not found');
        }

        // Create and configure Hedera agent
        const agent = new HederaAgentKit(
            user.accountId,
            user.privateKey,
            user.publicKey,
            user.network || 'testnet'
        );

        return agent;
    }

    async handleHederaPrompt(assistantId, userId, prompt) {
        // Check if the assistant has Hedera integration enabled
        const assistant = await Assistant.findById(assistantId);
        if (!assistant || !assistant.hederaIntegration.enabled) {
            return {
                response: "I'm sorry, but Hedera integration is not enabled for this assistant. Please contact the administrator to enable Hedera features.",
                operation: null
            };
        }

        try {
            // First, analyze the prompt to determine if it's a Hedera operation
            const analysis = await this.llm.invoke([
                new HumanMessage(`
                    Analyze this user request and determine if it's a Hedera operation.
                    If it is, identify the operation type and extract relevant parameters.
                    Request: "${prompt}"
                    
                    Respond in JSON format with:
                    {
                        "isHederaOperation": boolean,
                        "operation": "get_balance" | "transfer_tokens" | "create_token" | "transfer_hbar" | "airdrop" | "create_topic" | null,
                        "parameters": {
                            // Operation-specific parameters
                        }
                    }
                `)
            ]);

            const parsedAnalysis = JSON.parse(analysis.content);

            if (!parsedAnalysis.isHederaOperation) {
                return {
                    response: "I understand you're asking about Hedera operations. I can help you with checking your balance, transferring tokens, or creating new tokens. Could you please be more specific about what you'd like to do?",
                    operation: null
                };
            }

            // Get Hedera agent for the user
            const agent = await this.getHederaAgent(userId);

            // Perform the operation
            let result;
            switch (parsedAnalysis.operation) {
                case "get_balance":
                    const hbarBalance = await agent.getHbarBalance();
                    const tokenBalances = await agent.getAllTokensBalances();
                    result = {
                        hbar: hbarBalance,
                        tokens: tokenBalances
                    };
                    break;
                case "transfer_tokens":
                    result = await agent.transferToken(
                        parsedAnalysis.parameters.tokenId,
                        parsedAnalysis.parameters.toAddress,
                        parsedAnalysis.parameters.amount,
                        true
                    );
                    break;
                case "transfer_hbar":
                    result = await agent.transferHbar(
                        parsedAnalysis.parameters.toAddress,
                        parsedAnalysis.parameters.amount,
                        true
                    );
                    break;
                case "create_token":
                    if (parsedAnalysis.parameters.type === 'ft') {
                        result = await agent.createFT({
                            name: parsedAnalysis.parameters.name,
                            symbol: parsedAnalysis.parameters.symbol,
                            decimals: parsedAnalysis.parameters.decimals,
                            initialSupply: parsedAnalysis.parameters.initialSupply,
                            treasuryAccountId: agent.accountId,
                            adminKey: agent.publicKey,
                            supplyKey: agent.publicKey
                        }, true);
                    } else {
                        result = await agent.createNFT({
                            name: parsedAnalysis.parameters.name,
                            symbol: parsedAnalysis.parameters.symbol,
                            treasuryAccountId: agent.accountId,
                            adminKey: agent.publicKey,
                            supplyKey: agent.publicKey
                        }, true);
                    }
                    break;
                case "airdrop":
                    result = await agent.airdropToken(
                        parsedAnalysis.parameters.tokenId,
                        parsedAnalysis.parameters.recipients,
                        true
                    );
                    break;
                case "create_topic":
                    result = await agent.createTopic(
                        parsedAnalysis.parameters.memo,
                        parsedAnalysis.parameters.isSubmitKey,
                        true
                    );
                    break;
                default:
                    throw new Error(`Unknown operation: ${parsedAnalysis.operation}`);
            }

            // Format the response
            const responseMessage = await this.llm.invoke([
                new HumanMessage(`
                    Create a natural language response for this Hedera operation result.
                    Operation: ${parsedAnalysis.operation}
                    Result: ${JSON.stringify(result)}
                    
                    Make the response friendly and informative.
                `)
            ]);

            return {
                response: responseMessage.content,
                operation: parsedAnalysis.operation,
                result
            };
        } catch (error) {
            return {
                response: `I encountered an error while processing your request: ${error.message}`,
                operation: null,
                error: true
            };
        }
    }

    formatOperationResponse(operation, result) {
        switch (operation) {
            case 'getBalance':
                return `Your current balance is:\n` +
                       `HBAR: ${result.hbar}\n` +
                       (result.tokens && result.tokens.length > 0 
                        ? `Tokens:\n${result.tokens.map(t => `- ${t.tokenId}: ${t.balance}`).join('\n')}`
                        : 'No tokens found');
            
            case 'transfer':
                return `Successfully transferred ${result.amount} tokens to ${result.toAddress}. Transaction ID: ${result.transactionId}`;
            
            case 'createToken':
                return `Successfully created token "${result.name}" (${result.symbol}) with ID: ${result.tokenId}`;
            
            default:
                return 'Operation completed successfully';
        }
    }

    extractOperationFromPrompt(prompt) {
        const promptLower = prompt.toLowerCase();
        
        // Balance check patterns
        if (promptLower.includes('balance') || 
            promptLower.includes('check balance') || 
            promptLower.includes('how much') || 
            promptLower.includes('what is my balance') ||
            promptLower.includes('show my balance') ||
            promptLower.includes('wallet balance')) {
            return 'getBalance';
        }
        
        // Transfer patterns
        if (promptLower.includes('transfer') || 
            promptLower.includes('send') || 
            promptLower.includes('give') || 
            promptLower.includes('move') ||
            promptLower.includes('pay')) {
            return 'transfer';
        }
        
        // Token creation patterns
        if (promptLower.includes('create token') || 
            promptLower.includes('new token') || 
            promptLower.includes('mint token') || 
            promptLower.includes('issue token')) {
            return 'createToken';
        }
        
        return null;
    }

    extractOperationData(prompt, operation) {
        switch (operation) {
            case 'transfer':
                return this.extractTransferData(prompt);
            case 'createToken':
                return this.extractTokenCreationData(prompt);
            case 'getBalance':
                return {};
            default:
                return {};
        }
    }

    extractTransferData(prompt) {
        // Simple extraction - you might want to use more sophisticated NLP here
        const amountMatch = prompt.match(/(\d+)\s*(?:tokens|coins|amount)/i);
        const toMatch = prompt.match(/to\s+([a-zA-Z0-9]+)/i);
        
        return {
            amount: amountMatch ? parseInt(amountMatch[1]) : null,
            toAddress: toMatch ? toMatch[1] : null
        };
    }

    extractTokenCreationData(prompt) {
        const nameMatch = prompt.match(/name\s+([a-zA-Z0-9\s]+)/i);
        const symbolMatch = prompt.match(/symbol\s+([a-zA-Z0-9]+)/i);
        const supplyMatch = prompt.match(/(\d+)\s*(?:supply|tokens)/i);
        
        return {
            name: nameMatch ? nameMatch[1].trim() : null,
            symbol: symbolMatch ? symbolMatch[1].trim() : null,
            initialSupply: supplyMatch ? parseInt(supplyMatch[1]) : null
        };
    }

    async performHederaOperation(assistantId, userId, operation, data) {
        // Validate assistant exists and has Hedera integration enabled
        const assistant = await Assistant.findById(assistantId);
        if (!assistant) {
            throw new Error('Assistant not found');
        }

        if (!assistant.hederaIntegration.enabled) {
            throw new Error('Hedera integration is not enabled for this assistant');
        }

        if (!assistant.hederaIntegration.allowedOperations.includes(operation)) {
            throw new Error('Operation not allowed for this assistant');
        }

        // Validate permissions and rate limits
        await this.securityService.validateOperation(userId, operation, assistantId);

        // Get Hedera client
        const client = await this.hederaWalletService.getHederaClient(userId);
        
        // Perform operation
        switch (operation) {
            case 'transfer':
                if (data.amount > assistant.hederaIntegration.rateLimits.transfers) {
                    throw new Error('Transfer amount exceeds assistant rate limit');
                }
                return this.hederaWalletService.transferToken(userId, {
                    tokenId: data.tokenId,
                    toAddress: data.toAddress,
                    amount: data.amount
                });
            case 'createToken':
                if (data.initialSupply > assistant.hederaIntegration.rateLimits.creates) {
                    throw new Error('Token supply exceeds assistant rate limit');
                }
                return this.hederaWalletService.createToken(userId, {
                    name: data.name,
                    symbol: data.symbol,
                    initialSupply: data.initialSupply,
                    maxSupply: data.maxSupply
                });
            case 'getBalance':
                return this.hederaWalletService.getWalletBalance(userId);
            default:
                throw new Error('Unsupported operation');
        }
    }

    async enableHederaIntegration(assistantId, config) {
        const assistant = await Assistant.findById(assistantId);
        if (!assistant) {
            throw new Error('Assistant not found');
        }

        // Validate network
        const validNetworks = ['mainnet', 'testnet', 'previewnet'];
        if (!validNetworks.includes(config.network)) {
            throw new Error('Invalid network specified');
        }

        assistant.hederaIntegration = {
            enabled: true,
            network: config.network || 'testnet',
            allowedOperations: config.allowedOperations || ['transfer', 'getBalance'],
            rateLimits: {
                transfers: config.rateLimits?.transfers || 100,
                creates: config.rateLimits?.creates || 10,
                messages: config.rateLimits?.messages || 1000
            }
        };

        await assistant.save();
        return assistant;
    }

    async disableHederaIntegration(assistantId) {
        const assistant = await Assistant.findById(assistantId);
        if (!assistant) {
            throw new Error('Assistant not found');
        }

        assistant.hederaIntegration.enabled = false;
        await assistant.save();
        return assistant;
    }

    async updateAssistantHederaInstructions(assistantId) {
        const assistant = await Assistant.findById(assistantId);
        if (!assistant) {
            throw new Error('Assistant not found');
        }

        // Update assistant instructions to include Hedera capabilities
        const hederaInstructions = `
I am a Hedera-enabled assistant that can help you with:
1. Checking your wallet balance
2. Transferring tokens
3. Creating new tokens

You can ask me things like:
- "What's my current balance?"
- "Check my wallet balance"
- "How much HBAR do I have?"
- "Transfer 100 tokens to address 0x123..."
- "Create a new token named MyToken"

I will understand these requests and perform the corresponding Hedera operations.
`;

        // Update the assistant's instructions
        assistant.instructions = hederaInstructions;
        
        // Enable Hedera integration if not already enabled
        assistant.hederaIntegration = {
            enabled: true,
            network: 'testnet',
            allowedOperations: ['transfer', 'createToken', 'getBalance'],
            rateLimits: {
                transfers: 100,
                creates: 10,
                messages: 1000
            }
        };

        // Add Hedera-related tools
        assistant.tools = assistant.tools || [];
        assistant.tools.push({
            type: 'function',
            function: {
                name: 'handleHederaOperation',
                description: 'Handle Hedera blockchain operations',
                parameters: {
                    type: 'object',
                    properties: {
                        operation: {
                            type: 'string',
                            enum: ['getBalance', 'transfer', 'createToken'],
                            description: 'The Hedera operation to perform'
                        },
                        data: {
                            type: 'object',
                            description: 'Operation-specific data'
                        }
                    },
                    required: ['operation']
                }
            }
        });

        await assistant.save();
        return assistant;
    }
} 