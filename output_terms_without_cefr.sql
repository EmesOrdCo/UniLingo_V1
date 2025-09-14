-- Output all terms without CEFR levels with their topic groups
-- This will display the actual terms, not just select them

SELECT 
    english_term || ' | ' || COALESCE(topic_group, 'NULL') as output
FROM general_english_vocab
WHERE 
    cefr_level IS NULL 
    OR cefr_level = ''
    OR TRIM(cefr_level) = ''
    OR LENGTH(TRIM(cefr_level)) = 0
ORDER BY english_term;
