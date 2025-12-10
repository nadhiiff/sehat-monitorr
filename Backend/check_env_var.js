require('dotenv').config();

console.log("--- Environment Variable Check ---");
console.log("AI_API_URL:", process.env.AI_API_URL);
console.log("AI_API_KEY:", process.env.AI_API_KEY ? "LOADED (Hidden)" : "MISSING");

if (process.env.AI_API_URL && process.env.AI_API_URL.includes('gemini-2.0-flash')) {
    console.log("VERIFICATION: CORRECT MODEL (gemini-2.0-flash) is configured.");
} else {
    console.log("VERIFICATION: INCORRECT MODEL DETECTED.");
}
