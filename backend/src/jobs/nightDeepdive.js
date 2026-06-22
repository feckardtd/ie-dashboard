const { DateTime } = require('luxon');
const { getNotesForClasses } = require('../lib/supabase');
const { nightDeepdive: generateDeepdive } = require('../lib/deepseek');
const { sendTelegramMessage } = require('../lib/telegram');
const { getSubject, getTodayClasses, TIMEZONE } = require('../data/schedule');

async function runNightDeepdive() {
  const now = DateTime.now().setZone(TIMEZONE);
  const todayClasses = getTodayClasses(now);

  if (todayClasses.length === 0) {
    await sendTelegramMessage('🌙 <b>Night Deepdive</b>\n\nHoy no hubo clases en el programa. Descansa 💤');
    console.log('[deepdive] sin clases hoy, mensaje informativo enviado');
    return;
  }

  const { data: notes, error } = await getNotesForClasses(todayClasses.map((c) => c.id));
  if (error) console.error('[deepdive] error leyendo notas de Supabase:', error.message);

  const notesByClass = new Map((notes || []).map((n) => [n.class_id, n]));
  const classesWithNotes = todayClasses.filter((c) => notesByClass.get(c.id)?.content);

  if (classesWithNotes.length === 0) {
    await sendTelegramMessage(
      '🌙 <b>Night Deepdive</b>\n\nNo encontré notas guardadas de las clases de hoy. Agrégalas en /clases para que pueda profundizar mañana.'
    );
    console.log('[deepdive] sin notas hoy, mensaje informativo enviado');
    return;
  }

  for (const cls of classesWithNotes) {
    const note = notesByClass.get(cls.id);
    const subject = getSubject(cls.subjectId);
    const message = await generateDeepdive(note.content, cls.name, subject?.name);
    await sendTelegramMessage(`🌙 <b>Night Deepdive — ${cls.name}</b>\n\n${message}`);
  }
  console.log(`[deepdive] enviado para ${classesWithNotes.length} clase(s)`);
}

module.exports = { runNightDeepdive };
