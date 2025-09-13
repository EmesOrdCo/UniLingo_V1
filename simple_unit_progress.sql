-- Simple Unit Progress Tracking
-- Just one table to track user progress on units

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create unit_progress table
CREATE TABLE IF NOT EXISTS unit_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL,
  unit_title VARCHAR(255) NOT NULL,
  
  -- Simple progress tracking
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 5, -- Words, Listen, Write, Speak, Roleplay
  
  -- Status
  status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One record per user per unit
  UNIQUE(user_id, unit_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_unit_progress_user_id ON unit_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_unit_progress_unit_id ON unit_progress(unit_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_unit_progress_updated_at ON unit_progress;
CREATE TRIGGER update_unit_progress_updated_at
    BEFORE UPDATE ON unit_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE unit_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own unit progress" ON unit_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unit progress" ON unit_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unit progress" ON unit_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON unit_progress TO anon, authenticated;

-- Insert initial data for Unit 1
INSERT INTO unit_progress (user_id, unit_id, unit_title, status)
SELECT 
  u.id,
  1,
  'Basic Concepts',
  'not_started'
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM unit_progress up 
  WHERE up.user_id = u.id AND up.unit_id = 1
);
