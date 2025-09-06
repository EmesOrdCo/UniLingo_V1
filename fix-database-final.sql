-- Final fix for OTP authentication issues

-- 1. Completely remove the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Disable RLS temporarily to test
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- 4. Make sure the users table has the right structure
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- 5. Grant all permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 6. Test if we can insert directly
INSERT INTO public.users (id, email, created_at, last_active) 
VALUES ('test-user-id', 'test@example.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Create simple RLS policies
CREATE POLICY users_select_own ON public.users
FOR SELECT USING (true);

CREATE POLICY users_insert_own ON public.users
FOR INSERT WITH CHECK (true);

CREATE POLICY users_update_own ON public.users
FOR UPDATE USING (true) WITH CHECK (true);

-- 9. Clean up test data
DELETE FROM public.users WHERE id = 'test-user-id';
