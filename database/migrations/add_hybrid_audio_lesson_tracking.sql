-- ============================================
-- Hybrid Audio Lesson Usage Tracking System
-- ============================================
-- This implements a hybrid approach:
-- 1. Simple counter in users table (resets with subscription)
-- 2. Optional detailed tracking table for analytics
-- ============================================

-- ============================================
-- 1. Add Simple Counter to Users Table
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
-- 2. Optional Detailed Tracking Table
-- ============================================

-- Create detailed usage tracking table (optional, for analytics)
CREATE TABLE IF NOT EXISTS audio_lesson_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL CHECK (action IN ('created', 'deleted')),
  lesson_id UUID, -- Reference to the audio lesson (if available)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional context
  month_year TEXT NOT NULL, -- Format: "2024-01"
  subscription_reset_date DATE, -- When this user's subscription resets
  
  -- Constraints
  CONSTRAINT valid_action CHECK (action IN ('created', 'deleted'))
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_audio_usage_log_user_month 
ON audio_lesson_usage_log(user_id, month_year);

CREATE INDEX IF NOT EXISTS idx_audio_usage_log_action 
ON audio_lesson_usage_log(action);

CREATE INDEX IF NOT EXISTS idx_audio_usage_log_created_at 
ON audio_lesson_usage_log(created_at);

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
  
  -- Log detailed action (optional)
  INSERT INTO audio_lesson_usage_log (user_id, action, lesson_id, month_year)
  VALUES (user_uuid, 'created', lesson_uuid, current_month);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement usage (called when lesson is deleted)
CREATE OR REPLACE FUNCTION decrement_audio_lesson_usage(user_uuid UUID, lesson_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Decrement counter in users table (but never go below 0)
  UPDATE users 
  SET audio_lessons_used_this_month = GREATEST(0, audio_lessons_used_this_month - 1)
  WHERE id = user_uuid;
  
  -- Log detailed action (optional)
  INSERT INTO audio_lesson_usage_log (user_id, action, lesson_id, month_year)
  VALUES (user_uuid, 'deleted', lesson_uuid, current_month);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage (called when subscription renews)
CREATE OR REPLACE FUNCTION reset_audio_lesson_usage(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Reset counter in users table
  UPDATE users 
  SET audio_lessons_used_this_month = 0
  WHERE id = user_uuid;
  
  -- Log reset action
  INSERT INTO audio_lesson_usage_log (user_id, action, lesson_id, month_year)
  VALUES (user_uuid, 'reset', NULL, current_month);
  
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
  -- Increment usage counter
  PERFORM increment_audio_lesson_usage(NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for audio lesson deletion
CREATE OR REPLACE FUNCTION trg_audio_lesson_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement usage counter
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
-- 5. Row Level Security (RLS)
-- ============================================

-- Enable RLS on the log table
ALTER TABLE audio_lesson_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage logs
CREATE POLICY "Users can view their own usage logs"
ON audio_lesson_usage_log
FOR SELECT
USING (auth.uid() = user_id);

-- Users cannot insert/update/delete their own logs (system managed)
CREATE POLICY "System managed usage logs"
ON audio_lesson_usage_log
FOR ALL
USING (FALSE); -- Only system functions can modify

-- ============================================
-- 6. Analytics Functions (Optional)
-- ============================================

-- Function to get usage statistics for a month
CREATE OR REPLACE FUNCTION get_audio_lesson_usage_stats(target_month TEXT DEFAULT NULL)
RETURNS TABLE(
  month_year TEXT,
  total_users INTEGER,
  total_lessons_created INTEGER,
  total_lessons_deleted INTEGER,
  users_at_limit INTEGER,
  average_usage DECIMAL
) AS $$
DECLARE
  query_month TEXT;
BEGIN
  query_month := COALESCE(target_month, TO_CHAR(NOW(), 'YYYY-MM'));
  
  RETURN QUERY
  SELECT 
    query_month,
    COUNT(DISTINCT user_id)::INTEGER as total_users,
    COUNT(CASE WHEN action = 'created' THEN 1 END)::INTEGER as total_lessons_created,
    COUNT(CASE WHEN action = 'deleted' THEN 1 END)::INTEGER as total_lessons_deleted,
    COUNT(DISTINCT CASE WHEN action = 'created' THEN user_id END)::INTEGER as users_at_limit,
    ROUND(AVG(CASE WHEN action = 'created' THEN 1.0 ELSE 0.0 END), 2) as average_usage
  FROM audio_lesson_usage_log
  WHERE month_year = query_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's usage history
CREATE OR REPLACE FUNCTION get_user_usage_history(user_uuid UUID, months_back INTEGER DEFAULT 6)
RETURNS TABLE(
  month_year TEXT,
  lessons_created INTEGER,
  lessons_deleted INTEGER,
  net_usage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.month_year,
    COUNT(CASE WHEN ul.action = 'created' THEN 1 END)::INTEGER as lessons_created,
    COUNT(CASE WHEN ul.action = 'deleted' THEN 1 END)::INTEGER as lessons_deleted,
    (COUNT(CASE WHEN ul.action = 'created' THEN 1 END) - 
     COUNT(CASE WHEN ul.action = 'deleted' THEN 1 END))::INTEGER as net_usage
  FROM audio_lesson_usage_log ul
  WHERE ul.user_id = user_uuid
    AND ul.created_at >= NOW() - INTERVAL '1 month' * months_back
  GROUP BY ul.month_year
  ORDER BY ul.month_year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Comments and Documentation
-- ============================================

COMMENT ON COLUMN users.audio_lessons_used_this_month IS 'Simple counter for audio lessons used this month. Resets with subscription renewal.';
COMMENT ON TABLE audio_lesson_usage_log IS 'Detailed log of audio lesson usage for analytics and monitoring. Optional detailed tracking.';
COMMENT ON FUNCTION can_create_audio_lesson(UUID) IS 'Checks if user can create another audio lesson this month.';
COMMENT ON FUNCTION get_user_audio_lesson_usage(UUID) IS 'Returns current usage statistics for a user.';
COMMENT ON FUNCTION increment_audio_lesson_usage(UUID, UUID) IS 'Increments usage counter and logs creation.';
COMMENT ON FUNCTION decrement_audio_lesson_usage(UUID, UUID) IS 'Decrements usage counter and logs deletion.';
COMMENT ON FUNCTION reset_audio_lesson_usage(UUID) IS 'Resets usage counter (call on subscription renewal).';

-- ============================================
-- 8. Migration Complete
-- ============================================

-- Log successful migration
INSERT INTO audio_lesson_usage_log (user_id, action, lesson_id, month_year)
VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID, -- System user
  'migration',
  NULL,
  TO_CHAR(NOW(), 'YYYY-MM')
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Hybrid audio lesson usage tracking system installed successfully!';
  RAISE NOTICE '📊 Simple counter added to users table';
  RAISE NOTICE '📈 Optional detailed tracking table created';
  RAISE NOTICE '🔧 Helper functions and triggers installed';
  RAISE NOTICE '🛡️ Row Level Security enabled';
END $$;
