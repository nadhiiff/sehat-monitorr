const fetch = require('node-fetch');
require('dotenv').config();

// Consolidated search for Any Valid Key
const apiKey = process.env.AI_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("No API Key found in .env");
    process.exit(1);
}

async function checkModels() {
    console.log("Fetching models from OpenRouter...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            return;
        }

        const data = await response.json();
        const allModels = data.data;

        console.log(`\nFound ${allModels.length} total models.`);

        // Filter for Free + Vision
        // Note: OpenRouter API 'pricing' field usually has 'prompt' and 'completion' as strings representing cost
        // We look for '0' or '0.0'

        const freeVisionModels = allModels.filter(m => {
            const isFree = m.pricing.prompt === "0" && m.pricing.completion === "0";
            // Check for vision support (modality or architecture)
            // Some models typically have 'vision' in ID or architecture
            const id = m.id.toLowerCase();
            const hasVision = id.includes("vision") ||
                id.includes("vl") ||
                id.includes("gemini") ||
                id.includes("claude-3") ||
                id.includes("gpt-4o") ||
                id.includes("llama-3.2");

            return isFree && hasVision;
        });

        console.log("\n--- FREE VISION MODELS (Candidate List) ---");
        freeVisionModels.forEach(m => {
            console.log(`ID: ${m.id}`);
            console.log(`   Name: ${m.name}`);
            console.log(`   Context: ${m.context_length}`);
            console.log("-------------------------------------------");
        });

        if (freeVisionModels.length === 0) {
            console.log("No models explicitly marked as FREE and VISION found.");
            console.log("Listing ALL Free models (check descriptions):");
            const freeModels = allModels.filter(m => m.pricing.prompt === "0");
            freeModels.forEach(m => {
                console.log(`ID: ${m.id}`);
            });
        }

    } catch (error) {
        console.error("Failed to fetch models:", error);
    }
}

checkModels();
