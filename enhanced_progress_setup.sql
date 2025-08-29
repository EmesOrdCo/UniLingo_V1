-- ============================================================================
-- ENHANCED PROGRESS TRACKING SETUP
-- This file adds advanced progress analytics without modifying existing functionality
-- ============================================================================

-- Enhance existing lesson_progress table with additional analytics columns
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS learning_objectives_met INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_learning_objectives INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_rating INTEGER DEFAULT 0 CHECK (confidence_rating >= 0 AND confidence_rating <= 5),
ADD COLUMN IF NOT EXISTS difficulty_perceived INTEGER DEFAULT 0 CHECK (difficulty_perceived >= 0 AND difficulty_perceived <= 5),
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
ADD COLUMN IF NOT EXISTS preferred_learning_style VARCHAR(50) DEFAULT 'adaptive' CHECK (preferred_learning_style IN ('visual', 'auditory', 'kinesthetic', 'adaptive')),
ADD COLUMN IF NOT EXISTS study_environment VARCHAR(50) DEFAULT 'standard' CHECK (study_environment IN ('quiet', 'background_noise', 'music', 'standard')),
ADD COLUMN IF NOT EXISTS energy_level INTEGER DEFAULT 0 CHECK (energy_level >= 0 AND energy_level <= 5),
ADD COLUMN IF NOT EXISTS stress_level INTEGER DEFAULT 0 CHECK (stress_level >= 0 AND stress_level <= 5),
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Create exercise performance tracking table
CREATE TABLE IF NOT EXISTS exercise_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    progress_id UUID REFERENCES lesson_progress(id) ON DELETE CASCADE,
    exercise_index INTEGER NOT NULL,
    exercise_type VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    max_score INTEGER NOT NULL CHECK (max_score > 0),
    time_spent_seconds INTEGER NOT NULL CHECK (time_spent_seconds >= 0),
    attempts INTEGER DEFAULT 1 CHECK (attempts >= 1),
    first_attempt_correct BOOLEAN DEFAULT false,
    hints_used INTEGER DEFAULT 0 CHECK (hints_used >= 0),
    difficulty_rating INTEGER DEFAULT 0 CHECK (difficulty_rating >= 0 AND difficulty_rating <= 5),
    user_feedback TEXT, -- User can rate exercise difficulty
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vocabulary mastery tracking table
CREATE TABLE IF NOT EXISTS vocabulary_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    progress_id UUID REFERENCES lesson_progress(id) ON DELETE CASCADE,
    vocabulary_term_id UUID REFERENCES lesson_vocabulary(id) ON DELETE CASCADE,
    correct_attempts INTEGER DEFAULT 0 CHECK (correct_attempts >= 0),
    incorrect_attempts INTEGER DEFAULT 0 CHECK (incorrect_attempts >= 0),
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
    difficulty_rating INTEGER DEFAULT 0 CHECK (difficulty_rating >= 0 AND difficulty_rating <= 5),
    retention_score DECIMAL(5,2) DEFAULT 0.00 CHECK (retention_score >= 0.00 AND retention_score <= 100.00),
    notes TEXT, -- User can add personal notes about terms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning sessions analysis table
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    progress_id UUID REFERENCES lesson_progress(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    session_duration_seconds INTEGER CHECK (session_duration_seconds >= 0),
    exercises_completed INTEGER DEFAULT 0 CHECK (exercises_completed >= 0),
    breaks_taken INTEGER DEFAULT 0 CHECK (breaks_taken >= 0),
    focus_score INTEGER DEFAULT 0 CHECK (focus_score >= 0 AND focus_score <= 100),
    device_type VARCHAR(50) DEFAULT 'mobile' CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    time_of_day INTEGER CHECK (time_of_day >= 0 AND time_of_day <= 23),
    study_conditions VARCHAR(100), -- User can describe study environment
    mood_rating INTEGER DEFAULT 0 CHECK (mood_rating >= 0 AND mood_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skill metrics tracking table
CREATE TABLE IF NOT EXISTS skill_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_type VARCHAR(100) NOT NULL CHECK (skill_type IN ('reading', 'writing', 'listening', 'speaking', 'vocabulary', 'grammar', 'comprehension')),
    subject_area VARCHAR(100) NOT NULL,
    proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 10),
    total_practice_time INTEGER DEFAULT 0 CHECK (total_practice_time >= 0), -- in seconds
    lessons_completed INTEGER DEFAULT 0 CHECK (lessons_completed >= 0),
    average_score DECIMAL(5,2) DEFAULT 0.00 CHECK (average_score >= 0.00 AND average_score <= 100.00),
    improvement_rate DECIMAL(5,2) DEFAULT 0.00, -- Score improvement per week
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one skill metric per user per skill per subject
    UNIQUE(user_id, skill_type, subject_area)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_performance_progress_id ON exercise_performance(progress_id);
CREATE INDEX IF NOT EXISTS idx_exercise_performance_type ON exercise_performance(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercise_performance_created_at ON exercise_performance(created_at);

CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_progress_id ON vocabulary_progress(progress_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_term_id ON vocabulary_progress(vocabulary_term_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_mastery ON vocabulary_progress(mastery_level);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_progress_id ON learning_sessions(progress_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_time ON learning_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_device ON learning_sessions(device_type);

CREATE INDEX IF NOT EXISTS idx_skill_metrics_user_id ON skill_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_metrics_skill_subject ON skill_metrics(skill_type, subject_area);
CREATE INDEX IF NOT EXISTS idx_skill_metrics_proficiency ON skill_metrics(proficiency_level);

-- Enable RLS on new tables
ALTER TABLE exercise_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_performance
CREATE POLICY "Users can view own exercise performance" ON exercise_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lesson_progress 
            WHERE lesson_progress.id = exercise_performance.progress_id 
            AND lesson_progress.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own exercise performance" ON exercise_performance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lesson_progress 
            WHERE lesson_progress.id = exercise_performance.progress_id 
            AND lesson_progress.user_id = auth.uid()
        )
    );

-- RLS policies for vocabulary_progress
CREATE POLICY "Users can view own vocabulary progress" ON vocabulary_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lesson_progress 
            WHERE lesson_progress.id = vocabulary_progress.progress_id 
            AND lesson_progress.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own vocabulary progress" ON vocabulary_progress
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lesson_progress 
            WHERE lesson_progress.id = vocabulary_progress.progress_id 
            AND lesson_progress.user_id = auth.uid()
        )
    );

-- RLS policies for learning_sessions
CREATE POLICY "Users can view own learning sessions" ON learning_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lesson_progress 
            WHERE lesson_progress.id = learning_sessions.progress_id 
            AND lesson_progress.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own learning sessions" ON learning_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lesson_progress 
            WHERE lesson_progress.id = learning_sessions.progress_id 
            AND lesson_progress.user_id = auth.uid()
        )
    );

