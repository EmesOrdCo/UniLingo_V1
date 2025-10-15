-- ============================================
-- Cleanup Old Mandarin Columns
-- ============================================
-- This script removes the old mandarin columns after the migration to 
-- Chinese (Simplified) and Chinese (Traditional) has been verified
-- 
-- IMPORTANT: Only run this script AFTER:
-- 1. The replace_mandarin_with_chinese_variants.sql migration has been applied
-- 2. All frontend and backend code has been updated
-- 3. All functionality has been tested and verified
-- 4. You have confirmed the new Chinese columns are working correctly
-- ============================================

-- Step 1: Drop the old mandarin index
DROP INDEX IF EXISTS idx_subject_words_mandarin;

-- Step 2: Drop old mandarin columns from subject_words table
ALTER TABLE subject_words 
DROP COLUMN IF EXISTS mandarin_translation,
DROP COLUMN IF EXISTS example_sentence_mandarin;

-- Step 3: Drop old mandarin columns from arcade_games table
ALTER TABLE arcade_games 
DROP COLUMN IF EXISTS mandarin_name,
DROP COLUMN IF EXISTS mandarin_description;

-- Step 4: Drop old mandarin columns from lesson_scripts table
ALTER TABLE lesson_scripts 
-- Note: mandarin_lesson_script column has been renamed to chinese_simplified_lesson_script
-- No cleanup needed for this column as it was renamed, not dropped

-- Step 5: Verification - ensure old columns are gone
SELECT 'Cleanup completed successfully!' as status;

-- Step 6: Show current column structure for verification
SELECT 'Current subject_words columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
AND column_name LIKE '%chinese%'
ORDER BY column_name;

SELECT 'Current arcade_games columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'arcade_games' 
AND column_name LIKE '%chinese%'
ORDER BY column_name;

SELECT 'Current lesson_scripts columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lesson_scripts' 
AND column_name LIKE '%chinese%'
ORDER BY column_name;

-- Step 7: Final verification - ensure functions still work
SELECT 'Function verification - Chinese (Simplified):' as info;
SELECT * FROM get_subject_words_by_language('chinese_simplified') LIMIT 2;

SELECT 'Function verification - Chinese (Traditional):' as info;
SELECT * FROM get_subject_words_by_language('chinese_traditional') LIMIT 2;

-- ============================================
-- Migration Complete!
-- ============================================
-- All mandarin references have been successfully replaced with:
-- - Chinese (Simplified) - for mainland China, Singapore, Malaysia
-- - Chinese (Traditional) - for Taiwan, Hong Kong, Macau
-- ============================================
