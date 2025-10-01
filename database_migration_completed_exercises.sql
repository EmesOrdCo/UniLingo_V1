-- Migration: Add completed_exercises tracking to lesson_progress
-- Date: 2025-10-01
-- Purpose: Enable linear progression in personal lessons

-- Add completed_exercises column to track which exercises are completed
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS completed_exercises TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN lesson_progress.completed_exercises IS 'Array of completed exercise names for linear progression tracking. Values: flashcards, flashcard-quiz, sentence-scramble, word-scramble, fill-in-blank, listen, speak';

-- Optional: Update existing records to have empty array
UPDATE lesson_progress 
SET completed_exercises = ARRAY[]::TEXT[]
WHERE completed_exercises IS NULL;

-- Verify the migration
SELECT 
  lesson_id, 
  user_id, 
  total_score, 
  exercises_completed,
  completed_exercises,
  status
FROM lesson_progress
LIMIT 5;

