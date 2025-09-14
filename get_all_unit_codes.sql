-- Get all unit_code values in the database
SELECT DISTINCT unit_code
FROM general_english_vocab
WHERE unit_code IS NOT NULL
ORDER BY unit_code;
