-- Populate arcade_games table with arcade games
-- Note: Snake is a React Native game component, others would need conversion or hosting

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

-- NOTE: The following HTML5 games are available but need backend hosting
-- Uncomment and deploy backend games if you want to use them

-- Insert Hextris (Tetris-style puzzle game - HTML5)
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
  'Join the numbers to get to the 2048 tile! Slide tiles in any direction to combine them.',
  null,
  'games/2048/index.html',
  0,
  'puzzle',
  'medium',
  true,
  0
);

-- Insert Clumsy Bird (Flappy Bird clone)
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
  'Clumsy Bird',
  'Tap to flap and fly! Navigate through pipes without crashing in this addictive arcade game.',
  null,
  'games/clumsy-bird/index.html',
  0,
  'arcade',
  'hard',
  true,
  0
);

-- Insert Space Invaders (Classic shooter)
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
  'Defend Earth from alien invaders! Move and shoot to destroy all enemies before they reach you.',
  null,
  'games/space-invaders/index.html',
  0,
  'classic',
  'medium',
  true,
  0
);

-- Insert Pac-Man (Classic maze game)
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
  'Eat all the dots while avoiding ghosts! Collect power pellets to turn the tables on your enemies.',
  null,
  'games/pacman/index.html',
  0,
  'classic',
  'medium',
  true,
  0
);

-- Verify the React Native games were inserted
SELECT id, name, category, difficulty, game_url FROM arcade_games 
WHERE game_url IN ('snake', '2048', 'tetris') 
ORDER BY created_at DESC;

