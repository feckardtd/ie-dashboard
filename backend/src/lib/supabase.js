const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

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

module.exports = { supabase, getNote, getNotesForClasses, getNotesUpdatedBetween };
