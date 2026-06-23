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

-- Enable Row Level Security (optional but recommended)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (personalize later)
CREATE POLICY "Allow all" ON notes FOR ALL USING (true);
CREATE POLICY "Allow all" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all" ON reflections FOR ALL USING (true);

-- STORAGE: bucket público para fotos de notas a mano / Apple Notes / Freeform
INSERT INTO storage.buckets (id, name, public) VALUES ('note-photos', 'note-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "note-photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'note-photos');
CREATE POLICY "note-photos public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'note-photos');
CREATE POLICY "note-photos public delete" ON storage.objects FOR DELETE USING (bucket_id = 'note-photos');
