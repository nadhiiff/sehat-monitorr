const express = require('express');
const bodyParser = require('express').json;
const dotenv = require('dotenv');
const cors = require('cors'); // --- TAMBAH INI ---
const path = require('path'); // Import path module
dotenv.config();

const ReportRepository = require('./repositories/reportRepository');
const AIService = require('./services/aiService');
const ReportService = require('./services/reportService');
const { makeReportController } = require('./controllers/reportController');
const reportRoutesFactory = require('./routes/reportRoutes');
const imageUtil = require('./utils/imageUtil');
const db = require('./config/db');

function createApp() {
  const app = express();

  // --- TAMBAH MIDDLEWARE CORS ---
  // Mengizinkan request dari semua origin (hanya untuk pengembangan)
  app.use(cors());

  // Ensure database table exists
  db.initializeDatabase();
  // ------------------------------

  // Serve static files from 'uploads' directory
  // Assumes uploads is in the root of Backend (one level up from src)
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.use(bodyParser({ limit: '10mb' }));

  const reportRepo = new ReportRepository(db);
  const aiService = new AIService({ apiUrl: process.env.AI_API_URL, apiKey: process.env.AI_API_KEY });
  const reportService = new ReportService({ reportRepository: reportRepo, aiService, imageUtil });

  const controller = makeReportController({ reportService });

  // Mount at /api/reports to match Vercel rewrite structure
  app.use('/api/reports', reportRoutesFactory(controller));

  // error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

module.exports = createApp;