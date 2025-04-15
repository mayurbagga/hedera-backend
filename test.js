import fetch from 'node-fetch';

const testAIAgent = async () => {
    try {
        const response = await fetch('http://localhost:3010/api/ai-agent/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: 'Check the balance of this Aptos account: 0x1'
                }]
            })
        });

        if (response.ok) {
            const data = await response.text();
            console.log('Response:', data);
        } else {
            console.error('Error:', response.status, await response.text());
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

testAIAgent(); 