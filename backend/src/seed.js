'use strict';
/**
 * Seeds starter content (the same questions / opportunities / alumni stories that
 * were hard-coded in the frontend) and, optionally, an admin user and demo students.
 *
 *   npm run seed            -> content + admin (if ADMIN_EMAIL / ADMIN_PASSWORD set)
 *   node src/seed.js --demo -> also creates demo students so the leaderboard isn't empty
 *
 * Content is only inserted into EMPTY tables, so re-running never duplicates rows
 * or resurrects things an admin deleted.
 */
const bcrypt = require('bcryptjs');
const db = require('./db');
const config = require('./config');
const { today, addDays } = require('./utils/dates');
const { POINTS } = require('./services/stats');

const J = JSON.stringify;
const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;

/* ------------------------------------------------------------------ questions */
const questions = [
  // ---------- DSA ----------
  {
    title: 'Two Sum', category: 'DSA', topic: 'Arrays', difficulty: 'Easy', time: 15,
    companies: ['Google', 'Amazon', 'Microsoft'],
    description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one valid pair exists, and you may not use the same element twice.\n\nExample: nums = [2, 7, 11, 15], target = 9  ->  [0, 1]',
    hint: 'Store each value\'s index in a hash map and look up `target - current` as you scan. One pass, O(n).',
    explanation: 'Hash map of value -> index. For each number check whether its complement was already seen.',
  },
  {
    title: 'Container With Most Water', category: 'DSA', topic: 'Arrays', difficulty: 'Medium', time: 20,
    companies: ['Amazon', 'Adobe'],
    description: 'You are given n non-negative integers, where the i-th value is the height of a vertical line at x = i. Choose two lines which, together with the x-axis, form a container holding the most water. Return that maximum area.',
    hint: 'Start with two pointers at both ends and always move the pointer at the shorter line inward.',
    explanation: 'Area = min(h[l], h[r]) * (r - l). Moving the taller line can never help, so move the shorter one. O(n).',
  },
  {
    title: 'Valid Palindrome', category: 'DSA', topic: 'Strings', difficulty: 'Easy', time: 10,
    companies: ['Microsoft', 'Flipkart'],
    description: 'Given a string `s`, return true if it reads the same forwards and backwards after removing all non-alphanumeric characters and ignoring letter case.\n\nExample: "A man, a plan, a canal: Panama"  ->  true',
    hint: 'Use two pointers from both ends, skipping characters that are not letters or digits.',
    explanation: 'Two pointers, compare lower-cased alphanumeric characters. O(n) time, O(1) extra space.',
  },
  {
    title: 'Binary Tree Level Order Traversal', category: 'DSA', topic: 'Trees', difficulty: 'Medium', time: 20,
    companies: ['Google', 'Amazon'],
    description: 'Given the root of a binary tree, return the values of its nodes level by level, from left to right, as a list of lists.',
    hint: 'Breadth-first search with a queue. Process exactly queue.length nodes per level.',
    explanation: 'BFS: record the queue size at the start of each level, pop that many nodes, push their children.',
  },
  {
    title: 'Longest Increasing Subsequence', category: 'DSA', topic: 'Dynamic Programming', difficulty: 'Medium', time: 25,
    companies: ['Google', 'Microsoft'],
    description: 'Given an integer array `nums`, return the length of the longest strictly increasing subsequence (elements need not be contiguous).\n\nExample: [10, 9, 2, 5, 3, 7, 101, 18]  ->  4',
    hint: 'Start with dp[i] = best length ending at i (O(n^2)). Then improve with binary search over "tails" for O(n log n).',
    explanation: 'dp[i] = 1 + max(dp[j]) for j < i with nums[j] < nums[i]. The tails array + binary search gives O(n log n).',
  },
  {
    title: 'Word Ladder', category: 'DSA', topic: 'Graphs', difficulty: 'Hard', time: 35,
    companies: ['Amazon'],
    description: 'Given `beginWord`, `endWord` and a list of words, return the length of the shortest sequence from beginWord to endWord where each step changes exactly one letter and every intermediate word is in the list. Return 0 if no such sequence exists.',
    hint: 'Treat words as graph nodes and run BFS. Group words by wildcard patterns ("h*t") to find neighbours quickly.',
    explanation: 'BFS from beginWord guarantees the shortest path. Pre-bucketing by wildcard pattern avoids comparing every pair.',
  },

  // ---------- Aptitude (auto-graded MCQs) ----------
  {
    title: 'Train Speed Problem', category: 'Aptitude', topic: 'Quantitative', difficulty: 'Easy', time: 2,
    companies: ['TCS', 'Infosys'],
    description: 'A train 150 m long passes a telegraph pole in 10 seconds. What is its speed in km/h?',
    options: ['45 km/h', '54 km/h', '60 km/h', '72 km/h'], answer: '54 km/h',
    hint: 'Passing a pole means covering its own length. Convert m/s to km/h by multiplying by 18/5.',
    explanation: 'Speed = 150 / 10 = 15 m/s = 15 x 18/5 = 54 km/h.',
  },
  {
    title: 'Coin Toss Probability', category: 'Aptitude', topic: 'Probability', difficulty: 'Medium', time: 3,
    companies: ['Deloitte', 'Accenture'],
    description: 'A fair coin is tossed 3 times. What is the probability of getting exactly 2 heads?',
    options: ['1/8', '3/8', '1/2', '5/8'], answer: '3/8',
    hint: 'Count the favourable outcomes out of the 8 equally likely outcomes.',
    explanation: 'Favourable: HHT, HTH, THH = 3. Total = 2^3 = 8. Probability = 3/8.',
  },
  {
    title: 'Series Completion', category: 'Aptitude', topic: 'Logical Reasoning', difficulty: 'Easy', time: 2,
    companies: ['TCS', 'Infosys'],
    description: 'Find the next number in the series: 2, 6, 12, 20, 30, ?',
    options: ['36', '40', '42', '44'], answer: '42',
    hint: 'Look at the differences between consecutive terms.',
    explanation: 'Differences are 4, 6, 8, 10, so the next difference is 12 and 30 + 12 = 42. (Terms are n x (n+1).)',
  },
  {
    title: 'Compound Interest', category: 'Aptitude', topic: 'Quantitative', difficulty: 'Medium', time: 3,
    companies: ['Deloitte'],
    description: 'What is the compound interest on Rs. 10,000 at 10% per annum for 2 years, compounded annually?',
    options: ['Rs. 2,000', 'Rs. 2,100', 'Rs. 2,200', 'Rs. 2,400'], answer: 'Rs. 2,100',
    hint: 'Amount = P x (1 + r/100)^n, then subtract the principal.',
    explanation: 'Amount = 10,000 x 1.1 x 1.1 = 12,100. Interest = 12,100 - 10,000 = Rs. 2,100.',
  },
  {
    title: 'Blood Relations', category: 'Aptitude', topic: 'Logical Reasoning', difficulty: 'Hard', time: 4,
    companies: ['Accenture'],
    description: 'A is the sister of B. C is the mother of B. D is the father of C. How is A related to D?',
    options: ['Daughter', 'Granddaughter', 'Great-granddaughter', 'Niece'], answer: 'Granddaughter',
    hint: 'A and B share the same mother, so work out how C relates to A first.',
    explanation: 'A and B are siblings, so C is also A\'s mother. D is C\'s father, so D is A\'s grandfather and A is D\'s granddaughter.',
  },

  // ---------- HR (self-assessed) ----------
  {
    title: 'Tell me about yourself', category: 'HR', topic: 'Interview Questions', difficulty: 'Easy', time: 5,
    companies: ['Google', 'Microsoft', 'Amazon'],
    description: 'Give a 60-90 second introduction of yourself as you would in a real interview. Practise it out loud, then mark it solved once you are happy with it.',
    hint: 'Use Present -> Past -> Future: what you do now, the experiences that got you here, and why this role is next.',
    explanation: 'Keep it relevant to the role, include one concrete achievement, and end by linking your goals to the company.',
  },
  {
    title: 'Handling a Team Conflict', category: 'HR', topic: 'Behavioral', difficulty: 'Medium', time: 5,
    companies: ['Amazon', 'Adobe'],
    description: 'Tell me about a time you disagreed with a teammate. How did you handle it and what was the outcome? Answer out loud using the STAR format, then mark it solved.',
    hint: 'STAR: Situation, Task, Action, Result. Spend most of your time on what YOU did.',
    explanation: 'Show that you listened first, focused on the problem rather than the person, and reached a result everyone could support.',
  },
  {
    title: 'Why this company?', category: 'HR', topic: 'Interview Questions', difficulty: 'Medium', time: 5,
    companies: ['Google'],
    description: 'Why do you want to work here rather than at a competitor? Prepare a specific answer for one of your target companies, then mark it solved.',
    hint: 'Connect a specific product, value, or team to something you have actually built or learned.',
    explanation: 'Generic praise sounds rehearsed. Name a real product or engineering decision and link it to your own goals.',
  },
];

