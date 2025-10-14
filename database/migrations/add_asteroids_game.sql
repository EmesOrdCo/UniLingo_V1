-- Add Asteroids to the arcade
INSERT INTO arcade_games (
  game_name,
  game_url,
  game_description,
  category,
  difficulty,
  max_players,
  thumbnail_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Asteroids',
  'asteroids',
  'Classic space shooter! Rotate and thrust your ship, shoot asteroids, and watch out for UFOs. Asteroids split into smaller pieces when hit!',
  'Action',
  'Medium',
  1,
  NULL,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (game_url) DO UPDATE SET
  game_name = EXCLUDED.game_name,
  game_description = EXCLUDED.game_description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

