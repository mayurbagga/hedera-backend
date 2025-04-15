import { getBalanceTool } from './tools/getBalance.js';
import { sendTransactionTool } from './tools/sendTransaction.js';
import { readContractTool } from './tools/readContract.js';
import { writeContractTool } from './tools/writeContract.js';

// Tool registry
export const tools = {
  get_balance: getBalanceTool,
  send_transaction: sendTransactionTool,
  read_contract: readContractTool,
  write_contract: writeContractTool
};

// Function registry for executor
export const functionRegistry = Object.entries(tools).reduce((acc, [name, tool]) => ({
  ...acc,
  [name]: tool.handler
}), {});

// Function definitions for OpenAI
export const functionDefinitions = Object.values(tools).map(tool => tool.definition.function);