class AIService {
    constructor({ apiKey }) {
        this.fallbackKey = apiKey;
        console.log("DEBUG: AIService instantiated");
    }

    /**
     * Helper to get the Key at runtime
     */
    getKey() {
        // Consolidated search for Any Valid Key
        const key = this.fallbackKey ||
            process.env.OPENROUTER_API_KEY || // Added as primary support
            process.env.AI_API_KEY ||
            process.env.GROK_API_KEY ||
            process.env.OPENAI_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY;
        return key;
    }

    /**
     * Menilai tingkat keparahan luka dari gambar Base64 menggunakan OpenRouter (Generic).
     * @param {object} base64ImageData - Objek yang berisi { data: base64String, mimeType: string }
     * @returns {Promise<number|null>} Skor keparahan 0-100, atau null jika gagal.
     */
    async scoreWound(base64ImageData) {
        try {
            // Configuration for OpenRouter (or generic OpenAI provider)
            // Default to OpenRouter URL if not set
            const baseUrl = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1";
            // Default to Free Gemini model if not set
            const modelName = process.env.AI_MODEL_NAME || "google/gemini-2.0-flash-exp:free";

            console.log(`DEBUG: Preparing request to ${modelName} via ${baseUrl}...`);

            const apiKey = this.getKey();
            if (!apiKey) {
                // Check if user is trying to use OpenRouter without a key
                if (baseUrl.includes('openrouter')) {
                    throw new Error("Missing AI_API_KEY. Please add your 'sk-or-v1...' key to Vercel env vars as AI_API_KEY.");
                }
                throw new Error("Missing API Key (Checked all env vars)");
            }

            // Construct standard OpenAI-compatible payload
            const dataUrl = `data:${base64ImageData.mimeType};base64,${base64ImageData.data}`;

            const payload = {
                model: modelName,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analisis gambar luka ini. Berikan skor keparahan (severity_score) dalam rentang 0-100. Jawab HANYA dengan JSON format: { \"severity_score\": number, \"reasoning\": string }"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: dataUrl
                                }
                            }
                        ]
                    }
                ],
                // OpenRouter specific: router preferences
                // We prefer free or low cost if possible, but reliability first
                provider: {
                    order: ["Google", "DeepInfra", "Hyperbolic"],
                    allow_fallbacks: true
                }
            };

            // Execute Request
            // Use chat/completions endpoint
            // Ensure slash handling
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
            const endpoint = `${cleanBaseUrl}chat/completions`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                    // OpenRouter Requirement: Site URL and Name
                    "HTTP-Referer": "https://sehat-monitorr.vercel.app",
                    "X-Title": "Sehat Monitor"
                },
                body: JSON.stringify(payload)
            });

            // Handle Non-200 Responses
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("DEBUG: AI Raw Response:", JSON.stringify(data, null, 2));

            // Extract Content
            const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";

            if (!content) {
                if (data.error) throw new Error(data.error.message);
                throw new Error("AI response body was empty or malformed");
            }

            // Manual JSON Parsing
            const cleanedText = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonResult = JSON.parse(cleanedText);

            return jsonResult.severity_score;

        } catch (err) {
            console.error("AI Service Error:", err.message);

            const keyUsed = this.getKey() || "undefined";
            const suffix = keyUsed.length > 4 ? keyUsed.slice(-4) : keyUsed;

            throw new Error(`AI Service Failed: ${err.message}. Key Suffix: ${suffix}`);
        }
    }
}

module.exports = AIService;
