const { createOpenAI } = require('@ai-sdk/openai');
const { generateObject } = require('ai');
const { z } = require('zod');

class AIService {
    constructor({ apiKey }) {
        // Fallback to process.env if apiKey is not passed directly
        // We check GROK_API_KEY (preferred), then AI_API_KEY (legacy), then GOOGLE_API_KEY (legacy)
        this.apiKey = apiKey || process.env.GROK_API_KEY || process.env.AI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!this.apiKey) {
            console.warn("WARN: No API Key found for AIService (Grok).");
        }

        // Initialize xAI (Grok) provider
        // xAI is compatible with OpenAI SDK
        const openai = createOpenAI({
            name: 'xai',
            baseURL: 'https://api.x.ai/v1',
            apiKey: this.apiKey,
        });

        this.grok = openai;

        console.log("DEBUG: AIService (Grok/xAI) instantiated.");
    }

    /**
     * Menilai tingkat keparahan luka dari gambar Base64 menggunakan Grok.
     * @param {object} base64ImageData - Objek yang berisi { data: base64String, mimeType: string }
     * @returns {Promise<number|null>} Skor keparahan 0-100, atau null jika gagal.
     */
    async scoreWound(base64ImageData) {
        try {
            console.log("DEBUG: Preparing request to Grok (xAI)...");

            // Define the schema so Grok knows EXACTLY what to return
            const schema = z.object({
                severity_score: z.number().min(0).max(100).describe("Skala keparahan luka dari 0 (ringan) sampai 100 (sangat parah)"),
                reasoning: z.string().describe("Alasan singkat penilaian (maks 1 kalimat)")
            });

            // Convert base64 to data URL format
            const dataUrl = `data:${base64ImageData.mimeType};base64,${base64ImageData.data}`;

            // Use the specific Vision model
            const result = await generateObject({
                model: this.grok('grok-2-vision-1212'),
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
