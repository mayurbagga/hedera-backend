import mongoose from 'mongoose';

const assistantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  instructions: String,
  codeName: String,
  model: String,
  tools: Array,
  imageUrl: String,
  availableFunctions: Array,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userAddress: {
    type: String,
    required: true,
  },
  llmModel: {
    type: String,
    required: true,
  },
  llmProvider: {
    type: String,
    required: true,
  },
  // Add other fields as necessary
});

const Assistant = mongoose.models.Assistant || mongoose.model('Assistant', assistantSchema);

export default Assistant; 