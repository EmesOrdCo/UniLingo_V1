-- Token Tracking Database Functions for UniLingo
-- Run these in your Supabase SQL editor to restore token tracking functionality

-- Function to increment token usage
CREATE OR REPLACE FUNCTION increment_tokens(
  user_id UUID,
  input_count INTEGER,
  output_count INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update the user's token counts
  UPDATE users 
  SET 
    input_tokens = COALESCE(input_tokens, 0) + input_count,
    output_tokens = COALESCE(output_tokens, 0) + output_count,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- If no rows were updated, the user doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate spending percentage
CREATE OR REPLACE FUNCTION calculate_spending_percentage(user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  user_tokens RECORD;
  input_cost NUMERIC;
  output_cost NUMERIC;
  total_cost NUMERIC;
  spending_percentage NUMERIC;
BEGIN
  -- Get user's token usage
  SELECT input_tokens, output_tokens 
  INTO user_tokens
  FROM users 
  WHERE id = user_id;
  
  -- If user not found, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate costs (per 1M tokens)
  input_cost := (COALESCE(user_tokens.input_tokens, 0) / 1000000.0) * 0.60;
  output_cost := (COALESCE(user_tokens.output_tokens, 0) / 1000000.0) * 2.40;
  total_cost := input_cost + output_cost;
  
  -- Calculate percentage of $5.00 limit
  spending_percentage := (total_cost / 5.00) * 100;
  
  RETURN spending_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly token usage
CREATE OR REPLACE FUNCTION reset_monthly_tokens(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Reset token counts to 0
  UPDATE users 
  SET 
    input_tokens = 0,
    output_tokens = 0,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- If no rows were updated, the user doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ensure the users table has the required columns
-- (Run this if the columns don't exist)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_created_date TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_token_tracking ON users(id, input_tokens, output_tokens);
