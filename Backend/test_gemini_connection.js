require('dotenv').config();
const axios = require('axios');

async function testGemini() {
    const apiKey = process.env.AI_API_KEY;
    // Trying gemini-flash-latest
    const modelName = "gemini-flash-latest";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    console.log(`--- Gemini API Generation Test (${modelName}) ---`);

    if (!apiKey) {
        console.error("ERROR: API Key is missing in .env");
        return;
    }

    const testUrl = `${apiUrl}?key=${apiKey}`;

    const requestSchema = {
        type: "object",
        properties: {
            severity_score: {
                type: "integer",
                description: "Score 0-100"
            }
        },
        required: ["severity_score"]
    };

    const requestBody = {
        contents: [{
            parts: [
                { text: "Give me a severity score of 50 for this test." },
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                    }
                }
            ]
        }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: requestSchema
        }
    };

    try {
        console.log(`Sending request to: ${apiUrl}`);
        const response = await axios.post(testUrl, requestBody, {
            headers: { "Content-Type": "application/json" }
        });

        console.log("SUCCESS! API responded with status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error("FAILED. Error details:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
}

testGemini();
