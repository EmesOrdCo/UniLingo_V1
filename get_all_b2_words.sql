-- Get all B2 words in alphabetical order
SELECT english_term 
FROM general_english_vocab 
WHERE cefr_level = 'B2' 
ORDER BY english_term;