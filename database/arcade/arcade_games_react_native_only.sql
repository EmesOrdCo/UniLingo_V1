-- Populate arcade_games table with REACT NATIVE games ONLY
-- These games are built into the app and work immediately (no backend needed)

-- FIRST: Remove any HTML5 games that might cause 404 errors
DELETE FROM arcade_games WHERE game_url LIKE 'games/%';

-- Insert Snake (Native React Native game)
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
) VALUES (
  'Snake',
  'Guide the snake to eat food and grow longer! Avoid hitting walls or yourself.',
  null,
  'snake',
  0,
  'classic',
  'easy',
  true,
  0
);

-- Insert 2048 (Native React Native game)
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
) VALUES (
  '2048',
  'Swipe to move tiles. When two tiles with the same number touch, they merge into one!',
  null,
  '2048',
  0,
  'puzzle',
  'medium',
  true,
  0
);

-- Insert Tetris (Native React Native game)
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
) VALUES (
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

-- Verify ONLY React Native games exist
SELECT id, name, category, difficulty, game_url, is_active 
FROM arcade_games 
WHERE game_url IN ('snake', '2048', 'tetris') 
ORDER BY name;

-- Check for any HTML5 games (should return 0 rows)
SELECT COUNT(*) as html5_games_count 
FROM arcade_games 
WHERE game_url LIKE 'games/%';

