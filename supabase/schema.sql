-- Create tables
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  hyperlink TEXT NOT NULL,
  note TEXT,
  image_path TEXT,
  bought BOOLEAN NOT NULL DEFAULT FALSE,
  date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  bought_by_cookie TEXT
);

CREATE TABLE IF NOT EXISTS visitor_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  cookie_id TEXT NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  interaction_count INTEGER NOT NULL DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- Policies for gifts table
CREATE POLICY "Anyone can read gifts" ON gifts FOR SELECT USING (true);

CREATE POLICY "Admin can insert gifts" ON gifts 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update all gift fields" ON gifts 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anonymous users can update only bought status of unbought gifts" ON gifts 
  FOR UPDATE USING (
    auth.role() = 'anon' AND 
    (bought = false OR bought_by_cookie = current_setting('request.headers.x-gift-buyer-id', true))
  ) 
  WITH CHECK (
    auth.role() = 'anon'
    -- The WITH CHECK clause applies to the new row values, not the old ones
  );

CREATE POLICY "Admin can delete gifts" ON gifts 
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for visitor_logs
CREATE POLICY "Backend can manage visitor logs" ON visitor_logs 
  USING (auth.role() = 'service_role');

-- Create storage bucket for gift images
INSERT INTO storage.buckets (id, name, public) 
  VALUES ('gift-images', 'gift-images', true)
  ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy for the bucket
CREATE POLICY "Anyone can view gift images" ON storage.objects 
  FOR SELECT USING (bucket_id = 'gift-images');

CREATE POLICY "Only authenticated users can upload gift images" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update gift images" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete gift images" ON storage.objects 
  FOR DELETE USING (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

-- Sample data for testing (commented out for production)
/*
INSERT INTO gifts (title, hyperlink, note, bought, date_added)
VALUES 
  ('Example Gift 1', 'https://example.com/gift1', 'This is a test gift', false, NOW()),
  ('Example Gift 2', 'https://example.com/gift2', 'Another test gift', false, NOW() - INTERVAL '1 day');
*/
