-- UniLingo Onboarding Database Schema
-- This file contains the SQL schema needed to support the onboarding flow

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with comprehensive onboarding fields
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  
  -- Language preferences
  native_language VARCHAR(50),
  target_language VARCHAR(50),
  
  -- Learning preferences
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Advanced')),
  daily_commitment_minutes INTEGER,
  
  -- Notification preferences
  wants_notifications BOOLEAN DEFAULT true,
  
  -- Discovery and subscription
  discovery_source VARCHAR(100),
  selected_plan_id VARCHAR(50),
  has_active_subscription BOOLEAN DEFAULT false,
  
  -- Legacy fields for backward compatibility
  subjects TEXT[], -- Array of subjects/learning areas
  level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'expert')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_native_language ON users(native_language);
CREATE INDEX IF NOT EXISTS idx_users_target_language ON users(target_language);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create subscription plans table (if not exists)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features) VALUES
('free', 'Free Plan', 'Basic features for getting started', 0.00, 0.00, '{"max_flashcards": 50, "ai_lessons": false, "voice_practice": false}'),
('premium', 'Premium Plan', 'Full access to all features', 9.99, 99.99, '{"max_flashcards": -1, "ai_lessons": true, "voice_practice": true, "priority_support": true}')
ON CONFLICT (id) DO NOTHING;

-- Create user subscriptions table (if not exists)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) REFERENCES subscription_plans(id),
  status VARCHAR(20) CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'pending',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Create trigger for user subscriptions updated_at
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create onboarding progress table to track completion
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  step_name VARCHAR(50) NOT NULL,
  step_data JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for onboarding progress
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step_name ON onboarding_progress(step_name);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Onboarding progress policies
CREATE POLICY "Users can view own onboarding progress" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress" ON onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a view for user profiles with subscription info
CREATE OR REPLACE VIEW user_profiles_with_subscription AS
SELECT 
  u.*,
  us.status as subscription_status,
  us.plan_id as current_plan_id,
  sp.name as plan_name,
  sp.features as plan_features,
  CASE 
    WHEN us.status = 'active' AND us.end_date > NOW() THEN true
    ELSE false
  END as has_active_subscription
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a function to get user onboarding completion status
CREATE OR REPLACE FUNCTION get_user_onboarding_status(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_profile RECORD;
  completed_steps TEXT[];
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM users WHERE id = user_uuid;
  
  -- Get completed onboarding steps
  SELECT ARRAY_AGG(step_name) INTO completed_steps 
  FROM onboarding_progress 
  WHERE user_id = user_uuid;
  
  -- Build result
  result := jsonb_build_object(
    'has_profile', user_profile IS NOT NULL,
    'is_complete', user_profile IS NOT NULL AND 
                   user_profile.native_language IS NOT NULL AND 
                   user_profile.target_language IS NOT NULL AND
                   user_profile.proficiency_level IS NOT NULL,
    'completed_steps', COALESCE(completed_steps, ARRAY[]::TEXT[]),
    'profile', CASE 
      WHEN user_profile IS NOT NULL THEN 
        to_jsonb(user_profile)
      ELSE 
        NULL
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_onboarding_status(UUID) TO anon, authenticated;
