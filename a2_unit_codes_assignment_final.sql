-- A2 Unit Code Assignment (Final - 21 Groups)
-- Distributes A2 topic groups evenly across A2.1, A2.2, A2.3, A2.4, A2.5

-- A2.1: 64 words, 3 groups
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Work & Career';
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Family & Relationships';
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Objects & Materials';

-- A2.2: 65 words, 4 groups
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Communication & Language';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Nature & Environment';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Colors & Appearance';
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Sports & Recreation';

-- A2.3: 68 words, 5 groups
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Actions & Movement';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Actions & Processes';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Places & Locations';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Time & Scheduling';
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Transportation & Travel';

-- A2.4: 64 words, 4 groups
UPDATE general_english_vocab SET unit_code = 'A2.4' WHERE cefr_level = 'A2' AND topic_group = 'Daily Life & Personal Care';
UPDATE general_english_vocab SET unit_code = 'A2.4' WHERE cefr_level = 'A2' AND topic_group = 'Emotions & Feelings';
UPDATE general_english_vocab SET unit_code = 'A2.4' WHERE cefr_level = 'A2' AND topic_group = 'Education & Learning';
UPDATE general_english_vocab SET unit_code = 'A2.4' WHERE cefr_level = 'A2' AND topic_group = 'Entertainment & Media';

-- A2.5: 68 words, 5 groups
UPDATE general_english_vocab SET unit_code = 'A2.5' WHERE cefr_level = 'A2' AND topic_group = 'Abstract Concepts & Qualities';
UPDATE general_english_vocab SET unit_code = 'A2.5' WHERE cefr_level = 'A2' AND topic_group = 'Time & Space Concepts';
UPDATE general_english_vocab SET unit_code = 'A2.5' WHERE cefr_level = 'A2' AND topic_group = 'Money & Finance';
UPDATE general_english_vocab SET unit_code = 'A2.5' WHERE cefr_level = 'A2' AND topic_group = 'Health & Medical';
UPDATE general_english_vocab SET unit_code = 'A2.5' WHERE cefr_level = 'A2' AND topic_group = 'General Concepts';

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
