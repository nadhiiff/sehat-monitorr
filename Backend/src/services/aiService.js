const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
    async listModels() {
        try {
            console.log("DEBUG: Listing available models...");
            const modelResponse = await this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            // Note: SDK doesn't have direct listModels on instance, usually strictly via API/Manager
            // We'll skip complex listing for now and just focus on model switch safety.
        } catch (e) {
            console.error("DEBUG: List Models failed", e.message);
        }
    }

    constructor({ apiKey }) {
        this.apiKey = apiKey;
        // Trim potentially hidden whitespace from environment variables (Critical Fix for Vercel 404)
        const cleanKey = this.apiKey ? this.apiKey.trim() : "";

        // Initialize the Official Google SDK
        // This resolves the 404/403 errors by handling the authentication automatically
        this.genAI = new GoogleGenerativeAI(cleanKey);

        // DEBUG: List available models to see what is allowed
        // This will print to Vercel logs if headers/auth fails
        this.listModels();

        // Define the model with JSON configuration
        // Switching back to 'gemini-1.5-flash' as it is the correct V1Beta model
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        console.log("DEBUG: Google AI SDK Initialized with gemini-1.5-flash");
    }

    async listModels() {
        try {
            const models = await this.genAI.listModels();
            console.log("DEBUG: Available Gemini Models:");
            for (const model of models) {
                console.log(`- ${model.name}`);
            }
        } catch (error) {
            console.error("DEBUG: Error listing models:", error.message);
        }
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

            // KEY DEBUG: Reveal the length AND prefix/suffix (safe) to prove mismatch
            const keyLength = this.apiKey ? this.apiKey.length : 0;
            const keyPrefix = this.apiKey ? this.apiKey.substring(0, 5) : "undefined";
            const keySuffix = this.apiKey ? this.apiKey.slice(-4) : "****";

            // Throw specific error for Controller to catch
            throw new Error(`AI Service Failed (${err.message}). Key Used: ${keyPrefix}...${keySuffix} (Length: ${keyLength})`);
        }
    }
}

module.exports = AIService;

