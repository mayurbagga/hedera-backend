import mongoose from 'mongoose';

const userWalletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },
  privateKey: {
    type: String,
    required: true
  },
  publicKey: {
    type: String,
    required: true
  },
  network: {
    type: String,
    enum: ['mainnet', 'testnet', 'previewnet'],
    default: 'testnet'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  // Hedera specific features
  hederaFeatures: {
    tokenBalances: [{
      tokenId: String,
      balance: Number,
      lastUpdated: Date
    }],
    lastBalanceUpdate: {
      type: Date,
      default: Date.now
    },
    transactionHistory: [{
      type: {
        type: String,
        enum: ['transfer', 'createToken', 'getBalance']
      },
      amount: Number,
      tokenId: String,
      timestamp: Date,
      status: String
    }],
    permissions: {
      canTransfer: {
        type: Boolean,
        default: true
      },
      canCreateTokens: {
        type: Boolean,
        default: false
      },
      maxTransferAmount: {
        type: Number,
        default: 1000
      }
    }
  }
});

// Index for faster queries (userId is already indexed by unique constraint)
userWalletSchema.index({ walletAddress: 1 });

export const UserWallet = mongoose.model('UserWallet', userWalletSchema); 