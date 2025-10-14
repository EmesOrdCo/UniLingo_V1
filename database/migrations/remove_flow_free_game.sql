-- Remove Flow Free game from the arcade

-- First, delete any user game plays for Flow Free
DELETE FROM user_game_plays 
WHERE game_id IN (
  SELECT id FROM arcade_games WHERE game_url = 'flow-free'
);

-- Delete any high scores for Flow Free
DELETE FROM user_high_scores 
WHERE game_id IN (
  SELECT id FROM arcade_games WHERE game_url = 'flow-free'
);

-- Finally, delete the game itself
DELETE FROM arcade_games 
WHERE game_url = 'flow-free';

