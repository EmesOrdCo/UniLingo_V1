-- Add Sudoku to the arcade
INSERT INTO arcade_games (
  name,
  game_url,
  description,
  category,
  difficulty,
  xp_cost,
  is_active
) VALUES (
  'Sudoku',
  'sudoku',
  'Classic number puzzle! Fill the 9x9 grid so each row, column, and 3x3 box contains digits 1-9. Use notes mode and hints to help solve!',
  'puzzle',
  'medium',
  0,
  true
);

