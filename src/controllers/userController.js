import User from '../models/userModel.js';
import Assistant from '../models/assistantModel.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Store nonces in memory for simplicity (consider using a database or Redis in production)
const nonces = new Map();

// Register a new user with Hedera credentials
export const registerUser = async (req, res) => {
  try {
    const { address, accountId, publicKey, privateKey, network } = req.body;
    
    // Validate that all required fields are provided
    if (!address || !accountId || !publicKey || !privateKey) {
      return res.status(400).json({ message: 'Address, Account ID, Public Key, and Private Key are required' });
    }

    // Check for existing user with each unique field
    const existingAddress = await User.findOne({ address });
    const existingAccountId = await User.findOne({ accountId });
    const existingPublicKey = await User.findOne({ publicKey });
    
    if (existingAddress || existingAccountId || existingPublicKey) {
      let message = 'User already exists with: ';
      const conflicts = [];
      
      if (existingAddress) conflicts.push('address');
      if (existingAccountId) conflicts.push('account ID');
      if (existingPublicKey) conflicts.push('public key');
      
      message += conflicts.join(', ');
      return res.status(400).json({ 
        message,
        conflicts: {
          address: !!existingAddress,
          accountId: !!existingAccountId,
          publicKey: !!existingPublicKey
        }
      });
    }

    const user = new User({ 
      address, 
      accountId, 
      publicKey, 
      privateKey,
      network: network || 'testnet'
    });
    await user.save();
    
    // Return user without private key
    const userResponse = user.toObject();
    delete userResponse.privateKey;
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      user: userResponse 
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      message: 'Error registering user', 
      error: error.message 
    });
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

// Update authenticateUser to check address
export const authenticateUser = async (req, res) => {
  try {
    const { address } = req.body;

    const user = await User.findOne({ address });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = generateToken(address, user._id);
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
export function generateToken(address, userId) {
  const payload = { 
    address,
    userId,
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
    
    const user = await User.findOne({ address }).select('+privateKey'); // Explicitly include private key

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        address: user.address,
        accountId: user.accountId,
        publicKey: user.publicKey,
        privateKey: user.privateKey,
        network: user.network
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
}; 