-- Add Flow Free to the arcade
INSERT INTO arcade_games (
  name,
  game_url,
  description,
  category,
  difficulty,
  xp_cost,
  is_active
) VALUES (
  'Flow Free',
  'flow-free',
  'Connect matching colored dots! Drag paths between pairs to fill the entire grid. Paths cannot cross. Multiple levels!',
  'puzzle',
  'easy',
  0,
  true
);

