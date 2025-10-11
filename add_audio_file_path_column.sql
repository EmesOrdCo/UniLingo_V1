-- ============================================
-- Add audio_file_path column to audio_lessons table
-- ============================================
-- This migration adds the audio_file_path column for Supabase Storage integration

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'audio_lessons' 
        AND column_name = 'audio_file_path'
    ) THEN
        ALTER TABLE audio_lessons 
        ADD COLUMN audio_file_path TEXT;
        
        RAISE NOTICE 'Column audio_file_path added successfully';
    ELSE
        RAISE NOTICE 'Column audio_file_path already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audio_lessons'
ORDER BY ordinal_position;

