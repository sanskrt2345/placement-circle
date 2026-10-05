'use strict';
const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { wrap, HttpError } = require('../utils/http');
const practice = require('../services/practice');

const router = express.Router();
router.use(requireAuth);

const listQuery = z.object({
  category: z.enum(['DSA', 'Aptitude', 'HR']).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  q: z.string().trim().max(100).optional(),
});
const attemptBody = z.object({
  answer: z.string().max(500).optional(),
  solved: z.boolean().optional(),
  timeSpentSec: z.number().int().min(0).max(24 * 3600).optional(),
});
const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Invalid id.');
  return id;
};

// GET /api/questions?category=DSA&difficulty=Easy&q=array
router.get('/questions', (req, res) => {
  const filters = listQuery.parse(req.query);
  const questions = practice.listQuestions(req.user.id, filters);
  res.json({ count: questions.length, questions });
});

router.get('/questions/:id', (req, res) => {
  res.json({ question: practice.getQuestion(req.user.id, idParam(req)) });
});

// POST /api/questions/:id/attempt   { answer } for MCQs, { solved: true|false } for DSA/HR
router.post('/questions/:id/attempt', wrap(async (req, res) => {
  const body = attemptBody.parse(req.body);
  res.json(practice.submitAttempt(req.user, idParam(req), body));
}));

// GET /api/daily  -> today's 3-question mission
router.get('/daily', (req, res) => {
  res.json(practice.getDailyMission(req.user.id));
});

module.exports = router;
