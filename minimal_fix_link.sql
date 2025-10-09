-- Minimal fix: Change the link from subject_id to subject_name
-- This keeps the existing structure but fixes the relationship

-- Step 1: Check current structure
SELECT 'Current lesson_scripts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_scripts' 
ORDER BY ordinal_position;

-- Step 2: Drop the existing lesson_scripts table to recreate with correct link
DROP TABLE IF EXISTS lesson_scripts CASCADE;

-- Step 3: Recreate lesson_scripts table with subject_name linked to subject_words.subject
CREATE TABLE lesson_scripts (
  id SERIAL PRIMARY KEY,
  subject_name TEXT NOT NULL, -- This links to subject_words.subject
  english_script_writing TEXT,
  english_script_roleplay TEXT,
  french_script_writing TEXT,
  french_script_roleplay TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add constraint to ensure subject_name exists in subject_words
ALTER TABLE lesson_scripts 
ADD CONSTRAINT fk_lesson_scripts_subject 
FOREIGN KEY (subject_name) REFERENCES subject_words(subject);

-- Step 5: Add indexes for better performance
CREATE INDEX idx_lesson_scripts_subject_name ON lesson_scripts(subject_name);

-- Step 6: Add comments
COMMENT ON TABLE lesson_scripts IS 'Scripts for lessons - one per subject';
COMMENT ON COLUMN lesson_scripts.subject_name IS 'Links to subject_words.subject - one script per subject';

-- Step 7: Show the corrected structure
SELECT 'Final lesson_scripts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_scripts' 
ORDER BY ordinal_position;

-- Step 8: Show the relationship
SELECT 'Relationship: lesson_scripts.subject_name → subject_words.subject' as relationship_info;
