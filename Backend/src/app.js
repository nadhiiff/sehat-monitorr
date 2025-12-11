const express = require('express');
const bodyParser = require('express').json;
// Force Vercel Rebuild with new Env Vars
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

  // --- DEBUG ROUTE (USER REQUESTED) ---
  app.get('/api/debug-key', (req, res) => {
    const key = process.env.AI_API_KEY;
    return res.json({
      status: 'ok',
      keyLength: key ? key.length : 0,
      keyPrefix: key ? key.substring(0, 5) : 'undefined',
      keySuffix: key ? key.slice(-4) : 'undefined',
      env: process.env.VERCEL_ENV || 'local'
    });
  });
  // ------------------------------------

  // Serve static files
  // In Vercel, files are in /tmp. locally in ../uploads
  const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../uploads');

  // Mount at /api/uploads so it matches the URL structure we will use in frontend
  app.use('/api/uploads', express.static(uploadDir));
  // Also keep /uploads for backward compatibility/local if needed, but /api/uploads is safer for Vercel rewrites
  app.use('/uploads', express.static(uploadDir));

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