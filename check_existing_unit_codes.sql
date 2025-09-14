-- Check which unit_codes actually exist in the database
SELECT 
    unit_code,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE unit_code IS NOT NULL
GROUP BY unit_code
ORDER BY unit_code;
