-- Set 3-tier pricing structure for arcade games

-- Tier 1: Quick Games (15 XP)
UPDATE arcade_games SET xp_cost = 15 WHERE name = 'Flappy Bird';
UPDATE arcade_games SET xp_cost = 15 WHERE name = 'Pong';
UPDATE arcade_games SET xp_cost = 15 WHERE name = '2048';

-- Tier 2: Medium Games (25 XP)
UPDATE arcade_games SET xp_cost = 25 WHERE name = 'Bubble Shooter';
UPDATE arcade_games SET xp_cost = 25 WHERE name = 'Space Invaders';
UPDATE arcade_games SET xp_cost = 25 WHERE name = 'Breakout Deluxe';
UPDATE arcade_games SET xp_cost = 25 WHERE name = 'Snake';
UPDATE arcade_games SET xp_cost = 25 WHERE name = 'Minesweeper';

-- Tier 3: Complex Games (30 XP)
UPDATE arcade_games SET xp_cost = 30 WHERE name = 'Asteroids';
UPDATE arcade_games SET xp_cost = 30 WHERE name = 'Tetris';
UPDATE arcade_games SET xp_cost = 30 WHERE name = 'Sudoku';
UPDATE arcade_games SET xp_cost = 30 WHERE name = 'Pac-Man';

-- Verify the pricing
SELECT name, xp_cost, 
  CASE 
    WHEN xp_cost = 15 THEN 'Tier 1: Quick (15 XP)'
    WHEN xp_cost = 25 THEN 'Tier 2: Medium (25 XP)'
    WHEN xp_cost = 30 THEN 'Tier 3: Complex (30 XP)'
    ELSE 'Free'
  END as pricing_tier
FROM arcade_games 
WHERE is_active = true
ORDER BY xp_cost, name;
