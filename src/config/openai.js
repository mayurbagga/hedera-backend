import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // apiKey: 'sk-proj-tirK0krUnigqYrzbCPbgT3BlbkFJ9u4PmkOcycQz8Uhzi06O',
  
});