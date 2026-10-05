'use strict';
const db = require('../db');
const { today, diffDays } = require('../utils/dates');
const { parseJson, initialsOf } = require('../utils/user');
const { streakMap } = require('./stats');

/* ---------------------------------------------------------------- opportunities */

const toOpportunity = (o) => ({
  id: o.id,
  title: o.title,
  company: o.company,
  type: o.type,
  location: o.location,
  pay: o.pay,
  description: o.description,
  eligibility: o.eligibility,
  link: o.link,
  deadline: o.deadline,
  daysLeft: Math.max(0, diffDays(o.deadline, today())), // 0 = closing today
});

/** Open opportunities (deadline today or later), soonest deadline first. */
function listOpportunities({ type, q, limit } = {}) {
  const where = ['is_active = 1', 'deadline >= ?'];
  const params = [today()];
  if (type) { where.push('type = ?'); params.push(type); }
  let rows = db
    .prepare(`SELECT * FROM opportunities WHERE ${where.join(' AND ')} ORDER BY deadline ASC, id ASC`)
    .all(...params);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((o) => [o.title, o.company, o.location].join(' ').toLowerCase().includes(needle));
  }
  if (limit) rows = rows.slice(0, limit);
  return rows.map(toOpportunity);
}

/* ------------------------------------------------------------------ experiences */

const toExperience = (e, viewer) => ({
  id: e.id,
  company: e.company,
  role: e.role,
  status: e.status,
  name: e.name,
  year: e.year,
  rounds: parseJson(e.rounds, []),
  tip: e.tip,
  full: e.full,
  helpfulCount: e.helpful_count,
  helpful: Boolean(e.i_marked),
  canDelete: Boolean(viewer && (viewer.role === 'admin' || e.user_id === viewer.id)),
  createdAt: e.created_at,
});

function listExperiences(viewer, { q, limit } = {}) {
  let rows = db
    .prepare(
      `SELECT e.*,
              (SELECT COUNT(*) FROM experience_helpful h WHERE h.experience_id = e.id) AS helpful_count,
              EXISTS (SELECT 1 FROM experience_helpful h WHERE h.experience_id = e.id AND h.user_id = ?) AS i_marked
         FROM experiences e ORDER BY e.created_at DESC, e.id DESC`
    )
    .all(viewer.id);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((e) => [e.company, e.role, e.name].join(' ').toLowerCase().includes(needle));
  }
  if (limit) rows = rows.slice(0, limit);
  return rows.map((e) => toExperience(e, viewer));
}

function getExperience(viewer, id) {
  const e = db
    .prepare(
      `SELECT e.*,
              (SELECT COUNT(*) FROM experience_helpful h WHERE h.experience_id = e.id) AS helpful_count,
              EXISTS (SELECT 1 FROM experience_helpful h WHERE h.experience_id = e.id AND h.user_id = ?) AS i_marked
         FROM experiences e WHERE e.id = ?`
    )
    .get(viewer.id, id);
  return e ? toExperience(e, viewer) : null;
}

/* ------------------------------------------------------------------ leaderboard */

/**
 * scope: 'overall' | 'branch' | 'year'  (branch/year = same as the viewer's)
 * Ranks are by points (ties broken by who joined first, so the order is stable).
 */
function getLeaderboard(viewer, scope = 'overall', limit = 50) {
  const where = ["u.role = 'student'"];
  const params = [];
  if (scope === 'branch') {
    if (viewer.branch) { where.push('u.branch = ?'); params.push(viewer.branch); } else { where.push('u.id = ?'); params.push(viewer.id); }
  } else if (scope === 'year') {
    if (viewer.year) { where.push('u.year = ?'); params.push(viewer.year); } else { where.push('u.id = ?'); params.push(viewer.id); }
  }
  const rows = db
    .prepare(
      `SELECT u.id, u.full_name, u.branch, u.year, COALESCE(SUM(p.points), 0) AS points
         FROM users u LEFT JOIN points_ledger p ON p.user_id = u.id
        WHERE ${where.join(' AND ')}
        GROUP BY u.id ORDER BY points DESC, u.id ASC`
    )
    .all(...params);

  const streaks = streakMap();
  const all = rows.map((r, i) => ({
    rank: i + 1,
    name: r.full_name,
    initials: initialsOf(r.full_name),
    branch: r.branch,
    year: r.year,
    streak: streaks.get(r.id) || 0,
    points: r.points,
    isYou: r.id === viewer.id,
  }));
  const you = all.find((e) => e.isYou) || null;
  return { scope, total: all.length, you, entries: all.slice(0, limit), all };
}

module.exports = { listOpportunities, listExperiences, getExperience, getLeaderboard };
