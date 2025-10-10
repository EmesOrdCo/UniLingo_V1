-- Add available_xp column to user_learning_stats table
-- This is a separate XP reserve that users can spend on arcade games
-- The existing experience_points remains as cumulative XP (never decreases)

-- Add the new column
ALTER TABLE user_learning_stats 
ADD COLUMN IF NOT EXISTS available_xp INTEGER DEFAULT 0;

-- Initialize available_xp to match current experience_points for existing users
-- This gives them their current XP as spendable XP
UPDATE user_learning_stats 
SET available_xp = experience_points 
WHERE available_xp IS NULL OR available_xp = 0;

-- Add comment explaining the columns
COMMENT ON COLUMN user_learning_stats.experience_points IS 'Cumulative XP earned (never decreases, for display/levels)';
COMMENT ON COLUMN user_learning_stats.available_xp IS 'Spendable XP reserve (can be spent on arcade games)';

