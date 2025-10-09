-- Fix script structure: Remove script columns and create separate lesson_scripts table
-- This version is safer and handles potential errors

-- Step 1: Check what columns exist first
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
ORDER BY ordinal_position;

-- Step 2: Remove the script columns (one at a time to avoid syntax errors)
DO $$
BEGIN
    -- Check and drop columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_words' AND column_name = 'english_script_writing') THEN
        ALTER TABLE subject_words DROP COLUMN english_script_writing;
        RAISE NOTICE 'Dropped english_script_writing column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_words' AND column_name = 'english_script_roleplay') THEN
        ALTER TABLE subject_words DROP COLUMN english_script_roleplay;
        RAISE NOTICE 'Dropped english_script_roleplay column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_words' AND column_name = 'french_script_writing') THEN
        ALTER TABLE subject_words DROP COLUMN french_script_writing;
        RAISE NOTICE 'Dropped french_script_writing column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_words' AND column_name = 'french_script_roleplay') THEN
        ALTER TABLE subject_words DROP COLUMN french_script_roleplay;
        RAISE NOTICE 'Dropped french_script_roleplay column';
    END IF;
END $$;

-- Step 3: Create lesson_scripts table (simplified - no foreign key for now)
CREATE TABLE IF NOT EXISTS lesson_scripts (
  id SERIAL PRIMARY KEY,
  subject_name TEXT NOT NULL UNIQUE, -- Direct link to subject name (better than ID)
  english_script_writing TEXT,
  english_script_roleplay TEXT,
  french_script_writing TEXT,
  french_script_roleplay TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_scripts_subject_name ON lesson_scripts(subject_name);

-- Add comments
COMMENT ON TABLE lesson_scripts IS 'Scripts for lessons - one per subject/lesson';
COMMENT ON COLUMN lesson_scripts.subject_name IS 'Subject name - one script per subject';
COMMENT ON COLUMN lesson_scripts.english_script_writing IS 'English script content for writing exercises';
COMMENT ON COLUMN lesson_scripts.english_script_roleplay IS 'English script content for roleplay exercises';
COMMENT ON COLUMN lesson_scripts.french_script_writing IS 'French script content for writing exercises';
COMMENT ON COLUMN lesson_scripts.french_script_roleplay IS 'French script content for roleplay exercises';

-- Display the final table structures
SELECT 'Final subject_words table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
ORDER BY ordinal_position;

SELECT 'Final lesson_scripts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_scripts' 
ORDER BY ordinal_position;

