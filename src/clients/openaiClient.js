import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is set
});

export const openaiClient = {
  async createAssistant(data) {
    try {
      const response = await client.beta.assistants.create({
        name: data.name,
        model: data.model || 'gpt-3.5-turbo',
        instructions: data.instructions || 'You are a helpful assistant.',
        tools: data.tools || []
      });

      console.log('OpenAI Response:', JSON.stringify(response, null, 2));

      return response.id;
    } catch (error) {
      console.error('Error creating assistant in OpenAI:', error);
      throw error;
    }
  },

  async sendMessage(model, message) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: message }],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error communicating with OpenAI:', error);
      throw error;
    }
  },
};

export const sendMessage = async (threadId, message) => {
  if (!threadId) {
    throw new Error("Invalid 'thread_id': 'undefined'. Expected an ID that begins with 'thread'.");
  }

  console.log('Using thread ID:', threadId);

  // Proceed with sending the message using the threadId
  // ...
}; 