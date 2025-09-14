-- Get all terms without a CEFR level, showing topic_group and english_term
SELECT 
    english_term,
    topic_group,
    cefr_level
FROM general_english_vocab
WHERE cefr_level IS NULL
ORDER BY english_term;
