import request from 'supertest';
import express from 'express';
import { getConversationByThreadId, addMessageToConversation } from '../conversationController';
import { Conversation } from '../../models/conversationModel';

jest.mock('../../models/conversationModel');

const app = express();
app.use(express.json());
app.get('/api/conversations/:threadId', getConversationByThreadId);
app.post('/api/conversations/:threadId/messages', addMessageToConversation);

describe('Conversation Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a conversation by threadId', async () => {
    const mockMessages = [{ role: 'user', content: 'Hello' }];
    Conversation.findOne.mockResolvedValue({ messages: mockMessages });

    const response = await request(app).get('/api/conversations/thread123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockMessages);
    expect(Conversation.findOne).toHaveBeenCalledWith({ threadId: 'thread123' });
  });

  it('should add a message to a conversation', async () => {
    const mockConversation = { messages: [], save: jest.fn().mockResolvedValue(true) };
    Conversation.findOne.mockResolvedValue(mockConversation);

    const response = await request(app)
      .post('/api/conversations/thread123/messages')
      .send({ role: 'user', content: 'Hello again' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Message added successfully' });
    expect(mockConversation.messages).toContainEqual({ role: 'user', content: 'Hello again', timestamp: expect.any(Date) });
    expect(mockConversation.save).toHaveBeenCalled();
  });

  // Add more test cases for error handling, edge cases, etc.
}); 