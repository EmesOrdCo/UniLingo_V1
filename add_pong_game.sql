-- Add Pong game to arcade

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
  'Pong',
  'Classic paddle game! Compete against AI in this legendary arcade game. First to 11 wins!',
  null,
  'pong',
  0,
  'classic',
  'easy',
  true,
  0
);

-- Verify all 6 React Native games exist
SELECT name, game_url, category, difficulty FROM arcade_games 
WHERE game_url IN ('snake', '2048', 'tetris', 'breakout', 'space-invaders', 'pong')
ORDER BY name;

