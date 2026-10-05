'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { HttpError } = require('../utils/http');

const COOKIE = 'pc_token';

function cookieOptions() {
  return {
    httpOnly: true,            // not readable from JavaScript -> safer against XSS
    sameSite: 'lax',           // not sent on cross-site POSTs -> CSRF protection
    secure: config.isProd,     // HTTPS only in production
    maxAge: config.jwtExpiresDays * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function issueSession(res, userId) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: `${config.jwtExpiresDays}d` });
  res.cookie(COOKIE, token, cookieOptions());
  return token;
}

function clearSession(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE, opts);
}

function readToken(req) {
  if (req.cookies && req.cookies[COOKIE]) return req.cookies[COOKIE];
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Requires a valid login. Loads the fresh user row from the database. */
function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Please log in to continue.'));
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    clearSession(res);
    return next(new HttpError(401, 'Your session has expired. Please log in again.'));
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
  if (!user) {
    clearSession(res);
    return next(new HttpError(401, 'Account not found. Please log in again.'));
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return next(new HttpError(403, 'Admin access required.'));
  next();
}

module.exports = { requireAuth, requireAdmin, issueSession, clearSession };
