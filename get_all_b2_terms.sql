-- Get all B2 terms for analysis
SELECT english_term, spanish_translation, topic_group
FROM general_english_vocab 
WHERE cefr_level = 'B2'
ORDER BY english_term;
