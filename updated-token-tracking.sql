-- Updated token tracking with separate input/output tokens and dollar-based limits
-- Remove old monthly_token_usage column and add new columns

ALTER TABLE users 
DROP COLUMN IF EXISTS monthly_token_usage;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0;

-- Add account creation date if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_created_date DATE DEFAULT CURRENT_DATE;

-- Update existing users to have their creation date as today
UPDATE users 
SET account_created_date = CURRENT_DATE 
WHERE account_created_date IS NULL;

-- Create function to increment input and output tokens
CREATE OR REPLACE FUNCTION increment_tokens(user_id UUID, input_count INTEGER, output_count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    input_tokens = input_tokens + input_count,
    output_tokens = output_tokens + output_count
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset monthly tokens
CREATE OR REPLACE FUNCTION reset_monthly_tokens(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    input_tokens = 0,
    output_tokens = 0
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate spending percentage
CREATE OR REPLACE FUNCTION calculate_spending_percentage(user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  user_input_tokens INTEGER;
  user_output_tokens INTEGER;
  input_cost DECIMAL;
  output_cost DECIMAL;
  total_cost DECIMAL;
  spending_limit DECIMAL := 1.35;
BEGIN
  SELECT input_tokens, output_tokens INTO user_input_tokens, user_output_tokens
  FROM users WHERE id = user_id;
  
  -- Calculate costs: $0.60 per 1M input tokens, $2.40 per 1M output tokens
  input_cost := (user_input_tokens::DECIMAL / 1000000) * 0.60;
  output_cost := (user_output_tokens::DECIMAL / 1000000) * 2.40;
  total_cost := input_cost + output_cost;
  
  -- Return percentage of $1.35 limit
  RETURN (total_cost / spending_limit) * 100;
END;
$$ LANGUAGE plpgsql;
