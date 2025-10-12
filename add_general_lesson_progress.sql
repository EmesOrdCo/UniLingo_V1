-- Add General Lesson Progress Tracking
-- This migration extends the unit_progress table to support both CEFR units and general subject lessons

-- Step 1: Add new columns to unit_progress table
ALTER TABLE unit_progress 
ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(20) DEFAULT 'cefr',
ADD COLUMN IF NOT EXISTS subject_name TEXT,
ADD COLUMN IF NOT EXISTS exercises_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_exercises INTEGER DEFAULT 5;

-- Step 2: Add comments to describe the new columns
COMMENT ON COLUMN unit_progress.lesson_type IS 'Type of lesson: ''cefr'' for CEFR units, ''general'' for subject-based lessons';
COMMENT ON COLUMN unit_progress.subject_name IS 'Subject name for general lessons (e.g., ''After the Accident'')';
COMMENT ON COLUMN unit_progress.exercises_completed IS 'Number of exercises completed in the lesson';
COMMENT ON COLUMN unit_progress.total_exercises IS 'Total number of exercises in the lesson (default 5 for general lessons)';

-- Step 3: Update existing records to have lesson_type = 'cefr'
UPDATE unit_progress 
SET lesson_type = 'cefr' 
WHERE lesson_type IS NULL OR lesson_type = '';

-- Step 4: Create index for faster queries on general lessons
CREATE INDEX IF NOT EXISTS idx_unit_progress_lesson_type ON unit_progress(lesson_type);
CREATE INDEX IF NOT EXISTS idx_unit_progress_subject_name ON unit_progress(subject_name) WHERE subject_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unit_progress_user_subject ON unit_progress(user_id, subject_name, cefr_level) WHERE lesson_type = 'general';

-- Step 5: Update the unique constraint to handle both lesson types
-- Drop the old constraint if it exists
ALTER TABLE unit_progress DROP CONSTRAINT IF EXISTS unit_progress_user_unit_unique;
ALTER TABLE unit_progress DROP CONSTRAINT IF EXISTS unique_user_cefr_unit;

-- Add new composite unique constraint
-- For CEFR lessons: unique on (user_id, cefr_level, unit_number)
-- For general lessons: unique on (user_id, subject_name, cefr_level)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unit_progress_cefr_unique 
ON unit_progress(user_id, cefr_level, unit_number) 
WHERE lesson_type = 'cefr';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unit_progress_general_unique 
ON unit_progress(user_id, subject_name, cefr_level) 
WHERE lesson_type = 'general' AND subject_name IS NOT NULL;

-- Step 6: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'unit_progress' 
  AND column_name IN ('lesson_type', 'subject_name', 'exercises_completed', 'total_exercises')
ORDER BY ordinal_position;

-- Step 7: Show sample data structure
SELECT 
    'Sample CEFR lesson progress' as description,
    user_id,
    lesson_type,
    cefr_level,
    unit_number,
    unit_code,
    subject_name,
    lessons_completed,
    status
FROM unit_progress 
WHERE lesson_type = 'cefr'
LIMIT 3;

-- Step 8: Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'unit_progress' 
  AND indexname LIKE '%lesson_type%' OR indexname LIKE '%subject_name%'
ORDER BY indexname;

-- Migration complete!
SELECT '✅ Migration complete! General lesson progress tracking is now enabled.' as status;

