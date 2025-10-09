-- Fix script structure: Remove script columns and create separate lesson_scripts table

-- Step 1: Remove the script columns we just added
ALTER TABLE subject_words 
DROP COLUMN IF EXISTS english_script_writing,
DROP COLUMN IF EXISTS english_script_roleplay,
DROP COLUMN IF EXISTS french_script_writing,
DROP COLUMN IF EXISTS french_script_roleplay;

-- Keep french_keyword as it's still needed per term
-- ALTER TABLE subject_words DROP COLUMN IF EXISTS french_keyword;

-- Step 2: Create lesson_scripts table
CREATE TABLE IF NOT EXISTS lesson_scripts (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subject_words(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL, -- Denormalized for easier queries
  english_script_writing TEXT,
  english_script_roleplay TEXT,
  french_script_writing TEXT,
  french_script_roleplay TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_scripts_subject_id ON lesson_scripts(subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_scripts_subject_name ON lesson_scripts(subject_name);

-- Add comments
COMMENT ON TABLE lesson_scripts IS 'Scripts for lessons - one per subject/lesson';
COMMENT ON COLUMN lesson_scripts.subject_id IS 'Foreign key to subject_words table';
COMMENT ON COLUMN lesson_scripts.subject_name IS 'Denormalized subject name for easier queries';
COMMENT ON COLUMN lesson_scripts.english_script_writing IS 'English script content for writing exercises';
COMMENT ON COLUMN lesson_scripts.english_script_roleplay IS 'English script content for roleplay exercises';
COMMENT ON COLUMN lesson_scripts.french_script_writing IS 'French script content for writing exercises';
COMMENT ON COLUMN lesson_scripts.french_script_roleplay IS 'French script content for roleplay exercises';

-- Display the updated table structures
SELECT 'subject_words table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
ORDER BY ordinal_position;

SELECT 'lesson_scripts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_scripts' 
ORDER BY ordinal_position;

