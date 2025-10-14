-- Update arcade game pricing from 15, 25, 30 to 5, 10, 15 XP
-- This reduces the XP cost for all games to make them more accessible

-- Tier 1: Quick Games (15 XP → 5 XP)
UPDATE arcade_games SET xp_cost = 5 WHERE name = 'Flappy Bird';
UPDATE arcade_games SET xp_cost = 5 WHERE name = 'Pong';
UPDATE arcade_games SET xp_cost = 5 WHERE name = '2048';

-- Tier 2: Medium Games (25 XP → 10 XP)
UPDATE arcade_games SET xp_cost = 10 WHERE name = 'Bubble Shooter';
UPDATE arcade_games SET xp_cost = 10 WHERE name = 'Space Invaders';
UPDATE arcade_games SET xp_cost = 10 WHERE name = 'Breakout Deluxe';
UPDATE arcade_games SET xp_cost = 10 WHERE name = 'Snake';
UPDATE arcade_games SET xp_cost = 10 WHERE name = 'Minesweeper';

-- Tier 3: Complex Games (30 XP → 15 XP)
UPDATE arcade_games SET xp_cost = 15 WHERE name = 'Asteroids';
UPDATE arcade_games SET xp_cost = 15 WHERE name = 'Tetris';
UPDATE arcade_games SET xp_cost = 15 WHERE name = 'Sudoku';
UPDATE arcade_games SET xp_cost = 15 WHERE name = 'Pac-Man';

-- Verify the new pricing structure
SELECT name, xp_cost, 
  CASE 
    WHEN xp_cost = 5 THEN 'Tier 1: Quick (5 XP)'
    WHEN xp_cost = 10 THEN 'Tier 2: Medium (10 XP)'
    WHEN xp_cost = 15 THEN 'Tier 3: Complex (15 XP)'
    ELSE 'Free'
  END as pricing_tier
FROM arcade_games 
WHERE is_active = true
ORDER BY xp_cost, name;

-- Summary of changes:
-- Tier 1: 15 XP → 5 XP (67% reduction)
-- Tier 2: 25 XP → 10 XP (60% reduction)  
-- Tier 3: 30 XP → 15 XP (50% reduction)
-- 
-- This makes games more accessible while maintaining the tier structure
