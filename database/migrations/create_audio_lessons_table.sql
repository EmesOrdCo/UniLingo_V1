-- ============================================
-- Simple Audio Lessons Table
-- ============================================
-- Standalone table for PDF → Audio conversion
-- No complex relationships, just simple audio lessons

-- Drop table if exists (for clean re-creation)
DROP TABLE IF EXISTS audio_lessons CASCADE;

-- Create audio_lessons table
CREATE TABLE audio_lessons (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  script_text TEXT NOT NULL, -- The text that was converted to audio
  
  -- Audio file details
  audio_url TEXT NOT NULL, -- Supabase Storage URL to play the audio
  audio_file_path TEXT, -- Supabase Storage path for deletion (optional)
  audio_duration INTEGER NOT NULL, -- Duration in seconds
  
  -- User listening progress
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_played_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage tracking
  play_count INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (audio_duration >= 0),
  CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed')),
  CONSTRAINT valid_play_count CHECK (play_count >= 0)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Main index: Get user's audio lessons ordered by creation
CREATE INDEX idx_audio_lessons_user_created 
ON audio_lessons(user_id, created_at DESC);

-- Filter by status (e.g., show only incomplete lessons)
CREATE INDEX idx_audio_lessons_user_status 
ON audio_lessons(user_id, status);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE audio_lessons ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audio lessons
CREATE POLICY "Users can view own audio lessons"
ON audio_lessons
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own audio lessons
CREATE POLICY "Users can create own audio lessons"
ON audio_lessons
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own audio lessons
CREATE POLICY "Users can update own audio lessons"
ON audio_lessons
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own audio lessons
CREATE POLICY "Users can delete own audio lessons"
ON audio_lessons
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Triggers
-- ============================================

-- Trigger: Auto-update status to 'in_progress' when played
CREATE OR REPLACE FUNCTION update_audio_status_on_play()
RETURNS TRIGGER AS $$
BEGIN
  -- If last_played_at changes and status is not_started, change to in_progress
  IF NEW.last_played_at IS DISTINCT FROM OLD.last_played_at 
     AND OLD.status = 'not_started' THEN
    NEW.status = 'in_progress';
  END IF;
  
  -- Auto-increment play_count when last_played_at changes
  IF NEW.last_played_at IS DISTINCT FROM OLD.last_played_at THEN
    NEW.play_count = COALESCE(OLD.play_count, 0) + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audio_status_on_play_trigger
  BEFORE UPDATE ON audio_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_status_on_play();

-- ============================================
-- Helper Functions
-- ============================================

-- Function: Get user's audio lesson statistics
CREATE OR REPLACE FUNCTION get_audio_lesson_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_lessons', COUNT(*),
    'not_started', COUNT(*) FILTER (WHERE status = 'not_started'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_duration_seconds', COALESCE(SUM(audio_duration), 0),
    'total_plays', COALESCE(SUM(play_count), 0)
  )
  INTO result
  FROM audio_lessons
  WHERE user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE audio_lessons IS 'Simple standalone table for PDF-to-audio lessons';
COMMENT ON COLUMN audio_lessons.id IS 'Unique identifier for this audio lesson';
COMMENT ON COLUMN audio_lessons.user_id IS 'User who owns this audio lesson';
COMMENT ON COLUMN audio_lessons.title IS 'User-provided or auto-generated title';
COMMENT ON COLUMN audio_lessons.script_text IS 'The text that was converted to speech';
COMMENT ON COLUMN audio_lessons.audio_url IS 'Public S3 URL to stream the audio';
COMMENT ON COLUMN audio_lessons.audio_s3_key IS 'S3 object key for file management';
COMMENT ON COLUMN audio_lessons.audio_duration IS 'Audio length in seconds';
COMMENT ON COLUMN audio_lessons.status IS 'User listening progress: not_started, in_progress, completed';
COMMENT ON COLUMN audio_lessons.created_at IS 'When the audio lesson was created';
COMMENT ON COLUMN audio_lessons.last_played_at IS 'Last time user played this audio';
COMMENT ON COLUMN audio_lessons.play_count IS 'Number of times user has played this audio';

-- ============================================
-- Sample Queries (for reference)
-- ============================================

/*
-- Get all audio lessons for a user
SELECT id, title, audio_duration, status, play_count
FROM audio_lessons
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;

-- Get only incomplete lessons
SELECT id, title, status
FROM audio_lessons
WHERE user_id = 'user-uuid-here'
  AND status IN ('not_started', 'in_progress')
ORDER BY created_at DESC;

-- Get user statistics
SELECT get_audio_lesson_stats('user-uuid-here');

-- Mark audio as completed
UPDATE audio_lessons
SET status = 'completed'
WHERE id = 'lesson-uuid-here'
  AND user_id = 'user-uuid-here';

-- Track playback
UPDATE audio_lessons
SET last_played_at = NOW()
WHERE id = 'lesson-uuid-here'
  AND user_id = 'user-uuid-here';
-- Note: play_count will auto-increment via trigger

-- Delete audio lesson
DELETE FROM audio_lessons
WHERE id = 'lesson-uuid-here'
  AND user_id = 'user-uuid-here';
*/

-- ============================================
-- Success Message
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Simple audio_lessons table created successfully!';
  RAISE NOTICE '📊 Columns: id, user_id, title, script_text, audio_url, audio_duration, status';
  RAISE NOTICE '🎯 Status values: not_started, in_progress, completed';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Indexes and triggers configured';
  RAISE NOTICE '📈 Helper function: get_audio_lesson_stats(user_id)';
END $$;
