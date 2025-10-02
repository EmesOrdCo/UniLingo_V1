-- Add chat_content column to lesson_vocabulary table
-- This column will store the conversation script for personal lessons

ALTER TABLE lesson_vocabulary 
ADD COLUMN IF NOT EXISTS chat_content TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN lesson_vocabulary.chat_content IS 'JSON string containing conversation script for personal lessons';
