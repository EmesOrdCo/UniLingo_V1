-- C2 Unit Code Assignment (Evenly Balanced)
-- C2.1: 10 groups, 140 words
-- C2.2: 10 groups, 137 words
-- Total: 277 words, difference: 3 words

-- Assign C2.1 unit codes
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Verbs of Action & Change';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Adverbs & Conjunctions';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Nature & Animals';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Law, Politics, & Governance';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Verbs of Sensation & Influence';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Technology & Objects';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Concepts & Ideas (Abstract Nouns)';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Communication Acts';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Body & Health';
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Food & Drink';

-- Assign C2.2 unit codes
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Descriptive Adjectives';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Processes & States (Abstract Nouns)';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Feelings & Personal States';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Structures & Quantities';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Household & Materials';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Technical & Conceptual Adjectives';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Social Issues & Roles';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Language & Literature';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Arts, Sports & Entertainment';
UPDATE general_english_vocab SET unit_code = 'C2.2' WHERE cefr_level = 'C2' AND topic_group = 'Family & Relationships';

-- Verification queries
SELECT unit_code, COUNT(*) as word_count FROM general_english_vocab WHERE cefr_level = 'C2' GROUP BY unit_code ORDER BY unit_code;

SELECT unit_code, topic_group, COUNT(*) as word_count FROM general_english_vocab WHERE cefr_level = 'C2' GROUP BY unit_code, topic_group ORDER BY unit_code, word_count DESC;
