-- Count A2 topic groups
SELECT 
    COUNT(DISTINCT topic_group) as total_topic_groups
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND topic_group IS NOT NULL;
