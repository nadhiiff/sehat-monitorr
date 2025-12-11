const { createOpenAI } = require('@ai-sdk/openai');
const { generateObject } = require('ai');
const { z } = require('zod');

class AIService {
    constructor({ apiKey }) {
        // Just store the constructor argument, don't read env yet
        this.fallbackKey = apiKey;
        console.log("DEBUG: AIService instantiated");
    }

    /**
     * Helper to get the provider at runtime
     */
    getProvider() {
        // Runtime check for Env Vars (Safest for Vercel)
        // Check ALL possible names including the old GEMINI one and standard OPENAI
        const key = this.fallbackKey ||
            process.env.GROK_API_KEY ||
            process.env.AI_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env.OPENAI_API_KEY ||
            process.env.GOOGLE_API_KEY;

        if (!key) {
            console.error("CRITICAL: No API Key found in any known variable.");
            return null;
        }

        return createOpenAI({
            name: 'xai',
            baseURL: 'https://api.x.ai/v1',
            apiKey: key,
        });
    }

    /**
     * Menilai tingkat keparahan luka dari gambar Base64 menggunakan Grok.
     * @param {object} base64ImageData - Objek yang berisi { data: base64String, mimeType: string }
     * @returns {Promise<number|null>} Skor keparahan 0-100, atau null jika gagal.
     */
    async scoreWound(base64ImageData) {
        try {
            console.log("DEBUG: Preparing request to Grok (xAI)...");

            // Get Provider at Runtime (Lazy Init)
            const grokProvider = this.getProvider();
            if (!grokProvider) {
                throw new Error("Missing API Key (Checked GROK_API_KEY, AI_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY)");
            }

            // Define the schema so Grok knows EXACTLY what to return
            const schema = z.object({
                severity_score: z.number().min(0).max(100).describe("Skala keparahan luka dari 0 (ringan) sampai 100 (sangat parah)"),
                reasoning: z.string().describe("Alasan singkat penilaian (maks 1 kalimat)")
            });

            // Convert base64 to data URL format
            const dataUrl = `data:${base64ImageData.mimeType};base64,${base64ImageData.data}`;

            // Use the specific Vision model
            const result = await generateObject({
                model: grokProvider('grok-2-vision-1212'),
                schema: schema,
                // prompt property removed to fix conflict with messages
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: "Analisis gambar luka ini. Berikan skor keparahan (severity_score) dalam rentang 0-100." },
                            { type: 'image', image: dataUrl }
                        ]
                    }
                ]
            });

            console.log("DEBUG: Grok Response:", result.object);
            return result.object.severity_score;

        } catch (err) {
            console.error("Grok AI Error:", err.message);

            // Safe Key Logging
            const keyUsed = this.apiKey;
            const suffix = keyUsed ? keyUsed.slice(-4) : "undefined";

            throw new Error(`AI Service Failed (Grok): ${err.message}. Key Suffix: ${suffix}`);
        }
    }
}

module.exports = AIService;
