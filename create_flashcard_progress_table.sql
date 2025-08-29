-- Create user_flashcard_progress table for tracking flashcard mastery and progress
CREATE TABLE IF NOT EXISTS user_flashcard_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES user_flashcards(id) ON DELETE CASCADE,
    correct_attempts INTEGER DEFAULT 0 CHECK (correct_attempts >= 0),
    incorrect_attempts INTEGER DEFAULT 0 CHECK (incorrect_attempts >= 0),
    consecutive_correct INTEGER DEFAULT 0 CHECK (consecutive_correct >= 0),
    consecutive_incorrect INTEGER DEFAULT 0 CHECK (consecutive_incorrect >= 0),
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
    is_mastered BOOLEAN DEFAULT FALSE,
    last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retention_score DECIMAL(5,2) DEFAULT 0.00 CHECK (retention_score >= 0.00 AND retention_score <= 100.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one progress record per user per flashcard
    UNIQUE(user_id, flashcard_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_user_id ON user_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_flashcard_id ON user_flashcard_progress(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_mastery ON user_flashcard_progress(is_mastered);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_next_review ON user_flashcard_progress(next_review_date);

-- Enable Row Level Security (RLS)
ALTER TABLE user_flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own flashcard progress
CREATE POLICY "Users can view own flashcard progress" ON user_flashcard_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policy: users can insert their own flashcard progress
CREATE POLICY "Users can insert own flashcard progress" ON user_flashcard_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can update their own flashcard progress
CREATE POLICY "Users can update own flashcard progress" ON user_flashcard_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policy: users can delete their own flashcard progress
CREATE POLICY "Users can delete own flashcard progress" ON user_flashcard_progress
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update mastery level based on consecutive correct answers
CREATE OR REPLACE FUNCTION update_flashcard_mastery()
RETURNS TRIGGER AS $$
BEGIN
    -- Update consecutive counts
    IF NEW.correct_attempts > OLD.correct_attempts THEN
        -- Correct answer
        NEW.consecutive_correct = OLD.consecutive_correct + 1;
        NEW.consecutive_incorrect = 0;
    ELSIF NEW.incorrect_attempts > OLD.incorrect_attempts THEN
        -- Incorrect answer
        NEW.consecutive_correct = 0;
        NEW.consecutive_incorrect = OLD.consecutive_incorrect + 1;
    END IF;
    
    -- Update mastery level based on consecutive correct answers
    IF NEW.consecutive_correct >= 5 THEN
        NEW.mastery_level = 5;
        NEW.is_mastered = TRUE;
    ELSIF NEW.consecutive_correct >= 4 THEN
        NEW.mastery_level = 4;
        NEW.is_mastered = FALSE;
    ELSIF NEW.consecutive_correct >= 3 THEN
        NEW.mastery_level = 3;
        NEW.is_mastered = FALSE;
    ELSIF NEW.consecutive_correct >= 2 THEN
        NEW.mastery_level = 2;
        NEW.is_mastered = FALSE;
    ELSIF NEW.consecutive_correct >= 1 THEN
        NEW.mastery_level = 1;
        NEW.is_mastered = FALSE;
    ELSE
        NEW.mastery_level = 0;
        NEW.is_mastered = FALSE;
    END IF;
    
    -- Calculate retention score (percentage of correct answers)
    IF (NEW.correct_attempts + NEW.incorrect_attempts) > 0 THEN
        NEW.retention_score = ROUND(
            (NEW.correct_attempts::DECIMAL / (NEW.correct_attempts + NEW.incorrect_attempts)) * 100, 
            2
        );
    END IF;
    
    -- Update timestamps
    NEW.last_reviewed = NOW();
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update mastery when progress changes
CREATE TRIGGER trigger_update_flashcard_mastery
    BEFORE UPDATE ON user_flashcard_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_flashcard_mastery();

-- Create function to initialize progress for new flashcards
CREATE OR REPLACE FUNCTION initialize_flashcard_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_flashcard_progress (user_id, flashcard_id)
    VALUES (NEW.user_id, NEW.id)
    ON CONFLICT (user_id, flashcard_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create progress record for new flashcards
CREATE TRIGGER trigger_initialize_flashcard_progress
    AFTER INSERT ON user_flashcards
    FOR EACH ROW
    EXECUTE FUNCTION initialize_flashcard_progress();


