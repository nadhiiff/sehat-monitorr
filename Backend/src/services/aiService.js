const axios = require('axios');

class AIService {
    constructor({ apiUrl, apiKey }) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        console.log("DEBUG: AIService initialized with URL:", this.apiUrl);
    }

    /**
     * Menilai tingkat keparahan luka dari gambar Base64 menggunakan Gemini.
     * @param {object} base64ImageData - Objek yang berisi { data: base64String, mimeType: string }
     * @returns {Promise<number|null>} Skor keparahan 0-100, atau null jika gagal.
     */
    async scoreWound(base64ImageData) {
        // PERBAIKAN: Hardcode URL untuk mengatasi 404 (Salah URL di Vercel)
        // Menggunakan model gemini-1.5-flash yang stabil
        const validUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        // Trim key to remove accidental whitespace/newlines
        const cleanKey = this.apiKey ? this.apiKey.trim() : '';
        const url = `${validUrl}?key=${cleanKey}`;
        console.log("DEBUG: Using URL:", validUrl);

        const requestSchema = {
            type: "object",
            properties: {
                severity_score: {
                    type: "integer",
                    description: "Nilai skalar tunggal yang mewakili tingkat keparahan luka dari 0 (paling ringan) hingga 100 (paling parah)."
                }
            },
            required: ["severity_score"]
        };

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: "Berdasarkan gambar luka, berikan penilaian keparahan dalam skala 0 hingga 100. Berikan jawaban HANYA dalam format JSON berikut." },
                        // PENTING: Menggunakan 'inlineData' (CamelCase)
                        {
                            inlineData: {
                                mimeType: base64ImageData.mimeType,
                                data: base64ImageData.data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                // Meminta output berupa JSON
                responseMimeType: "application/json",
                responseSchema: requestSchema
            }
        };

        console.log("DEBUG: base64ImageData keys:", Object.keys(base64ImageData));
        console.log("DEBUG: mimeType:", base64ImageData.mimeType);
        console.log("DEBUG: data length:", base64ImageData.data ? base64ImageData.data.length : 'undefined');

        try {
            console.log("DEBUG: Sending request to Gemini URL:", url);
            const res = await axios.post(url, requestBody, {
                headers: { "Content-Type": "application/json" }
            });

            if (!res.data.candidates || res.data.candidates.length === 0) {
                console.error("Gemini API error: No candidates found in response.");
                // Melempar error untuk ditangani oleh controller
                throw new Error("API Gemini tidak mengembalikan kandidat respons.");
            }

            // Parsing Hasil JSON yang Terstruktur
            const textResponse = res.data.candidates[0].content.parts[0].text;
            const jsonResult = JSON.parse(textResponse);
            const score = jsonResult.severity_score;

            if (typeof score === 'number' && score >= 0 && score <= 100) {
                return score;
            } else {
                console.error("Gemini API error: Invalid score format returned.");
                // Melempar error jika format output Gemini salah
                throw new Error("Skor yang dikembalikan AI tidak valid atau di luar jangkauan.");
            }

        } catch (err) {
            // Log error yang detail ke backend console
            console.error("Gemini API error (Multimodal Failure):", err.response?.status, err.response?.data || err.message);

            // PERBAIKAN: Lempar error (termasuk status HTTP) agar controller tahu status apa yang harus dikirim ke frontend
            if (err.response?.status) {
                // Ensure "Status" is capitalized to match controller regex
                throw new Error(`Gemini API returned Status ${err.response.status}. Check API Key or image format.`);
            }
            throw err; // Lempar error jaringan atau parsing lainnya
        }
    }
}

module.exports = AIService;