const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
    constructor({ apiKey }) {
        this.apiKey = apiKey;
        // Trim potentially hidden whitespace from environment variables (Critical Fix for Vercel 404)
        const cleanKey = this.apiKey ? this.apiKey.trim() : "";

        // Initialize the Official Google SDK
        // This resolves the 404/403 errors by handling the authentication automatically
        this.genAI = new GoogleGenerativeAI(cleanKey);

        // Define the model with JSON configuration
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        console.log("DEBUG: Google AI SDK Initialized with gemini-1.5-flash");
    }

    /**
     * Menilai tingkat keparahan luka dari gambar Base64 menggunakan Gemini.
     * @param {object} base64ImageData - Objek yang berisi { data: base64String, mimeType: string }
     * @returns {Promise<number|null>} Skor keparahan 0-100, atau null jika gagal.
     */
    async scoreWound(base64ImageData) {
        try {
            console.log("DEBUG: Preparing request with Google SDK...");

            // Prompt for JSON output
            const prompt = "Berdasarkan gambar luka, berikan penilaian keparahan dalam skala 0 hingga 100. Berikan jawaban HANYA dalam format JSON dengan key 'severity_score'. Contoh: { \"severity_score\": 75 }";

            // Prepare the image part
            const imagePart = {
                inlineData: {
                    data: base64ImageData.data,
                    mimeType: base64ImageData.mimeType
                }
            };

            // Call the API
            const result = await this.model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            console.log("DEBUG: Raw AI Response:", text);

            // Clean up code blocks if present ( ```json ... ``` )
            // The SDK usually handles this with responseMimeType, but safety first
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonResult = JSON.parse(cleanText);

            if (jsonResult.severity_score !== undefined) {
                return jsonResult.severity_score;
            } else {
                throw new Error("Format JSON tidak sesuai: " + text);
            }

        } catch (err) {
            console.error("Google SDK Error:", err.message);
            // Throw specific error for Controller to catch
            throw new Error(`AI Service Failed: ${err.message}`);
        }
    }
}

module.exports = AIService;