import { HederaAgentKit } from 'hedera-agent-kit';
import { ChatOpenAI } from '@langchain/openai';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import User from '../models/userModel.js';
import { Assistant } from '../models/Assistant.js';
import { Chat } from '../models/chatModel.js';
import mongoose from 'mongoose';

export class HederaChatService {
    constructor() {
        // Initialize Chat Model with system message
        this.chatModel = new ChatOpenAI({
            model: "gpt-4",
            temperature: 0.7
        });
    }

    async initializeHederaAgent(userAddress) {
        try {
            // Get user's Hedera credentials
            const user = await User.findOne({ address: userAddress }).select('+privateKey');
            if (!user) {
                throw new Error('User not found');
            }

            // Determine the correct mirror node URL based on network
            const mirrorNodeUrl = user.network === 'testnet' 
                ? 'https://testnet.mirrornode.hedera.com'
                : user.network === 'mainnet'
                    ? 'https://mainnet.mirrornode.hedera.com'
                    : 'https://previewnet.mirrornode.hedera.com';

            console.log('Initializing Hedera agent with:', {
                accountId: user.accountId,
                network: user.network,
                mirrorNodeUrl
            });

            // Initialize Hedera Agent with proper configuration
            this.hederaAgent = new HederaAgentKit(
                user.accountId,
                user.privateKey,
                user.publicKey,
                user.network || 'testnet',
                {
                    mirrorNodeUrl,
                    network: {
                        [user.network]: {
                            mirrorNodeUrl
                        }
                    }
                }
            );

            // Create Hedera Tools
            const hederaTools = this.createHederaTools();
            this.toolsNode = new ToolNode(hederaTools);

            // Test the connection
            await this.hederaAgent.getHbarBalance();
            console.log('Hedera agent initialized successfully');
        } catch (error) {
            console.error('Error initializing Hedera agent:', error);
            throw new Error('Failed to initialize Hedera agent: ' + error.message);
        }
    }

    createHederaTools() {
        return [
            {
                name: 'getBalance',
                description: 'Get HBAR and token balances from the Hedera network',
                func: async () => {
                    try {
                        const hbarBalance = await this.hederaAgent.getHbarBalance();
                        const tokenBalances = await this.hederaAgent.getAllTokensBalances();
                        return { hbarBalance, tokenBalances };
                    } catch (error) {
                        console.error('Error in getBalance tool:', error);
                        throw error;
                    }
                }
            },
            {
                name: 'transfer',
                description: 'Transfer tokens to another address on the Hedera network',
                func: async (data) => {
                    try {
                        return await this.hederaAgent.transferToken(
                            data.tokenId,
                            data.toAddress,
                            data.amount,
                            true
                        );
                    } catch (error) {
                        console.error('Error in transfer tool:', error);
                        throw error;
                    }
                }
            },
            {
                name: 'createToken',
                description: 'Create a new token on the Hedera network',
                func: async (data) => {
                    try {
                        return await this.hederaAgent.createFT(data.options, true);
                    } catch (error) {
                        console.error('Error in createToken tool:', error);
                        throw error;
                    }
                }
            },
            {
                name: 'airdrop',
                description: 'Airdrop tokens to multiple recipients on the Hedera network',
                func: async (data) => {
                    try {
                        return await this.hederaAgent.airdropToken(
                            data.tokenId,
                            data.recipients,
                            true
                        );
                    } catch (error) {
                        console.error('Error in airdrop tool:', error);
                        throw error;
                    }
                }
            },
            {
                name: 'topic',
                description: 'Perform topic operations on the Hedera network',
                func: async (data) => {
                    try {
                        switch (data.operation) {
                            case 'create':
                                return await this.hederaAgent.createTopic(
                                    data.memo,
                                    data.isSubmitKey,
                                    true
                                );
                            case 'message':
                                return await this.hederaAgent.submitTopicMessage(
                                    data.topicId,
                                    data.message,
                                    true
                                );
                            case 'getMessages':
                                return await this.hederaAgent.getTopicMessages(
                                    data.topicId,
                                    this.hederaAgent.network
                                );
                            default:
                                throw new Error('Invalid topic operation');
                        }
                    } catch (error) {
                        console.error('Error in topic tool:', error);
                        throw error;
                    }
                }
            }
        ];
    }

