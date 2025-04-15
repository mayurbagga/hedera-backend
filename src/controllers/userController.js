import User from '../models/userModel.js';
import Assistant from '../models/assistantModel.js';
import { ethers } from 'ethers';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Store nonces in memory for simplicity (consider using a database or Redis in production)
const nonces = new Map();

// Register a new user with address only, ensuring uniqueness
export const registerUser = async (req, res) => {
  try {
    const { address } = req.body;
    const existingUser = await User.findOne({ address });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = new User({ address });
    await user.save();
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

// Get assistants created by the user
export const getUserAssistants = async (req, res) => {
  try {
    const userId = req.params.userId;
    const assistants = await Assistant.find({ createdBy: userId });
    res.status(200).json({ assistants });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assistants', error });
  }
};

// Add a new endpoint for MetaMask authentication
export const authenticateUser = async (req, res) => {
  try {
    const { address } = req.body;

    // Log the received address
    console.log('Received Address:', address);

    // Bypass signature verification and issue a static token
    const token = generateToken(address);
    res.json({ token });

  } catch (error) {
    console.error('Authentication Error:', error); // Log the error details
    res.status(500).json({ message: 'Error during authentication', error: error.message });
  }
};

// Generate and store a nonce for a given address
export const generateNonceForAddress = (address) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  nonces.set(address, nonce);
  return nonce;
};

// Helper function to generate a token
export function generateToken(address) {
  const payload = { 
    address,
    iat: Math.floor(Date.now() / 1000) // Issued at time
  };
  const secretKey = process.env.JWT_SECRET;
  const options = { expiresIn: '1h' }; // Set token expiration
  return jwt.sign(payload, secretKey, options);
}

export const getNonce = (req, res) => {
  const { address } = req.body;
  const nonce = generateNonceForAddress(address);
  res.json({ nonce });
}; 