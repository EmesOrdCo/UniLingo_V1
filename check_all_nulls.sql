-- Check entire database for NULL values in unit_code and topic_group

-- 1. Total count of all terms
SELECT 
    'Total terms' as metric,
    COUNT(*) as count
FROM general_english_vocab;

-- 2. Terms without topic_group
SELECT 
    'Terms without topic_group' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE topic_group IS NULL;

-- 3. Terms without unit_code
SELECT 
    'Terms without unit_code' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE unit_code IS NULL;

-- 4. Terms without both topic_group AND unit_code
SELECT 
    'Terms without both topic_group AND unit_code' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE topic_group IS NULL AND unit_code IS NULL;

-- 5. Breakdown by CEFR level - missing topic_group
SELECT 
    cefr_level,
    COUNT(*) as missing_topic_group
FROM general_english_vocab 
WHERE topic_group IS NULL
GROUP BY cefr_level
ORDER BY cefr_level;

-- 6. Breakdown by CEFR level - missing unit_code
SELECT 
    cefr_level,
    COUNT(*) as missing_unit_code
FROM general_english_vocab 
WHERE unit_code IS NULL
GROUP BY cefr_level
ORDER BY cefr_level;

-- 7. Complete status by CEFR level
SELECT 
    cefr_level,
    COUNT(*) as total_terms,
    COUNT(topic_group) as with_topic_group,
    COUNT(unit_code) as with_unit_code,
    COUNT(*) - COUNT(topic_group) as missing_topic_group,
    COUNT(*) - COUNT(unit_code) as missing_unit_code
FROM general_english_vocab 
GROUP BY cefr_level
ORDER BY cefr_level;
