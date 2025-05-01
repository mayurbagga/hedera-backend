import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import assistantRoutes from './routes/assistantRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSwagger } from './config/swagger.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import hederaRoutes from './routes/hederaRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Connect to the database
connectDB().then(() => {
  console.log('Database connected');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Error handling middleware
app.use(errorHandler);