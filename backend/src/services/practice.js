'use strict';
const crypto = require('crypto');
const db = require('../db');
const { today } = require('../utils/dates');
const { parseJson } = require('../utils/user');
const { HttpError } = require('../utils/http');
const { POINTS, DAILY_BONUS, getPoints, getStreaks } = require('./stats');

const CATEGORIES = ['DSA', 'Aptitude', 'HR'];
const isMcq = (q) => Boolean(q.options);

/** Ids of questions this user has solved / attempted at least once. */
function userQuestionState(userId) {
  const rows = db
    .prepare('SELECT question_id, MAX(correct) AS solved FROM attempts WHERE user_id = ? GROUP BY question_id')
    .all(userId);
  return new Map(rows.map((r) => [r.question_id, r.solved === 1]));
}

function toListItem(q, state) {
  return {
    id: q.id,
    title: q.title,
    category: q.category,
    topic: q.topic,
    difficulty: q.difficulty,
    timeMinutes: q.time_minutes,
    companies: parseJson(q.companies, []),
    solved: state.get(q.id) === true,
    attempted: state.has(q.id),
  };
}

function listQuestions(userId, { category, difficulty, q } = {}) {
  const where = ['is_active = 1'];
  const params = [];
  if (category) { where.push('category = ?'); params.push(category); }
  if (difficulty) { where.push('difficulty = ?'); params.push(difficulty); }
  const rows = db
    .prepare(`SELECT * FROM questions WHERE ${where.join(' AND ')} ORDER BY category, id`)
    .all(...params);
  const state = userQuestionState(userId);
  let items = rows.map((r) => toListItem(r, state));
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((i) =>
      [i.title, i.topic, i.category, ...i.companies].join(' ').toLowerCase().includes(needle)
    );
  }
  return items;
}

function getQuestion(userId, id) {
  const q = db.prepare('SELECT * FROM questions WHERE id = ? AND is_active = 1').get(id);
  if (!q) throw new HttpError(404, 'Question not found.');
  const state = userQuestionState(userId);
  return {
    ...toListItem(q, state),
    description: q.description,
    hint: q.hint,
    type: isMcq(q) ? 'mcq' : 'self',
    options: isMcq(q) ? parseJson(q.options, []) : null, // the answer is never sent to the browser
  };
}

/* ------------------------------------------------------------------ daily set */

const pick = (userId, day, category, candidates) => {
  const h = crypto.createHash('md5').update(`${userId}:${day}:${category}`).digest().readUInt32BE(0);
  return candidates[h % candidates.length];
};

function buildDailySet(userId, day) {
  const state = userQuestionState(userId);
  const ids = [];
  for (const category of CATEGORIES) {
    const all = db.prepare('SELECT id FROM questions WHERE is_active = 1 AND category = ? ORDER BY id').all(category);
    if (!all.length) continue;
    const unsolved = all.filter((r) => state.get(r.id) !== true);
    ids.push(pick(userId, day, category, unsolved.length ? unsolved : all).id);
  }
  return ids;
}

function getDailyMission(userId) {
  const day = today();
  let row = db.prepare('SELECT question_ids FROM daily_sets WHERE user_id = ? AND day = ?').get(userId, day);
  if (!row) {
    const ids = buildDailySet(userId, day);
    db.prepare('INSERT OR IGNORE INTO daily_sets (user_id, day, question_ids) VALUES (?, ?, ?)').run(userId, day, JSON.stringify(ids));
    row = { question_ids: JSON.stringify(ids) };
  }
  const ids = parseJson(row.question_ids, []);
  const solvedToday = new Set(
    db.prepare('SELECT DISTINCT question_id FROM attempts WHERE user_id = ? AND day = ? AND correct = 1').all(userId, day).map((r) => r.question_id)
  );
  const questions = ids
    .map((id) => db.prepare('SELECT * FROM questions WHERE id = ?').get(id))
    .filter(Boolean)
    .map((q) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      timeMinutes: q.time_minutes,
      solved: solvedToday.has(q.id),
    }));
  const completed = questions.filter((q) => q.solved).length;
  const total = questions.length;
  return {
    day,
    total,
    completed,
    remaining: total - completed,
    done: total > 0 && completed === total,
    bonusPoints: DAILY_BONUS,
    questions,
  };
}

/* ------------------------------------------------------------------- attempts */

/**
 * Records an attempt, awards points (once per question, ever) and the daily bonus
 * (once per day) when all of today's questions are solved.
 *
 *  - MCQ questions are graded by the server against the stored answer.
 *  - Other questions (DSA / HR) are self-assessed: the student reports `solved`.
 */
function submitAttempt(user, questionId, input) {
  const q = db.prepare('SELECT * FROM questions WHERE id = ? AND is_active = 1').get(questionId);
  if (!q) throw new HttpError(404, 'Question not found.');

  let correct;
  let answer = null;
  if (isMcq(q)) {
    const options = parseJson(q.options, []);
    if (typeof input.answer !== 'string' || !options.includes(input.answer)) {
      throw new HttpError(400, 'Please choose one of the options.');
    }
    answer = input.answer;
    correct = answer === q.answer;
  } else {
    if (typeof input.solved !== 'boolean') throw new HttpError(400, 'Tell us whether you solved it (solved: true/false).');
    correct = input.solved;
  }

  const day = today();
  const run = db.transaction(() => {
    db.prepare(
      'INSERT INTO attempts (user_id, question_id, correct, answer, time_spent_sec, day) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user.id, q.id, correct ? 1 : 0, answer, input.timeSpentSec ?? null, day);

    let pointsAwarded = 0;
    if (correct) {
      const info = db
        .prepare("INSERT OR IGNORE INTO points_ledger (user_id, points, reason, ref, day) VALUES (?, ?, 'solve', ?, ?)")
        .run(user.id, POINTS[q.difficulty], String(q.id), day);
      if (info.changes) pointsAwarded = POINTS[q.difficulty];
    }

    const mission = getDailyMission(user.id);
    let bonusAwarded = 0;
    if (mission.done) {
      const info = db
        .prepare("INSERT OR IGNORE INTO points_ledger (user_id, points, reason, ref, day) VALUES (?, ?, 'daily_bonus', ?, ?)")
        .run(user.id, DAILY_BONUS, day, day);
      if (info.changes) bonusAwarded = DAILY_BONUS;
    }
    return { pointsAwarded, bonusAwarded, mission };
  });
  const { pointsAwarded, bonusAwarded, mission } = run();

  return {
    correct,
    pointsAwarded,
    bonusAwarded,
    // Reveal the explanation once the student got it right (or for self-assessed questions)
    explanation: correct || !isMcq(q) ? q.explanation : null,
    correctAnswer: correct && isMcq(q) ? q.answer : null,
    mission: { completed: mission.completed, total: mission.total, done: mission.done },
    totalPoints: getPoints(user.id),
    streak: getStreaks(user.id).current,
  };
}

module.exports = { listQuestions, getQuestion, getDailyMission, submitAttempt, isMcq };
