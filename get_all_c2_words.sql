-- Get all C2 words from the database
SELECT english_term
FROM general_english_vocab
WHERE cefr_level = 'C2'
ORDER BY english_term;
