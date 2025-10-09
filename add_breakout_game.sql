-- Add Breakout game to arcade

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
  'Breakout',
  'Break all the bricks! Drag the paddle to bounce the ball and clear each level.',
  null,
  'breakout',
  0,
  'classic',
  'easy',
  true,
  0
);

-- Verify all 4 React Native games exist
SELECT name, game_url, category FROM arcade_games 
WHERE game_url IN ('snake', '2048', 'tetris', 'breakout')
ORDER BY name;

