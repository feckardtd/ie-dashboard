const { DateTime } = require('luxon');
const { getNotesUpdatedBetween, getReflectionsBetween } = require('../lib/supabase');
const { weekendRecap: generateRecap } = require('../lib/deepseek');
const { sendTelegramMessage } = require('../lib/telegram');
const { appendWeeklyRecapToNotion, isNotionConfigured } = require('../lib/notion');
const { CLASSES, TIMEZONE } = require('../data/schedule');

// Runs Sunday evening. Looks back 7 days (the program week that just
// ended) and summarizes notes + daily reflections into one recap with a
// plan of attack for the coming week.
async function runWeekendRecap() {
  const now = DateTime.now().setZone(TIMEZONE);
  const weekStart = now.minus({ days: 7 }).startOf('day');
  const weekEnd = now.startOf('day').plus({ days: 1 });

  const [{ data: notes, error: notesError }, { data: reflections, error: reflError }] =
    await Promise.all([
      getNotesUpdatedBetween(weekStart.toUTC().toISO(), weekEnd.toUTC().toISO()),
      getReflectionsBetween(weekStart.toUTC().toISO(), weekEnd.toUTC().toISO()),
    ]);
  if (notesError) console.error('[weekend] error leyendo notas:', notesError.message);
  if (reflError) console.error('[weekend] error leyendo reflexiones:', reflError.message);

  const weekNotes = (notes || [])
    .filter((n) => n.content)
    .map((n) => ({ clase: CLASSES.find((c) => c.id === n.class_id)?.name || n.class_id, notas: n.content }));
  const weekReflections = (reflections || [])
    .filter((r) => r.content)
    .map((r) => ({ fecha: r.date, reflexion: r.content }));
  const classNames = [...new Set(weekNotes.map((n) => n.clase))];
  const weekLabel = `${weekStart.toFormat('d LLL')} – ${now.toFormat('d LLL yyyy')}`;

  if (weekNotes.length === 0 && weekReflections.length === 0) {
    await sendTelegramMessage(
      '🗂️ <b>Weekend Recap</b>\n\nNo encontré notas ni reflexiones de esta semana. Aprovecha el domingo para descansar — la próxima semana empezamos de cero 💪'
    );
    console.log('[weekend] sin datos esta semana, mensaje informativo enviado');
    await syncToNotion(weekLabel, 'No hubo notas ni reflexiones registradas esta semana.');
    return;
  }

  const message = await generateRecap(weekNotes, weekReflections, classNames);
  await sendTelegramMessage(`🗂️ <b>Weekend Recap</b>\n\n${message}`);
  console.log('[weekend] enviado a Telegram');
  await syncToNotion(weekLabel, message);
}

// Best-effort: si NOTION_API_KEY no está configurada, no hace nada y el
// sync semanal manual (vía tarea programada de Claude) sigue siendo el
// respaldo. Un error de Notion nunca debe tumbar el job principal.
async function syncToNotion(weekLabel, recapText) {
  if (!isNotionConfigured()) return;
  try {
    await appendWeeklyRecapToNotion({ weekLabel, recapText });
    console.log('[weekend] sync directo a Notion OK');
  } catch (err) {
    console.error('[weekend] error sincronizando con Notion:', err.message);
  }
}

module.exports = { runWeekendRecap };
