const { DateTime } = require('luxon');
const { getNotesForClasses } = require('../lib/supabase');
const { preClassPrep: generatePrep } = require('../lib/deepseek');
const { sendTelegramMessage } = require('../lib/telegram');
const { CLASSES, getSubject, getClassStart, TIMEZONE } = require('../data/schedule');

// In-memory dedup so the same class doesn't get notified twice across
// cron ticks. Resets if the process restarts — acceptable for a personal
// bot, but if Railway restarts mid-window a class could be notified twice.
const notified = new Set();

const MINUTES_BEFORE = 30;
const WINDOW_MINUTES = 5; // tolerance: fires once per checker tick (every 5 min)

async function checkUpcomingClasses() {
  const now = DateTime.now().setZone(TIMEZONE);

  for (const cls of CLASSES) {
    if (notified.has(cls.id)) continue;
    const start = getClassStart(cls);
    if (!start) continue;

    const minutesUntil = start.diff(now, 'minutes').minutes;
    const inWindow =
      minutesUntil <= MINUTES_BEFORE && minutesUntil > MINUTES_BEFORE - WINDOW_MINUTES;

    if (inWindow) {
      notified.add(cls.id);
      await sendPreClassPrep(cls).catch((err) =>
        console.error(`[preclass] error enviando prep para ${cls.id}:`, err.message)
      );
    }
  }
}

async function sendPreClassPrep(cls) {
  const subject = getSubject(cls.subjectId);
  const subjectClassIds = CLASSES.filter((c) => c.subjectId === cls.subjectId).map((c) => c.id);

  const { data: notes, error } = await getNotesForClasses(subjectClassIds);
  if (error) console.error('[preclass] error leyendo notas de Supabase:', error.message);

  const previousNotes = (notes || [])
    .filter((n) => n.content)
    .map((n) => ({ clase: cls.name, notas: n.content }));

  const message = await generatePrep(cls.name, subject?.name, previousNotes);
  await sendTelegramMessage(`📚 <b>Pre-Class Prep — ${cls.name}</b>\n\n${message}`);
  console.log(`[preclass] enviado para ${cls.id} (${cls.name})`);
}

module.exports = { checkUpcomingClasses };
