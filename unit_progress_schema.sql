-- Unit Progress Tracking Schema
-- This file contains the SQL schema for comprehensive progress tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_activities table (referenced in code but missing from schema)
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'game', 'lesson', 'flashcard_review', 'daily_challenge', 'unit_exercise'
  activity_name VARCHAR(255) NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional fields for different activity types
  activity_data JSONB, -- Store specific data for each activity type
  unit_id INTEGER, -- For unit-related activities
  lesson_id VARCHAR(100), -- For lesson-related activities
  exercise_type VARCHAR(50) -- 'words', 'listen', 'write', etc.
);

-- Create unit_progress table to track unit completion
CREATE TABLE IF NOT EXISTS unit_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL,
  unit_title VARCHAR(255) NOT NULL,
  topic_group VARCHAR(100) NOT NULL,
  
  -- Progress tracking
  total_lessons INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  
  -- Scores and performance
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  
  -- Status and dates
  status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed', 'locked')) DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per unit
  UNIQUE(user_id, unit_id)
);

-- Create lesson_progress table to track individual lesson completion
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL,
  lesson_type VARCHAR(50) NOT NULL, -- 'words', 'listen', 'write', 'speak', 'roleplay'
  lesson_title VARCHAR(255) NOT NULL,
  
  -- Progress tracking
  total_exercises INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  
  -- Scores and performance
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Status and dates
  status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed', 'locked')) DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per lesson type per unit
  UNIQUE(user_id, unit_id, lesson_type)
);

-- Create exercise_progress table to track individual exercise completion
CREATE TABLE IF NOT EXISTS exercise_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL,
  lesson_type VARCHAR(50) NOT NULL,
  exercise_type VARCHAR(50) NOT NULL, -- 'flashcards', 'quiz', 'scramble', etc.
  
  -- Exercise details
  exercise_data JSONB, -- Store exercise-specific data
  vocabulary_items TEXT[], -- Array of vocabulary item IDs used
  
  -- Progress tracking
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Status and dates
  status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')) DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per exercise
  UNIQUE(user_id, unit_id, lesson_type, exercise_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_completed_at ON user_activities(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_unit_id ON user_activities(unit_id);

CREATE INDEX IF NOT EXISTS idx_unit_progress_user_id ON unit_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_unit_progress_unit_id ON unit_progress(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_progress_status ON unit_progress(status);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_unit_id ON lesson_progress(unit_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_type ON lesson_progress(lesson_type);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);

CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_id ON exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_unit_id ON exercise_progress(unit_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_lesson_type ON exercise_progress(lesson_type);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_status ON exercise_progress(status);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_user_activities_updated_at ON user_activities;
CREATE TRIGGER update_user_activities_updated_at
    BEFORE UPDATE ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unit_progress_updated_at ON unit_progress;
CREATE TRIGGER update_unit_progress_updated_at
    BEFORE UPDATE ON unit_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at
    BEFORE UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exercise_progress_updated_at ON exercise_progress;
CREATE TRIGGER update_exercise_progress_updated_at
    BEFORE UPDATE ON exercise_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON user_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own unit progress" ON unit_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unit progress" ON unit_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unit progress" ON unit_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lesson progress" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress" ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress" ON lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own exercise progress" ON exercise_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise progress" ON exercise_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise progress" ON exercise_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_activities TO anon, authenticated;
GRANT ALL ON unit_progress TO anon, authenticated;
GRANT ALL ON lesson_progress TO anon, authenticated;
GRANT ALL ON exercise_progress TO anon, authenticated;

-- Create functions for progress calculations
CREATE OR REPLACE FUNCTION calculate_unit_progress(user_uuid UUID, unit_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  unit_record RECORD;
  lesson_count INTEGER;
  completed_lessons INTEGER;
  exercise_count INTEGER;
  completed_exercises INTEGER;
BEGIN
  -- Get unit progress record
  SELECT * INTO unit_record FROM unit_progress 
  WHERE user_id = user_uuid AND unit_id = unit_id_param;
  
  -- Count total and completed lessons
  SELECT COUNT(*) INTO lesson_count FROM lesson_progress 
  WHERE user_id = user_uuid AND unit_id = unit_id_param;
  
  SELECT COUNT(*) INTO completed_lessons FROM lesson_progress 
  WHERE user_id = user_uuid AND unit_id = unit_id_param AND status = 'completed';
  
  -- Count total and completed exercises
  SELECT COUNT(*) INTO exercise_count FROM exercise_progress 
  WHERE user_id = user_uuid AND unit_id = unit_id_param;
  
  SELECT COUNT(*) INTO completed_exercises FROM exercise_progress 
  WHERE user_id = user_uuid AND unit_id = unit_id_param AND status = 'completed';
  
  -- Build result
  result := jsonb_build_object(
    'unit_id', unit_id_param,
    'total_lessons', lesson_count,
    'completed_lessons', completed_lessons,
    'total_exercises', exercise_count,
    'completed_exercises', completed_exercises,
    'progress_percentage', CASE 
      WHEN lesson_count > 0 THEN ROUND((completed_lessons::DECIMAL / lesson_count) * 100, 2)
      ELSE 0
    END,
    'unit_status', COALESCE(unit_record.status, 'not_started'),
    'unit_data', CASE 
      WHEN unit_record IS NOT NULL THEN to_jsonb(unit_record)
      ELSE NULL
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION calculate_unit_progress(UUID, INTEGER) TO anon, authenticated;

-- Insert initial unit data for Unit 1
INSERT INTO unit_progress (user_id, unit_id, unit_title, topic_group, status)
SELECT 
  u.id,
  1,
  'Basic Concepts',
  'Basic Concepts',
  'not_started'
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM unit_progress up 
  WHERE up.user_id = u.id AND up.unit_id = 1
);

-- Insert initial lesson data for Unit 1
INSERT INTO lesson_progress (user_id, unit_id, lesson_type, lesson_title, status)
SELECT 
  u.id,
  1,
  lesson_type,
  lesson_title,
  CASE WHEN lesson_type IN ('words', 'listen', 'write') THEN 'active' ELSE 'locked' END
FROM users u
CROSS JOIN (
  VALUES 
    ('words', 'Words'),
    ('listen', 'Listen'),
    ('write', 'Write'),
    ('speak', 'Speak'),
    ('roleplay', 'Roleplay')
) AS lessons(lesson_type, lesson_title)
WHERE NOT EXISTS (
  SELECT 1 FROM lesson_progress lp 
  WHERE lp.user_id = u.id AND lp.unit_id = 1 AND lp.lesson_type = lessons.lesson_type
);