    async handleChatMessage(userAddress, message, assistantId) {
        try {
            console.log('Received message:', message);
            console.log('User address:', userAddress);
            
            // Get assistant's instructions
            const assistant = await Assistant.findById(assistantId);
            if (!assistant) {
                throw new Error('Assistant not found');
            }

            // Initialize Hedera Agent if not already initialized
            if (!this.hederaAgent) {
                console.log('Initializing Hedera agent for address:', userAddress);
                await this.initializeHederaAgent(userAddress);
            }

            // Find existing chat or create new one with a new threadId
            let chat = await Chat.findOne({
                assistantId: assistantId,
                userId: userAddress,
                status: 'active'
            });

            if (!chat) {
                // Create a new threadId
                const threadId = new mongoose.Types.ObjectId();
                chat = new Chat({
                    assistantId: assistantId,
                    userId: userAddress,
                    threadId: threadId,
                    messages: [],
                    status: 'active'
                });
            }

            // Add user message
            chat.messages.push({
                role: 'user',
                content: message,
                timestamp: new Date()
            });

            // Create system message with assistant's instructions
            const systemMessage = new SystemMessage(`
                ${assistant.instructions}
                
                You are a Hedera blockchain assistant named "${assistant.name}" that helps understand user requests.
                Your role is to classify user messages into specific operations and respond in a way that matches your personality and capabilities.
                
                Available Operations:
                1. BALANCE - When users want to check their HBAR balance
                2. TRANSFER - When users want to send HBAR to another account
                3. CREATE_TOKEN - When users want to create a new fungible token
                
                For TRANSFER operations, extract:
                - amount: The amount of HBAR to transfer
                - recipientId: The Hedera account ID to send to
                
                For CREATE_TOKEN operations, extract:
                - name: The name of the token
                - symbol: The token symbol
                - initialSupply: The initial supply amount
                
                Respond in JSON format:
                {
                    "operation": "BALANCE" | "TRANSFER" | "CREATE_TOKEN" | "INTRO",
                    "params": {
                        "amount": number,        // For TRANSFER only
                        "recipientId": string,   // For TRANSFER only
                        "name": string,          // For CREATE_TOKEN only
                        "symbol": string,        // For CREATE_TOKEN only
                        "initialSupply": number  // For CREATE_TOKEN only
                    },
                    "response": string          // Your personalized response message
                }
            `);

            // Use LangChain to understand the request
            const messages = [
                systemMessage,
                new HumanMessage(message)
            ];

            // Get response from the model
            const response = await this.chatModel.invoke(messages);
            const parsedResponse = JSON.parse(response.content);

            // Add assistant's initial response
            chat.messages.push({
                role: 'assistant',
                content: parsedResponse.response,
                timestamp: new Date()
            });

            let operationResult;
            // Handle the operation based on the parsed response
            try {
                switch (parsedResponse.operation) {
                    case 'BALANCE':
                        const balance = await this.hederaAgent.getHbarBalance();
                        operationResult = `Your HBAR balance is: ${balance} HBAR`;
                        break;
                    case 'TRANSFER':
                        const transferResult = await this.hederaAgent.transferToken(
                            null, // HBAR transfer
                            parsedResponse.params.recipientId,
                            parsedResponse.params.amount,
                            true
                        );
                        operationResult = `Transfer successful! Transaction hash: ${transferResult.txHash}`;
                        break;
                    case 'CREATE_TOKEN':
                        const tokenResult = await this.hederaAgent.createFT({
                            name: parsedResponse.params.name,
                            symbol: parsedResponse.params.symbol,
                            initialSupply: parsedResponse.params.initialSupply
                        }, true);
                        operationResult = `Token created successfully! Token ID: ${tokenResult.tokenId}`;
                        break;
                    case 'INTRO':
                    case 'UNKNOWN':
                        operationResult = parsedResponse.response;
                        break;
                    default:
                        operationResult = "I'm not sure how to handle that request. Please try again.";
                }

                // Add operation result as a separate message if different from initial response
                if (operationResult && operationResult !== parsedResponse.response) {
                    chat.messages.push({
                        role: 'assistant',
                        content: operationResult,
                        timestamp: new Date()
                    });
                }

                // Save the chat
                await chat.save();

                return operationResult;
            } catch (error) {
                // Add error message to chat
                chat.messages.push({
                    role: 'assistant',
                    content: `Error: ${error.message}`,
                    timestamp: new Date()
                });
                await chat.save();
                throw error;
            }
        } catch (error) {
            console.error('Error in handleChatMessage:', error);
            throw error;
        }
    }

