-- =====================================================
-- ENHANCED user_learning_stats Function WITH COMPLETE STREAKS
-- =====================================================
-- This function now calculates experience points, levels, study time, accuracy, AND updates ALL streak types

-- Step 1: Drop the trigger first (since it depends on the function)
DROP TRIGGER IF EXISTS trigger_update_learning_stats ON user_activities;

-- Step 2: Now we can drop the old function
DROP FUNCTION IF EXISTS update_user_learning_stats();

-- Step 3: Create the enhanced function with complete streak updates
CREATE OR REPLACE FUNCTION update_user_learning_stats()
RETURNS TRIGGER AS $$
DECLARE
    new_experience_points INTEGER;
    new_level VARCHAR(50);
    study_time_hours DECIMAL(8,2);
    accuracy_bonus INTEGER;
    streak_bonus INTEGER;
    current_streak INTEGER;
    today_date DATE;
    streak_record RECORD;
    days_since_last_activity INTEGER;
    activity_streak_type VARCHAR(50);
BEGIN
    -- Get today's date
    today_date := CURRENT_DATE;
    
    -- Calculate base experience points from score and accuracy
    new_experience_points := NEW.score;
    
    -- Add accuracy bonus (higher accuracy = more XP)
    IF NEW.accuracy_percentage IS NOT NULL THEN
        IF NEW.accuracy_percentage >= 90 THEN
            accuracy_bonus := 20; -- Perfect performance bonus
        ELSIF NEW.accuracy_percentage >= 80 THEN
            accuracy_bonus := 15; -- Good performance bonus
        ELSIF NEW.accuracy_percentage >= 70 THEN
            accuracy_bonus := 10; -- Decent performance bonus
        ELSE
            accuracy_bonus := 5;  -- Basic completion bonus
        END IF;
        new_experience_points := new_experience_points + accuracy_bonus;
    END IF;
    
    -- Add activity type bonus
    CASE NEW.activity_type
        WHEN 'lesson' THEN
            new_experience_points := new_experience_points + 25; -- Lessons are worth more
            activity_streak_type := 'daily_lessons';
        WHEN 'flashcard' THEN
            new_experience_points := new_experience_points + 15; -- Flashcards are medium value
            activity_streak_type := 'daily_flashcards';
        WHEN 'game' THEN
            new_experience_points := new_experience_points + 20; -- Games are fun and rewarding
            activity_streak_type := 'daily_games';
        ELSE
            new_experience_points := new_experience_points + 10; -- Default bonus
            activity_streak_type := 'daily_study';
    END CASE;
    
    -- =====================================================
    -- AUTOMATIC STREAK UPDATES FOR ALL TYPES
    -- =====================================================
    
    -- Update the specific activity type streak
    PERFORM update_single_streak(NEW.user_id, activity_streak_type, today_date);
    
    -- Update the general daily study streak
    PERFORM update_single_streak(NEW.user_id, 'daily_study', today_date);
    
    -- Get the current general study streak for XP bonus calculation
    SELECT current_streak INTO current_streak
    FROM user_streaks 
    WHERE user_id = NEW.user_id 
    AND streak_type = 'daily_study';
    
    -- Add streak bonus to XP
    IF current_streak >= 7 THEN
        streak_bonus := 15; -- 7+ day streak bonus
    ELSIF current_streak >= 3 THEN
        streak_bonus := 10; -- 3+ day streak bonus
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
-- HELPER FUNCTION FOR STREAK UPDATES
-- =====================================================

-- Function to update a single streak type
CREATE OR REPLACE FUNCTION update_single_streak(
    user_uuid UUID, 
    streak_type_name VARCHAR(50), 
    activity_date DATE
)
RETURNS VOID AS $$
DECLARE
    streak_record RECORD;
    days_since_last_activity INTEGER;
BEGIN
    -- Get current streak for this type
    SELECT * INTO streak_record
    FROM user_streaks 
    WHERE user_id = user_uuid 
    AND streak_type = streak_type_name;
    
    IF streak_record IS NOT NULL THEN
        -- Calculate days since last activity
        days_since_last_activity := activity_date - streak_record.last_activity_date;
        
        IF days_since_last_activity = 1 THEN
            -- Continue streak (consecutive days)
            UPDATE user_streaks 
            SET 
                current_streak = streak_record.current_streak + 1,
                longest_streak = GREATEST(streak_record.current_streak + 1, streak_record.longest_streak),
                last_activity_date = activity_date,
                updated_at = NOW()
            WHERE id = streak_record.id;
        ELSIF days_since_last_activity > 1 THEN
            -- Reset streak (gap in days)
            UPDATE user_streaks 
            SET 
                current_streak = 1,
                last_activity_date = activity_date,
                updated_at = NOW()
            WHERE id = streak_record.id;
        END IF;
        -- If days_since_last_activity = 0, keep current streak (same day activity)
    ELSE
        -- Create new streak record for this type
        INSERT INTO user_streaks (
            user_id, 
            streak_type, 
            current_streak, 
            longest_streak, 
            last_activity_date, 
            start_date
        ) VALUES (
            user_uuid, 
            streak_type_name, 
            1, 
            1, 
            activity_date, 
            activity_date
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger with the new function
CREATE TRIGGER trigger_update_learning_stats
    AFTER INSERT ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_learning_stats();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if the enhanced function with complete streaks was created successfully
SELECT 
    'Enhanced update_user_learning_stats function WITH COMPLETE STREAKS' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'update_user_learning_stats' 
        AND routine_schema = 'public'
    ) THEN '✅ CREATED' ELSE '❌ FAILED' END as status;

-- Check if the helper function was created
SELECT 
    'update_single_streak helper function' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'update_single_streak' 
        AND routine_schema = 'public'
    ) THEN '✅ CREATED' ELSE '❌ FAILED' END as status;

-- Check if the trigger was recreated successfully
SELECT 
    'trigger_update_learning_stats' as trigger_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_learning_stats' 
        AND trigger_schema = 'public'
    ) THEN '✅ RECREATED' ELSE '❌ FAILED' END as status;

-- Check current streak status for ALL types
SELECT 
    us.user_id,
    u.email,
    us.streak_type,
    us.current_streak,
    us.longest_streak,
    us.last_activity_date,
    us.start_date,
    us.updated_at
FROM user_streaks us
JOIN auth.users u ON us.user_id = u.id
ORDER BY us.streak_type, us.current_streak DESC;
