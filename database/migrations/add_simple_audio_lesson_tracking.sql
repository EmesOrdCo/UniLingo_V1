-- ============================================
-- Simple Audio Lesson Usage Tracking
-- ============================================
-- Just adds columns to existing tables for usage tracking
-- ============================================

-- ============================================
-- 1. Add Usage Counter to Users Table
-- ============================================

-- Add audio lesson usage counter to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS audio_lessons_used_this_month INTEGER NOT NULL DEFAULT 0;

-- Add constraint to ensure non-negative values
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS valid_audio_lessons_usage 
CHECK (audio_lessons_used_this_month >= 0);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_audio_lessons_usage 
ON users(audio_lessons_used_this_month);

-- ============================================
-- 2. Add Tracking Fields to Audio Lessons Table
-- ============================================

-- Add month tracking to audio_lessons table
ALTER TABLE audio_lessons 
ADD COLUMN IF NOT EXISTS created_month TEXT; -- Format: "2024-01"

-- Add index for month-based queries
CREATE INDEX IF NOT EXISTS idx_audio_lessons_created_month 
ON audio_lessons(created_month);

-- ============================================
-- 3. Helper Functions
-- ============================================

-- Function to check if user can create audio lesson
CREATE OR REPLACE FUNCTION can_create_audio_lesson(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  monthly_limit INTEGER := 5; -- Configurable limit
BEGIN
  -- Get current usage from users table
  SELECT audio_lessons_used_this_month 
  INTO current_usage
  FROM users 
  WHERE id = user_uuid;
  
  -- Return true if under limit
  RETURN COALESCE(current_usage, 0) < monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current usage
CREATE OR REPLACE FUNCTION get_user_audio_lesson_usage(user_uuid UUID)
RETURNS TABLE(
  current_usage INTEGER,
  monthly_limit INTEGER,
  remaining_lessons INTEGER,
  can_create BOOLEAN
) AS $$
DECLARE
  usage_count INTEGER;
  limit_count INTEGER := 5; -- Configurable limit
BEGIN
  -- Get current usage
  SELECT COALESCE(audio_lessons_used_this_month, 0)
  INTO usage_count
  FROM users 
  WHERE id = user_uuid;
  
  -- Return usage details
  RETURN QUERY SELECT 
    usage_count,
    limit_count,
    GREATEST(0, limit_count - usage_count),
    usage_count < limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage (called when lesson is created)
CREATE OR REPLACE FUNCTION increment_audio_lesson_usage(user_uuid UUID, lesson_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Increment counter in users table
  UPDATE users 
  SET audio_lessons_used_this_month = audio_lessons_used_this_month + 1
  WHERE id = user_uuid;
  
  -- Update the lesson's created_month if lesson_uuid provided
  IF lesson_uuid IS NOT NULL THEN
    UPDATE audio_lessons 
    SET created_month = current_month
    WHERE id = lesson_uuid;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement usage (called when lesson is deleted)
CREATE OR REPLACE FUNCTION decrement_audio_lesson_usage(user_uuid UUID, lesson_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  current_month TEXT;
  lesson_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get the lesson's created month if lesson_uuid provided
  IF lesson_uuid IS NOT NULL THEN
    SELECT created_month INTO lesson_month
    FROM audio_lessons 
    WHERE id = lesson_uuid;
  END IF;
  
  -- Only decrement if lesson was created this month
  IF lesson_month = current_month THEN
    UPDATE users 
    SET audio_lessons_used_this_month = GREATEST(0, audio_lessons_used_this_month - 1)
    WHERE id = user_uuid;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage (called when subscription renews)
CREATE OR REPLACE FUNCTION reset_audio_lesson_usage(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Reset counter in users table
  UPDATE users 
  SET audio_lessons_used_this_month = 0
  WHERE id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Triggers for Automatic Tracking
-- ============================================

-- Trigger function for audio lesson creation
CREATE OR REPLACE FUNCTION trg_audio_lesson_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment usage counter and set created_month
  PERFORM increment_audio_lesson_usage(NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for audio lesson deletion
CREATE OR REPLACE FUNCTION trg_audio_lesson_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement usage counter (only if created this month)
  PERFORM decrement_audio_lesson_usage(OLD.user_id, OLD.id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trg_audio_lesson_created ON audio_lessons;
CREATE TRIGGER trg_audio_lesson_created
  AFTER INSERT ON audio_lessons
  FOR EACH ROW
  EXECUTE FUNCTION trg_audio_lesson_created();

DROP TRIGGER IF EXISTS trg_audio_lesson_deleted ON audio_lessons;
CREATE TRIGGER trg_audio_lesson_deleted
  AFTER DELETE ON audio_lessons
  FOR EACH ROW
  EXECUTE FUNCTION trg_audio_lesson_deleted();

-- ============================================
-- 5. Comments and Documentation
-- ============================================

COMMENT ON COLUMN users.audio_lessons_used_this_month IS 'Simple counter for audio lessons used this month. Resets with subscription renewal.';
COMMENT ON COLUMN audio_lessons.created_month IS 'Month when lesson was created (YYYY-MM format) for usage tracking.';

-- ============================================
-- 6. Migration Complete
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Simple audio lesson usage tracking system installed successfully!';
  RAISE NOTICE '📊 Usage counter added to users table';
  RAISE NOTICE '📅 Month tracking added to audio_lessons table';
  RAISE NOTICE '🔧 Helper functions and triggers installed';
END $$;
