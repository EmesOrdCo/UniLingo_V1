-- Find terms with missing or empty CEFR levels
SELECT 
    english_term,
    topic_group,
    cefr_level,
    LENGTH(cefr_level) as level_length
FROM general_english_vocab
WHERE 
    cefr_level IS NULL 
    OR cefr_level = ''
    OR TRIM(cefr_level) = ''
    OR LENGTH(TRIM(cefr_level)) = 0
ORDER BY english_term;
