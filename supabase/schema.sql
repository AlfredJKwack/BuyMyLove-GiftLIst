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
DROP POLICY IF EXISTS "Anyone can read gifts" ON gifts;
CREATE POLICY "Anyone can read gifts" ON gifts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage gifts" ON gifts;
CREATE POLICY "Authenticated users can manage gifts" ON gifts 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anonymous users can update bought status" ON gifts;
-- NOTE: Postgres RLS policies cannot reference OLD.* in WITH CHECK.
-- This policy allows anonymous users to update gifts only if the business logic is satisfied.
-- For strict column-level enforcement, use a BEFORE UPDATE trigger.
CREATE POLICY "Anonymous users can update bought status" ON gifts
  FOR UPDATE
  TO anon
  USING (
    (bought = false OR bought_by_cookie = current_setting('request.headers.x-gift-buyer-id', true))
  )
  WITH CHECK (
    true
  );

-- Policies for visitor_logs
DROP POLICY IF EXISTS "Backend can manage visitor logs" ON visitor_logs;
CREATE POLICY "Backend can manage visitor logs" ON visitor_logs 
  USING (auth.role() = 'service_role');

-- Create storage bucket for gift images
INSERT INTO storage.buckets (id, name, public) 
  VALUES ('gift-images', 'gift-images', true)
  ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy for the bucket
DROP POLICY IF EXISTS "Anyone can view gift images" ON storage.objects;
CREATE POLICY "Anyone can view gift images" ON storage.objects 
  FOR SELECT USING (bucket_id = 'gift-images');

DROP POLICY IF EXISTS "Only authenticated users can upload gift images" ON storage.objects;
CREATE POLICY "Only authenticated users can upload gift images" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'gift-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only authenticated users can update gift images" ON storage.objects;
CREATE POLICY "Only authenticated users can update gift images" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'gift-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only authenticated users can delete gift images" ON storage.objects;
CREATE POLICY "Only authenticated users can delete gift images" ON storage.objects 
  FOR DELETE USING (bucket_id = 'gift-images' AND auth.uid() IS NOT NULL);

-- Helper function for setting configuration variables in Edge Functions
CREATE OR REPLACE FUNCTION set_config(setting_name text, new_value text, is_local boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config(setting_name, new_value, is_local);
  RETURN new_value;
END;
$$;

-- Sample data for testing (commented out for production)
/*
INSERT INTO gifts (title, hyperlink, note, bought, date_added)
VALUES 
  ('Example Gift 1', 'https://example.com/gift1', 'This is a test gift', false, NOW()),
  ('Example Gift 2', 'https://example.com/gift2', 'Another test gift', false, NOW() - INTERVAL '1 day');
*/

-- Enforce column-level update restrictions for anonymous users
-- Only allow "bought" and "bought_by_cookie" to be changed by anonymous users
CREATE OR REPLACE FUNCTION enforce_anon_update_columns()
RETURNS trigger AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL THEN
    -- Anonymous user: only allow "bought" and "bought_by_cookie" to change
    IF (NEW.title IS DISTINCT FROM OLD.title OR
        NEW.hyperlink IS DISTINCT FROM OLD.hyperlink OR
        NEW.note IS DISTINCT FROM OLD.note OR
        NEW.image_path IS DISTINCT FROM OLD.image_path OR
        NEW.date_added IS DISTINCT FROM OLD.date_added) THEN
      RAISE EXCEPTION 'Anonymous users may only update bought and bought_by_cookie fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_anon_update_columns_trigger ON gifts;
CREATE TRIGGER enforce_anon_update_columns_trigger
  BEFORE UPDATE ON gifts
  FOR EACH ROW
  EXECUTE FUNCTION enforce_anon_update_columns();
