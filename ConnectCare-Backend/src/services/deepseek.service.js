// Use global fetch (Node 18+) or fallback
const fetch = global.fetch;

if (!fetch) {
    console.error("Global fetch not available! Please install node-fetch or use Node 18+");
}

const generateMedicalReport = async (conversationText) => {
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    // Prompt from user request
    const systemPrompt = `Generate a concise medical report based on the following doctor–patient conversation. The report should include:
Review the following doctor-patient conversation and generate a professional medical report.
The report MUST be in JSON format with the following keys:
- chief_complaint
- history_of_present_illness
- associated_symptoms
- relevant_lifestyle_factors
- assessment
- recommended_investigations
- treatment_plan
- advice

Do not include any markdown formatting (like \`\`\`json), just the raw JSON object. Use professional medical language.`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://connectcare.com', // Optional OpenRouter headers
                'X-Title': 'ConnectCare'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat', // Trying standard generic deepseek chat model on OpenRouter
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: conversationText }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API Error Status:', response.status);
            console.error('DeepSeek API Error Body:', errorText);
            throw new Error(`DeepSeek API Failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Attempt to parse JSON from content
        try {
            // Clean content if it has markdown code blocks
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent);
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', content);
            // Fallback: return raw content in a structured way
            return {
                notes: content
            };
        }

    } catch (error) {
        console.error('Error generating medical report:', error);
        // Add more context to the error for better debugging and user feedback
        if (error.message.includes('DeepSeek API Failed')) {
            throw error; // Already has details
        }
        throw new Error(`AI Report Generation Error: ${error.message}`);
    }
};

module.exports = {
    generateMedicalReport
};
