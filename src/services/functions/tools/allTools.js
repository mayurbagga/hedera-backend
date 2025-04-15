import { getBalanceTool } from './getBalance.js';
import { getWalletAddressTool } from './getWalletAddress.js';
import { readContractTool } from './readContract.js';
import { sendTransactionTool } from './sendTransaction.js';
import { writeContractTool } from './writeContract.js';
import { getContractAbiTool } from './getContractAbi.js';
import { getTransactionReceiptTool } from './getTransactionReceipt.js';
import { deployErc20Tool } from './deployErc20.js';
import { uniswapV3CreatePoolTool } from './uniswapV3createPool.js';
import { approveTokenAllowanceTool } from './approveTokenAllowance.js';
import { getTokenBalanceTool } from './getTokenBalance.js';

export const tools = {
    // == READ == \\
    get_balance: getBalanceTool,
    get_wallet_address: getWalletAddressTool,
    get_contract_abi: getContractAbiTool,
    read_contract: readContractTool,
    get_transaction_receipt: getTransactionReceiptTool,
    get_token_balance: getTokenBalanceTool,
    // get_contract_bytecode: getContractBytecodeTool,

    // == WRITE == \\
    send_transaction: sendTransactionTool,
    write_contract: writeContractTool,
    deploy_erc20: deployErc20Tool,
    create_uniswap_v3_pool: uniswapV3CreatePoolTool,
    approve_token_allowance: approveTokenAllowanceTool,

    // Add more tools here...
}; 