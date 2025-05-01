export const hederaConfig = {
    security: {
        encryption: {
            algorithm: 'aes-256-gcm',
            keyRotation: '24h'
        },
        permissions: {
            defaultOperations: ['transfer', 'createToken', 'getBalance'],
            defaultLimits: {
                transfer: 100,
                createToken: 10
            }
        }
    },
    monitoring: {
        balanceCheckInterval: '1h',
        suspiciousActivityThreshold: {
            transfers: 10,
            amount: 1000
        }
    },
    network: {
        nodes: {
            mainnet: ['mainnet-node1.hedera.com', 'mainnet-node2.hedera.com'],
            testnet: ['testnet-node1.hedera.com', 'testnet-node2.hedera.com'],
            previewnet: ['previewnet-node1.hedera.com', 'previewnet-node2.hedera.com']
        },
        mirrorNode: {
            mainnet: 'mainnet.mirror.hedera.com',
            testnet: 'testnet.mirror.hedera.com',
            previewnet: 'previewnet.mirror.hedera.com'
        }
    },
    rateLimits: {
        transfer: 100,
        createToken: 10,
        getBalance: 1000
    },
    defaultAssistantConfig: {
        enabled: false,
        network: 'testnet',
        allowedOperations: ['transfer', 'getBalance'],
        rateLimits: {
            transfers: 100,
            creates: 10,
            messages: 1000
        }
    }
}; 