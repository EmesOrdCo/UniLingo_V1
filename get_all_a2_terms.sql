-- Get all A2 terms with their current topic_group
SELECT 
    english_term,
    topic_group
FROM general_english_vocab 
WHERE cefr_level = 'A2' 
ORDER BY english_term;
