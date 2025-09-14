-- B2 Unit Code Assignment
-- Assigns 36 B2 topic groups to B2.1, B2.2, B2.3, B2.4 units
-- Even split: 9 groups per unit

-- Assign B2.1 unit codes
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Abstract Concepts (Events & Outcomes)';
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Abstract Concepts (Formal)';
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Abstract Concepts (Ideas & Beliefs)';
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Abstract Concepts (State & Condition)';
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Abstract Concepts (Systems & Structures)';
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Adverbs of Manner';
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Adverbs, Measurement & Quantity';
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Arts, Media & Entertainment';
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Business & Finance';

-- Assign B2.2 unit codes
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Communication & Language';
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Connecting & Modifying Words';
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Descriptive Qualities (General)';
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Descriptive Qualities (Importance)';
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Descriptive Qualities (Negative)';
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Descriptive Qualities (Physical)';
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Descriptive Qualities (Size & Scale)';
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Education & Learning';
UPDATE general_english_vocab SET unit_code = 'B2.2' WHERE cefr_level = 'B2' AND topic_group = 'Feelings & Emotions';

-- Assign B2.3 unit codes
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'Food & Drink';
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'Formal & Social Actions';
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'Health & Body';
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'Law, Crime & Conflict';
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'Location & Direction';
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'Miscellaneous Nouns & Verbs';
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'Nature & Environment';
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'Objects, Materials & Clothing';
UPDATE general_english_vocab SET unit_code = 'B2.3' WHERE cefr_level = 'B2' AND topic_group = 'People & Roles (General)';

-- Assign B2.4 unit codes
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'People & Roles (Professional)';
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'Physical Actions & Motion';
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'Politics & Governance';
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'Structures, Places & Parts';
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'Thinking & Knowing';
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'Time & Sequence';
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'Verbs of Change & Development';
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'Verbs of Exchange & Removal';
UPDATE general_english_vocab SET unit_code = 'B2.4' WHERE cefr_level = 'B2' AND topic_group = 'Work & Employment';

-- Verification queries
SELECT unit_code, COUNT(*) as word_count FROM general_english_vocab WHERE cefr_level = 'B2' AND unit_code IS NOT NULL GROUP BY unit_code ORDER BY unit_code;

SELECT topic_group, unit_code, COUNT(*) as word_count FROM general_english_vocab WHERE cefr_level = 'B2' AND topic_group IS NOT NULL GROUP BY topic_group, unit_code ORDER BY unit_code, topic_group;
