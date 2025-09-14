-- B1 Unit Code Assignment - Corrected with actual topic group names
-- Divides 26 topic groups into B1.1, B1.2, B1.3

-- Assign B1.1 unit codes (9 groups, ~181 words)
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'Verbs: Action & Movement';
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'Abstract Nouns & Concepts';
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'Adverbs & Degree Words';
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'Travel & Transport';
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'Safety';
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'People & Relationships';
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'Measurement & Quantity';
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'Home & Daily Life';
UPDATE general_english_vocab SET unit_code = 'B1.1' WHERE cefr_level = 'B1' AND topic_group = 'Clothing & Fashion';

-- Assign B1.2 unit codes (9 groups, ~170 words)
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Adjectives: Describing People & Things';
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Nature';
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Law';
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Emotions & Attitudes';
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Education & Learning';
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Finance & Shopping';
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Food & Drink';
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Adjectives: Feelings & Reactions';
UPDATE general_english_vocab SET unit_code = 'B1.2' WHERE cefr_level = 'B1' AND topic_group = 'Sports & Leisure';

-- Assign B1.3 unit codes (8 groups, ~153 words)
UPDATE general_english_vocab SET unit_code = 'B1.3' WHERE cefr_level = 'B1' AND topic_group = 'Verbs: Thinking & Communication';
UPDATE general_english_vocab SET unit_code = 'B1.3' WHERE cefr_level = 'B1' AND topic_group = 'Arts';
UPDATE general_english_vocab SET unit_code = 'B1.3' WHERE cefr_level = 'B1' AND topic_group = 'Science & Technology';
UPDATE general_english_vocab SET unit_code = 'B1.3' WHERE cefr_level = 'B1' AND topic_group = 'Work & Business';
UPDATE general_english_vocab SET unit_code = 'B1.3' WHERE cefr_level = 'B1' AND topic_group = 'Health & Body';
UPDATE general_english_vocab SET unit_code = 'B1.3' WHERE cefr_level = 'B1' AND topic_group = 'Places & Buildings';
UPDATE general_english_vocab SET unit_code = 'B1.3' WHERE cefr_level = 'B1' AND topic_group = 'Time & Sequence';

-- Verification queries:
SELECT unit_code, COUNT(*) as word_count 
FROM general_english_vocab 
WHERE cefr_level = 'B1' 
GROUP BY unit_code 
ORDER BY unit_code;

SELECT unit_code, topic_group, COUNT(*) as word_count 
FROM general_english_vocab 
WHERE cefr_level = 'B1' 
GROUP BY unit_code, topic_group 
ORDER BY unit_code, word_count DESC;
