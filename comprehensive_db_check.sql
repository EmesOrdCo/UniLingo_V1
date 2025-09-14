-- Comprehensive Database Check for NULL values

-- 1. Check for terms without CEFR level
SELECT 
    'Terms without CEFR level' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE cefr_level IS NULL OR cefr_level = '' OR TRIM(cefr_level) = '';

-- 2. Check for empty strings in CEFR level
SELECT 
    'Terms with empty CEFR level' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE cefr_level = '';

-- 3. Check for whitespace-only CEFR levels
SELECT 
    'Terms with whitespace-only CEFR level' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE TRIM(cefr_level) = '' AND cefr_level IS NOT NULL;

-- 4. Sample of terms without CEFR level
SELECT 
    english_term,
    topic_group,
    unit_code,
    cefr_level
FROM general_english_vocab 
WHERE cefr_level IS NULL OR cefr_level = '' OR TRIM(cefr_level) = ''
LIMIT 10;

-- 5. Check for terms without topic_group (all CEFR levels)
SELECT 
    cefr_level,
    COUNT(*) as missing_topic_group
FROM general_english_vocab 
WHERE topic_group IS NULL
GROUP BY cefr_level
ORDER BY cefr_level;

-- 6. Check for terms without unit_code (all CEFR levels)
SELECT 
    cefr_level,
    COUNT(*) as missing_unit_code
FROM general_english_vocab 
WHERE unit_code IS NULL
GROUP BY cefr_level
ORDER BY cefr_level;

-- 7. Sample terms without topic_group
SELECT 
    english_term,
    cefr_level,
    unit_code
FROM general_english_vocab 
WHERE topic_group IS NULL
LIMIT 20;

-- 8. Sample terms without unit_code
SELECT 
    english_term,
    cefr_level,
    topic_group
FROM general_english_vocab 
WHERE unit_code IS NULL
LIMIT 20;

-- 9. Total database overview
SELECT 
    'Total database terms' as metric,
    COUNT(*) as count
FROM general_english_vocab;

-- 10. Check for any terms with NULL english_term
SELECT 
    'Terms with NULL english_term' as metric,
    COUNT(*) as count
FROM general_english_vocab 
WHERE english_term IS NULL;
