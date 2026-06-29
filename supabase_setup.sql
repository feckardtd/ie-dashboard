-- Run this in your Supabase SQL Editor to set up all tables

-- NOTES (one per class)
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  professor TEXT DEFAULT '',
  photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- fotos de notas a mano / Apple Notes / Freeform
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT DEFAULT '',
  email TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  snapchat TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  slack TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFLECTIONS (one per day)
CREATE TABLE IF NOT EXISTS reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRE-CLASS NOTIFICATIONS (dedup del agente Pre-Class Prep, 30 min antes)
CREATE TABLE IF NOT EXISTS preclass_notifications (
  class_id TEXT PRIMARY KEY,
  notified_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY REMINDERS (dedup del recordatorio genérico, 10 min antes de
-- cualquier actividad: clases formales + eventos de CampOrganizer)
CREATE TABLE IF NOT EXISTS activity_reminders (
  activity_id TEXT PRIMARY KEY,
  notified_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAMP SCHEDULE CACHE (snapshot diario del horario real de CampOrganizer,
-- sincronizado ~6:30 AM hora de España)
CREATE TABLE IF NOT EXISTS camp_schedule_cache (
  date DATE NOT NULL,
  view TEXT NOT NULL, -- 'day' | 'week'
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, view)
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE preclass_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_schedule_cache ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (personalize later)
CREATE POLICY "Allow all" ON notes FOR ALL USING (true);
CREATE POLICY "Allow all" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all" ON reflections FOR ALL USING (true);
CREATE POLICY "Allow all" ON preclass_notifications FOR ALL USING (true);
CREATE POLICY "Allow all" ON activity_reminders FOR ALL USING (true);
CREATE POLICY "Allow all" ON camp_schedule_cache FOR ALL USING (true);

-- STORAGE: bucket público para fotos de notas a mano / Apple Notes / Freeform
INSERT INTO storage.buckets (id, name, public) VALUES ('note-photos', 'note-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "note-photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'note-photos');
CREATE POLICY "note-photos public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'note-photos');
CREATE POLICY "note-photos public delete" ON storage.objects FOR DELETE USING (bucket_id = 'note-photos');
