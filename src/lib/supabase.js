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

// Helper: subir una foto (nota a mano, captura de Apple Notes/Freeform, etc.)
// al bucket público "note-photos" y devolver su URL pública.
export async function uploadNotePhoto(classId, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${classId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('note-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadError) return { url: null, error: uploadError };
  const { data } = supabase.storage.from('note-photos').getPublicUrl(path);
  return { url: data.publicUrl, path, error: null };
}

// Helper: guardar la lista actualizada de fotos de una nota (upsert por class_id).
export async function saveNotePhotos(classId, photoUrls) {
  const { data, error } = await supabase
    .from('notes')
    .upsert({ class_id: classId, photo_urls: photoUrls, updated_at: new Date() }, { onConflict: 'class_id' })
    .select();
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
