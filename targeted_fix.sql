-- TARGETED FIX: Find and Remove the Specific user_progress_summary Reference
-- This script will identify exactly what's causing the error and fix it

-- =====================================================
-- STEP 1: IDENTIFY THE PROBLEM
-- =====================================================

-- Find all functions that reference user_progress_summary
SELECT 
    'Functions with user_progress_summary references' as check_item,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%user_progress_summary%'
AND routine_schema = 'public';

-- Find all triggers that might be causing issues
SELECT 
    'Active triggers on user_activities' as check_item,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_activities'
AND trigger_schema = 'public';

-- =====================================================
-- STEP 2: REMOVE SPECIFIC PROBLEMATIC FUNCTIONS
-- =====================================================

-- Drop the specific function that's causing the error
DROP FUNCTION IF EXISTS update_daily_progress_summary() CASCADE;

-- Drop any other functions that might reference user_progress_summary
DROP FUNCTION IF EXISTS get_enhanced_learning_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_enhanced_learning_stats_fixed(UUID) CASCADE;

-- =====================================================
-- STEP 3: REMOVE SPECIFIC TRIGGERS
-- =====================================================

-- Drop the specific trigger that's causing the error
DROP TRIGGER IF EXISTS trigger_update_daily_progress ON user_activities;

-- Drop any other triggers that might be problematic
DROP TRIGGER IF EXISTS trigger_update_learning_stats ON user_activities;

-- =====================================================
-- STEP 4: VERIFY CLEANUP
-- =====================================================

-- Check if any functions still reference user_progress_summary
SELECT 
    'Remaining user_progress_summary references' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_definition LIKE '%user_progress_summary%'
        AND routine_schema = 'public'
    ) THEN '❌ STILL EXISTS' ELSE '✅ ALL REMOVED' END as status;

-- Check what triggers remain on user_activities
SELECT 
    'Remaining triggers on user_activities' as check_item,
    trigger_name,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'user_activities'
AND trigger_schema = 'public';

-- =====================================================
-- STEP 5: CREATE A SIMPLE, CLEAN FUNCTION
-- =====================================================

-- Create a simple function that doesn't reference user_progress_summary
CREATE OR REPLACE FUNCTION update_user_learning_stats_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple update without any user_progress_summary references
    INSERT INTO user_learning_stats (
        user_id, 
        total_lessons_completed, 
        total_flashcards_reviewed, 
        total_games_played, 
        total_score_earned,
        updated_at
    )
    VALUES (
        NEW.user_id, 
        CASE WHEN NEW.activity_type = 'lesson' THEN 1 ELSE 0 END,
        CASE WHEN NEW.activity_type = 'flashcard' THEN 1 ELSE 0 END,
        CASE WHEN NEW.activity_type = 'game' THEN 1 ELSE 0 END,
        NEW.score,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_lessons_completed = user_learning_stats.total_lessons_completed + 
            CASE WHEN NEW.activity_type = 'lesson' THEN 1 ELSE 0 END,
        total_flashcards_reviewed = user_learning_stats.total_flashcards_reviewed + 
            CASE WHEN NEW.activity_type = 'flashcard' THEN 1 ELSE 0 END,
        total_games_played = user_learning_stats.total_games_played + 
            CASE WHEN NEW.activity_type = 'game' THEN 1 ELSE 0 END,
        total_score_earned = user_learning_stats.total_score_earned + NEW.score,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a simple trigger
DROP TRIGGER IF EXISTS trigger_update_learning_stats_simple ON user_activities;
CREATE TRIGGER trigger_update_learning_stats_simple
    AFTER INSERT ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_learning_stats_simple();

-- =====================================================
-- STEP 6: FINAL VERIFICATION
-- =====================================================

-- Final check - no user_progress_summary references should exist
SELECT 
    'FINAL CHECK: user_progress_summary references' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_definition LIKE '%user_progress_summary%'
        AND routine_schema = 'public'
    ) THEN '❌ STILL EXISTS - NEEDS MANUAL FIX' ELSE '✅ ALL CLEAR' END as status;

-- Show what triggers are now active
SELECT 
    'Active triggers after fix' as check_item,
    trigger_name,
    '✅ ACTIVE' as status
FROM information_schema.triggers 
WHERE event_object_table = 'user_activities'
AND trigger_schema = 'public';
