-- Add Flappy Bird game to arcade

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
  'Flappy Bird',
  'Tap to flap! Navigate through pipes without crashing in this addictive endless game.',
  null,
  'flappy-bird',
  0,
  'arcade',
  'hard',
  true,
  0
);

-- Verify all 9 React Native games exist
SELECT name, game_url, category, difficulty FROM arcade_games 
WHERE game_url IN ('snake', '2048', 'tetris', 'breakout', 'space-invaders', 'pong', 'minesweeper', 'pacman', 'flappy-bird')
ORDER BY name;

