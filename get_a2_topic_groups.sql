-- Get all A2 topic groups from the database
SELECT DISTINCT topic_group
FROM general_english_vocab
WHERE cefr_level = 'A2' 
  AND topic_group IS NOT NULL
ORDER BY topic_group;
