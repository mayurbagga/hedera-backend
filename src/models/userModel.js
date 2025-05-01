import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, 'Address is required'],
    unique: true,
    trim: true
  },
  accountId: {
    type: String,
    required: [true, 'Account ID is required'],
    unique: true,
    trim: true
  },
  publicKey: {
    type: String,
    required: [true, 'Public key is required'],
    unique: true,
    trim: true
  },
  privateKey: {
    type: String,
    required: [true, 'Private key is required'],
    select: false, // This ensures the private key is not returned in queries by default
    trim: true
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
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

export default User; 