-- RLS policies for skill_metrics
CREATE POLICY "Users can view own skill metrics" ON skill_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill metrics" ON skill_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill metrics" ON skill_metrics
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for vocabulary_progress updated_at
CREATE TRIGGER update_vocabulary_progress_updated_at 
    BEFORE UPDATE ON vocabulary_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for skill_metrics updated_at
CREATE TRIGGER update_skill_metrics_updated_at 
    BEFORE UPDATE ON skill_metrics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE exercise_performance IS 'Tracks detailed performance metrics for each exercise attempt';
COMMENT ON TABLE vocabulary_progress IS 'Tracks vocabulary mastery and retention over time';
COMMENT ON TABLE learning_sessions IS 'Analyzes learning patterns and study session effectiveness';
COMMENT ON TABLE skill_metrics IS 'Tracks cross-lesson skill development and proficiency levels';

-- ============================================================================
-- ENHANCED PROGRESS TRACKING SETUP COMPLETE
-- ============================================================================
-- 
-- This setup adds comprehensive progress analytics while preserving all existing functionality.
-- New features include:
-- - Exercise-level performance tracking
-- - Vocabulary mastery analysis
-- - Learning pattern insights
-- - Skill development metrics
-- - Enhanced user feedback collection
--
-- All existing data and relationships remain intact.
-- ============================================================================

