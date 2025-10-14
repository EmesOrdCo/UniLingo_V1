-- ============================================
-- Add CEFR Level to Subject Words
-- ============================================
-- This script adds cefr_level column to subject_words table
-- and populates it from lesson_scripts if the association exists

-- Step 1: Check current structure of both tables
SELECT 'Current subject_words table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
ORDER BY ordinal_position;

SELECT 'Current lesson_scripts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_scripts' 
ORDER BY ordinal_position;

-- Step 2: Add cefr_level column to subject_words if it doesn't exist
ALTER TABLE subject_words 
ADD COLUMN IF NOT EXISTS cefr_level TEXT;

-- Add comment
COMMENT ON COLUMN subject_words.cefr_level IS 'CEFR language level (A1, A2, B1, B2, C1, C2) associated with the subject';

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_subject_words_cefr_level ON subject_words(cefr_level);

-- Step 4: Populate subject_words with cefr_level from lesson_scripts
-- Based on the schema, lesson_scripts has both subject_name and cefr_level columns
UPDATE subject_words sw
SET cefr_level = ls.cefr_level
FROM lesson_scripts ls
WHERE sw.subject = ls.subject_name
AND ls.cefr_level IS NOT NULL;

-- Show how many rows were updated
SELECT 'Rows updated:' as info, COUNT(*) as updated_count
FROM subject_words 
WHERE cefr_level IS NOT NULL;

-- Step 5: Show the results
SELECT 'Updated subject_words table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subject_words' 
ORDER BY ordinal_position;

-- Step 6: Show sample data with cefr_level
SELECT 'Sample subject_words with cefr_level:' as info;
SELECT 
  subject,
  cefr_level,
  COUNT(*) as word_count
FROM subject_words
WHERE cefr_level IS NOT NULL
GROUP BY subject, cefr_level
ORDER BY subject
LIMIT 20;

-- Step 7: Show statistics
SELECT 'CEFR Level Distribution:' as info;
SELECT 
  cefr_level,
  COUNT(DISTINCT subject) as unique_subjects,
  COUNT(*) as total_words
FROM subject_words
WHERE cefr_level IS NOT NULL
GROUP BY cefr_level
ORDER BY 
  CASE cefr_level
    WHEN 'A1' THEN 1
    WHEN 'A2' THEN 2
    WHEN 'B1' THEN 3
    WHEN 'B2' THEN 4
    WHEN 'C1' THEN 5
    WHEN 'C2' THEN 6
    ELSE 7
  END;

-- ============================================
-- Manual Population (if needed)
-- ============================================
-- If lesson_scripts doesn't have cefr_level, you can manually set it
-- Example patterns:

/*
-- Option 1: Update specific subjects with their CEFR level
UPDATE subject_words
SET cefr_level = 'A1'
WHERE subject IN ('Saying Hello', 'Meeting New People', 'Basic Greetings');

UPDATE subject_words
SET cefr_level = 'A2'
WHERE subject IN ('Shopping', 'Food & Dining', 'Travel');

-- Option 2: Update based on subject name patterns
UPDATE subject_words
SET cefr_level = 'A1'
WHERE subject LIKE '%Basic%' OR subject LIKE '%Simple%';

-- Option 3: First add cefr_level to lesson_scripts, then populate subject_words
ALTER TABLE lesson_scripts 
ADD COLUMN IF NOT EXISTS cefr_level TEXT;

-- Manually set cefr_level in lesson_scripts
UPDATE lesson_scripts SET cefr_level = 'A1' WHERE subject_name = 'Saying Hello';
UPDATE lesson_scripts SET cefr_level = 'A1' WHERE subject_name = 'Meeting New People';
-- ... etc ...

-- Then run this script again to propagate to subject_words
*/

-- ============================================
-- Success Message
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Added cefr_level column to subject_words table';
  RAISE NOTICE '📊 Column: cefr_level (TEXT)';
  RAISE NOTICE '🔍 Populated from lesson_scripts table using subject_name → subject mapping';
  RAISE NOTICE '📈 Check the statistics above to see the CEFR level distribution';
END $$;

