-- Add Pac-Man game to arcade

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
  'Pac-Man',
  'Navigate the maze, eat pellets, and avoid ghosts! Grab power pellets to turn the tables!',
  null,
  'pacman',
  0,
  'classic',
  'medium',
  true,
  0
);

-- Verify all 8 React Native games exist
SELECT name, game_url, category, difficulty FROM arcade_games 
WHERE game_url IN ('snake', '2048', 'tetris', 'breakout', 'space-invaders', 'pong', 'minesweeper', 'pacman')
ORDER BY name;

