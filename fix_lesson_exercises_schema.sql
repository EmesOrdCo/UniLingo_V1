-- Fix lesson_exercises table schema to match improved lesson service
-- This script updates the existing table to support the new structured exercise format

-- First, let's check the current table structure
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'lesson_exercises' ORDER BY ordinal_position;

-- Add missing columns to lesson_exercises table
ALTER TABLE lesson_exercises 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;

-- Rename the 'content' column to 'exercise_data' to match the interface
-- Note: We'll create a new column and migrate data, then drop the old one
ALTER TABLE lesson_exercises 
ADD COLUMN IF NOT EXISTS exercise_data JSONB;

-- Update existing records to copy data from 'content' to 'exercise_data'
UPDATE lesson_exercises 
SET exercise_data = content 
WHERE exercise_data IS NULL AND content IS NOT NULL;

-- Now we can safely drop the old 'content' column
-- (Uncomment the line below after confirming the data migration worked)
-- ALTER TABLE lesson_exercises DROP COLUMN IF EXISTS content;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_order ON lesson_exercises(order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_points ON lesson_exercises(points);

-- Verify the updated table structure
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'lesson_exercises' ORDER BY ordinal_position;

-- The table should now have these columns:
-- id (UUID, PRIMARY KEY)
-- lesson_id (UUID, REFERENCES esp_lessons)
-- exercise_type (VARCHAR)
-- exercise_data (JSONB) - renamed from 'content'
-- order_index (INTEGER) - newly added
-- points (INTEGER) - newly added
-- created_at (TIMESTAMP)