/* --------------------------------------------------------------- opportunities */
// deadlines are "days from the day you seed", so the demo data is never instantly expired
const opportunities = [
  { title: 'Digital Cadre', company: 'TCS', type: 'job', location: 'Pan India', pay: '₹7.5 LPA', description: 'Fast-track programme for high performers.', eligibility: 'Final year', in: 3, link: 'https://www.tcs.com/careers' },
  { title: 'SDE Intern', company: 'Amazon', type: 'internship', location: 'Bengaluru', pay: '₹90,000/month', description: 'Build customer-obsessed products at scale.', eligibility: 'Final year B.Tech', in: 5, link: 'https://www.amazon.jobs' },
  { title: 'Software Engineering Intern', company: 'Google', type: 'internship', location: 'Bengaluru', pay: '₹1,00,000/month', description: 'Work with Google engineers on real production systems. Areas: Search, Ads, Cloud.', eligibility: '3rd/Final year B.Tech CSE/IT', in: 7, link: 'https://www.google.com/about/careers/' },
  { title: 'SDE-1 (Full-time)', company: 'Flipkart', type: 'job', location: 'Bengaluru', pay: '₹28 LPA', description: 'Own the largest e-commerce stack in India.', eligibility: 'Final year B.Tech / M.Tech', in: 10, link: 'https://www.flipkartcareers.com' },
  { title: 'Explore Program (SDE Intern)', company: 'Microsoft', type: 'internship', location: 'Hyderabad', pay: '₹80,000/month', description: '12-week rotational program across PM, SDE and Design.', eligibility: '2nd year B.Tech', in: 12, link: 'https://careers.microsoft.com' },
  { title: 'Consulting Analyst', company: 'Deloitte', type: 'job', location: 'Mumbai', pay: '₹9 LPA', description: 'Advise Fortune 500 clients on strategy and operations.', eligibility: 'Final year', in: 15, link: 'https://www.deloitte.com/global/en/careers.html' },
  { title: 'Engineering Intern', company: 'Atlassian', type: 'internship', location: 'Remote', pay: '$3,500/month', description: 'Work fully remote with the Jira / Confluence teams.', eligibility: 'Any year', in: 20, link: 'https://www.atlassian.com/company/careers' },
  { title: 'Product Intern', company: 'Adobe', type: 'internship', location: 'Noida', pay: '₹70,000/month', description: 'Ship features used by millions of creators worldwide.', eligibility: 'Pre-final year', in: 4, link: 'https://www.adobe.com/careers.html' },
];

