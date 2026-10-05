'use strict';

const parseJson = (text, fallback) => {
  try {
    const v = JSON.parse(text);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || '';
  return (first + last).toUpperCase();
};

/** The shape of a user that is safe to send to the browser. */
function publicUser(row) {
  const subtitle = [row.branch, row.year].filter(Boolean).join(' · ');
  return {
    id: row.id,
    fullName: row.full_name,
    firstName: row.full_name.trim().split(/\s+/)[0],
    initials: initialsOf(row.full_name),
    email: row.email,
    role: row.role,
    college: row.college,
    branch: row.branch,
    year: row.year,
    subtitle: subtitle || 'Student',
  };
}

module.exports = { parseJson, initialsOf, publicUser };
