-- C1 Unit Code Assignment
-- Assigns 33 C1 topic groups (5+ terms) to C1.1, C1.2, C1.3 units
-- Even split: 11 groups per unit
-- Only includes groups with 5 or more terms

-- Assign C1.1 unit codes
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Abstract Concepts & Qualities';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Physical Actions & Movement';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Social & Political Terms';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Measurement & Mathematics';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Adverbs of Manner & Degree';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'People & Roles in Business';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Feelings & Emotions';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Financial & Business Terms';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Describing Personality & Behavior';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Art, Music & Media';
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group = 'Adverbs of Time & Frequency';

-- Assign C1.2 unit codes
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Actions & Achievements';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Food & Drink';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Family & Relationships';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Nature & Environment';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Health & Well-being';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Actions & Changes';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Feelings & Social Interactions';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Communication & Social Interactions';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Descriptions & Definitions';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Medical & Scientific Terms';
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group = 'Technology & Internet';

-- Assign C1.3 unit codes
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Daily Routines & Hygiene';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Physical Qualities & Conditions';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Social & Cultural Terms';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Scientific & Academic Terms';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Financial & Business Actions';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Clothing & Apparel';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Body & Health';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Materials & Substances';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Negative Conditions & States';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Communication & Academic Terms';
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group = 'Travel & Transport';

-- Verification queries
SELECT unit_code, COUNT(*) as word_count FROM general_english_vocab WHERE cefr_level = 'C1' AND unit_code IS NOT NULL GROUP BY unit_code ORDER BY unit_code;

SELECT topic_group, unit_code, COUNT(*) as word_count FROM general_english_vocab WHERE cefr_level = 'C1' AND topic_group IS NOT NULL AND unit_code IS NOT NULL GROUP BY topic_group, unit_code ORDER BY unit_code, topic_group;

-- Check remaining unassigned C1 words
SELECT COUNT(*) as unassigned_words FROM general_english_vocab WHERE cefr_level = 'C1' AND unit_code IS NULL;
