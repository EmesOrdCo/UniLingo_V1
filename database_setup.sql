-- Create user_flashcards table for personal user flashcards
CREATE TABLE IF NOT EXISTS user_flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    front TEXT NOT NULL, -- English text
    back TEXT NOT NULL, -- Chinese text
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
    tags TEXT[], -- Array of tags (predefined + custom)
    pronunciation TEXT, -- Optional
    example TEXT, -- Optional
    native_language VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_flashcards_user_id ON user_flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcards_subject ON user_flashcards(subject);
CREATE INDEX IF NOT EXISTS idx_user_flashcards_topic ON user_flashcards(topic);
CREATE INDEX IF NOT EXISTS idx_user_flashcards_difficulty ON user_flashcards(difficulty);

-- Enable Row Level Security (RLS)
ALTER TABLE user_flashcards ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own flashcards
CREATE POLICY "Users can view own flashcards" ON user_flashcards
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policy: users can insert their own flashcards
CREATE POLICY "Users can insert own flashcards" ON user_flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can update their own flashcards
CREATE POLICY "Users can update own flashcards" ON user_flashcards
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policy: users can delete their own flashcards
CREATE POLICY "Users can delete own flashcards" ON user_flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_flashcards_updated_at 
    BEFORE UPDATE ON user_flashcards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LESSON FEATURE TABLES
-- ============================================================================

-- Create esp_lessons table for AI-generated lessons
CREATE TABLE IF NOT EXISTS esp_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_duration INTEGER, -- in minutes
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lesson_vocabulary table for lesson vocabulary items
CREATE TABLE IF NOT EXISTS lesson_vocabulary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES esp_lessons(id) ON DELETE CASCADE,
    english_term TEXT NOT NULL,
    definition TEXT NOT NULL,
    native_translation TEXT NOT NULL,
    example_sentence_en TEXT,
    example_sentence_native TEXT,
    difficulty_rank INTEGER CHECK (difficulty_rank >= 1 AND difficulty_rank <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lesson_exercises table for lesson exercises
CREATE TABLE IF NOT EXISTS lesson_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES esp_lessons(id) ON DELETE CASCADE,
    exercise_type VARCHAR(100) NOT NULL,
    content JSONB NOT NULL, -- Exercise content, options, correct answers
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lesson_progress table for user progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES esp_lessons(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_score INTEGER DEFAULT 0,
    max_possible_score INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    total_exercises INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one progress record per user per lesson
    UNIQUE(user_id, lesson_id)
);

-- Create indexes for lesson tables
CREATE INDEX IF NOT EXISTS idx_esp_lessons_user_id ON esp_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_esp_lessons_subject ON esp_lessons(subject);
CREATE INDEX IF NOT EXISTS idx_esp_lessons_difficulty ON esp_lessons(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary_lesson_id ON lesson_vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary_difficulty ON lesson_vocabulary(difficulty_rank);

CREATE INDEX IF NOT EXISTS idx_lesson_exercises_lesson_id ON lesson_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_type ON lesson_exercises(exercise_type);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);

-- Enable RLS on lesson tables
ALTER TABLE esp_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for esp_lessons
CREATE POLICY "Users can view own lessons" ON esp_lessons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lessons" ON esp_lessons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lessons" ON esp_lessons
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lessons" ON esp_lessons
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for lesson_vocabulary
CREATE POLICY "Users can view lesson vocabulary" ON lesson_vocabulary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM esp_lessons 
            WHERE esp_lessons.id = lesson_vocabulary.lesson_id 
            AND esp_lessons.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert lesson vocabulary" ON lesson_vocabulary
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM esp_lessons 
            WHERE esp_lessons.id = lesson_vocabulary.lesson_id 
            AND esp_lessons.user_id = auth.uid()
        )
    );

-- RLS policies for lesson_exercises
CREATE POLICY "Users can view lesson exercises" ON lesson_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM esp_lessons 
            WHERE esp_lessons.id = lesson_exercises.lesson_id 
            AND esp_lessons.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert lesson exercises" ON lesson_exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM esp_lessons 
            WHERE esp_lessons.id = lesson_exercises.lesson_id 
            AND esp_lessons.user_id = auth.uid()
        )
    );

-- RLS policies for lesson_progress
CREATE POLICY "Users can view own progress" ON lesson_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON lesson_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON lesson_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON lesson_progress
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for lesson_progress updated_at
CREATE TRIGGER update_lesson_progress_updated_at 
    BEFORE UPDATE ON lesson_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for esp_lessons updated_at
CREATE TRIGGER update_esp_lessons_updated_at 
    BEFORE UPDATE ON esp_lessons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
