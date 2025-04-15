import { Aptos, AptosConfig, Ed25519PrivateKey, Network, PrivateKey, PrivateKeyVariants } from "@aptos-labs/ts-sdk";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, ChatMessage } from "@langchain/core/messages/index.js";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Message as VercelChatMessage } from "ai";
import { AgentRuntime, LocalSigner, createAptosTools } from "move-agent-kit";

const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo",
    temperature: 0.7,
});

const textDecoder = new TextDecoder();

// Function to read and process the stream
async function readStream(stream) {
    try {
        const reader = stream.getReader();
        let result = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += textDecoder.decode(value, { stream: true });
        }

        result += textDecoder.decode();
        return result;
    } catch (error) {
        console.error("Error reading stream:", error);
        throw error;
    }
}

const convertVercelMessageToLangChainMessage = (message) => {
    if (message.role === "user") {
        return new HumanMessage(message.content);
    } else if (message.role === "assistant") {
        return new AIMessage(message.content);
    } else {
        return new ChatMessage(message.content, message.role);
    }
};

const convertLangChainMessageToVercelMessage = (message) => {
    if (message._getType() === "human") {
        return { content: message.content, role: "user" };
    } else if (message._getType() === "ai") {
        return {
            content: message.content,
            role: "assistant",
            tool_calls: message.tool_calls,
        };
    } else {
        return { content: message.content, role: message._getType() };
    }
};

export const handleAIRequest = async (req, res) => {
    try {
        // Initialize Aptos configuration
        const aptosConfig = new AptosConfig({
            network: Network.TESTNET,
        });

        const aptos = new Aptos(aptosConfig);

        // Validate and get private key from environment
        const privateKeyStr = process.env.APTOS_PRIVATE_KEY;
        if (!privateKeyStr) {
            throw new Error("Missing APTOS_PRIVATE_KEY environment variable");
        }

        // Setup account and signer
        const account = await aptos.deriveAccountFromPrivateKey({
            privateKey: new Ed25519PrivateKey(PrivateKey.formatPrivateKey(privateKeyStr, PrivateKeyVariants.Ed25519)),
        });

        if (!account) {
            throw new Error("Account not connected");
        }

        const accountAddress = account.accountAddress.toString();
        console.log("Connected account:", accountAddress);

        // Get account balance
        try {
            const resources = await aptos.getAccountResources({ accountAddress });
            const aptosCoin = resources.find(r => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
            const balance = aptosCoin ? aptosCoin.data.coin.value : "0";
            console.log("Account balance:", balance);
        } catch (error) {
            console.error("Error getting balance:", error);
        }

        // Create Aptos Agent Kit signer and runtime
        const signer = new LocalSigner(account, Network.TESTNET);
        const aptosAgent = new AgentRuntime(signer, aptos, {
            PANORA_API_KEY: process.env.PANORA_API_KEY,
        });

        // Get tools from Aptos Agent Kit
        const tools = createAptosTools(aptosAgent);
        const memory = new MemorySaver();

        // Create React agent
        const agent = createReactAgent({
            llm,
            tools,
            checkpointSaver: memory,
            messageModifier: `
                You are a helpful agent that can interact onchain using the Aptos Agent Kit. You are
                empowered to interact onchain using your tools. If you ever need funds, you can request them from the
                faucet. If not, you can provide your wallet details and request funds from the user. If there is a 5XX
                (internal) HTTP error code, ask the user to try again later. If someone asks you to do something you
                can't do with your currently available tools, you must say so, and encourage them to implement it
                themselves using the Aptos Agent Kit, recommend they go to https://www.aptosagentkit.xyz for more information. Be
                concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.

                The response also contains token/token[] which contains the name and address of the token and the decimals.
                WHEN YOU RETURN ANY TOKEN AMOUNTS, RETURN THEM ACCORDING TO THE DECIMALS OF THE TOKEN.
            `,
        });

        const { messages, show_intermediate_steps = false } = req.body;

        if (!show_intermediate_steps) {
            const eventStream = await agent.streamEvents(
                { messages },
                {
                    version: "v2",
                    configurable: {
                        thread_id: "Aptos Agent Kit!",
                    },
                }
            );

            const textEncoder = new TextEncoder();
            const transformStream = new ReadableStream({
                async start(controller) {
                    for await (const { event, data } of eventStream) {
                        if (event === "on_chat_model_stream") {
                            if (data.chunk.content) {
                                if (typeof data.chunk.content === "string") {
                                    controller.enqueue(textEncoder.encode(data.chunk.content));
                                } else {
                                    for (const content of data.chunk.content) {
                                        controller.enqueue(textEncoder.encode(content.text ? content.text : ""));
                                    }
                                }
                            }
                        }
                    }
                    controller.close();
                },
            });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            transformStream.pipeTo(new WritableStream({
                write(chunk) {
                    res.write(chunk);
                },
                close() {
                    res.end();
                },
                abort(err) {
                    console.error('Stream error:', err);
                    res.end();
                }
            }));
        } else {
            const result = await agent.invoke({ messages });
            res.json({
                messages: result.messages.map(convertLangChainMessageToVercelMessage),
            });
        }
    } catch (error) {
        console.error("Request error:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "An error occurred",
            status: "error",
        });
    }
}; 