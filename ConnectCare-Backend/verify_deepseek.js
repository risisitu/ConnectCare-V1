require('dotenv').config();
const fetch = global.fetch || require('node-fetch'); // Ensure fetch is available if running in older node env, though backend seems to use Node 18+

async function verifyDeepSeek() {
    console.log("Verifying DeepSeek API Key...");
    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!API_KEY) {
        console.error("❌ No API Key found in process.env.DEEPSEEK_API_KEY");
        return;
    }

    console.log(`Key found: ${API_KEY.substring(0, 5)}...`);

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    { role: 'user', content: 'Say hello' }
                ]
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ API Success!");
            console.log("Response:", data.choices[0].message.content);
        } else {
            console.error(`❌ API Failed: ${response.status} - ${response.statusText}`);
            const text = await response.text();
            console.error("Error details:", text);
        }
    } catch (error) {
        console.error("❌ Request Failed:", error);
    }
}

verifyDeepSeek();
