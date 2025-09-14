-- Output all 396 terms without unit_code with their topic groups
-- This will display the actual terms, not just select them

SELECT 
    english_term || ' | ' || COALESCE(topic_group, 'NULL') as output
FROM general_english_vocab
WHERE 
    unit_code IS NULL 
    OR unit_code = ''
    OR TRIM(unit_code) = ''
    OR LENGTH(TRIM(unit_code)) = 0
ORDER BY english_term
LIMIT 500;
