-- Update the spending limit in the database function from $1.35 to $5.00

CREATE OR REPLACE FUNCTION calculate_spending_percentage(user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  user_input_tokens INTEGER;
  user_output_tokens INTEGER;
  input_cost DECIMAL;
  output_cost DECIMAL;
  total_cost DECIMAL;
  spending_limit DECIMAL := 5.00; -- Updated from 1.35 to 5.00
BEGIN
  SELECT input_tokens, output_tokens INTO user_input_tokens, user_output_tokens
  FROM users 
  WHERE id = user_id;
  
  -- Handle case where user doesn't exist
  IF user_input_tokens IS NULL THEN
    user_input_tokens := 0;
  END IF;
  
  IF user_output_tokens IS NULL THEN
    user_output_tokens := 0;
  END IF;
  
  -- Calculate costs (per 1M tokens)
  input_cost := (user_input_tokens::DECIMAL / 1000000) * 0.60;
  output_cost := (user_output_tokens::DECIMAL / 1000000) * 2.40;
  total_cost := input_cost + output_cost;
  
  -- Return percentage
  RETURN (total_cost / spending_limit) * 100;
END;
$$ LANGUAGE plpgsql;
