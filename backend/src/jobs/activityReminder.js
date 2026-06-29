// Job: recordatorio simple 10 min antes de CUALQUIER actividad del día —
// no solo las 28 clases formales del programa (eso ya lo cubre, con más
// contexto generado por IA y 30 min de anticipación, Pre-Class Prep). Este
// job es más genérico y corre más seguido (cada minuto) para cubrir también
// comidas, tiempo libre y cualquier otro evento real que tenga CampOrganizer.
//
// Fuente de datos, en este orden de preferencia:
//   1. camp_schedule_cache (hoy, view='day') — la agenda real, sincronizada
//      una vez por día ~6:30 AM por campOrganizerSync.js. Si existe para
//      hoy, es la fuente más completa y precisa.
//   2. CLASSES de data/schedule.js — fallback con horarios ESTIMADOS, usado
//      solo si CampOrganizer no está configurado o el cache de hoy todavía
//      no llegó (p.ej. antes de las 6:30 AM o si falla el login).
//
// No se usan ambas fuentes a la vez para el mismo día — evita mandar dos
// recordatorios para la misma actividad si por algún motivo coincidieran.

const { DateTime } = require('luxon');
const {
  getNotifiedActivityIds,
  markActivityNotified,
  getCampScheduleCacheToday,
} = require('../lib/supabase');
const { sendTelegramMessage } = require('../lib/telegram');
const { CLASSES, getClassStart, TIMEZONE } = require('../data/schedule');

const MINUTES_BEFORE = 10;
const WINDOW_MINUTES = 1; // el cron corre cada minuto, así que 1 min de tolerancia alcanza

async function checkActivityReminders() {
  const now = DateTime.now().setZone(TIMEZONE);
  const todayStr = now.toISODate();
  const notified = await getNotifiedActivityIds();
  const activities = await getTodayActivities(todayStr);

  for (const act of activities) {
    if (!act.start || notified.has(act.id)) continue;

    const minutesUntil = act.start.diff(now, 'minutes').minutes;
    const inWindow =
      minutesUntil <= MINUTES_BEFORE && minutesUntil > MINUTES_BEFORE - WINDOW_MINUTES;

    if (inWindow) {
      await markActivityNotified(act.id);
      await sendReminder(act).catch((err) =>
        console.error(`[activity-reminder] error enviando recordatorio para ${act.id}:`, err.message)
      );
    }
  }
}

async function getTodayActivities(todayStr) {
  const campEvents = await getCampScheduleCacheToday(todayStr);

  if (campEvents && campEvents.length) {
    return campEvents
      .filter((e) => e.visibility?.explorer !== false && e.status !== 'canceled')
      .map((e) => ({
        id: `camp:${e._id}`,
        title: e.title,
        location: e.location?.name || null,
        start: e.start_at ? DateTime.fromISO(e.start_at).setZone(TIMEZONE) : null,
      }));
  }

  // Fallback: clases estimadas de hoy desde schedule.js
  return CLASSES.filter((c) => {
    const start = getClassStart(c);
    return start && start.toISODate() === todayStr;
  }).map((c) => ({
    id: `class:${c.id}`,
    title: c.name,
    location: c.location || null,
    start: getClassStart(c),
  }));
}

async function sendReminder(act) {
  const timeStr = act.start.toFormat('HH:mm');
  const message = `⏰ <b>${act.title}</b> empieza en 10 min (${timeStr})${
    act.location ? `\n📍 ${act.location}` : ''
  }`;
  await sendTelegramMessage(message);
  console.log(`[activity-reminder] enviado para ${act.id} (${act.title})`);
}

module.exports = { checkActivityReminders };
