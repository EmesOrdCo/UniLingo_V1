-- Fix database issues for OTP authentication - Version 2

-- 1. First, let's disable the trigger temporarily to isolate the issue
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Check if the users table has the right structure
-- Let's make sure the users table has all required columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- 3. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies and recreate them
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- 5. Create RLS policies for users table
CREATE POLICY users_select_own ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert_own ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- 7. Create a simpler trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, last_active)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- 8. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
