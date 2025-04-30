import express from 'express';
import { authenticateUser, registerUser, getUserDetails } from '../controllers/userController.js';

const router = express.Router();

// Define the route for authentication
router.post('/authenticate', authenticateUser);

// Define the route for user registration
router.post('/register', registerUser);

// Define the route for getting user details
router.get('/:address', getUserDetails);

export default router; 