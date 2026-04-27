// Groq AI Service
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const getAIResponse = async (message) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        return "I'm not connected to Groq yet. Please add a valid API key to the .env file.";
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful college assistant named 'My AI'. You help students with college life, study tips, and campus events. Keep responses concise and friendly."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Groq API Error:", errorData);
            throw new Error(errorData.error?.message || 'Failed to fetch response from Groq');
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("AI Service Error:", error);
        return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    }
};