    isBalanceQuery(message) {
        // Don't match if it's a transfer request
        if (message.toLowerCase().includes('transfer') || message.toLowerCase().includes('send')) {
            return false;
        }
        
        const balanceKeywords = [
            'balance',
            'how much',
            'check my',
            'show me',
            'what\'s in',
            'wallet',
            'hbar'
        ];
        
        const lowerMessage = message.toLowerCase();
        return balanceKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    async handleTopicOperation(data) {
        try {
            switch (data.operation) {
                case 'create':
                    const createResult = await this.hederaAgent.createTopic(
                        data.memo,
                        data.isSubmitKey,
                        true
                    );
                    return `Topic created successfully! Topic ID: ${createResult.topicId}`;
                
                case 'message':
                    const messageResult = await this.hederaAgent.submitTopicMessage(
                        data.topicId,
                        data.message,
                        true
                    );
                    return `Message submitted successfully! Transaction hash: ${messageResult.txHash}`;
                
                case 'getMessages':
                    const messages = await this.hederaAgent.getTopicMessages(
                        data.topicId,
                        this.hederaAgent.network
                    );
                    return `Topic Messages:\n${messages.map(m => m.message).join('\n')}`;
                
                default:
                    return "Invalid topic operation. Please specify create, message, or getMessages.";
            }
        } catch (error) {
            console.error('Error in topic operation:', error);
            return "Sorry, the topic operation failed. Please check the details and try again.";
        }
    }

    async parseOperation(message) {
        try {
            const response = await this.chatModel.invoke([
                this.systemMessage,
                new HumanMessage(`
                    Analyze this message and determine if it's a Hedera operation request.
                    Focus on identifying balance-related queries.
                    
                    Balance-related phrases to look for:
                    - "balance"
                    - "how much"
                    - "check my"
                    - "show me"
                    - "what's in"
                    - "wallet"
                    - "hbar"
                    - "tokens"
                    
                    Message to analyze: "${message}"
                    
                    Respond in JSON format with:
                    {
                        "type": "getBalance" | "transfer" | "createToken" | "airdrop" | "topic" | "unknown",
                        "data": {
                            // Operation-specific parameters
                        },
                        "confidence": number // 0-1 indicating how confident you are about the operation type
                    }
                `)
            ]);

            const analysis = JSON.parse(response.content);
            
            // If it's a balance-related query with high confidence, force it to getBalance
            if (analysis.confidence > 0.7 && 
                (message.toLowerCase().includes('balance') || 
                 message.toLowerCase().includes('how much') || 
                 message.toLowerCase().includes('check my') || 
                 message.toLowerCase().includes('show me') || 
                 message.toLowerCase().includes('what\'s in') || 
                 message.toLowerCase().includes('wallet') || 
                 message.toLowerCase().includes('hbar') || 
                 message.toLowerCase().includes('tokens'))) {
                return { type: 'getBalance', data: {} };
            }
            
            return analysis;
        } catch (error) {
            console.error('Error parsing operation:', error);
            return { type: 'unknown' };
        }
    }

    async formatResponse(result, operationType) {
        const messages = [
            this.systemMessage,
            new HumanMessage(`
                Format this operation result in a friendly, conversational way.
                Operation type: ${operationType}
                Result: ${JSON.stringify(result)}
                
                Make the response:
                1. Clear and easy to understand
                2. Include relevant details
                3. Use emojis where appropriate
                4. Be friendly and helpful
            `)
        ];

        const response = await this.chatModel.invoke(messages);
        return response.content;
    }
} 