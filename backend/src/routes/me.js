'use strict';
/** Personalised endpoints: /progress, /profile, /dashboard */
const express = require('express');
const { z } = require('zod');

const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { parseJson, publicUser } = require('../utils/user');
const stats = require('../services/stats');
const practice = require('../services/practice');
const content = require('../services/content');

const router = express.Router();
router.use(requireAuth);

/* -------------------------------------------------------------------- progress */
router.get('/progress', (req, res) => {
  const uid = req.user.id;
  const summary = stats.summary(uid);
  const { weakAreas, strongAreas } = stats.weakAndStrong(uid);
  res.json({
    stats: {
      prepScore: stats.prepScore(summary, summary.streak),
      solved: summary.solved,
      accuracy: summary.accuracy,
      streak: summary.streak,
      points: summary.points,
    },
    weekly: stats.weekly(uid),
    categoryAccuracy: stats.categoryAccuracy(uid),
    difficulty: stats.difficultyMix(uid),
    weakAreas,
    strongAreas,
  });
});

/* --------------------------------------------------------------------- profile */
const list = (maxItems, maxLen) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);
const profileBody = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    college: z.string().trim().max(80),
    branch: z.string().trim().max(30),
    year: z.enum(['1st Year', '2nd Year', '3rd Year', 'Final Year']).or(z.literal('')),
    goal: z.string().trim().max(80),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).or(z.literal('')),
    focus: list(8, 30),
    targetCompanies: list(10, 40),
  })
  .partial();

function profilePayload(user) {
  const summary = stats.summary(user.id);
  return {
    user: publicUser(user),
    targetCompanies: parseJson(user.target_companies, []),
    preferences: { goal: user.goal, level: user.level, focus: parseJson(user.focus, []) },
    stats: { streak: summary.streak, points: summary.points, solved: summary.solved },
    heatmap: stats.heatmap(user.id),
    achievements: stats.achievements(user.id),
    memberSince: user.created_at,
  };
}

router.get('/profile', (req, res) => res.json(profilePayload(req.user)));

router.put('/profile', (req, res) => {
  const b = profileBody.parse(req.body);
  const u = req.user;
  db.prepare(
    `UPDATE users SET full_name = ?, college = ?, branch = ?, year = ?, goal = ?, level = ?, focus = ?, target_companies = ? WHERE id = ?`
  ).run(
    b.fullName ?? u.full_name,
    b.college ?? u.college,
    b.branch ?? u.branch,
    b.year ?? u.year,
    b.goal ?? u.goal,
    b.level ?? u.level,
    b.focus ? JSON.stringify(b.focus) : u.focus,
    b.targetCompanies ? JSON.stringify(b.targetCompanies) : u.target_companies,
    u.id
  );
  res.json(profilePayload(db.prepare('SELECT * FROM users WHERE id = ?').get(u.id)));
});

/* ------------------------------------------------------------------- dashboard */
function recommendations(user, summary, weakAreas) {
  const first = user.full_name.trim().split(/\s+/)[0];
  const targets = parseJson(user.target_companies, []);
  const items = [];

  weakAreas.slice(0, 2).forEach((w) =>
    items.push({
      title: `Your accuracy in ${w.name} is ${w.value}%`,
      text: `Practise 3 ${w.name} problems →`,
      href: `practice.html?q=${encodeURIComponent(w.name)}`,
    })
  );
  if (targets.length) {
    items.push({
      title: `${targets[0]} is one of your target companies`,
      text: `Explore ${targets[0]} interview experiences →`,
      href: `alumni.html?q=${encodeURIComponent(targets[0])}`,
    });
  }
  if (!summary.attempts) {
    items.unshift({
      title: 'Start with an easy win',
      text: 'Solve your first question to begin your streak →',
      href: 'daily-prep.html',
    });
  }

  let coach;
  if (!summary.attempts) {
    coach = `${first}, welcome to Placement Circle! Solve today's 3 questions to start your streak and earn your first points.`;
  } else {
    const praise = summary.streak >= 2
      ? `your ${summary.points} points and ${summary.streak}-day streak are great`
      : `you have ${summary.points} points so far`;
    const focus = weakAreas[0]
      ? ` Spend some time on ${weakAreas[0].name} today${targets[0] ? ` to get closer to ${targets[0]}` : ''}.`
      : targets[0]
        ? ` Keep going — ${targets[0]} is within reach.`
        : ' Keep the momentum going.';
    coach = `${first}, ${praise}.${focus}`;
  }
  return { coach, items: items.slice(0, 3) };
}

router.get('/dashboard', (req, res) => {
  const uid = req.user.id;
  const summary = stats.summary(uid);
  const { weakAreas } = stats.weakAndStrong(uid);

  // top 5 overall, but always show the viewer (replace the 5th row if they're outside the top 5)
  const board = content.getLeaderboard(req.user, 'overall', 1000);
  let rows = board.all.slice(0, 5);
  if (board.you && !rows.some((r) => r.isYou)) rows = [...rows.slice(0, 4), board.you];

  res.json({
    user: publicUser(req.user),
    mission: practice.getDailyMission(uid),
    streak: {
      current: summary.streak,
      longest: summary.longestStreak,
      last35Days: stats.recentActivity(uid, 35),
    },
    stats: { points: summary.points, solved: summary.solved, accuracy: summary.accuracy },
    picks: recommendations(req.user, summary, weakAreas),
    closingSoon: content.listOpportunities({ limit: 3 }),
    alumni: content.listExperiences(req.user, { limit: 3 }),
    leaderboard: rows,
  });
});

module.exports = router;
