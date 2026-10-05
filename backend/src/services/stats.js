'use strict';
/**
 * All "how is this student doing?" logic lives here so that the dashboard,
 * progress, profile and leaderboard endpoints always agree with each other.
 *
 * Definitions
 *  - attempt   : one submission for a question (MCQ answer, or self-reported solve)
 *  - solved    : a question with at least one correct attempt (counted once)
 *  - accuracy  : correct attempts / all attempts
 *  - activity  : a day on which the student made at least one attempt
 *  - streak    : consecutive activity days ending today (or yesterday, so the
 *                streak is not shown as 0 before the student has practised today)
 */
const db = require('../db');
const { today, addDays, diffDays, weekdayIndex, startOfWeek } = require('../utils/dates');

const POINTS = { Easy: 10, Medium: 20, Hard: 40 };
const DAILY_BONUS = 20;
const MIN_ATTEMPTS_FOR_TOPIC = 3; // need this many attempts before a topic is "weak"/"strong"

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);

/* ---------------- streaks ---------------- */

function streaksFromDays(sortedDays, todayStr = today()) {
  if (!sortedDays.length) return { current: 0, longest: 0 };
  const set = new Set(sortedDays);

  // longest run
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    run = diffDays(sortedDays[i], sortedDays[i - 1]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // current run: start from today, or yesterday if nothing yet today
  let cursor = set.has(todayStr) ? todayStr : addDays(todayStr, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

const activityDays = (userId) =>
  db
    .prepare('SELECT DISTINCT day FROM attempts WHERE user_id = ? ORDER BY day')
    .all(userId)
    .map((r) => r.day);

function getStreaks(userId) {
  return streaksFromDays(activityDays(userId));
}

/** { userId -> currentStreak } for every user (used by the leaderboard). */
function streakMap() {
  const since = addDays(today(), -400);
  const rows = db
    .prepare('SELECT DISTINCT user_id, day FROM attempts WHERE day >= ? ORDER BY user_id, day')
    .all(since);
  const byUser = new Map();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id).push(r.day);
  }
  const out = new Map();
  for (const [uid, days] of byUser) out.set(uid, streaksFromDays(days).current);
  return out;
}

/* ---------------- totals ---------------- */

const getPoints = (userId) =>
  db.prepare('SELECT COALESCE(SUM(points),0) AS p FROM points_ledger WHERE user_id = ?').get(userId).p;

function getTotals(userId) {
  const a = db
    .prepare('SELECT COUNT(*) AS attempts, COALESCE(SUM(correct),0) AS correct FROM attempts WHERE user_id = ?')
    .get(userId);
  const solved = db
    .prepare('SELECT COUNT(DISTINCT question_id) AS n FROM attempts WHERE user_id = ? AND correct = 1')
    .get(userId).n;
  return {
    attempts: a.attempts,
    correct: a.correct,
    solved,
    accuracy: pct(a.correct, a.attempts),
    points: getPoints(userId),
  };
}

/* ---------------- breakdowns ---------------- */

function categoryAccuracy(userId) {
  const rows = db
    .prepare(
      `SELECT q.category AS name, COUNT(*) AS attempts, SUM(a.correct) AS correct
         FROM attempts a JOIN questions q ON q.id = a.question_id
        WHERE a.user_id = ? GROUP BY q.category`
    )
    .all(userId);
  const byName = new Map(rows.map((r) => [r.name, r]));
  return ['Aptitude', 'DSA', 'HR'].map((name) => {
    const r = byName.get(name);
    return { name, value: r ? pct(r.correct, r.attempts) : 0, attempts: r ? r.attempts : 0 };
  });
}

function difficultyMix(userId) {
  const rows = db
    .prepare(
      `SELECT q.difficulty AS name, COUNT(DISTINCT a.question_id) AS n
         FROM attempts a JOIN questions q ON q.id = a.question_id
        WHERE a.user_id = ? AND a.correct = 1 GROUP BY q.difficulty`
    )
    .all(userId);
  const byName = new Map(rows.map((r) => [r.name, r.n]));
  const colors = { Easy: '#6366f1', Medium: '#22d3ee', Hard: '#10b981' };
  return ['Easy', 'Medium', 'Hard'].map((name) => ({ name, value: byName.get(name) || 0, color: colors[name] }));
}

function topicAccuracy(userId) {
  return db
    .prepare(
      `SELECT q.topic AS name, COUNT(*) AS attempts, SUM(a.correct) AS correct
         FROM attempts a JOIN questions q ON q.id = a.question_id
        WHERE a.user_id = ? GROUP BY q.topic HAVING COUNT(*) >= ?`
    )
    .all(userId, MIN_ATTEMPTS_FOR_TOPIC)
    .map((r) => ({ name: r.name, value: pct(r.correct, r.attempts), attempts: r.attempts }));
}

function weakAndStrong(userId) {
  const topics = topicAccuracy(userId);
  const weakAreas = topics
    .filter((t) => t.value < 60)
    .sort((a, b) => a.value - b.value || b.attempts - a.attempts)
    .slice(0, 3);
  const strongAreas = topics
    .filter((t) => t.value >= 80)
    .sort((a, b) => b.value - a.value || b.attempts - a.attempts)
    .slice(0, 3);
  return { weakAreas, strongAreas };
}

/** Questions solved per day, Monday..Sunday of the current week. */
function weekly(userId) {
  const start = startOfWeek(today());
  const rows = db
    .prepare(
      `SELECT day, COUNT(DISTINCT question_id) AS n FROM attempts
        WHERE user_id = ? AND correct = 1 AND day >= ? AND day <= ? GROUP BY day`
    )
    .all(userId, start, addDays(start, 6));
  const byDay = new Map(rows.map((r) => [r.day, r.n]));
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return names.map((day, i) => ({ day, date: addDays(start, i), value: byDay.get(addDays(start, i)) || 0 }));
}

/* ---------------- composite score ---------------- */

/**
 * Prep score (0-100):  50% accuracy  +  30% coverage (solved / 50)  +  20% consistency (streak / 30)
 */
function prepScore({ attempts, accuracy, solved }, streak) {
  if (!attempts) return 0;
  const coverage = Math.min(solved / 50, 1) * 100;
  const consistency = Math.min(streak / 30, 1) * 100;
  return Math.round(accuracy * 0.5 + coverage * 0.3 + consistency * 0.2);
}

/* ---------------- profile heatmap ---------------- */

/** 24 weeks x 7 days, column-major (matches the CSS grid), levels 0-4. */
function heatmap(userId, weeks = 24) {
  const todayStr = today();
  const start = addDays(startOfWeek(todayStr), -(weeks - 1) * 7);
  const rows = db
    .prepare('SELECT day, COUNT(*) AS n FROM attempts WHERE user_id = ? AND day >= ? GROUP BY day')
    .all(userId, start);
  const byDay = new Map(rows.map((r) => [r.day, r.n]));
  const level = (n) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);
  const cells = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const future = date > todayStr;
      const count = future ? 0 : byDay.get(date) || 0;
      cells.push({ date, count, level: level(count), future });
    }
  }
  return { weeks, cells };
}

