const { DateTime } = require('luxon');
const { getNotesUpdatedBetween } = require('../lib/supabase');
const { morningIntelligence: generateMorning } = require('../lib/deepseek');
const { sendTelegramMessage } = require('../lib/telegram');
const { CLASSES, getTodayClasses, TIMEZONE } = require('../data/schedule');

async function runMorningIntelligence() {
  const now = DateTime.now().setZone(TIMEZONE);
  const yesterdayStart = now.minus({ days: 1 }).startOf('day');
  const todayStart = now.startOf('day');

  const { data: notes, error } = await getNotesUpdatedBetween(
    yesterdayStart.toUTC().toISO(),
    todayStart.toUTC().toISO()
  );
  if (error) console.error('[morning] error leyendo notas de Supabase:', error.message);

  const yesterdayNotes = (notes || []).map((n) => ({
    clase: CLASSES.find((c) => c.id === n.class_id)?.name || n.class_id,
    notas: n.content,
  }));

  const todayClasses = getTodayClasses(now);

  const message = await generateMorning(yesterdayNotes, todayClasses);
  await sendTelegramMessage(`🌅 <b>Morning Intelligence</b>\n\n${message}`);
  console.log('[morning] enviado a Telegram');
}

module.exports = { runMorningIntelligence };
