import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  address1: {
    type: String,
    required: true,
    unique: true,
  },
  address2: {
    type: String,
    required: true,
    unique: true,
  },
  privateKey: {
    type: String,
    required: true,
    select: false, // This ensures the private key is not returned in queries by default
  }
});

const User = mongoose.model('User', userSchema);

export default User; 