-- =====================================================
-- HOLISTIC PROGRESS TRACKING SYSTEM
-- =====================================================

-- User Activity Tracking Table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'lesson', 'flashcard', 'game', 'exercise'
    activity_id UUID, -- ID of the specific lesson/flashcard/game
    activity_name VARCHAR(255), -- Human-readable name
    duration_seconds INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Study Sessions Table
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'lesson', 'flashcard', 'game', 'mixed'
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration_seconds INTEGER DEFAULT 0,
    activities_completed INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0,
    study_environment VARCHAR(100),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    focus_level INTEGER CHECK (focus_level >= 1 AND focus_level <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Streaks Table
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL, -- 'daily_study', 'weekly_lessons', 'monthly_goals'
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    start_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Daily Goals Table
CREATE TABLE IF NOT EXISTS user_daily_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'study_time', 'lessons_completed', 'flashcards_reviewed', 'games_played'
    target_value INTEGER NOT NULL, -- minutes, count, etc.
    current_value INTEGER DEFAULT 0,
    goal_date DATE DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Progress Summary Table (Daily Aggregates)
CREATE TABLE IF NOT EXISTS user_progress_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    summary_date DATE DEFAULT CURRENT_DATE,
    total_study_time_minutes INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    flashcards_reviewed INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0,
    streak_maintained BOOLEAN DEFAULT FALSE,
    goals_achieved INTEGER DEFAULT 0,
    total_goals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Learning Statistics Table
CREATE TABLE IF NOT EXISTS user_learning_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_study_time_hours DECIMAL(8,2) DEFAULT 0,
    total_lessons_completed INTEGER DEFAULT 0,
    total_flashcards_reviewed INTEGER DEFAULT 0,
    total_games_played INTEGER DEFAULT 0,
    total_score_earned INTEGER DEFAULT 0,
    average_lesson_accuracy DECIMAL(5,2) DEFAULT 0,
    favorite_subject VARCHAR(100),
    best_performance_date DATE,
    current_level VARCHAR(50) DEFAULT 'Beginner',
    experience_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievement Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- 'streak', 'accuracy', 'time', 'completion'
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    achievement_data JSONB, -- Store additional achievement details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_completed_at ON user_activities(completed_at);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_streak_type ON user_streaks(streak_type);

CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_goal_date ON user_daily_goals(goal_date);

CREATE INDEX IF NOT EXISTS idx_user_progress_summary_user_id ON user_progress_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_summary_summary_date ON user_progress_summary(summary_date);

CREATE INDEX IF NOT EXISTS idx_user_learning_stats_user_id ON user_learning_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_type ON user_achievements(achievement_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- User can only see their own data
CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON user_activities
    FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view own study sessions" ON study_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON study_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily goals" ON user_daily_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily goals" ON user_daily_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily goals" ON user_daily_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress summary" ON user_progress_summary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress summary" ON user_progress_summary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress summary" ON user_progress_summary
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning stats" ON user_learning_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning stats" ON user_learning_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning stats" ON user_learning_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update user learning stats when activities are added
CREATE OR REPLACE FUNCTION update_user_learning_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_learning_stats (user_id, total_lessons_completed, total_flashcards_reviewed, total_games_played, total_score_earned)
    VALUES (NEW.user_id, 
            CASE WHEN NEW.activity_type = 'lesson' THEN 1 ELSE 0 END,
            CASE WHEN NEW.activity_type = 'flashcard' THEN 1 ELSE 0 END,
            CASE WHEN NEW.activity_type = 'game' THEN 1 ELSE 0 END,
            NEW.score)
    ON CONFLICT (user_id) DO UPDATE SET
        total_lessons_completed = user_learning_stats.total_lessons_completed + 
            CASE WHEN NEW.activity_type = 'lesson' THEN 1 ELSE 0 END,
        total_flashcards_reviewed = user_learning_stats.total_flashcards_reviewed + 
            CASE WHEN NEW.activity_type = 'flashcard' THEN 1 ELSE 0 END,
        total_games_played = user_learning_stats.total_games_played + 
            CASE WHEN NEW.activity_type = 'game' THEN 1 ELSE 0 END,
        total_score_earned = user_learning_stats.total_score_earned + NEW.score,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update learning stats
CREATE TRIGGER trigger_update_learning_stats
    AFTER INSERT ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_learning_stats();

-- Function to update daily progress summary
CREATE OR REPLACE FUNCTION update_daily_progress_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_progress_summary (user_id, summary_date, lessons_completed, flashcards_reviewed, games_played, total_score)
    VALUES (NEW.user_id, 
            DATE(NEW.completed_at),
            CASE WHEN NEW.activity_type = 'lesson' THEN 1 ELSE 0 END,
            CASE WHEN NEW.activity_type = 'flashcard' THEN 1 ELSE 0 END,
            CASE WHEN NEW.activity_type = 'game' THEN 1 ELSE 0 END,
            NEW.score)
    ON CONFLICT (user_id, summary_date) DO UPDATE SET
        lessons_completed = user_progress_summary.lessons_completed + 
            CASE WHEN NEW.activity_type = 'lesson' THEN 1 ELSE 0 END,
        flashcards_reviewed = user_progress_summary.flashcards_reviewed + 
            CASE WHEN NEW.activity_type = 'flashcard' THEN 1 ELSE 0 END,
        games_played = user_progress_summary.games_played + 
            CASE WHEN NEW.activity_type = 'game' THEN 1 ELSE 0 END,
        total_score = user_progress_summary.total_score + NEW.score,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update daily progress
CREATE TRIGGER trigger_update_daily_progress
    AFTER INSERT ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_progress_summary();

-- =====================================================
-- SAMPLE DATA REMOVED - WILL BE CREATED DYNAMICALLY
-- =====================================================

COMMIT;
