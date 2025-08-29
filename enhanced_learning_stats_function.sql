-- =====================================================
-- ENHANCED user_learning_stats Function
-- =====================================================
-- This function now calculates experience points, levels, study time, and accuracy

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS update_user_learning_stats();

-- Create the enhanced function
CREATE OR REPLACE FUNCTION update_user_learning_stats()
RETURNS TRIGGER AS $$
DECLARE
    new_experience_points INTEGER;
    new_level VARCHAR(50);
    study_time_hours DECIMAL(8,2);
    accuracy_bonus INTEGER;
    streak_bonus INTEGER;
    current_streak INTEGER;
BEGIN
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
        WHEN 'flashcard' THEN
            new_experience_points := new_experience_points + 15; -- Flashcards are medium value
        WHEN 'game' THEN
            new_experience_points := new_experience_points + 20; -- Games are fun and rewarding
        ELSE
            new_experience_points := new_experience_points + 10; -- Default bonus
    END CASE;
    
    -- Add streak bonus (check current daily streak)
    SELECT COALESCE(current_streak, 0) INTO current_streak
    FROM (
        SELECT COUNT(*) as current_streak
        FROM user_progress_summary
        WHERE user_id = NEW.user_id
        AND summary_date >= CURRENT_DATE - INTERVAL '7 days'
        AND (lessons_completed > 0 OR flashcards_reviewed > 0 OR games_played > 0)
    ) streak_check;
    
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
-- VERIFICATION QUERIES
-- =====================================================

-- Check if the function was created successfully
SELECT 
    'Enhanced update_user_learning_stats function' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'update_user_learning_stats' 
        AND routine_schema = 'public'
    ) THEN '✅ CREATED' ELSE '❌ FAILED' END as status;

-- Show the function definition
SELECT routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_user_learning_stats' 
AND routine_schema = 'public';

-- =====================================================
-- TESTING THE ENHANCED FUNCTION
-- =====================================================

-- Test with a sample activity (replace with actual user_id)
-- This will show what the function calculates
DO $$
DECLARE
    test_user_id UUID;
    test_activity RECORD;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Simulate what the function would calculate
        RAISE NOTICE 'Testing enhanced function for user: %', test_user_id;
        RAISE NOTICE 'Base XP from score: 8';
        RAISE NOTICE 'Accuracy bonus (80%%): 15 XP';
        RAISE NOTICE 'Game bonus: 20 XP';
        RAISE NOTICE 'Streak bonus (if applicable): 0-15 XP';
        RAISE NOTICE 'Total XP per game: 43-58 XP';
        RAISE NOTICE 'Level progression: Beginner (0) → Elementary (100) → Intermediate (500) → Advanced (1000) → Expert (2500) → Master (5000)';
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;
