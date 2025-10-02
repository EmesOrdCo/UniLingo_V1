-- Add chat_content column to esp_lessons table
-- This column will store the conversation script for personal lessons

ALTER TABLE esp_lessons 
ADD COLUMN IF NOT EXISTS chat_content TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN esp_lessons.chat_content IS 'JSON string containing conversation script for personal lessons';
