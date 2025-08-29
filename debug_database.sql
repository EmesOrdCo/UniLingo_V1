-- Debug script to find what's causing the ON CONFLICT error

-- 1. Check if there are any triggers on user_activities table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'user_activities';

-- 2. Check table constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_activities';

-- 3. Check for any RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_activities';

-- 4. Check the actual table structure
\d user_activities;

-- 5. Test the function directly with a simple insert
SELECT insert_user_activity(
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test',
    'Test Activity',
    60,
    5,
    10,
    50.0
);
