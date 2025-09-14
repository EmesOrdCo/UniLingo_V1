-- Get all 500 B1 terms for manual semantic grouping
-- This script outputs all B1 words so you can create proper semantic groups yourself

SELECT english_term 
FROM general_english_vocab 
WHERE cefr_level = 'B1' 
ORDER BY english_term;
