-- Add new columns to the existing subject_words table
-- This script adds the requested columns for English and French script content

ALTER TABLE subject_words 
ADD COLUMN IF NOT EXISTS english_script_writing TEXT,
ADD COLUMN IF NOT EXISTS english_script_roleplay TEXT,
ADD COLUMN IF NOT EXISTS french_keyword TEXT,
ADD COLUMN IF NOT EXISTS french_script_writing TEXT,
ADD COLUMN IF NOT EXISTS french_script_roleplay TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN subject_words.english_script_writing IS 'English script content for writing exercises';
COMMENT ON COLUMN subject_words.english_script_roleplay IS 'English script content for roleplay exercises';
COMMENT ON COLUMN subject_words.french_keyword IS 'French keyword or phrase translation';
COMMENT ON COLUMN subject_words.french_script_writing IS 'French script content for writing exercises';
COMMENT ON COLUMN subject_words.french_script_roleplay IS 'French script content for roleplay exercises';

-- Display the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
ORDER BY ordinal_position;


