-- Add Bubble Shooter to the arcade
INSERT INTO arcade_games (
  name,
  game_url,
  description,
  category,
  difficulty,
  xp_cost,
  is_active
) VALUES (
  'Bubble Shooter',
  'bubble-shooter',
  'Match 3 or more bubbles to pop them! Aim carefully and clear the board. Disconnected bubbles fall for bonus points!',
  'arcade',
  'easy',
  0,
  true
);

