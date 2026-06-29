const { DateTime } = require('luxon');
const {
  getNotesForClasses,
  getNotifiedClassIds,
  markClassNotified,
  getCampScheduleCacheToday,
} = require('../lib/supabase');
const {
  preClassPrep: generatePrep,
  hackathonPrep: generateHackathonPrep,
  pitchPrep: generatePitchPrep,
} = require('../lib/deepseek');
const { sendTelegramMessage } = require('../lib/telegram');
const { CLASSES, getSubject, getClassStart, TIMEZONE } = require('../data/schedule');

// Dedup so the same class doesn't get notified twice across cron ticks.
// Persisted in Supabase (table `preclass_notifications`) instead of an
// in-memory Set so a Railway restart mid-window doesn't cause a duplicate
// notification — each class_id is unique across the whole program, so it
// only ever needs to fire once.
const MINUTES_BEFORE = 30;
const WINDOW_MINUTES = 5; // tolerance: fires once per checker tick (every 5 min)

// CampOrganizer labels each academic block in its title as "... S<n>" where
// <n> is the session number within the day (e.g. "(Room 342 - A)
// Sustainability & Social Impact S2") — the room/group letter (A/B/C)
// varies, but all variants of the same session share the same start time,
// and that session number lines up 1:1 with `cls.session` in schedule.js.
// So instead of matching class names (which don't resemble CampOrganizer's
// generic per-block titles), we match on session number alone — far more
// reliable than fuzzy text matching, and avoids ever needing to know which
// room/group Fede is actually in.
const SESSION_SUFFIX_RE = /\bS(\d)\b/i;

function getRealStartFromCamp(cls, campEvents, todayStr) {
  if (!campEvents || !campEvents.length) return null;
  // Only trust the session-number match for classes actually scheduled
  // today — otherwise a coincidental "S<n>" match in today's cache could
  // get attributed to a class that's really scheduled a different day.
  const estimated = getClassStart(cls);
  if (!estimated || estimated.toISODate() !== todayStr) return null;

  const matches = campEvents.filter((e) => {
    if (e.status === 'canceled' || !e.start_at) return false;
    const m = e.title?.match(SESSION_SUFFIX_RE);
    return m && Number(m[1]) === cls.session;
  });
  if (!matches.length) return null;
  const earliest = matches.reduce((a, b) => (a.start_at < b.start_at ? a : b));
  return DateTime.fromISO(earliest.start_at).setZone(TIMEZONE);
}

async function checkUpcomingClasses() {
  const now = DateTime.now().setZone(TIMEZONE);
  const todayStr = now.toISODate();
  const notified = await getNotifiedClassIds();
  const campEvents = await getCampScheduleCacheToday(todayStr);

  for (const cls of CLASSES) {
    if (notified.has(cls.id)) continue;
    // Prefer the real CampOrganizer time for today's classes; fall back to
    // the estimated schedule.js time if there's no cache yet or no matching
    // session block was found (e.g. non-academic days, or before sync runs).
    const start = getRealStartFromCamp(cls, campEvents, todayStr) || getClassStart(cls);
    if (!start) continue;

    const minutesUntil = start.diff(now, 'minutes').minutes;
    const inWindow =
      minutesUntil <= MINUTES_BEFORE && minutesUntil > MINUTES_BEFORE - WINDOW_MINUTES;

    if (inWindow) {
      await markClassNotified(cls.id);
      await sendPreClassPrep(cls).catch((err) =>
        console.error(`[preclass] error enviando prep para ${cls.id}:`, err.message)
      );
    }
  }
}

// Specialized agents take over for certain subjects instead of the generic
// Pre-Class Prep, with their own emoji/title/prompt — Hackathon Assistant
// for hackathon sessions, Pitch Practice Bot for pitch sessions. Everything
// else (sustainability, AI, prototyping, etc.) keeps using the generic prep.
const SPECIALIZED_AGENTS = {
  hackathon: { emoji: '⚡', title: 'Hackathon Assistant', generate: generateHackathonPrep },
  pitch: { emoji: '🎤', title: 'Pitch Practice Bot', generate: generatePitchPrep },
};

async function sendPreClassPrep(cls) {
  const subject = getSubject(cls.subjectId);
  const subjectClassIds = CLASSES.filter((c) => c.subjectId === cls.subjectId).map((c) => c.id);

  const { data: notes, error } = await getNotesForClasses(subjectClassIds);
  if (error) console.error('[preclass] error leyendo notas de Supabase:', error.message);

  const previousNotes = (notes || [])
    .filter((n) => n.content)
    .map((n) => ({ clase: cls.name, notas: n.content }));

  const specialized = SPECIALIZED_AGENTS[cls.subjectId];
  if (specialized) {
    const message = await specialized.generate(cls.name, previousNotes);
    await sendTelegramMessage(`${specialized.emoji} <b>${specialized.title} — ${cls.name}</b>\n\n${message}`);
    console.log(`[preclass] enviado (${specialized.title}) para ${cls.id} (${cls.name})`);
    return;
  }

  const message = await generatePrep(cls.name, subject?.name, previousNotes);
  await sendTelegramMessage(`📚 <b>Pre-Class Prep — ${cls.name}</b>\n\n${message}`);
  console.log(`[preclass] enviado para ${cls.id} (${cls.name})`);
}

module.exports = { checkUpcomingClasses };
