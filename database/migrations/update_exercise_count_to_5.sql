-- Update exercise count from 7 to 5 for general lessons
-- This is a subtle update to the existing migration

-- Step 1: Update the default value for total_exercises column
ALTER TABLE unit_progress 
ALTER COLUMN total_exercises SET DEFAULT 5;

-- Step 2: Update existing general lesson records that have 7 exercises to 5
UPDATE unit_progress 
SET total_exercises = 5 
WHERE lesson_type = 'general' AND total_exercises = 7;

-- Step 3: Update the comment to reflect the correct count
COMMENT ON COLUMN unit_progress.total_exercises IS 'Total number of exercises in the lesson (default 5 for general lessons)';

-- Step 4: Verify the changes
SELECT 
    'Updated records' as description,
    COUNT(*) as count
FROM unit_progress 
WHERE lesson_type = 'general' AND total_exercises = 5;

-- Step 5: Show current defaults
SELECT 
    column_name,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'unit_progress' 
  AND column_name = 'total_exercises';

-- Migration complete!
SELECT '✅ Exercise count updated to 5 for general lessons!' as status;
