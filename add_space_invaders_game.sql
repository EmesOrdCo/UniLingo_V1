-- Add Space Invaders game to arcade

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
  'Space Invaders',
  'Defend Earth from alien invaders! Shoot the descending enemies before they reach you.',
  null,
  'space-invaders',
  0,
  'action',
  'medium',
  true,
  0
);

-- Verify all 5 React Native games exist
SELECT name, game_url, category, difficulty FROM arcade_games 
WHERE game_url IN ('snake', '2048', 'tetris', 'breakout', 'space-invaders')
ORDER BY name;

