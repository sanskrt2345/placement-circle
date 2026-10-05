'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config');
const db = require('./db');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp() {
  const app = express();
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  // Security headers. The existing pages use inline <script>/onclick handlers and
  // remote fonts/images, so a strict CSP is left off; the other helmet defaults stay on.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Only needed when the frontend is served from another origin (e.g. VS Code Live Server)
  if (config.corsOrigin.length) {
    app.use(cors({ origin: config.corsOrigin, credentials: true }));
  }

  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  /* ------------------------------ API ------------------------------ */
  app.get('/api/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  // Never let browsers/proxies cache personalised API responses
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api', require('./routes/practice'));
  app.use('/api', require('./routes/content'));
  app.use('/api', require('./routes/me'));

  /* --------------------------- Frontend ---------------------------- */
  app.use(express.static(config.frontendDir, { extensions: ['html'] }));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
