-- A2 Organization Verification
-- Run this after executing a2_fixed_semantic_groups.sql and a2_unit_codes_assignment.sql

-- 1. Check total A2 words
SELECT 
    'Total A2 words' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE cefr_level = 'A2';

-- 2. Check words without topic_group
SELECT 
    'A2 words without topic_group' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND topic_group IS NULL;

-- 3. Check words without unit_code
SELECT 
    'A2 words without unit_code' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND unit_code IS NULL;

-- 4. Topic group sizes (should all be 5+ words)
SELECT 
    topic_group,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND topic_group IS NOT NULL
GROUP BY topic_group
ORDER BY word_count DESC;

-- 5. Unit code distribution
SELECT 
    unit_code,
    COUNT(DISTINCT topic_group) as group_count,
    COUNT(*) as total_words
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND unit_code IS NOT NULL
GROUP BY unit_code
ORDER BY unit_code;

-- 6. Detailed breakdown by unit and topic
SELECT 
    unit_code,
    topic_group,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND unit_code IS NOT NULL
GROUP BY unit_code, topic_group
ORDER BY unit_code, word_count DESC;

-- 7. Check for any groups with less than 5 words (should be empty)
SELECT 
    topic_group,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND topic_group IS NOT NULL
GROUP BY topic_group
HAVING COUNT(*) < 5
ORDER BY word_count;
