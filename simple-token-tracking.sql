-- Simple monthly token usage tracking
-- Add monthly_token_usage column to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS monthly_token_usage INTEGER DEFAULT 0;

-- Add account creation date if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_created_date DATE DEFAULT CURRENT_DATE;

-- Update existing users to have their creation date as today
UPDATE users 
SET account_created_date = CURRENT_DATE 
WHERE account_created_date IS NULL;

-- Create function to increment monthly tokens
CREATE OR REPLACE FUNCTION increment_monthly_tokens(user_id UUID, token_count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET monthly_token_usage = monthly_token_usage + token_count
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
