-- Clear the english_script_roleplay column to start fresh

-- Show current data before clearing
SELECT 'Before clearing - sample of current data:' as info;
SELECT subject_name, 
       CASE 
           WHEN english_script_roleplay IS NULL THEN 'NULL'
           WHEN LENGTH(english_script_roleplay) = 0 THEN 'EMPTY'
           ELSE 'HAS CONTENT (' || LENGTH(english_script_roleplay) || ' chars)'
       END as script_status
FROM lesson_scripts 
ORDER BY subject_name 
LIMIT 10;

-- Count how many records have content
SELECT 'Records with roleplay content:' as info;
SELECT COUNT(*) as records_with_content
FROM lesson_scripts 
WHERE english_script_roleplay IS NOT NULL 
  AND LENGTH(english_script_roleplay) > 0;

-- Clear the english_script_roleplay column
UPDATE lesson_scripts 
SET english_script_roleplay = NULL,
    updated_at = NOW()
WHERE english_script_roleplay IS NOT NULL;

-- Verify the clearing worked
SELECT 'After clearing - verification:' as info;
SELECT COUNT(*) as records_with_content
FROM lesson_scripts 
WHERE english_script_roleplay IS NOT NULL 
  AND LENGTH(english_script_roleplay) > 0;

-- Show sample of cleared data
SELECT 'Sample of cleared data:' as info;
SELECT subject_name, 
       CASE 
           WHEN english_script_roleplay IS NULL THEN 'NULL ✓'
           ELSE 'STILL HAS CONTENT ❌'
       END as script_status
FROM lesson_scripts 
ORDER BY subject_name 
LIMIT 10;

SELECT 'english_script_roleplay column cleared successfully!' as result;