/* ----------------------------------------------------------------- experiences */
const experiences = [
  { company: 'Google', role: 'SDE-1', status: 'Offer', name: 'Ananya Kapoor', year: 2025,
    rounds: ['Online Assessment', 'Technical Round 1', 'Technical Round 2', 'Googleyness & HR'],
    tip: "Consistency > intensity. Solve one meaningful problem a day for 6 months and you'll be ready.",
    full: 'I started preparing in my third year and kept a simple rule: one problem a day, then write down the pattern I learned. In interviews, I talked through brute force first, then improved it step by step. The Googleyness round was a normal conversation about teamwork and how I handle ambiguity.' },
  { company: 'Microsoft', role: 'SDE Intern', status: 'Offer', name: 'Rahul Verma', year: 2026,
    rounds: ['OA', 'Group Discussion', 'Technical + HR'],
    tip: 'Speak your thought process out loud. Interviewers care more about approach than the final code.',
    full: 'The OA had two coding questions and a few MCQs. The group discussion was on a current tech topic and was more about how you listen than how loud you are. In the technical round, I explained my approach before typing anything, and the interviewer helped when I got stuck.' },
  { company: 'Amazon', role: 'SDE-1', status: 'Offer', name: 'Priya Sharma', year: 2025,
    rounds: ['Online Assessment', 'Technical Round', 'Bar Raiser'],
    tip: 'Bar Raiser is the hardest round — practice behavioral with a friend at least 5 times.',
    full: 'Prepare 6 to 8 stories from your projects and college life, and map each one to the Amazon leadership principles. Use the STAR format and always say what YOU did, not what the team did. The Bar Raiser asked follow-ups on every story, so know the details.' },
  { company: 'Adobe', role: 'MTS-1', status: 'Offer', name: 'Karthik Reddy', year: 2024,
    rounds: ['Online Test', 'Technical Round', 'Managerial + HR'],
    tip: 'Have one project you can explain end-to-end for 20 minutes without hesitation.',
    full: 'They went deep on my main project: why I chose the tech stack, what broke, and how I fixed it. Revise your core subjects too (OS, DBMS, OOP). The managerial round was relaxed and focused on learning ability and career goals.' },
];

