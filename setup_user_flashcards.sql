-- Run this SQL in your Supabase SQL Editor to create the user_flashcards table

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
