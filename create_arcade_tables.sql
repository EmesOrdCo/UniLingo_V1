-- Arcade Games System
-- Run this SQL in Supabase SQL Editor

-- Table for available arcade games
CREATE TABLE IF NOT EXISTS arcade_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  game_url TEXT NOT NULL,
  xp_cost INTEGER NOT NULL DEFAULT 0, -- Free for now
  category TEXT, -- 'puzzle', 'arcade', 'classic', 'action'
  difficulty TEXT, -- 'easy', 'medium', 'hard'
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table to track user game plays
CREATE TABLE IF NOT EXISTS user_game_plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES arcade_games(id) ON DELETE CASCADE,
  xp_spent INTEGER NOT NULL DEFAULT 0,
  score INTEGER,
  duration_seconds INTEGER,
  played_at TIMESTAMP DEFAULT NOW()
);

-- Table for user high scores
CREATE TABLE IF NOT EXISTS user_game_highscores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES arcade_games(id) ON DELETE CASCADE,
  high_score INTEGER NOT NULL DEFAULT 0,
  achieved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Enable Row Level Security
ALTER TABLE arcade_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_highscores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for arcade_games (everyone can read active games)
CREATE POLICY "Anyone can view active arcade games"
  ON arcade_games FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_game_plays (users can only see their own plays)
CREATE POLICY "Users can view own game plays"
  ON user_game_plays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game plays"
  ON user_game_plays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_game_highscores (users can view all, but only update their own)
CREATE POLICY "Users can view all high scores"
  ON user_game_highscores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own high scores"
  ON user_game_highscores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own high scores"
  ON user_game_highscores FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert initial free games
INSERT INTO arcade_games (name, description, game_url, category, difficulty, xp_cost) VALUES
  ('Hextris', 'Fast-paced puzzle game on a hexagonal grid. Rotate the hexagon to match colors!', 'hextris', 'puzzle', 'medium', 0),
  ('2048', 'Join the numbers and get to the 2048 tile! Addictive puzzle game.', '2048', 'puzzle', 'medium', 0),
  ('Flappy Bird', 'Tap to flap and fly through the pipes. How far can you go?', 'flappy-bird', 'arcade', 'hard', 0),
  ('Snake', 'Classic snake game. Eat the food and grow longer without hitting yourself!', 'snake', 'classic', 'easy', 0),
  ('Tetris', 'The timeless puzzle game. Clear lines by completing rows!', 'tetris', 'puzzle', 'medium', 0),
  ('Breakout', 'Break all the bricks with your paddle and ball. Classic arcade action!', 'breakout', 'classic', 'easy', 0),
  ('Space Invaders', 'Defend Earth from alien invaders! Shoot them all down!', 'space-invaders', 'action', 'medium', 0),
  ('Pac-Man', 'Eat all the dots while avoiding the ghosts. A true classic!', 'pacman', 'classic', 'medium', 0);

-- Function to update high score
CREATE OR REPLACE FUNCTION update_high_score(
  p_user_id UUID,
  p_game_id UUID,
  p_score INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_high_score INTEGER;
BEGIN
  -- Get current high score
  SELECT high_score INTO current_high_score
  FROM user_game_highscores
  WHERE user_id = p_user_id AND game_id = p_game_id;
  
  -- If no high score exists or new score is higher
  IF current_high_score IS NULL OR p_score > current_high_score THEN
    INSERT INTO user_game_highscores (user_id, game_id, high_score, achieved_at)
    VALUES (p_user_id, p_game_id, p_score, NOW())
    ON CONFLICT (user_id, game_id)
    DO UPDATE SET high_score = p_score, achieved_at = NOW();
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment game play count
CREATE OR REPLACE FUNCTION increment_game_play_count(p_game_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE arcade_games
  SET play_count = play_count + 1
  WHERE id = p_game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_game_plays_user_id ON user_game_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_plays_game_id ON user_game_plays(game_id);
CREATE INDEX IF NOT EXISTS idx_user_game_highscores_user_id ON user_game_highscores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_highscores_game_id ON user_game_highscores(game_id);
CREATE INDEX IF NOT EXISTS idx_arcade_games_active ON arcade_games(is_active);
