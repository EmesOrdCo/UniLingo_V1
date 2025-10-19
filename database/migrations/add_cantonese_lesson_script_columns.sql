-- Add Cantonese lesson script column to lesson_scripts table
ALTER TABLE lesson_scripts
ADD COLUMN IF NOT EXISTS cantonese_lesson_script TEXT;
