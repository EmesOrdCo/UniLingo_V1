-- Fix database issues for OTP authentication

-- 1. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for users table
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, last_active)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- 4. Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
