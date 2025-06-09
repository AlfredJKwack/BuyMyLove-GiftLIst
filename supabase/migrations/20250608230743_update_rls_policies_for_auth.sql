-- Update RLS policies to use auth.uid() IS NOT NULL for authenticated users

-- Drop old policies
DROP POLICY IF EXISTS "Admin can insert gifts" ON gifts;
DROP POLICY IF EXISTS "Admin can update all gift fields" ON gifts;
DROP POLICY IF EXISTS "Anonymous users can update only bought status of unbought gifts" ON gifts;
DROP POLICY IF EXISTS "Admin can delete gifts" ON gifts;

-- Create new policies for gifts table
DROP POLICY IF EXISTS "Authenticated users can manage gifts" ON gifts;
CREATE POLICY "Authenticated users can manage gifts" ON gifts 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anonymous users can update bought status" ON gifts;
CREATE POLICY "Anonymous users can update bought status" ON gifts 
  FOR UPDATE 
  USING (
    auth.uid() IS NULL AND
    (bought = false OR bought_by_cookie = current_setting('request.headers.x-gift-buyer-id', true))
  ) 
  WITH CHECK (
    auth.uid() IS NULL
  );

-- Update storage policies to use auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Only authenticated users can upload gift images" ON storage.objects;
CREATE POLICY "Only authenticated users can upload gift images" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'gift-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only authenticated users can update gift images" ON storage.objects;
CREATE POLICY "Only authenticated users can update gift images" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'gift-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only authenticated users can delete gift images" ON storage.objects;
CREATE POLICY "Only authenticated users can delete gift images" ON storage.objects 
  FOR DELETE USING (bucket_id = 'gift-images' AND auth.uid() IS NOT NULL);
