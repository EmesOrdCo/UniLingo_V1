-- A2 Unit Code Assignment (3 Units)
-- Distributes A2 topic groups across A2.1, A2.2, A2.3

-- A2.1: 108 words, 6 groups
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Work & Career';
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Time & Space Concepts';
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Nature & Environment';
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Money & Finance';
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Entertainment & Media';
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Time & Scheduling';

-- A2.2: 112 words, 8 groups
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Communication & Language';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Abstract Concepts & Qualities';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Actions & Processes';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Education & Learning';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Places & Locations';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Health & Medical';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Transportation & Travel';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'General Concepts';

-- A2.3: 109 words, 7 groups
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Actions & Movement';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Daily Life & Personal Care';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Emotions & Feelings';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Family & Relationships';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Colors & Appearance';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Objects & Materials';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Sports & Recreation';

-- Verification: Check distribution
SELECT unit_code, topic_group, COUNT(*) as word_count
FROM general_english_vocab
WHERE cefr_level = 'A2' AND unit_code IS NOT NULL
GROUP BY unit_code, topic_group
ORDER BY unit_code, word_count DESC;

-- Summary by unit
SELECT unit_code, COUNT(DISTINCT topic_group) as group_count, COUNT(*) as total_words
FROM general_english_vocab
WHERE cefr_level = 'A2' AND unit_code IS NOT NULL
GROUP BY unit_code
ORDER BY unit_code;
