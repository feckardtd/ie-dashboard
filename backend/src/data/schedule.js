const { DateTime } = require('luxon');

// Mirrors src/data/schedule.js in the frontend. Keep both in sync if the
// program schedule changes (subjects, classes, or week boundaries).

const SUBJECTS = [
  { id: 'ai-critical', name: 'AI & Critical Thinking', color: '#6c63ff', icon: '🤖', week: 'both' },
  { id: 'sustainability', name: 'Sustainability & SDGs', color: '#22c55e', icon: '🌱', week: 1 },
  { id: 'prototyping', name: 'Prototyping & Design', color: '#f5c842', icon: '🎨', week: 'both' },
  { id: 'hackathon', name: 'Hackathon & Problem Definition', color: '#f97316', icon: '⚡', week: 'both' },
  { id: 'pitch', name: 'Pitch & Business', color: '#ec4899', icon: '💼', week: 2 },
  { id: 'softskills', name: 'Storytelling & Public Speaking', color: '#14b8a6', icon: '📢', week: 2 },
  { id: 'admissions', name: 'Admissions & University', color: '#8b5cf6', icon: '🎓', week: 2 },
  { id: 'teambuilding', name: 'Team Building & Well-Being', color: '#06b6d4', icon: '🤝', week: 1 },
];

const CLASSES = [
  // SEMANA 1 - SEGOVIA
  { id: 'c1', subjectId: 'teambuilding', name: 'Icebreaker & Team Building', day: 'Monday', week: 1, session: 1, location: 'Segovia' },
  { id: 'c2', subjectId: 'teambuilding', name: 'Well-Being Workshop', day: 'Monday', week: 1, session: 2, location: 'Segovia' },
  { id: 'c3', subjectId: 'teambuilding', name: 'Team Building: Two Truths and a Lie', day: 'Monday', week: 1, session: 3, location: 'Segovia' },
  { id: 'c4', subjectId: 'sustainability', name: 'Sustainability Introduction & SDGs Agenda 2030', day: 'Tuesday', week: 1, session: 1, location: 'Segovia' },
  { id: 'c5', subjectId: 'sustainability', name: 'Sustainability Activity', day: 'Tuesday', week: 1, session: 2, location: 'Segovia' },
  { id: 'c6', subjectId: 'sustainability', name: 'Social Impact', day: 'Tuesday', week: 1, session: 4, location: 'Segovia' },
  { id: 'c7', subjectId: 'ai-critical', name: 'Critical Thinking in the Age of AI', day: 'Thursday', week: 1, session: 1, location: 'Segovia' },
  { id: 'c8', subjectId: 'ai-critical', name: 'Ethics of AI & Introduction to Project', day: 'Thursday', week: 1, session: 2, location: 'Segovia' },
  { id: 'c9', subjectId: 'prototyping', name: 'Prototyping with AI', day: 'Thursday', week: 1, session: 3, location: 'Segovia' },
  { id: 'c10', subjectId: 'hackathon', name: 'Define a Good Problem: Hackathon Kick-Off', day: 'Friday', week: 1, session: 1, location: 'Segovia' },
  { id: 'c11', subjectId: 'hackathon', name: 'Customer Discovery Field Trip', day: 'Friday', week: 1, session: 2, location: 'Segovia' },
  { id: 'c12', subjectId: 'prototyping', name: 'Prototyping with AI (Advanced)', day: 'Friday', week: 1, session: 3, location: 'Segovia' },
  { id: 'c13', subjectId: 'hackathon', name: 'Define Your Area of Interest & Problem Prompts', day: 'Thursday', week: 1, session: 4, location: 'Segovia' },
  // SEMANA 2 - MADRID
  { id: 'c14', subjectId: 'prototyping', name: 'Design System Thinking', day: 'Monday', week: 2, session: 1, location: 'Madrid' },
  { id: 'c15', subjectId: 'hackathon', name: 'Hackathon Framework', day: 'Monday', week: 2, session: 2, location: 'Madrid' },
  { id: 'c16', subjectId: 'ai-critical', name: 'Tech Trends', day: 'Monday', week: 2, session: 3, location: 'Madrid' },
  { id: 'c17', subjectId: 'admissions', name: 'Admissions, Global Markets & University Insights', day: 'Monday', week: 2, session: 4, location: 'Madrid' },
  { id: 'c18', subjectId: 'prototyping', name: 'Prototyping with AI — Session 1', day: 'Tuesday', week: 2, session: 1, location: 'Madrid' },
  { id: 'c19', subjectId: 'prototyping', name: 'Prototyping with AI — Session 2', day: 'Tuesday', week: 2, session: 2, location: 'Madrid' },
  { id: 'c20', subjectId: 'pitch', name: 'Individual Pitch Practice with VR', day: 'Tuesday', week: 2, session: 3, location: 'Madrid' },
  { id: 'c21', subjectId: 'softskills', name: 'The Art of Storytelling', day: 'Wednesday', week: 2, session: 1, location: 'Madrid' },
  { id: 'c22', subjectId: 'softskills', name: 'Public Speaking & Presentation Skills', day: 'Wednesday', week: 2, session: 2, location: 'Madrid' },
  { id: 'c23', subjectId: 'pitch', name: 'Feedback Round: Group Presentations & Review', day: 'Wednesday', week: 2, session: 3, location: 'Madrid' },
  { id: 'c24', subjectId: 'pitch', name: 'Pitch Competition in Class', day: 'Thursday', week: 2, session: 1, location: 'Madrid' },
  { id: 'c25', subjectId: 'pitch', name: 'Pitch Practice', day: 'Thursday', week: 2, session: 2, location: 'Madrid' },
  { id: 'c26', subjectId: 'pitch', name: 'Elevator Pitch & Investment', day: 'Thursday', week: 2, session: 3, location: 'Madrid' },
  { id: 'c27', subjectId: 'pitch', name: 'Finalists Pitch Competition & Awards', day: 'Thursday', week: 2, session: 4, location: 'Madrid' },
  { id: 'c28', subjectId: 'admissions', name: 'How To Stand Out in Your Admissions Process', day: 'Friday', week: 2, session: 1, location: 'Madrid' },
];

