import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import assistantRoutes from './routes/assistantRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSwagger } from './config/swagger.js';
import userRoutes from './routes/userRoutes.js';
import Web3 from 'web3';
import { Assistant } from './models/Assistant.js';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';
import chatRoutes from './routes/chatRoutes.js';
import hederaRoutes from './routes/hederaRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import JSON file using readFileSync
const factoryABI = JSON.parse(readFileSync(new URL('../abi_Fectory_Bonding_Curve.json', import.meta.url)));

// Dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://hedera-starter.vercel.app',
  'https://hedera-starter-frontend.vercel.app',
  'https://*',
  'https://4258-106-215-20-105.ngrok-free.app',
  'https://f395-106-215-20-105.ngrok-free.app',
  'https://ai-agent-frontend-nine.vercel.app',
  'https://main.d2fr6vimkj4d1z.amplifyapp.com',
  'https://movestarter.fun',
  'https://main.d21c1uuxm7cd7x.amplifyapp.com',
  'file://*'  // Allow file protocol during development
]; 

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin); // Log the blocked origin
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Define routes
app.use('/api/assistants', assistantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/hedera', hederaRoutes);

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.send('Server is running');
});

// Function to set up event listener
function setupEventListener() {
    try {
        // Initialize web3 with a provider
        const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.RPC_URL, {
            // Add WebSocket options for better stability
            reconnect: {
                auto: true,
                delay: 5000, // ms
                maxAttempts: 5,
                onTimeout: false
            }
        }));

        if (!process.env.FACTORY_ADDRESS) {
            console.warn('Factory address not configured, skipping event listener setup');
            return;
        }

        const factoryAddress = process.env.FACTORY_ADDRESS;
        console.log("Factory Address:", factoryAddress);

        // Create a contract instance
        const contract = new web3.eth.Contract(factoryABI, factoryAddress);

        // Listen for ContractDeployed events with error handling
        contract.events.ContractDeployed({ fromBlock: 'latest' })
            .on('connected', function(subscriptionId){
                console.log('Event listener connected with ID:', subscriptionId);
            })
            .on('data', async function(event) {
                try {
                    console.log("Event fired!");
                    console.log("Token Address:", event.returnValues.contractAddress);
                    console.log("Project ID:", event.returnValues.projectId);

                    const assistantId = await getAssistantIdForProject(event.returnValues.projectId);
                    console.log("Retrieved Assistant ID:", assistantId);

                    if (assistantId) {
                        console.log(`Token address ${event.returnValues.contractAddress} belongs to assistant ${assistantId}`);
                        try {
                            const result = await Assistant.findByIdAndUpdate(assistantId, { tokenAddress: event.returnValues.contractAddress });
                            console.log("Token address and projectId saved to MongoDB", result);
                        } catch (error) {
                            console.error("Error saving token address to MongoDB:", error);
                        }
                    } else {
                        console.error("Could not find assistant for project ID:", event.returnValues.projectId);
                    }
                } catch (error) {
                    console.error('Error processing event:', error);
                }
            })
            .on('error', function(error) {
                console.error('Event subscription error:', error);
                // Attempt to reconnect after a delay
                setTimeout(setupEventListener, 10000);
            });

    } catch (error) {
        console.error('Error setting up event listener:', error);
        // Attempt to reconnect after a delay
        setTimeout(setupEventListener, 10000);
    }
}

// Function to get the assistantId for a given projectId
async function getAssistantIdForProject(projectId) {
  const assistant = await Assistant.findOne({ projectId });
  return assistant ? assistant._id : null;
}

// Connect to the database
connectDB().then(() => {
  console.log('Database connected');
});

setupEventListener(); 
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
// Call the function to set up the event listener
});

// Error handling middleware
app.use(errorHandler);