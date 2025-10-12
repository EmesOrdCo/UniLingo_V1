-- Add image_url column to subject_words table
-- This column will store the Supabase Storage URL for word images

ALTER TABLE subject_words 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN subject_words.image_url IS 'URL to word image stored in Supabase Storage (General_Lessons bucket)';

-- Create index for faster image URL lookups
CREATE INDEX IF NOT EXISTS idx_subject_words_image_url ON subject_words(image_url) WHERE image_url IS NOT NULL;

-- Display the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
ORDER BY ordinal_position;

