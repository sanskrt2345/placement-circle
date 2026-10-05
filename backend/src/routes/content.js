'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const db = require('../db');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { HttpError } = require('../utils/http');
const content = require('../services/content');

const router = express.Router();
router.use(requireAuth);

const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Invalid id.');
  return id;
};

/* ---------------------------------------------------------------- opportunities */
const oppQuery = z.object({
  type: z.enum(['internship', 'job']).optional(),
  q: z.string().trim().max(100).optional(),
});

router.get('/opportunities', (req, res) => {
  const opportunities = content.listOpportunities(oppQuery.parse(req.query));
  res.json({ count: opportunities.length, opportunities });
});

/* ------------------------------------------------------------------ experiences */
const expQuery = z.object({ q: z.string().trim().max(100).optional() });

const expBody = z.object({
  company: z.string().trim().min(1, 'Enter the company.').max(60),
  role: z.string().trim().min(1, 'Enter the role.').max(60),
  name: z.string().trim().min(1, 'Enter your name.').max(80),
  year: z.coerce.number().int().min(2000).max(2035).optional(),
  status: z.enum(['Offer', 'Rejected', 'In process']).optional().default('Offer'),
  rounds: z.array(z.string().trim().min(1).max(60)).max(12).optional().default([]),
  tip: z.string().trim().min(1, 'Write a short tip.').max(500),
  full: z.string().trim().max(4000).optional(),
});

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'test',
  keyGenerator: (req) => `user:${req.user.id}`, // requireAuth has already run
  message: { error: 'You are sharing too quickly. Please try again later.' },
});

router.get('/experiences', (req, res) => {
  const { q } = expQuery.parse(req.query);
  const experiences = content.listExperiences(req.user, { q });
  res.json({ count: experiences.length, experiences });
});

router.post('/experiences', postLimiter, (req, res) => {
  const b = expBody.parse(req.body);
  const info = db
    .prepare(
      `INSERT INTO experiences (user_id, company, role, status, name, year, rounds, tip, full)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, b.company, b.role, b.status, b.name, b.year ?? new Date().getFullYear(), JSON.stringify(b.rounds), b.tip, b.full || b.tip);
  res.status(201).json({ experience: content.getExperience(req.user, info.lastInsertRowid) });
});

// Toggle "Helpful" for the current user
router.post('/experiences/:id/helpful', (req, res) => {
  const id = idParam(req);
  if (!db.prepare('SELECT 1 FROM experiences WHERE id = ?').get(id)) throw new HttpError(404, 'Experience not found.');
  const del = db.prepare('DELETE FROM experience_helpful WHERE user_id = ? AND experience_id = ?').run(req.user.id, id);
  if (!del.changes) db.prepare('INSERT INTO experience_helpful (user_id, experience_id) VALUES (?, ?)').run(req.user.id, id);
  const count = db.prepare('SELECT COUNT(*) AS n FROM experience_helpful WHERE experience_id = ?').get(id).n;
  res.json({ helpful: !del.changes, helpfulCount: count });
});

router.delete('/experiences/:id', (req, res) => {
  const id = idParam(req);
  const e = db.prepare('SELECT user_id FROM experiences WHERE id = ?').get(id);
  if (!e) throw new HttpError(404, 'Experience not found.');
  if (req.user.role !== 'admin' && e.user_id !== req.user.id) throw new HttpError(403, 'You can only delete your own experiences.');
  db.prepare('DELETE FROM experiences WHERE id = ?').run(id);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ leaderboard */
const lbQuery = z.object({
  scope: z.enum(['overall', 'branch', 'year']).optional().default('overall'),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

router.get('/leaderboard', (req, res) => {
  const { scope, limit } = lbQuery.parse(req.query);
  const { all, ...board } = content.getLeaderboard(req.user, scope, limit);
  res.json(board);
});

module.exports = router;
