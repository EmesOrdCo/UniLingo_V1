-- Upgrade Breakout to Breakout Deluxe with power-ups
UPDATE arcade_games
SET 
  game_name = 'Breakout Deluxe',
  game_description = 'Classic brick breaker with power-ups! Collect multi-ball, laser paddle, expand paddle, slow ball, and extra lives. Metal bricks are indestructible!',
  updated_at = NOW()
WHERE game_url = 'breakout';

