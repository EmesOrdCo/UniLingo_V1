-- Add Minesweeper game to arcade

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
  'Minesweeper',
  'Find all the mines! Tap to reveal cells, hold to flag. Use numbers to deduce mine locations.',
  null,
  'minesweeper',
  0,
  'puzzle',
  'medium',
  true,
  0
);

-- Verify all 7 React Native games exist
SELECT name, game_url, category, difficulty FROM arcade_games 
WHERE game_url IN ('snake', '2048', 'tetris', 'breakout', 'space-invaders', 'pong', 'minesweeper')
ORDER BY name;

