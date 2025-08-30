-- FIX: Update Enhanced Learning Stats Function to Remove user_progress_summary References
-- This fixes the function that was causing "relation user_progress_summary does not exist" errors

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS update_user_learning_stats_enhanced() CASCADE;

-- Create the fixed function without user_progress_summary references
CREATE OR REPLACE FUNCTION update_user_learning_stats_enhanced()
RETURNS TRIGGER AS $$
DECLARE
    new_experience_points INTEGER := 0;
    new_level TEXT := 'Beginner';
    study_time_hours DECIMAL := 0;
    streak_bonus INTEGER := 0;
    current_streak INTEGER := 0;
BEGIN
    -- Calculate base XP based on activity type and accuracy
    CASE NEW.activity_type
        WHEN 'lesson' THEN
            new_experience_points := 15 + COALESCE(NEW.accuracy_percentage, 0) / 10;
        WHEN 'flashcard' THEN
            new_experience_points := 3 + COALESCE(NEW.accuracy_percentage, 0) / 20;
        WHEN 'game' THEN
            new_experience_points := 8 + COALESCE(NEW.accuracy_percentage, 0) / 15;
        ELSE
            new_experience_points := 5;
    END CASE;
    
    -- Calculate streak bonus based on recent activity (last 7 days)
    -- Use user_activities table instead of user_progress_summary
    SELECT COALESCE(current_streak, 0) INTO current_streak
    FROM (
        SELECT COUNT(DISTINCT DATE(completed_at)) as current_streak
        FROM user_activities
        WHERE user_id = NEW.user_id
        AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
        AND (activity_type = 'lesson' OR activity_type = 'flashcard' OR activity_type = 'game')
    ) streak_check;
    
    IF current_streak >= 7 THEN
        streak_bonus := 3; -- 7+ day streak bonus (reduced from 15)
    ELSIF current_streak >= 3 THEN
        streak_bonus := 2; -- 3+ day streak bonus (reduced from 10)
    ELSE
        streak_bonus := 0;  -- No streak bonus
    END IF;
    
    new_experience_points := new_experience_points + streak_bonus;
    
    -- Calculate study time in hours
    IF NEW.duration_seconds IS NOT NULL THEN
        study_time_hours := NEW.duration_seconds::DECIMAL / 3600.0; -- Convert seconds to hours
    ELSE
        study_time_hours := 0;
    END IF;
    
    -- Determine new level based on total XP
    SELECT 
        CASE 
            WHEN (SELECT COALESCE(experience_points, 0) FROM user_learning_stats WHERE user_id = NEW.user_id) + new_experience_points >= 5000 THEN 'Master'
            WHEN (SELECT COALESCE(experience_points, 0) FROM user_learning_stats WHERE user_id = NEW.user_id) + new_experience_points >= 2500 THEN 'Expert'
            WHEN (SELECT COALESCE(experience_points, 0) FROM user_learning_stats WHERE user_id = NEW.user_id) + new_experience_points >= 1000 THEN 'Advanced'
            WHEN (SELECT COALESCE(experience_points, 0) FROM user_learning_stats WHERE user_id = NEW.user_id) + new_experience_points >= 500 THEN 'Intermediate'
            WHEN (SELECT COALESCE(experience_points, 0) FROM user_learning_stats WHERE user_id = NEW.user_id) + new_experience_points >= 100 THEN 'Elementary'
            ELSE 'Beginner'
        END INTO new_level;
    
    -- Insert or update user learning stats with all calculated values
    INSERT INTO user_learning_stats (
        user_id, 
        total_lessons_completed, 
        total_flashcards_reviewed, 
        total_games_played, 
        total_score_earned,
        total_study_time_hours,
        experience_points,
        current_level,
        average_lesson_accuracy,
        updated_at
    )
    VALUES (
        NEW.user_id, 
        CASE WHEN NEW.activity_type = 'lesson' THEN 1 ELSE 0 END,
        CASE WHEN NEW.activity_type = 'flashcard' THEN 1 ELSE 0 END,
        CASE WHEN NEW.activity_type = 'game' THEN 1 ELSE 0 END,
        NEW.score,
        study_time_hours,
        new_experience_points,
        new_level,
        CASE WHEN NEW.activity_type = 'lesson' AND NEW.accuracy_percentage IS NOT NULL THEN NEW.accuracy_percentage ELSE 0 END,
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
        total_study_time_hours = user_learning_stats.total_study_time_hours + study_time_hours,
        experience_points = user_learning_stats.experience_points + new_experience_points,
        current_level = new_level,
        average_lesson_accuracy = CASE 
            WHEN NEW.activity_type = 'lesson' AND NEW.accuracy_percentage IS NOT NULL THEN
                -- Calculate weighted average: (old_avg * old_count + new_accuracy) / (old_count + 1)
                CASE 
                    WHEN user_learning_stats.total_lessons_completed > 0 THEN
                        ROUND(
                            ((user_learning_stats.average_lesson_accuracy * user_learning_stats.total_lessons_completed) + NEW.accuracy_percentage)::DECIMAL / 
                            (user_learning_stats.total_lessons_completed + 1), 2
                        )
                    ELSE NEW.accuracy_percentage
                END
            ELSE user_learning_stats.average_lesson_accuracy
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if the function was created successfully
SELECT 
    'Enhanced update_user_learning_stats function (FIXED)' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'update_user_learning_stats_enhanced' 
        AND routine_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- =====================================================
-- SUMMARY
-- =====================================================
-- This function now:
-- 1. ✅ Uses user_activities table instead of user_progress_summary
-- 2. ✅ Calculates streak bonus based on recent activity days
-- 3. ✅ Uses reduced XP values (matching our earlier changes)
-- 4. ✅ Properly updates user_learning_stats table
-- 5. ✅ No longer causes "relation user_progress_summary does not exist" errors
