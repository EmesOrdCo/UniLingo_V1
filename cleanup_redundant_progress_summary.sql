-- =====================================================
-- CLEANUP: Remove Redundant user_progress_summary Table
-- =====================================================
-- This script removes the redundant table and its trigger function
-- since all data can be calculated from other tables

-- Step 1: Drop the trigger that updates daily progress summary
DROP TRIGGER IF EXISTS trigger_update_daily_progress ON user_activities;

-- Step 2: Drop the function that updates daily progress summary
DROP FUNCTION IF EXISTS update_daily_progress_summary();

-- Step 3: Drop the redundant table
DROP TABLE IF EXISTS user_progress_summary CASCADE;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if the table was removed
SELECT 
    'user_progress_summary table' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_progress_summary' 
        AND table_schema = 'public'
    ) THEN '❌ STILL EXISTS' ELSE '✅ REMOVED' END as status;

-- Check if the trigger was removed
SELECT 
    'trigger_update_daily_progress' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_daily_progress' 
        AND trigger_schema = 'public'
    ) THEN '❌ STILL EXISTS' ELSE '✅ REMOVED' END as status;

-- Check if the function was removed
SELECT 
    'update_daily_progress_summary function' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'update_daily_progress_summary' 
        AND routine_schema = 'public'
    ) THEN '❌ STILL EXISTS' ELSE '✅ REMOVED' END as status;

-- =====================================================
-- SMART QUERY FUNCTION FOR DAILY DATA
-- =====================================================
-- This replaces the redundant table with a smart query function

CREATE OR REPLACE FUNCTION get_daily_progress(user_uuid UUID, target_date DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'date', target_date,
        'total_study_time_minutes', COALESCE(SUM(duration_seconds) / 60, 0),
        'lessons_completed', COUNT(CASE WHEN activity_type = 'lesson' THEN 1 END),
        'flashcards_reviewed', COUNT(CASE WHEN activity_type = 'flashcard' THEN 1 END),
        'games_played', COUNT(CASE WHEN activity_type = 'game' THEN 1 END),
        'total_score', COALESCE(SUM(score), 0),
        'average_accuracy', COALESCE(AVG(accuracy_percentage), 0),
        'streak_maintained', EXISTS(
            SELECT 1 FROM user_streaks 
            WHERE user_id = user_uuid 
            AND streak_type = 'daily_study' 
            AND last_activity_date = target_date
        ),
        'goals_achieved', (
            SELECT COUNT(*) FROM user_daily_goals 
            WHERE user_id = user_uuid 
            AND goal_date = target_date 
            AND completed = true
        ),
        'total_goals', (
            SELECT COUNT(*) FROM user_daily_goals 
            WHERE user_id = user_uuid 
            AND goal_date = target_date
        )
    ) INTO result
    FROM user_activities
    WHERE user_id = user_uuid 
    AND DATE(completed_at) = target_date;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TEST THE NEW SMART QUERY FUNCTION
-- =====================================================

-- Test the function for today's data (replace with your user_id)
-- SELECT get_daily_progress('2c8cf5dd-d246-4bcc-9878-29742ad9e59f', CURRENT_DATE);

-- =====================================================
-- VERIFY THE NEW FUNCTION EXISTS
-- =====================================================

-- Check if the smart query function was created
SELECT 
    'get_daily_progress smart function' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'get_daily_progress' 
        AND routine_schema = 'public'
    ) THEN '✅ CREATED' ELSE '❌ FAILED' END as status;

-- =====================================================
-- SUMMARY OF CHANGES
-- =====================================================

-- What was removed:
-- ❌ user_progress_summary table (redundant data storage)
-- ❌ trigger_update_daily_progress trigger
-- ❌ update_daily_progress_summary function

-- What was added:
-- ✅ get_daily_progress() function (smart query replacement)

-- Benefits:
-- ✅ No more data duplication
-- ✅ No more sync issues
-- ✅ Simpler, more maintainable system
-- ✅ Data always matches source tables
