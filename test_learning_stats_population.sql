-- =====================================================
-- COMPREHENSIVE TEST: user_learning_stats Population
-- =====================================================

-- This script tests the entire flow from user_activities to user_learning_stats
-- Run this in your Supabase SQL editor to verify everything works

-- =====================================================
-- STEP 1: Verify Database Structure
-- =====================================================

-- Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_name IN (
    'user_activities',
    'user_learning_stats', 
    'user_progress_summary'
)
AND table_schema = 'public';

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_update_learning_stats',
    'trigger_update_daily_progress'
)
AND trigger_schema = 'public';

-- Check if functions exist
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.routines 
WHERE routine_name IN (
    'update_user_learning_stats',
    'update_daily_progress_summary',
    'insert_user_activity'
)
AND routine_schema = 'public';

-- =====================================================
-- STEP 2: Verify Constraints
-- =====================================================

-- Check unique constraints
SELECT 
    table_name,
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.table_constraints 
WHERE table_name IN ('user_progress_summary', 'user_learning_stats')
AND constraint_type = 'UNIQUE'
AND table_schema = 'public';

-- =====================================================
-- STEP 3: Test Data Flow (Simulate Real Usage)
-- =====================================================

-- First, let's see what users exist
SELECT 
    id,
    email,
    created_at
FROM auth.users 
LIMIT 5;

-- Check if user_learning_stats has any data
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN total_lessons_completed > 0 THEN 1 END) as users_with_lessons,
    COUNT(CASE WHEN total_flashcards_reviewed > 0 THEN 1 END) as users_with_flashcards,
    COUNT(CASE WHEN total_games_played > 0 THEN 1 END) as users_with_games
FROM user_learning_stats;

-- Check if user_activities has any data
SELECT 
    COUNT(*) as total_activities,
    COUNT(DISTINCT user_id) as unique_users,
    activity_type,
    COUNT(*) as count_by_type
FROM user_activities 
GROUP BY activity_type;

-- =====================================================
-- STEP 4: Manual Test Insert (if no data exists)
-- =====================================================

-- If no data exists, let's create a test user and activity
-- First, check if we have any authenticated users
DO $$
DECLARE
    test_user_id UUID;
    test_activity_id UUID;
    test_stats_id UUID;
BEGIN
    -- Get a test user (replace with actual user ID if you have one)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user: %', test_user_id;
        
        -- Insert a test activity
        INSERT INTO user_activities (
            user_id,
            activity_type,
            activity_name,
            duration_seconds,
            score,
            max_score,
            accuracy_percentage,
            completed_at
        ) VALUES (
            test_user_id,
            'game',
            'Test Quiz Game',
            300, -- 5 minutes
            8,
            10,
            80.0,
            NOW()
        ) RETURNING id INTO test_activity_id;
        
        RAISE NOTICE 'Inserted test activity: %', test_activity_id;
        
        -- Check if user_learning_stats was updated
        SELECT id INTO test_stats_id FROM user_learning_stats WHERE user_id = test_user_id;
        
        IF test_stats_id IS NOT NULL THEN
            RAISE NOTICE '✅ user_learning_stats was populated automatically!';
        ELSE
            RAISE NOTICE '❌ user_learning_stats was NOT populated - check triggers!';
        END IF;
        
        -- Check if user_progress_summary was updated
        IF EXISTS (
            SELECT 1 FROM user_progress_summary 
            WHERE user_id = test_user_id 
            AND summary_date = CURRENT_DATE
        ) THEN
            RAISE NOTICE '✅ user_progress_summary was populated automatically!';
        ELSE
            RAISE NOTICE '❌ user_progress_summary was NOT populated - check triggers!';
        END IF;
        
    ELSE
        RAISE NOTICE 'No users found in auth.users - cannot run test';
    END IF;
END $$;

-- =====================================================
-- STEP 5: Verify Results
-- =====================================================

-- Check the test results
SELECT 
    'user_activities' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users
FROM user_activities
UNION ALL
SELECT 
    'user_learning_stats' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users
FROM user_learning_stats
UNION ALL
SELECT 
    'user_progress_summary' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users
FROM user_progress_summary;

-- Show detailed learning stats for the test user
SELECT 
    uls.user_id,
    u.email,
    uls.total_lessons_completed,
    uls.total_flashcards_reviewed,
    uls.total_games_played,
    uls.total_score_earned,
    uls.experience_points,
    uls.current_level,
    uls.created_at,
    uls.updated_at
FROM user_learning_stats uls
JOIN auth.users u ON uls.user_id = u.id
ORDER BY uls.updated_at DESC
LIMIT 5;

-- Show recent activities
SELECT 
    ua.user_id,
    u.email,
    ua.activity_type,
    ua.activity_name,
    ua.score,
    ua.max_score,
    ua.accuracy_percentage,
    ua.duration_seconds,
    ua.completed_at
FROM user_activities ua
JOIN auth.users u ON ua.user_id = u.id
ORDER BY ua.completed_at DESC
LIMIT 10;

-- =====================================================
-- STEP 6: Trigger Function Test
-- =====================================================

-- Test the trigger function directly
DO $$
DECLARE
    test_user_id UUID;
    test_result JSON;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function directly
        SELECT update_user_learning_stats() INTO test_result;
        RAISE NOTICE 'Trigger function test result: %', test_result;
    END IF;
END $$;

-- =====================================================
-- STEP 7: Cleanup (Optional)
-- =====================================================

-- Uncomment these lines if you want to clean up test data
-- DELETE FROM user_activities WHERE activity_name = 'Test Quiz Game';
-- DELETE FROM user_progress_summary WHERE summary_date = CURRENT_DATE;
-- DELETE FROM user_learning_stats WHERE user_id IN (
--     SELECT user_id FROM user_activities WHERE activity_name = 'Test Quiz Game'
-- );

-- =====================================================
-- SUMMARY
-- =====================================================

-- This script should show:
-- 1. ✅ All tables exist
-- 2. ✅ All triggers exist  
-- 3. ✅ All functions exist
-- 4. ✅ All constraints exist
-- 5. ✅ Data flows correctly from user_activities → user_learning_stats
-- 6. ✅ Data flows correctly from user_activities → user_progress_summary

-- If any step fails, the issue is likely:
-- - Missing triggers
-- - Missing functions  
-- - Missing constraints
-- - RLS policies blocking access
-- - Function permissions issues
