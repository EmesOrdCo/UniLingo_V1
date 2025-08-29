-- Fix the missing unique constraints that the triggers need

-- 1. Add unique constraint for user_progress_summary (user_id, summary_date)
ALTER TABLE user_progress_summary 
ADD CONSTRAINT user_progress_summary_user_date_unique 
UNIQUE (user_id, summary_date);

-- 2. Add unique constraint for user_learning_stats (user_id)
ALTER TABLE user_learning_stats 
ADD CONSTRAINT user_learning_stats_user_unique 
UNIQUE (user_id);

-- 3. Verify the constraints were added
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('user_progress_summary', 'user_learning_stats')
AND constraint_type = 'UNIQUE';
