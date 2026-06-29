const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// This bot only does plain REST queries (select/insert), never realtime
// subscriptions, but supabase-js still initializes a RealtimeClient under
// the hood and that requires a WebSocket implementation on Node < 22.
// Provide the "ws" package as the transport per Supabase's own docs.
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws },
});

// Get the note for a single class (mirrors frontend src/lib/supabase.js getNote)
async function getNote(classId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('class_id', classId)
    .maybeSingle();
  return { data, error };
}

// Get all notes whose class_id is in the given list
async function getNotesForClasses(classIds) {
  if (!classIds.length) return { data: [], error: null };
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .in('class_id', classIds);
  return { data: data || [], error };
}

// Get all notes updated within [startISO, endISO) — used to approximate
// "yesterday's notes" / "today's notes" since the notes table doesn't
// track which calendar day a note is about, only when it was last saved.
async function getNotesUpdatedBetween(startISO, endISO) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .gte('updated_at', startISO)
    .lt('updated_at', endISO);
  return { data: data || [], error };
}

// Pre-Class Prep dedup — persisted in Supabase instead of an in-memory Set
// so a Railway restart mid-window doesn't cause a duplicate notification.
async function getNotifiedClassIds() {
  const { data, error } = await supabase.from('preclass_notifications').select('class_id');
  if (error) {
    console.error('[supabase] error leyendo preclass_notifications:', error.message);
    return new Set();
  }
  return new Set((data || []).map((r) => r.class_id));
}

async function markClassNotified(classId) {
  const { error } = await supabase
    .from('preclass_notifications')
    .upsert({ class_id: classId, notified_at: new Date().toISOString() });
  if (error) console.error('[supabase] error guardando preclass_notification:', error.message);
}

// Activity Reminder (10 min antes de CUALQUIER actividad: clases formales +
// eventos de CampOrganizer) dedup — mismo patrón que preclass_notifications,
// pero con un id genérico con prefijo ('camp:<eventId>' o 'class:<classId>')
// para no pisar el dedup de Pre-Class Prep, que es un aviso distinto (30 min
// antes, con contexto generado por IA) y convive con este.
async function getNotifiedActivityIds() {
  const { data, error } = await supabase.from('activity_reminders').select('activity_id');
  if (error) {
    console.error('[supabase] error leyendo activity_reminders:', error.message);
    return new Set();
  }
  return new Set((data || []).map((r) => r.activity_id));
}

async function markActivityNotified(activityId) {
  const { error } = await supabase
    .from('activity_reminders')
    .upsert({ activity_id: activityId, notified_at: new Date().toISOString() });
  if (error) console.error('[supabase] error guardando activity_reminder:', error.message);
}

// Trae los eventos de hoy del cache de CampOrganizer (camp_schedule_cache,
// view='day'), o null si no hay fila para hoy todavía (el sync corre una vez
// por día ~6:30 AM) o si falló. null le indica al caller que use el fallback
// (CLASSES de schedule.js) en vez de "hoy no hay nada programado".
async function getCampScheduleCacheToday(todayStr) {
  const { data, error } = await supabase
    .from('camp_schedule_cache')
    .select('*')
    .eq('view', 'day')
    .eq('date', todayStr)
    .maybeSingle();
  if (error) {
    console.error('[supabase] error leyendo camp_schedule_cache:', error.message);
    return null;
  }
  if (!data || data.date !== todayStr || !data.payload?.events) return null;
  return data.payload.events;
}

// All reflections saved in [startISO, endISO) — used by Weekend Recap to
// pull the week's daily reflections (mirrors getNotesUpdatedBetween).
async function getReflectionsBetween(startISO, endISO) {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .gte('updated_at', startISO)
    .lt('updated_at', endISO)
    .order('date', { ascending: true });
  return { data: data || [], error };
}

// Contacts created in [startISO, endISO) — used by the Contact Follow-up
// Agent to find new people Fede met since the last run, so it can suggest
// a concrete follow-up message before they slip out of mind.
async function getContactsCreatedBetween(startISO, endISO) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

module.exports = {
  supabase,
  getNote,
  getNotesForClasses,
  getNotesUpdatedBetween,
  getNotifiedClassIds,
  markClassNotified,
  getNotifiedActivityIds,
  markActivityNotified,
  getCampScheduleCacheToday,
  getReflectionsBetween,
  getContactsCreatedBetween,
};
