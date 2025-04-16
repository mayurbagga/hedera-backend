import { openai } from '../config/openai.js';
import { Thread } from '../models/Thread.js';
import { Assistant } from '../models/Assistant.js';
import { FunctionExecutor } from './functionExecutor.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import mongoose from 'mongoose';
import { Chat } from '../models/chatModel.js';
import User from '../models/userModel.js';

export const threadService = {
  async createThread(assistantId) {
    if (!mongoose.Types.ObjectId.isValid(assistantId)) {
      throw new Error('Invalid assistant ID');
    }

    const assistant = await Assistant.findById(assistantId);
    if (!assistant) {
      throw new Error(ERROR_MESSAGES.ASSISTANT_NOT_FOUND);
    }

    let openaiThreadId = null;
    
    // Create OpenAI thread if the assistant uses OpenAI
    if (assistant.llmProvider === 'openai') {
      if (!assistant.openaiAssistantId) {
        throw new Error('OpenAI assistant ID not found for this assistant');
      }
      
      const openaiThread = await openai.beta.threads.create();
      openaiThreadId = openaiThread.id;
      console.log('Created OpenAI thread with ID:', openaiThreadId);
    }

    const thread = await Thread.create({
      assistantId,
      openaiThreadId
    });

    console.log('Created thread in database:', thread._id);
    return thread;
  },

  async sendMessage(threadId, userMessage, userId) {
    const thread = await Thread.findById(threadId).populate('assistantId');
    if (!thread) {
      throw new Error(ERROR_MESSAGES.THREAD_NOT_FOUND);
    }

    if (!thread.openaiThreadId) {
      throw new Error('OpenAI thread ID not found for this thread');
    }

    if (!thread.assistantId || !thread.assistantId.openaiAssistantId) {
      throw new Error('OpenAI assistant ID not found for this thread');
    }

    try {
      console.log('Adding user message to thread:', userMessage);
      await openai.beta.threads.messages.create(thread.openaiThreadId, {
        role: "user",
        content: userMessage
      });

      const dynamicInstructions = thread.assistantId.instructions;

      console.log('Creating run with assistant:', thread.assistantId.openaiAssistantId);
      const run = await openai.beta.threads.runs.create(thread.openaiThreadId, {
        assistant_id: thread.assistantId.openaiAssistantId,
        instructions: dynamicInstructions
      });

      let runStatus = await this.waitForRunCompletion(thread.openaiThreadId, run.id);
      console.log('Initial run status:', runStatus);
      
      while (runStatus.status === 'requires_action' && runStatus.required_action?.type === 'submit_tool_outputs') {
        console.log('Function call required:', runStatus.required_action.submit_tool_outputs);
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = await FunctionExecutor.execute(toolCalls);
        
        console.log('Submitting tool outputs:', toolOutputs);
        runStatus = await openai.beta.threads.runs.submitToolOutputs(
          thread.openaiThreadId,
          run.id,
          { tool_outputs: toolOutputs }
        );
        
        runStatus = await this.waitForRunCompletion(thread.openaiThreadId, run.id);
        console.log('Updated run status after tool outputs:', runStatus);
      }

      // Get the latest message that includes function results
      const messages = await openai.beta.threads.messages.list(thread.openaiThreadId);
      const latestMessage = messages.data[0];
      
      // If the message has no content (empty response), create a formatted response
      if (latestMessage.content.length === 0 && latestMessage.role === 'assistant') {
        // Get the previous assistant message that might have the function call results
        const previousMessages = messages.data.slice(1);
        const functionResults = previousMessages.find(msg => 
          msg.role === 'assistant' && msg.content.some(c => c.type === 'function')
        );
        
        if (functionResults) {
          const balance = JSON.parse(functionResults.content[0].text.value);
          return {
            ...latestMessage,
            content: [{
              type: 'text',
              text: {
                value: `The balance for address ${balance.address} on ${balance.chain} is:\n${balance.balance} Wei`,
                annotations: []
              }
            }]
          };
        }
      }

      // Check if the database connection is established
      if (!mongoose.connection.readyState) {
        console.error('Database connection is not established');
        throw new Error('Database connection error');
      }

      // Find or create chat document
      let chat = await Chat.findOne({
        assistantId: thread.assistantId._id,
        threadId: thread._id,
        userId: userId
      });

      if (!chat) {
        chat = new Chat({
          assistantId: thread.assistantId._id,
          threadId: thread._id,
          userId: userId,
          messages: []
        });
      }

      // Add user message
      chat.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Extract text from the latest message content
      const assistantMessageContent = latestMessage.content.map(c => c.text.value).join(' ');

      // Add assistant message
      chat.messages.push({
        role: 'assistant',
        content: assistantMessageContent,
        timestamp: new Date()
      });

      // Save the chat and log the result
      try {
        await chat.save();
        console.log('Chat saved successfully');
      } catch (saveError) {
        console.error('Error saving chat:', saveError);
        throw new Error('Failed to save chat');
      }

      return latestMessage;
    } catch (error) {
      console.error('Send Message Error:', error);
      throw new Error(`${ERROR_MESSAGES.OPENAI_ERROR}: ${error.message}`);
    }
  },

  async waitForRunCompletion(threadId, runId) {
    let runStatus;
    do {
      runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
      
      if (runStatus.status === 'failed') {
        console.error('Run failed:', runStatus.last_error);
        throw new Error('Run failed: ' + runStatus.last_error?.message || 'Unknown error');
      }
      
      if (!['completed', 'requires_action'].includes(runStatus.status)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } while (!['completed', 'requires_action'].includes(runStatus.status));
    
    return runStatus;
  },

  async getMessages(threadId) {
    const thread = await Thread.findById(threadId);
    if (!thread) {
      throw new Error(ERROR_MESSAGES.THREAD_NOT_FOUND);
    }

    if (!thread.openaiThreadId) {
      throw new Error('OpenAI thread ID not found for this thread');
    }

    const messages = await openai.beta.threads.messages.list(thread.openaiThreadId);
    return messages.data;
  },

  async getConversation(threadId) {
    const chat = await Chat.findOne({ threadId });
    if (!chat) {
      throw new Error('Chat not found');
    }
    return chat.messages;
  }
};