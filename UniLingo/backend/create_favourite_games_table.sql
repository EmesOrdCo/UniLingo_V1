-- Create favourite_games table for storing user's favorite games
CREATE TABLE IF NOT EXISTS favourite_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL,
    game_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favourite_games_user_id ON favourite_games(user_id);
CREATE INDEX IF NOT EXISTS idx_favourite_games_game_type ON favourite_games(game_type);

-- Enable Row Level Security
ALTER TABLE favourite_games ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favourite games" ON favourite_games
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favourite games" ON favourite_games
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favourite games" ON favourite_games
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favourite games" ON favourite_games
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_favourite_games_updated_at 
    BEFORE UPDATE ON favourite_games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
