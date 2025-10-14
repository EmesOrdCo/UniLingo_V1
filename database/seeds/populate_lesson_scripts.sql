-- Populate lesson_scripts with unique subjects from subject_words

-- Step 1: Show all unique subjects in subject_words
SELECT 'Unique subjects in subject_words:' as info;
SELECT DISTINCT subject, COUNT(*) as word_count
FROM subject_words 
GROUP BY subject 
ORDER BY subject;

-- Step 2: Insert unique subjects into lesson_scripts (with empty script fields)
INSERT INTO lesson_scripts (subject_name, english_script_writing, english_script_roleplay, french_script_writing, french_script_roleplay)
SELECT DISTINCT 
    subject as subject_name,
    NULL as english_script_writing,
    NULL as english_script_roleplay,
    NULL as french_script_writing,
    NULL as french_script_roleplay
FROM subject_words
WHERE subject NOT IN (SELECT subject_name FROM lesson_scripts);

-- Step 3: Show the populated lesson_scripts table
SELECT 'Lesson scripts after population:' as info;
SELECT 
    subject_name,
    CASE 
        WHEN english_script_writing IS NULL THEN 'Empty'
        ELSE 'Has Content'
    END as writing_script_status,
    CASE 
        WHEN french_script_writing IS NULL THEN 'Empty'
        ELSE 'Has Content'
    END as french_script_status,
    created_at
FROM lesson_scripts 
ORDER BY subject_name;

-- Step 4: Verify the relationship works
SELECT 'Verification - subjects with word counts and script status:' as info;
SELECT 
    sw.subject,
    COUNT(*) as word_count,
    CASE 
        WHEN ls.subject_name IS NOT NULL THEN '✅ Has Script Entry'
        ELSE '❌ No Script Entry'
    END as script_status
FROM subject_words sw
LEFT JOIN lesson_scripts ls ON sw.subject = ls.subject_name
GROUP BY sw.subject, ls.subject_name
ORDER BY sw.subject;
