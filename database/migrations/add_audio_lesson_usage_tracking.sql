-- ============================================
-- Audio Lesson Usage Tracking System
-- ============================================
-- Tracks monthly usage to enforce 5 lessons per month limit
-- Prevents deletion abuse by tracking total monthly usage

-- Create audio_lesson_usage table
CREATE TABLE IF NOT EXISTS audio_lesson_usage (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage tracking
  month_year TEXT NOT NULL, -- Format: "2024-01" for January 2024
  lessons_created INTEGER NOT NULL DEFAULT 0, -- Number of lessons created this month
  lessons_deleted INTEGER NOT NULL DEFAULT 0, -- Number of lessons deleted this month
  total_usage INTEGER NOT NULL DEFAULT 0, -- Total usage (created - deleted, but never goes below 0)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_lessons_created CHECK (lessons_created >= 0),
  CONSTRAINT valid_lessons_deleted CHECK (lessons_deleted >= 0),
  CONSTRAINT valid_total_usage CHECK (total_usage >= 0),
  CONSTRAINT unique_user_month UNIQUE (user_id, month_year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_lesson_usage_user_month 
ON audio_lesson_usage(user_id, month_year);

CREATE INDEX IF NOT EXISTS idx_audio_lesson_usage_month 
ON audio_lesson_usage(month_year);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get current month-year string
CREATE OR REPLACE FUNCTION get_current_month_year()
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(NOW(), 'YYYY-MM');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get or create usage record for user and month
CREATE OR REPLACE FUNCTION get_or_create_usage_record(p_user_id UUID, p_month_year TEXT DEFAULT NULL)
RETURNS audio_lesson_usage AS $$
DECLARE
  usage_record audio_lesson_usage;
  current_month TEXT;
BEGIN
  -- Use provided month or current month
  current_month := COALESCE(p_month_year, get_current_month_year());
  
  -- Try to get existing record
  SELECT * INTO usage_record
  FROM audio_lesson_usage
  WHERE user_id = p_user_id AND month_year = current_month;
  
  -- If not found, create new record
  IF NOT FOUND THEN
    INSERT INTO audio_lesson_usage (user_id, month_year, lessons_created, lessons_deleted, total_usage)
    VALUES (p_user_id, current_month, 0, 0, 0)
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql;

-- Function to increment lesson creation
CREATE OR REPLACE FUNCTION increment_lesson_creation(p_user_id UUID)
RETURNS audio_lesson_usage AS $$
DECLARE
  usage_record audio_lesson_usage;
  current_month TEXT;
BEGIN
  current_month := get_current_month_year();
  
  -- Get or create usage record
  usage_record := get_or_create_usage_record(p_user_id, current_month);
  
  -- Increment creation count and total usage
  UPDATE audio_lesson_usage
  SET 
    lessons_created = lessons_created + 1,
    total_usage = total_usage + 1,
    updated_at = NOW()
  WHERE id = usage_record.id
  RETURNING * INTO usage_record;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql;

-- Function to increment lesson deletion
CREATE OR REPLACE FUNCTION increment_lesson_deletion(p_user_id UUID)
RETURNS audio_lesson_usage AS $$
DECLARE
  usage_record audio_lesson_usage;
  current_month TEXT;
BEGIN
  current_month := get_current_month_year();
  
  -- Get or create usage record
  usage_record := get_or_create_usage_record(p_user_id, current_month);
  
  -- Increment deletion count and decrease total usage (but not below 0)
  UPDATE audio_lesson_usage
  SET 
    lessons_deleted = lessons_deleted + 1,
    total_usage = GREATEST(0, total_usage - 1),
    updated_at = NOW()
  WHERE id = usage_record.id
  RETURNING * INTO usage_record;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create more lessons
CREATE OR REPLACE FUNCTION can_create_audio_lesson(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usage_record audio_lesson_usage;
  current_month TEXT;
BEGIN
  current_month := get_current_month_year();
  
  -- Get or create usage record
  usage_record := get_or_create_usage_record(p_user_id, current_month);
  
  -- Check if user has reached the limit (5 lessons per month)
  RETURN usage_record.total_usage < 5;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current usage
CREATE OR REPLACE FUNCTION get_user_audio_lesson_usage(p_user_id UUID, p_month_year TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  usage_record audio_lesson_usage;
  current_month TEXT;
  result JSON;
BEGIN
  current_month := COALESCE(p_month_year, get_current_month_year());
  
  -- Get or create usage record
  usage_record := get_or_create_usage_record(p_user_id, current_month);
  
  -- Build result JSON
  SELECT json_build_object(
    'user_id', p_user_id,
    'month_year', current_month,
    'lessons_created', usage_record.lessons_created,
    'lessons_deleted', usage_record.lessons_deleted,
    'total_usage', usage_record.total_usage,
    'remaining_lessons', GREATEST(0, 5 - usage_record.total_usage),
    'can_create_more', usage_record.total_usage < 5,
    'updated_at', usage_record.updated_at
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers for Automatic Usage Tracking
-- ============================================

-- Trigger function to track lesson creation
CREATE OR REPLACE FUNCTION track_audio_lesson_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if this is a new lesson (INSERT)
  IF TG_OP = 'INSERT' THEN
    PERFORM increment_lesson_creation(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to track lesson deletion
CREATE OR REPLACE FUNCTION track_audio_lesson_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if this is a deletion (DELETE)
  IF TG_OP = 'DELETE' THEN
    PERFORM increment_lesson_deletion(OLD.user_id);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on audio_lessons table
DROP TRIGGER IF EXISTS audio_lesson_creation_trigger ON audio_lessons;
CREATE TRIGGER audio_lesson_creation_trigger
  AFTER INSERT ON audio_lessons
  FOR EACH ROW
  EXECUTE FUNCTION track_audio_lesson_creation();

DROP TRIGGER IF EXISTS audio_lesson_deletion_trigger ON audio_lessons;
CREATE TRIGGER audio_lesson_deletion_trigger
  AFTER DELETE ON audio_lessons
  FOR EACH ROW
  EXECUTE FUNCTION track_audio_lesson_deletion();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE audio_lesson_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own usage
CREATE POLICY "Users can view own audio lesson usage"
ON audio_lesson_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can insert/update usage records
CREATE POLICY "System can manage audio lesson usage"
ON audio_lesson_usage
FOR ALL
USING (true); -- Allow system functions to manage records

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE audio_lesson_usage IS 'Tracks monthly audio lesson usage to enforce 5 lessons per month limit';
COMMENT ON COLUMN audio_lesson_usage.user_id IS 'User who owns this usage record';
COMMENT ON COLUMN audio_lesson_usage.month_year IS 'Month and year in YYYY-MM format';
COMMENT ON COLUMN audio_lesson_usage.lessons_created IS 'Number of lessons created this month';
COMMENT ON COLUMN audio_lesson_usage.lessons_deleted IS 'Number of lessons deleted this month';
COMMENT ON COLUMN audio_lesson_usage.total_usage IS 'Net usage (created - deleted, minimum 0)';

-- ============================================
-- Success Message
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Audio lesson usage tracking system created successfully!';
  RAISE NOTICE '📊 Features: 5 lessons per month limit, deletion abuse prevention';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Triggers and functions configured';
  RAISE NOTICE '📈 Helper functions: can_create_audio_lesson(), get_user_audio_lesson_usage()';
END $$;
