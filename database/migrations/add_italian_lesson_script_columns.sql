-- Add Italian lesson script column to lesson_scripts table
ALTER TABLE lesson_scripts
ADD COLUMN IF NOT EXISTS italian_lesson_script TEXT;