/* ---------------------------------------------------------------------- seeding */
function seedContent() {
  const added = {};

  if (count('questions') === 0) {
    const ins = db.prepare(
      `INSERT INTO questions (title, category, topic, difficulty, time_minutes, companies, description, hint, options, answer, explanation)
       VALUES (@title, @category, @topic, @difficulty, @time, @companies, @description, @hint, @options, @answer, @explanation)`
    );
    db.transaction(() => {
      for (const q of questions) {
        ins.run({ ...q, companies: J(q.companies), options: q.options ? J(q.options) : null, answer: q.answer || null });
      }
    })();
    added.questions = questions.length;
  }

  if (count('opportunities') === 0) {
    const ins = db.prepare(
      `INSERT INTO opportunities (title, company, type, location, pay, description, eligibility, link, deadline)
       VALUES (@title, @company, @type, @location, @pay, @description, @eligibility, @link, @deadline)`
    );
    db.transaction(() => {
      for (const o of opportunities) ins.run({ ...o, deadline: addDays(today(), o.in) });
    })();
    added.opportunities = opportunities.length;
  }

  if (count('experiences') === 0) {
    const ins = db.prepare(
      `INSERT INTO experiences (company, role, status, name, year, rounds, tip, full)
       VALUES (@company, @role, @status, @name, @year, @rounds, @tip, @full)`
    );
    db.transaction(() => {
      for (const e of experiences) ins.run({ ...e, rounds: J(e.rounds) });
    })();
    added.experiences = experiences.length;
  }
  return added;
}

function ensureAdmin() {
  const { email, password, name } = config.admin;
  if (!email || !password) return false;
  const hash = bcrypt.hashSync(password, 10);
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'admin')").run(name, email, hash);
  }
  return true;
}

/** Demo students + practice history so leaderboard / progress pages have something to show. */
function seedDemo() {
  const hash = bcrypt.hashSync('Student@2026', 10);
  const qs = db.prepare('SELECT id, difficulty FROM questions ORDER BY id').all();
  const people = [
    ['Aarav Patel', 'student@college.edu', 'CSE', 'Final Year', 12, 0.72],
    ['Ishaan Mehta', 'ishaan@college.edu', 'CSE', 'Final Year', 42, 0.9],
    ['Priya Sharma', 'priya@college.edu', 'CSE', '3rd Year', 28, 0.85],
    ['Rohan Iyer', 'rohan@college.edu', 'IT', 'Final Year', 21, 0.8],
    ['Ananya Kapoor', 'ananya@college.edu', 'CSE', 'Final Year', 18, 0.78],
    ['Karthik Reddy', 'karthik@college.edu', 'ECE', '3rd Year', 14, 0.7],
    ['Meera Nair', 'meera@college.edu', 'CSE', '2nd Year', 9, 0.65],
    ['Devansh Rao', 'devansh@college.edu', 'IT', 'Final Year', 7, 0.6],
    ['Sara Ali', 'sara@college.edu', 'CSE', '3rd Year', 11, 0.7],
    ['Fresh Student', 'fresh@college.edu', 'CSE', 'Final Year', 0, 0],
  ];
  const insUser = db.prepare(
    `INSERT OR IGNORE INTO users (full_name, email, password_hash, branch, year, college, goal, level, focus, target_companies)
     VALUES (?, ?, ?, ?, ?, 'IIT Delhi', 'Software Engineering', 'Intermediate', ?, ?)`
  );
  const insAttempt = db.prepare('INSERT INTO attempts (user_id, question_id, correct, day) VALUES (?, ?, ?, ?)');
  const insPoints = db.prepare('INSERT OR IGNORE INTO points_ledger (user_id, points, reason, ref, day) VALUES (?, ?, ?, ?, ?)');

  let seed = 11;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  db.transaction(() => {
    for (const [name, email, branch, year, streak, skill] of people) {
      insUser.run(name, email, hash, branch, year, J(['DSA', 'Aptitude', 'HR Interviews']), J(['Google', 'Microsoft', 'Adobe']));
      const u = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (db.prepare('SELECT 1 FROM attempts WHERE user_id = ?').get(u.id)) continue; // already seeded
      const solvedOnce = new Set();
      for (let d = 0; d < streak; d++) {
        const day = addDays(today(), -d);
        const n = 1 + Math.floor(rand() * 3);
        for (let k = 0; k < n; k++) {
          const q = qs[Math.floor(rand() * qs.length)];
          const ok = rand() < skill ? 1 : 0;
          insAttempt.run(u.id, q.id, ok, day);
          if (ok && !solvedOnce.has(q.id)) {
            solvedOnce.add(q.id);
            insPoints.run(u.id, POINTS[q.difficulty], 'solve', String(q.id), day);
          }
        }
      }
    }
  })();
  return people.length;
}

function run({ demo = false } = {}) {
  const added = seedContent();
  const admin = ensureAdmin();
  const demoUsers = demo ? seedDemo() : 0;
  return { added, admin, demoUsers };
}

module.exports = { run, seedContent, ensureAdmin, seedDemo };

if (require.main === module) {
  const result = run({ demo: process.argv.includes('--demo') });
  console.log('Seed complete:', JSON.stringify(result));
  if (result.demoUsers) console.log('Demo login: student@college.edu / Student@2026');
}
