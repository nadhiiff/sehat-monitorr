const createApp = require('./app');
const db = require('./config/db');
const express = require('express');

const app = createApp();
const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
    res.status(200).json({
        message: "Selamat datang di API Sistem Pelaporan Kesehatan. Akses frontend melalui file index.html.",
        available_routes: [
            "POST /reports/predict (AI Scoring)",
            "POST /reports (Submission Data)",
            "GET /reports/:id/image (Download Laporan)"
        ]
    });
});


// Mulai server
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`Database URL: ${process.env.DATABASE_URL}`);
});

// Handling exit signals
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed. Aplikasi berhenti.');
        process.exit(0);
    });
});