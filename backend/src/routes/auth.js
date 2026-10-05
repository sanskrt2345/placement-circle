'use strict';
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const db = require('../db');
const config = require('../config');
const { HttpError, wrap } = require('../utils/http');
const { publicUser } = require('../utils/user');
const { requireAuth, issueSession, clearSession } = require('../middleware/auth');
const { sendOtpEmail } = require('../services/mailer');

const router = express.Router();

const limiter = (limit, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.env === 'test',
    message: { error: message },
  });
const loginLimiter = limiter(10, 15, 'Too many login attempts. Please wait a few minutes and try again.');
const otpLimiter = limiter(15, 15, 'Too many verification requests. Please wait a few minutes and try again.');

/* ------------------------------------------------------------------ validation */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long.')
  .pipe(z.email('Enter a valid email address.'));

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.');

const YEARS = ['1st Year', '2nd Year', '3rd Year', 'Final Year'];

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(80),
  email,
  password,
  branch: z.string().trim().max(30).optional().default(''),
  year: z.enum(YEARS).or(z.literal('')).optional().default(''),
});
const verifySchema = z.object({ email, otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.') });
const resendSchema = z.object({ email });
const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password.').max(200) });

/* --------------------------------------------------------------------- helpers */
const hashOtp = (mail, otp) => crypto.createHmac('sha256', config.jwtSecret).update(`${mail}:${otp}`).digest('hex');
const makeOtp = () => String(crypto.randomInt(100000, 1000000));
const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
// Used so "unknown email" takes as long as "wrong password" (prevents timing-based user discovery)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

function assertDomainAllowed(mail) {
  const allowed = config.allowedEmailDomains;
  if (!allowed.length) return;
  const domain = mail.split('@')[1];
  if (!allowed.some((d) => domain === d || domain.endsWith('.' + d))) {
    throw new HttpError(400, `Please use your college email (${allowed.map((d) => '@' + d).join(', ')}).`);
  }
}

async function issueOtp(pending) {
  const otp = makeOtp();
  const now = Date.now();
  db.prepare(
    `UPDATE pending_signups SET otp_hash = ?, expires_at = ?, attempts = 0, last_sent_at = ? WHERE email = ?`
  ).run(hashOtp(pending.email.toLowerCase(), otp), now + config.otp.ttlMinutes * 60 * 1000, now, pending.email);
  try {
    await sendOtpEmail(pending.email, pending.full_name, otp);
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    db.prepare('DELETE FROM pending_signups WHERE email = ?').run(pending.email);
    throw new HttpError(502, 'We could not send the verification email. Please try again in a moment.');
  }
  return otp;
}

function checkCooldown(pending) {
  const wait = Math.ceil((pending.last_sent_at + config.otp.resendCooldownSeconds * 1000 - Date.now()) / 1000);
  if (wait > 0) throw new HttpError(429, `Please wait ${wait}s before requesting another code.`, { retryAfter: wait });
}

const otpResponse = (mail, otp) => ({
  message: `We sent a 6-digit code to ${mail}.`,
  email: mail,
  expiresInMinutes: config.otp.ttlMinutes,
  resendAfterSeconds: config.otp.resendCooldownSeconds,
  ...(config.otp.exposeInResponse ? { devOtp: otp } : {}),
});

/* ---------------------------------------------------------------------- routes */

// Step 1: validate the form and email a code. No account is created yet.
router.post('/signup/request-otp', otpLimiter, wrap(async (req, res) => {
  const data = signupSchema.parse(req.body);
  assertDomainAllowed(data.email);

  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(data.email)) {
    throw new HttpError(409, 'An account with this email already exists. Please log in instead.');
  }
  const existing = db.prepare('SELECT * FROM pending_signups WHERE email = ?').get(data.email);
  if (existing) checkCooldown(existing);

  db.prepare(
    `INSERT INTO pending_signups (email, full_name, password_hash, branch, year, otp_hash, expires_at, last_sent_at)
     VALUES (@email, @fullName, @hash, @branch, @year, '', 0, 0)
     ON CONFLICT(email) DO UPDATE SET full_name = excluded.full_name, password_hash = excluded.password_hash,
                                      branch = excluded.branch, year = excluded.year`
  ).run({ ...data, hash: await bcrypt.hash(data.password, 10) });

  const pending = db.prepare('SELECT * FROM pending_signups WHERE email = ?').get(data.email);
  const otp = await issueOtp(pending);
  res.json(otpResponse(data.email, otp));
}));

// Resend the code for a signup that is already waiting for verification
router.post('/signup/resend-otp', otpLimiter, wrap(async (req, res) => {
  const { email: mail } = resendSchema.parse(req.body);
  const pending = db.prepare('SELECT * FROM pending_signups WHERE email = ?').get(mail);
  if (!pending) throw new HttpError(404, 'No signup in progress for this email. Please start again.');
  checkCooldown(pending);
  const otp = await issueOtp(pending);
  res.json(otpResponse(mail, otp));
}));

// Step 2: check the code, create the account and log the user in
router.post('/signup/verify', otpLimiter, wrap(async (req, res) => {
  const { email: mail, otp } = verifySchema.parse(req.body);
  const pending = db.prepare('SELECT * FROM pending_signups WHERE email = ?').get(mail);
  if (!pending) throw new HttpError(400, 'No signup in progress for this email. Please start again.');

  if (Date.now() > pending.expires_at) {
    db.prepare('DELETE FROM pending_signups WHERE email = ?').run(mail);
    throw new HttpError(400, 'This code has expired. Please sign up again to get a new one.');
  }
  if (pending.attempts >= config.otp.maxAttempts) {
    db.prepare('DELETE FROM pending_signups WHERE email = ?').run(mail);
    throw new HttpError(429, 'Too many incorrect attempts. Please sign up again to get a new code.');
  }
  if (!safeEqual(hashOtp(mail, otp), pending.otp_hash)) {
    db.prepare('UPDATE pending_signups SET attempts = attempts + 1 WHERE email = ?').run(mail);
    const left = config.otp.maxAttempts - pending.attempts - 1;
    throw new HttpError(400, `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`);
  }

  const create = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO users (full_name, email, password_hash, branch, year) VALUES (?, ?, ?, ?, ?)')
      .run(pending.full_name, pending.email.toLowerCase(), pending.password_hash, pending.branch, pending.year);
    db.prepare('DELETE FROM pending_signups WHERE email = ?').run(mail);
    return info.lastInsertRowid;
  });
  let userId;
  try {
    userId = create();
  } catch (err) {
    if (String(err.code).startsWith('SQLITE_CONSTRAINT')) throw new HttpError(409, 'An account with this email already exists.');
    throw err;
  }
  issueSession(res, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.status(201).json({ user: publicUser(user) });
}));

router.post('/login', loginLimiter, wrap(async (req, res) => {
  const { email: mail, password: pw } = loginSchema.parse(req.body);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(mail);
  const ok = await bcrypt.compare(pw, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Invalid email or password.');
  issueSession(res, user.id);
  res.json({ user: publicUser(user) });
}));

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