/** Last N days oldest -> newest, true if the student practised that day. */
function recentActivity(userId, days = 35) {
  const todayStr = today();
  const start = addDays(todayStr, -(days - 1));
  const set = new Set(
    db
      .prepare('SELECT DISTINCT day FROM attempts WHERE user_id = ? AND day >= ?')
      .all(userId, start)
      .map((r) => r.day)
  );
  return Array.from({ length: days }, (_, i) => set.has(addDays(start, i)));
}

/* ---------------- achievements ---------------- */

function achievements(userId) {
  const totals = getTotals(userId);
  const { longest } = getStreaks(userId);
  const solvedIn = (cat) =>
    db
      .prepare(
        `SELECT COUNT(DISTINCT a.question_id) AS n FROM attempts a JOIN questions q ON q.id = a.question_id
          WHERE a.user_id = ? AND a.correct = 1 AND q.category = ?`
      )
      .get(userId, cat).n;
  const apt = categoryAccuracy(userId).find((c) => c.name === 'Aptitude');

  return [
    { title: '7 Day Streak', description: 'Practise 7 days in a row', unlocked: longest >= 7 },
    { title: '50 Questions', description: 'Solve 50 questions', unlocked: totals.solved >= 50 },
    { title: 'DSA Warrior', description: 'Solve 5 DSA questions', unlocked: solvedIn('DSA') >= 5 },
    { title: 'Aptitude Ace', description: '80%+ accuracy over 5+ aptitude attempts', unlocked: apt.attempts >= 5 && apt.value >= 80 },
    { title: 'Interview Ready', description: 'Solve 3 HR questions', unlocked: solvedIn('HR') >= 3 },
    { title: 'Consistency King', description: 'Practise 30 days in a row', unlocked: longest >= 30 },
  ];
}

/** Compact summary used by the dashboard, profile and progress pages. */
function summary(userId) {
  const totals = getTotals(userId);
  const streaks = getStreaks(userId);
  return { ...totals, streak: streaks.current, longestStreak: streaks.longest };
}

module.exports = {
  POINTS,
  DAILY_BONUS,
  streaksFromDays,
  getStreaks,
  streakMap,
  getTotals,
  getPoints,
  categoryAccuracy,
  difficultyMix,
  weakAndStrong,
  weekly,
  prepScore,
  heatmap,
  recentActivity,
  achievements,
  summary,
};
