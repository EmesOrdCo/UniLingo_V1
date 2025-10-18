-- Add Chinese Traditional lesson script column to lesson_scripts table
ALTER TABLE lesson_scripts 
ADD COLUMN IF NOT EXISTS "chinese(traditional)_lesson_script" TEXT;
