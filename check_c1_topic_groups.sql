-- Check how many topic_groups are in C1
SELECT 
    COUNT(DISTINCT topic_group) as total_topic_groups
FROM general_english_vocab 
WHERE cefr_level = 'C1';

-- Also show the actual topic groups
SELECT 
    topic_group,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'C1' AND topic_group IS NOT NULL
GROUP BY topic_group
ORDER BY topic_group;
