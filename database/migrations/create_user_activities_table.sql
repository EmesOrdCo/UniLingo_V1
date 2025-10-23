-- Create user_activities table for tracking user activities and progress
-- This table is used by multiple services for activity logging and progress tracking

CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson', 'flashcard', 'game', 'exercise', 'general_lesson', 'unit_exercise')),
  activity_id TEXT,
  activity_name TEXT,
  duration_seconds INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_completed_at ON user_activities(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_activity_type ON user_activities(user_id, activity_type);

-- Add comments for documentation
COMMENT ON TABLE user_activities IS 'Tracks all user activities for progress, streaks, and analytics';
COMMENT ON COLUMN user_activities.activity_type IS 'Type of activity: lesson, flashcard, game, exercise, etc.';
COMMENT ON COLUMN user_activities.activity_id IS 'Optional ID linking to specific lesson/exercise';
COMMENT ON COLUMN user_activities.activity_name IS 'Human-readable name of the activity';
COMMENT ON COLUMN user_activities.duration_seconds IS 'Time spent on the activity in seconds';
COMMENT ON COLUMN user_activities.score IS 'Score achieved in the activity';
COMMENT ON COLUMN user_activities.max_score IS 'Maximum possible score for the activity';
COMMENT ON COLUMN user_activities.accuracy_percentage IS 'Accuracy percentage (0.00 to 100.00)';
COMMENT ON COLUMN user_activities.completed_at IS 'When the activity was completed';

-- Enable Row Level Security (RLS)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON user_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON user_activities
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON user_activities TO authenticated;
GRANT ALL ON user_activities TO service_role;
