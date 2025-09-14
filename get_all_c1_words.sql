-- Get all C1 words from the database
SELECT english_term
FROM general_english_vocab
WHERE cefr_level = 'C1'
ORDER BY english_term;
