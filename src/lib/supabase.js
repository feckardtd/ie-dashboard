import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: save note for a class
export async function saveNote(classId, content, professor) {
  const { data, error } = await supabase
    .from('notes')
    .upsert({ class_id: classId, content, professor, updated_at: new Date() }, { onConflict: 'class_id' })
    .select();
  return { data, error };
}

// Helper: get note for a class
export async function getNote(classId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('class_id', classId)
    .single();
  return { data, error };
}

// Helper: save contact
export async function saveContact(contact) {
  const { data, error } = await supabase
    .from('contacts')
    .upsert(contact)
    .select();
  return { data, error };
}

// Helper: get all contacts
export async function getContacts() {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

// Helper: save reflection
export async function saveReflection(date, content) {
  const { data, error } = await supabase
    .from('reflections')
    .upsert({ date, content, updated_at: new Date() }, { onConflict: 'date' })
    .select();
  return { data, error };
}

// Helper: get all reflections
export async function getReflections() {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .order('date', { ascending: false });
  return { data, error };
}
