import User from '../models/userModel.js';
import Assistant from '../models/assistantModel.js';
import { ethers } from 'ethers';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Store nonces in memory for simplicity (consider using a database or Redis in production)
const nonces = new Map();

// Register a new user with two addresses and private key
export const registerUser = async (req, res) => {
  try {
    const { address1, address2, privateKey } = req.body;
    
    // Validate that all required fields are provided
    if (!address1 || !address2 || !privateKey) {
      return res.status(400).json({ message: 'Both addresses and private key are required' });
    }

    // Check if either address already exists
    const existingUser1 = await User.findOne({ address1 });
    const existingUser2 = await User.findOne({ address2 });
    
    if (existingUser1 || existingUser2) {
      return res.status(400).json({ message: 'One or both addresses are already registered' });
    }

    const user = new User({ address1, address2, privateKey });
    await user.save();
    
    // Return user without private key
    const userResponse = user.toObject();
    delete userResponse.privateKey;
    
    res.status(201).json({ message: 'User registered successfully', user: userResponse });
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

// Update authenticateUser to check both addresses
export const authenticateUser = async (req, res) => {
  try {
    const { address } = req.body;

    // Check if the address matches either address1 or address2
    const user = await User.findOne({
      $or: [
        { address1: address },
        { address2: address }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = generateToken(address);
    res.json({ token });

  } catch (error) {
    console.error('Authentication Error:', error);
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

// Get user details including private key
export const getUserDetails = async (req, res) => {
  try {
    const { address } = req.params;
    
    // Find user by either address1 or address2
    const user = await User.findOne({
      $or: [
        { address1: address },
        { address2: address }
      ]
    }).select('+privateKey'); // Explicitly include private key

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        address1: user.address1,
        address2: user.address2,
        privateKey: user.privateKey
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user details', error });
  }
}; 