import { functionRegistry } from './functions/index.js';

export class FunctionExecutor {
  static async execute(toolCalls) {
    const toolOutputs = [];
    
    for (const toolCall of toolCalls) {
      const functionCall = toolCall.function;
      let functionResponse;

      try {
        console.log('Executing function:', functionCall.name, 'with args:', functionCall.arguments);
        
        const func = functionRegistry[functionCall.name];
        if (!func) {
          console.error(`Function ${functionCall.name} not found in registry`);
          console.log('Available functions:', Object.keys(functionRegistry));
          throw new Error(`Function ${functionCall.name} not found`);
        }

        const args = JSON.parse(functionCall.arguments);
        console.log('Parsed arguments:', args);
        
        // Add private key for write operations if needed
        if (['send_transaction', 'write_contract'].includes(functionCall.name)) {
          args.privateKey = process.env.WALLET_PRIVATE_KEY;
        }
        
        functionResponse = await func(args);
        console.log('Function response:', functionResponse);
      } catch (error) {
        console.error(`Error executing function ${functionCall.name}:`, error);
        console.error('Error stack:', error.stack);
        functionResponse = { error: error.message };
      }

      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify(functionResponse)
      });
    }

    console.log('Final tool outputs:', toolOutputs);
    return toolOutputs;
  }
}