// Calendar dates per week/day — mirrors Dashboard.jsx (WEEK1_START/WEEK2_START)
// and the frontend Schedule.jsx page, so the backend stays in sync with the UI.
const WEEK_DAY_DATES = {
  1: {
    Sunday: '2026-06-28', Monday: '2026-06-29', Tuesday: '2026-06-30',
    Wednesday: '2026-07-01', Thursday: '2026-07-02', Friday: '2026-07-03', Saturday: '2026-07-04',
  },
  2: {
    Sunday: '2026-07-05', Monday: '2026-07-06', Tuesday: '2026-07-07',
    Wednesday: '2026-07-08', Thursday: '2026-07-09', Friday: '2026-07-10', Saturday: '2026-07-11',
  },
};

// TODO(Fede): confirm real class start times. schedule.js only has a
// "session" number, not a clock time, so these are ESTIMATED standard
// slots (1.5h blocks starting 9am). Update this map once the real
// program timetable is confirmed, otherwise Pre-Class Prep will fire
// at the wrong time.
const SESSION_START_TIMES = {
  1: '09:00',
  2: '10:30',
  3: '12:00',
  4: '13:30',
};

const TIMEZONE = 'Europe/Madrid';

function getClassStart(cls) {
  const dateStr = WEEK_DAY_DATES[cls.week]?.[cls.day];
  const timeStr = SESSION_START_TIMES[cls.session] || '09:00';
  if (!dateStr) return null;
  return DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: TIMEZONE });
}

function getSubject(subjectId) {
  return SUBJECTS.find((s) => s.id === subjectId);
}

function getTodayClasses(now = DateTime.now().setZone(TIMEZONE)) {
  const todayStr = now.toISODate();
  return CLASSES.filter((c) => {
    const start = getClassStart(c);
    return start && start.toISODate() === todayStr;
  });
}

module.exports = {
  SUBJECTS,
  CLASSES,
  WEEK_DAY_DATES,
  SESSION_START_TIMES,
  TIMEZONE,
  getClassStart,
  getSubject,
  getTodayClasses,
};
