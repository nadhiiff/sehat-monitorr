// testGemini.js

require("dotenv").config();
const fetch = require("node-fetch");

console.log("✅ Menguji koneksi ke Gemini...");

const API_KEY = process.env.AI_API_KEY;
// Ganti dari "gemini-1.5-flash" ke model yang valid untuk v1beta
const MODEL = "gemini-2.5-flash"; 

fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "Hello!" }] }]
  })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));