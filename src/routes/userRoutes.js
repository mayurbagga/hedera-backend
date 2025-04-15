import express from 'express';
import { authenticateUser, registerUser } from '../controllers/userController.js';

const router = express.Router();

// Define the route for authentication
router.post('/authenticate', authenticateUser);

// Define the route for user registration
router.post('/register', registerUser);

export default router; 