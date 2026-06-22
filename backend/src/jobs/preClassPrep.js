const { DateTime } = require('luxon');
const { getNotesForClasses, getNotifiedClassIds, markClassNotified } = require('../lib/supabase');
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

async function checkUpcomingClasses() {
  const now = DateTime.now().setZone(TIMEZONE);
  const notified = await getNotifiedClassIds();

  for (const cls of CLASSES) {
    if (notified.has(cls.id)) continue;
    const start = getClassStart(cls);
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
