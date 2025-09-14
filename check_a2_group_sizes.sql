-- Check A2 group sizes to verify 5-20 word requirement
SELECT 
    topic_group,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND topic_group IS NOT NULL
GROUP BY topic_group
ORDER BY word_count DESC;
