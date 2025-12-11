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
        // Constructor now just stores fallback, real init happens at runtime to be safe for Vercel
        this.fallbackKey = apiKey;
        console.log("DEBUG: AIService instantiated");
    }

    async getModel() {
        // Runtime check for Env Var (safest for Serverless)
        // CHECK ALL POSSIBLE NAMES: Users often mix up AI_API_KEY vs GEMINI_API_KEY
        const runtimeKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || this.fallbackKey;
        const cleanKey = runtimeKey ? runtimeKey.trim() : "";

        const genAI = new GoogleGenerativeAI(cleanKey);

        // Return model instance with v1 forced
        return genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        }, {
            apiVersion: "v1"
        });
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
        let runtimeKey = "";
        try {
            console.log("DEBUG: Preparing request with Google SDK (Runtime Init)...");

            // Re-fetch key for debug log
            runtimeKey = process.env.AI_API_KEY || this.fallbackKey;

            const model = await this.getModel();

            const prompt = "Berdasarkan gambar luka, berikan penilaian keparahan dalam skala 0 hingga 100. Berikan jawaban HANYA dalam format JSON dengan key 'severity_score'. Contoh: { \"severity_score\": 75 }";

            const imagePart = {
                inlineData: {
                    data: base64ImageData.data,
                    mimeType: base64ImageData.mimeType
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            console.log("DEBUG: Raw AI Response:", text);

            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonResult = JSON.parse(cleanText);

            if (jsonResult.severity_score !== undefined) {
                return jsonResult.severity_score;
            } else {
                throw new Error("Format JSON tidak sesuai: " + text);
            }

        } catch (err) {
            // KEY DEBUG: Reveal the length AND prefix/suffix (safe) to prove mismatch
            const keyLength = runtimeKey ? runtimeKey.length : 0;
            const keyPrefix = runtimeKey ? runtimeKey.substring(0, 5) : "undefined";
            const keySuffix = runtimeKey ? runtimeKey.slice(-4) : "****";

            const debugMsg = `AI_API_KEY: ${process.env.AI_API_KEY ? 'Set' : 'Unset'}, GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Unset'}`;

            throw new Error(`AI Service Failed (${err.message}). Key Used: ${keyPrefix}...${keySuffix} (Length: ${keyLength}). [Env Debug: ${debugMsg}]`);
        }
    }
}

module.exports = AIService;
