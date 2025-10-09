-- CLEANUP SCRIPT: Remove all arcade game entries and start fresh
-- This will fix any 404 errors caused by HTML5 games or duplicate entries

-- Step 1: Remove ALL existing arcade game entries
DELETE FROM arcade_games;

-- Step 2: Add ONLY the 3 working React Native games
INSERT INTO arcade_games (
  name,
  description,
  thumbnail_url,
  game_url,
  xp_cost,
  category,
  difficulty,
  is_active,
  play_count
) VALUES 
  (
    'Snake',
    'Guide the snake to eat food and grow longer! Avoid hitting walls or yourself.',
    null,
    'snake',
    0,
    'classic',
    'easy',
    true,
    0
  ),
  (
    '2048',
    'Swipe to move tiles. When two tiles with the same number touch, they merge into one!',
    null,
    '2048',
    0,
    'puzzle',
    'medium',
    true,
    0
  ),
  (
    'Tetris',
    'Stack falling blocks to clear lines! Rotate and move pieces to create complete rows.',
    null,
    'tetris',
    0,
    'puzzle',
    'medium',
    true,
    0
  );

-- Step 3: Verify ONLY 3 games exist
SELECT 
  id, 
  name, 
  game_url, 
  category, 
  difficulty, 
  is_active 
FROM arcade_games 
ORDER BY name;

-- Should show exactly 3 rows:
-- 1. 2048 (game_url: '2048')
-- 2. Snake (game_url: 'snake')
-- 3. Tetris (game_url: 'tetris')

