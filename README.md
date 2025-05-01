# Hedera AI Agent Backend

A powerful backend service that combines AI capabilities with Hedera blockchain operations using hedera-agentkit and Hedera Hashgraph. This project was developed for the Hedera Hackathon to demonstrate the integration of AI assistants with blockchain functionality.

## 🚀 Features

- **AI-Powered Blockchain Operations**: Intelligent processing of natural language requests for Hedera operations
- **Hedera Integration**:
  - HBAR balance checking
  - Token transfers
  - Custom token creation
  - Topic management (create, submit messages, get messages)
  - Airdrop functionality
- **Smart Assistant System**:
  - Custom AI assistants with unique personalities
  - Natural language understanding
  - Context-aware responses
  - Conversation history tracking

## 🛠 Technology Stack

- **Blockchain**:
  - [hedera-agentkit](https://github.com/hedera-agent-kit): For simplified Hedera operations
  - Hedera Hashgraph: For blockchain infrastructure
  - Mirror Node integration: For network data access
- **AI & Language Processing**:
  - LangChain: For AI operations
  - GPT-4: For natural language understanding
- **Backend**:
  - Node.js & Express
  - MongoDB: For data persistence
  - WebSocket: For real-time event handling

## 💡 How We Use Hedera-AgentKit

The project leverages hedera-agentkit in several key areas:

1. **HederaChatService.js**:
   - Initializes HederaAgentKit with user credentials
   - Handles HBAR and token balance queries
   - Manages token transfers and creation
   - Implements topic operations

2. **Key Features Implementation**:
   ```javascript
   // Initialize Hedera Agent
   this.hederaAgent = new HederaAgentKit(
       accountId,
       privateKey,
       publicKey,
       network,
       config
   );

   // Balance Operations
   const balance = await this.hederaAgent.getHbarBalance();

   // Token Operations
   const tokenResult = await this.hederaAgent.createFT(tokenOptions);
   const transferResult = await this.hederaAgent.transferToken(tokenId, recipient, amount);

   // Topic Operations
   const topicResult = await this.hederaAgent.createTopic(memo, isSubmitKey);
   ```

## 🔗 Hedera Hashgraph Integration

Our project utilizes Hedera Hashgraph's network for:

1. **Account Management**:
   - Secure wallet creation
   - Balance tracking
   - Transaction processing

2. **Token Service (HTS)**:
   - Custom token creation
   - Token transfers
   - Balance management

3. **Consensus Service**:
   - Topic creation and management
   - Message submission
   - Message retrieval

## 🏗 Project Structure

```
hedera-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── openai.js
│   ├── controllers/
│   │   ├── assistantController.js
│   │   └── chatController.js
│   ├── models/
│   │   ├── Assistant.js
│   │   ├── Chat.js
│   │   └── User.js
│   ├── services/
│   │   ├── HederaChatService.js
│   │   └── threadService.js
│   └── routes/
│       ├── assistantRoutes.js
│       └── hederaRoutes.js
└── index.js
```

## 🚀 Getting Started

1. **Prerequisites**:
   - Node.js v16 or higher
   - MongoDB
   - Hedera testnet account

2. **Environment Setup**:
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd hedera-backend

   # Install dependencies
   npm install

   # Create .env file
   cp .env.example .env
   ```

3. **Configure Environment Variables**:
   ```env
   # Hedera Configuration
   HEDERA_NETWORK=testnet
   OPERATOR_ID=your-operator-id
   OPERATOR_KEY=your-operator-key

   # Database
   MONGODB_URI=your-mongodb-uri

   # AI Configuration
   OPENAI_API_KEY=your-openai-key
   ```

4. **Start the Server**:
   ```bash
   npm run dev
   ```

## 🔐 Security

- Private keys are encrypted before storage
- Environment variables for sensitive data
- Authentication middleware for API endpoints
- Rate limiting for API protection

## 📝 API Documentation

### Hedera Operations

1. **Balance Check**:
   ```http
   POST /api/hedera/chat
   {
     "message": "what's my balance",
     "userAddress": "0.0.123456"
   }
   ```

2. **Token Transfer**:
   ```http
   POST /api/hedera/chat
   {
     "message": "transfer 10 HBAR to 0.0.789012",
     "userAddress": "0.0.123456"
   }
   ```

3. **Create Token**:
   ```http
   POST /api/hedera/chat
   {
     "message": "create a token named MyToken with symbol MTK and initial supply 1000",
     "userAddress": "0.0.123456"
   }
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Project

This project was developed for the Hedera Hackathon, showcasing the integration of AI capabilities with Hedera blockchain operations. It demonstrates how natural language processing can be combined with blockchain functionality to create user-friendly blockchain interactions. 