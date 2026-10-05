'use strict';
const { ZodError } = require('zod');
const config = require('../config');
const { HttpError } = require('../utils/http');

const prettyField = (path) => {
  const p = path.join('.');
  return p ? p.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()) : '';
};

function notFound(req, res, next) {
  if (req.path.startsWith('/api/')) return next(new HttpError(404, 'Endpoint not found.'));
  res.status(404).send('Not found');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    const first = err.issues[0];
    const label = prettyField(first.path);
    return res.status(400).json({ error: label ? `${label}: ${first.message}` : first.message, details });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large.' });

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.', ...(config.isProd ? {} : { debug: err.message }) });
}

module.exports = { notFound, errorHandler };
