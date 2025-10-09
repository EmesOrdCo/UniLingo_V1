-- Corrected script structure: One script per subject, not per word
-- This fixes the relationship issue where scripts were incorrectly linked to individual words

-- Step 1: Check current structure
SELECT 'Current subject_words table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
ORDER BY ordinal_position;

-- Step 2: Remove any existing script columns from subject_words (if they exist)
DO $$
BEGIN
    -- Check and drop script columns if they exist
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

-- Step 3: Drop and recreate lesson_scripts table with correct structure
-- First, drop the existing table if it has the wrong structure
DROP TABLE IF EXISTS lesson_scripts CASCADE;

-- Create the corrected lesson_scripts table
CREATE TABLE lesson_scripts (
  id SERIAL PRIMARY KEY,
  subject_name TEXT NOT NULL UNIQUE, -- One script per subject
  english_script_writing TEXT,
  english_script_roleplay TEXT,
  french_script_writing TEXT,
  french_script_roleplay TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_lesson_scripts_subject_name ON lesson_scripts(subject_name);

-- Add comments to clarify the relationship
COMMENT ON TABLE lesson_scripts IS 'Scripts for lessons - ONE script per subject/topic';
COMMENT ON COLUMN lesson_scripts.subject_name IS 'Subject name - one script per subject, not per word';
COMMENT ON COLUMN lesson_scripts.english_script_writing IS 'English script content for writing exercises';
COMMENT ON COLUMN lesson_scripts.english_script_roleplay IS 'English script content for roleplay exercises';
COMMENT ON COLUMN lesson_scripts.french_script_writing IS 'French script content for writing exercises';
COMMENT ON COLUMN lesson_scripts.french_script_roleplay IS 'French script content for roleplay exercises';

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lesson_scripts_updated_at 
    BEFORE UPDATE ON lesson_scripts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Verify the final structure
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

-- Step 5: Show the relationship
SELECT 'Relationship Explanation:' as info;
SELECT 
    'subject_words: Multiple words/phrases per subject' as table_info,
    'lesson_scripts: ONE script per subject' as relationship_info;

-- Example: Show how to get all words for a subject and its script
SELECT 'Example query to get subject words and script:' as info;
SELECT '
SELECT 
    sw.word_phrase,
    sw.french_keyword,
    ls.english_script_writing,
    ls.french_script_writing
FROM subject_words sw
LEFT JOIN lesson_scripts ls ON sw.subject = ls.subject_name
WHERE sw.subject = ''your_subject_name'';
' as example_query;
