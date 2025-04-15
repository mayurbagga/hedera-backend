import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { Assistant } from './models/Assistant.js';

// Load environment variables
dotenv.config();

// Factory ABI - only the event definition needed for listening
const factoryABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "initialProjectLead",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "initialAgent",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldAgent",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAgent",
				"type": "address"
			}
		],
		"name": "AgentUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "projectId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "contractAddress",
				"type": "address"
			}
		],
		"name": "ContractDeployed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldLead",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newLead",
				"type": "address"
			}
		],
		"name": "ProjectLeadUpdated",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "agent",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "projectId",
				"type": "bytes32"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "symbol",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "totalSupplyTokens",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "basePriceUsd",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "slopeUsd",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "targetMarketCapUsd",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "priceFeed",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "uniswapRouter",
				"type": "address"
			}
		],
		"name": "deployContract",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "deployedContracts",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAgent",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "projectLead",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAgent",
				"type": "address"
			}
		],
		"name": "updateAgent",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newProjectLead",
				"type": "address"
			}
		],
		"name": "updateProjectLead",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

// Initialize provider with a valid RPC URL
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// Initialize factory contract interface
const factoryAddress = process.env.FACTORY_ADDRESS;
const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);

export async function startFactoryIndexer(assistantId) {
  console.log(`Starting event listeners for token factory at ${factoryAddress}`);

  // Listen for ContractDeployed events
  factoryContract.on("ContractDeployed", async (projectId, contractAddress) => {
    console.log(`New contract deployed at address ${contractAddress}`);
    try {
      // Update the assistant with the contractAddress
      await Assistant.findByIdAndUpdate(assistantId, { tokenAddress: contractAddress });
      console.log(`Updated assistant with token address ${contractAddress}`);
    } catch (error) {
      console.error(`Error updating assistant with token address:`, error);
    }
  });

  // ... existing code for historical events ...
} 