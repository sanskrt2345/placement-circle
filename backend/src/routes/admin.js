'use strict';
/** Admin-only content management (questions + opportunities). */
const express = require('express');
const { z } = require('zod');

const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { HttpError } = require('../utils/http');

const router = express.Router();
router.use(requireAuth, requireAdmin);

const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Invalid id.');
  return id;
};
const conflict = (err) => {
  if (String(err.code).startsWith('SQLITE_CONSTRAINT')) throw new HttpError(409, 'An item with the same title already exists.');
  throw err;
};

/* ------------------------------------------------------------------- questions */
const questionBody = z
  .object({
    title: z.string().trim().min(2).max(120),
    category: z.enum(['DSA', 'Aptitude', 'HR']),
    topic: z.string().trim().min(1).max(60),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    timeMinutes: z.number().int().min(1).max(180),
    companies: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
    description: z.string().trim().max(4000).default(''),
    hint: z.string().trim().max(1000).default(''),
    explanation: z.string().trim().max(2000).default(''),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(6).nullable().optional(),
    answer: z.string().trim().max(200).nullable().optional(),
  })
  .refine((q) => !q.options || (q.answer && q.options.includes(q.answer)), {
    message: 'For multiple-choice questions, `answer` must be one of the `options`.',
    path: ['answer'],
  });

const qParams = (b) => ({
  title: b.title,
  category: b.category,
  topic: b.topic,
  difficulty: b.difficulty,
  time: b.timeMinutes,
  companies: JSON.stringify(b.companies),
  description: b.description,
  hint: b.hint,
  explanation: b.explanation,
  options: b.options ? JSON.stringify(b.options) : null,
  answer: b.options ? b.answer : null,
});

router.post('/questions', (req, res) => {
  const b = questionBody.parse(req.body);
  try {
    const info = db
      .prepare(
        `INSERT INTO questions (title, category, topic, difficulty, time_minutes, companies, description, hint, options, answer, explanation)
         VALUES (@title, @category, @topic, @difficulty, @time, @companies, @description, @hint, @options, @answer, @explanation)`
      )
      .run(qParams(b));
    res.status(201).json({ id: Number(info.lastInsertRowid) });
  } catch (e) { conflict(e); }
});

router.put('/questions/:id', (req, res) => {
  const id = idParam(req);
  const b = questionBody.parse(req.body);
  try {
    const info = db
      .prepare(
        `UPDATE questions SET title=@title, category=@category, topic=@topic, difficulty=@difficulty, time_minutes=@time,
                companies=@companies, description=@description, hint=@hint, options=@options, answer=@answer, explanation=@explanation
          WHERE id=@id`
      )
      .run({ ...qParams(b), id });
    if (!info.changes) throw new HttpError(404, 'Question not found.');
    res.json({ ok: true });
  } catch (e) { if (e instanceof HttpError) throw e; conflict(e); }
});

// Soft delete: keeps students' history intact
router.delete('/questions/:id', (req, res) => {
  const info = db.prepare('UPDATE questions SET is_active = 0 WHERE id = ?').run(idParam(req));
  if (!info.changes) throw new HttpError(404, 'Question not found.');
  res.json({ ok: true });
});

/* ---------------------------------------------------------------- opportunities */
const oppBody = z.object({
  title: z.string().trim().min(2).max(120),
  company: z.string().trim().min(1).max(60),
  type: z.enum(['internship', 'job']),
  location: z.string().trim().min(1).max(60),
  pay: z.string().trim().max(60).default(''),
  description: z.string().trim().max(1000).default(''),
  eligibility: z.string().trim().max(120).default(''),
  link: z.string().trim().max(500).refine((u) => /^https?:\/\//i.test(u), 'Link must start with http:// or https://'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD.'),
});

router.post('/opportunities', (req, res) => {
  const b = oppBody.parse(req.body);
  try {
    const info = db
      .prepare(
        `INSERT INTO opportunities (title, company, type, location, pay, description, eligibility, link, deadline)
         VALUES (@title, @company, @type, @location, @pay, @description, @eligibility, @link, @deadline)`
      )
      .run(b);
    res.status(201).json({ id: Number(info.lastInsertRowid) });
  } catch (e) { conflict(e); }
});

router.put('/opportunities/:id', (req, res) => {
  const id = idParam(req);
  const b = oppBody.parse(req.body);
  try {
    const info = db
      .prepare(
        `UPDATE opportunities SET title=@title, company=@company, type=@type, location=@location, pay=@pay,
                description=@description, eligibility=@eligibility, link=@link, deadline=@deadline WHERE id=@id`
      )
      .run({ ...b, id });
    if (!info.changes) throw new HttpError(404, 'Opportunity not found.');
    res.json({ ok: true });
  } catch (e) { if (e instanceof HttpError) throw e; conflict(e); }
});

router.delete('/opportunities/:id', (req, res) => {
  const info = db.prepare('UPDATE opportunities SET is_active = 0 WHERE id = ?').run(idParam(req));
  if (!info.changes) throw new HttpError(404, 'Opportunity not found.');
  res.json({ ok: true });
});

module.exports = router;
