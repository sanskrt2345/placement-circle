'use strict';
const config = require('../config');

// 'YYYY-MM-DD' for a moment in time, in the app timezone (default Asia/Kolkata).
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: config.timezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dayString = (date = new Date()) => fmt.format(date);
const today = () => dayString();

const toUtc = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);

const addDays = (day, n) => fromUtc(toUtc(day) + n * 86400000);
const diffDays = (a, b) => Math.round((toUtc(a) - toUtc(b)) / 86400000); // a - b
// Monday = 0 ... Sunday = 6
const weekdayIndex = (day) => (new Date(toUtc(day)).getUTCDay() + 6) % 7;
const startOfWeek = (day) => addDays(day, -weekdayIndex(day));

module.exports = { dayString, today, addDays, diffDays, weekdayIndex, startOfWeek };
