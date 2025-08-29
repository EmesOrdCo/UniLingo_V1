-- =====================================================
-- BACKFILL EXPERIENCE POINTS FOR EXISTING USERS
-- =====================================================
-- This script recalculates experience points and levels for users who already have activities

-- Function to recalculate experience points for a specific user
CREATE OR REPLACE FUNCTION recalculate_user_experience(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    total_xp INTEGER := 0;
    new_level VARCHAR(50);
    user_activities RECORD;
    activity_xp INTEGER;
    accuracy_bonus INTEGER;
    type_bonus INTEGER;
    streak_bonus INTEGER;
    current_streak INTEGER;
    result JSON;
BEGIN
    -- Reset experience points to 0
    total_xp := 0;
    
    -- Loop through all activities for this user
    FOR user_activities IN 
        SELECT 
            activity_type,
            score,
            accuracy_percentage,
            duration_seconds,
            completed_at
        FROM user_activities 
        WHERE user_id = user_uuid
        ORDER BY completed_at ASC
    LOOP
        -- Base XP from score
        activity_xp := user_activities.score;
        
        -- Add accuracy bonus
        IF user_activities.accuracy_percentage IS NOT NULL THEN
            IF user_activities.accuracy_percentage >= 90 THEN
                accuracy_bonus := 20;
            ELSIF user_activities.accuracy_percentage >= 80 THEN
                accuracy_bonus := 15;
            ELSIF user_activities.accuracy_percentage >= 70 THEN
                accuracy_bonus := 10;
            ELSE
                accuracy_bonus := 5;
            END IF;
            activity_xp := activity_xp + accuracy_bonus;
        END IF;
        
        -- Add activity type bonus
        CASE user_activities.activity_type
            WHEN 'lesson' THEN type_bonus := 25;
            WHEN 'flashcard' THEN type_bonus := 15;
            WHEN 'game' THEN type_bonus := 20;
            ELSE type_bonus := 10;
        END CASE;
        activity_xp := activity_xp + type_bonus;
        
        -- Add to total
        total_xp := total_xp + activity_xp;
    END LOOP;
    
    -- Determine level based on total XP
    IF total_xp >= 5000 THEN
        new_level := 'Master';
    ELSIF total_xp >= 2500 THEN
        new_level := 'Expert';
    ELSIF total_xp >= 1000 THEN
        new_level := 'Advanced';
    ELSIF total_xp >= 500 THEN
        new_level := 'Intermediate';
    ELSIF total_xp >= 100 THEN
        new_level := 'Elementary';
    ELSE
        new_level := 'Beginner';
    END IF;
    
    -- Update the user's learning stats
    UPDATE user_learning_stats 
    SET 
        experience_points = total_xp,
        current_level = new_level,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Return result
    result := json_build_object(
        'user_id', user_uuid,
        'total_experience_points', total_xp,
        'new_level', new_level,
        'activities_processed', (SELECT COUNT(*) FROM user_activities WHERE user_id = user_uuid)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate ALL users' experience points
CREATE OR REPLACE FUNCTION recalculate_all_users_experience()
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    total_users INTEGER := 0;
    successful_updates INTEGER := 0;
    failed_updates INTEGER := 0;
    results JSON[] := '{}';
    user_result JSON;
BEGIN
    -- Loop through all users with learning stats
    FOR user_record IN 
        SELECT user_id FROM user_learning_stats
    LOOP
        BEGIN
            user_result := recalculate_user_experience(user_record.user_id);
            results := array_append(results, user_result);
            successful_updates := successful_updates + 1;
        EXCEPTION WHEN OTHERS THEN
            failed_updates := failed_updates + 1;
            results := array_append(results, json_build_object(
                'user_id', user_record.user_id,
                'error', SQLERRM
            ));
        END;
        
        total_users := total_users + 1;
    END LOOP;
    
    RETURN json_build_object(
        'total_users_processed', total_users,
        'successful_updates', successful_updates,
        'failed_updates', failed_updates,
        'results', results
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXECUTION COMMANDS
-- =====================================================

-- Option 1: Recalculate for a specific user (replace with actual user_id)
-- SELECT recalculate_user_experience('2c8cf5dd-d246-4bcc-9878-29742ad9e59f');

-- Option 2: Recalculate for ALL users
-- SELECT recalculate_all_users_experience();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check current experience points and levels
SELECT 
    uls.user_id,
    u.email,
    uls.experience_points,
    uls.current_level,
    uls.total_score_earned,
    uls.total_games_played,
    uls.total_lessons_completed,
    uls.total_flashcards_reviewed,
    uls.updated_at
FROM user_learning_stats uls
JOIN auth.users u ON uls.user_id = u.id
ORDER BY uls.experience_points DESC;

-- Check if functions were created
SELECT 
    routine_name,
    routine_type,
    CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.routines 
WHERE routine_name IN ('recalculate_user_experience', 'recalculate_all_users_experience')
AND routine_schema = 'public';
