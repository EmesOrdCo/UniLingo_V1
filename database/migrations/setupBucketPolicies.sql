-- Setup policies for General_Lessons bucket to allow public access to images
-- This allows the word image service to read images from the bucket

-- First, make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('General_Lessons', 'General_Lessons', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  updated_at = NOW();

-- Create policy to allow anyone to read files from General_Lessons bucket
CREATE POLICY "Public read access for General_Lessons" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'General_Lessons');

-- Create policy to allow authenticated users to upload files (optional, for future use)
CREATE POLICY "Authenticated users can upload to General_Lessons" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'General_Lessons');

-- Create policy to allow authenticated users to update files (optional, for future use)
CREATE POLICY "Authenticated users can update General_Lessons files" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'General_Lessons');

-- Create policy to allow authenticated users to delete files (optional, for future use)
CREATE POLICY "Authenticated users can delete General_Lessons files" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'General_Lessons');

-- Verify the bucket exists and is public
SELECT 
  id, 
  name, 
  public, 
  created_at 
FROM storage.buckets 
WHERE name = 'General_Lessons';

-- List any existing policies for the bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND qual LIKE '%General_Lessons%';
