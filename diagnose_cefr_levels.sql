-- Diagnostic queries to understand CEFR level distribution

-- 1. Check all possible CEFR level values (including NULL)
SELECT 
    cefr_level,
    COUNT(*) as count
FROM general_english_vocab
GROUP BY cefr_level
ORDER BY cefr_level;

-- 2. Check for empty strings instead of NULL
SELECT 
    english_term,
    topic_group,
    cefr_level
FROM general_english_vocab
WHERE cefr_level = '' OR cefr_level IS NULL
ORDER BY english_term;

-- 3. Show sample of all data to see what's there
SELECT 
    english_term,
    topic_group,
    cefr_level
FROM general_english_vocab
ORDER BY english_term
LIMIT 20;

-- 4. Check total count of records
SELECT COUNT(*) as total_records FROM general_english_vocab;
