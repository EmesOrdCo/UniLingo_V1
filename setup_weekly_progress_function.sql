-- =====================================================
-- SETUP: Weekly Progress Function for Dashboard
-- =====================================================
-- This script creates the smart query function for daily progress data
-- that replaces the removed user_progress_summary table

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
-- VERIFY THE FUNCTION EXISTS
-- =====================================================

SELECT 
    'get_daily_progress function' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'get_daily_progress' 
        AND routine_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- =====================================================
-- TEST THE FUNCTION
-- =====================================================

-- Test the function for today's data (replace with your user_id)
-- SELECT get_daily_progress('your-user-id-here', CURRENT_DATE);

-- =====================================================
-- GRANT EXECUTE PERMISSION
-- =====================================================

GRANT EXECUTE ON FUNCTION get_daily_progress(UUID, DATE) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if user_activities table exists and has data
SELECT 
    'user_activities table' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_activities' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if user_streaks table exists
SELECT 
    'user_streaks table' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_streaks' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if user_daily_goals table exists
SELECT 
    'user_daily_goals table' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_daily_goals' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- =====================================================
-- SUMMARY
-- =====================================================
-- This function provides:
-- 1. Total study time in minutes for the day
-- 2. Number of lessons completed
-- 3. Number of flashcards reviewed
-- 4. Number of games played
-- 5. Total score earned
-- 6. Average accuracy percentage
-- 7. Whether streak was maintained
-- 8. Number of goals achieved vs total goals

-- The function is used by HolisticProgressService.getProgressInsights()
-- to populate the "This Week" section in the dashboard learning insights.
