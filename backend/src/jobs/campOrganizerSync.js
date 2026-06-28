// Job: sincroniza el horario de CampOrganizer hacia Supabase.
//
// Por ahora guarda la respuesta cruda (jsonb) en una tabla cache —
// "camp_schedule_cache" — en vez de parsear campos específicos, porque
// todavía no tenemos confirmado el shape exacto del JSON que devuelve
// CampOrganizer (el login no se pudo capturar aún, así que tampoco se llegó
// a ver el body de /schedule). Una vez que tengamos un ejemplo real de
// respuesta, esto se puede mapear a columnas (día, hora, materia, location)
// para alimentar directamente el Dashboard/Schedule del frontend.
//
// Requiere migración previa (ver migración "camp_schedule_cache" sugerida
// en el chat) y las env vars CAMP_ORGANIZER_EMAIL / CAMP_ORGANIZER_PASSWORD
// en Railway. Si no están configuradas, no hace nada (mismo patrón
// fail-safe que notion.js / weekendRecap.js).

const { DateTime } = require('luxon');
const { supabase } = require('../lib/supabase');
const { isConfigured, fetchDaySchedule, fetchWeekSchedule } = require('../lib/campOrganizer');
const { TIMEZONE } = require('../data/schedule');

async function upsertScheduleCache(dateISO, view, payload) {
  const { error } = await supabase
    .from('camp_schedule_cache')
    .upsert(
      { date: dateISO, view, payload, fetched_at: new Date().toISOString() },
      { onConflict: 'date,view' }
    );
  if (error) console.error('[camporganizer-sync] error guardando en Supabase:', error.message);
}

// Corre una vez al día: trae el día de hoy + la semana completa y las
// cachea. Pensado para correr temprano (ej. 6:30 AM) antes de Morning
// Intelligence, para que esta última pueda eventualmente usar horarios
// reales en lugar de los estimados de src/data/schedule.js.
async function runCampOrganizerSync() {
  if (!isConfigured()) {
    console.log('[camporganizer-sync] credenciales no configuradas, omito sync');
    return { skipped: true };
  }

  const today = DateTime.now().setZone(TIMEZONE).toFormat('yyyy-MM-dd');

  try {
    // Secuencial, no Promise.all: CampOrganizer parece rechazar (404) una de
    // las dos llamadas cuando llegan casi simultáneas desde la misma sesión
    // (visto en pruebas: día y semana fallaban alternadamente con el mismo
    // patrón). Una pausa corta entre ambas evita el problema.
    const dayData = await fetchDaySchedule(today);
    if (!dayData?.skipped) await upsertScheduleCache(today, 'day', dayData);

    await new Promise((r) => setTimeout(r, 800));

    const weekData = await fetchWeekSchedule(today);
    if (!weekData?.skipped) await upsertScheduleCache(today, 'week', weekData);

    console.log('[camporganizer-sync] horario sincronizado para', today);
    return { ok: true };
  } catch (e) {
    // Nunca rompe el flujo principal del bot — solo loguea, igual que el
    // try/catch de syncToNotion en weekendRecap.js.
    console.error('[camporganizer-sync] error:', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { runCampOrganizerSync };
