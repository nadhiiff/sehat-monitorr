// Entry point for Vercel Serverless Function
const createApp = require('../Backend/src/app');

const app = createApp();

module.exports = app;
