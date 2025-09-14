-- Organize 396 Terms Without Unit Codes
-- Consolidates topic groups and assigns unit codes

-- A2 CONSOLIDATION AND UNIT ASSIGNMENT
-- A2.1: Daily Life & People
UPDATE general_english_vocab SET topic_group = 'Daily Life & People' WHERE cefr_level = 'A2' AND topic_group IN ('Daily Activities & Planning', 'Time & Events', 'Family Members and Relationships', 'Family and Relationships', 'Relationships and Roles', 'People and Society', 'Miscellaneous');
UPDATE general_english_vocab SET unit_code = 'A2.1' WHERE cefr_level = 'A2' AND topic_group = 'Daily Life & People';

-- A2.2: Communication & Objects
UPDATE general_english_vocab SET topic_group = 'Communication & Objects' WHERE cefr_level = 'A2' AND topic_group IN ('Communication Vocabulary', 'Communication and Interaction', 'Language and Communication', 'Verbs of Communication', 'Objects and Materials', 'Technology and Communication');
UPDATE general_english_vocab SET unit_code = 'A2.2' WHERE cefr_level = 'A2' AND topic_group = 'Communication & Objects';

-- A2.3: Nature & Environment
UPDATE general_english_vocab SET topic_group = 'Nature & Environment' WHERE cefr_level = 'A2' AND topic_group IN ('Nature and Environment', 'Environment & Nature');
UPDATE general_english_vocab SET unit_code = 'A2.3' WHERE cefr_level = 'A2' AND topic_group = 'Nature & Environment';

-- A2.4: Emotions & Work
UPDATE general_english_vocab SET topic_group = 'Emotions & Work' WHERE cefr_level = 'A2' AND topic_group IN ('Emotions and Attitudes', 'Feelings and Reactions', 'Career Development', 'Decision Making & Evaluation');
UPDATE general_english_vocab SET unit_code = 'A2.4' WHERE cefr_level = 'A2' AND topic_group = 'Emotions & Work';

-- A2.5: Places & Activities
UPDATE general_english_vocab SET topic_group = 'Places & Activities' WHERE cefr_level = 'A2' AND topic_group IN ('Places and Locations', 'Health & Medicine', 'Leisure & Entertainment', 'Money and Numbers', 'Travel and Transportation', 'Legal and Formal Terms', 'Ideas and Concepts', 'Concepts', 'Descriptive Words', 'Colors and Actions', 'Contrast and Exception', 'Everyday Vocabulary', 'Nouns and Verbs', 'Seasons & Time');
UPDATE general_english_vocab SET unit_code = 'A2.5' WHERE cefr_level = 'A2' AND topic_group = 'Places & Activities';

-- B2 ASSIGNMENT
UPDATE general_english_vocab SET topic_group = 'Academic & Technical' WHERE cefr_level = 'B2' AND english_term IN ('cat', 'definitely', 'differ', 'distinction', 'distinguish', 'draft', 'ease', 'emphasis', 'equivalent', 'guard', 'habit', 'index', 'input', 'isolate', 'label', 'mathematics', 'numerous', 'output', 'presentation', 'reasonable', 'recognition', 'respectively', 'restrict', 'retain', 'secure', 'variable');
UPDATE general_english_vocab SET unit_code = 'B2.1' WHERE cefr_level = 'B2' AND topic_group = 'Academic & Technical';

-- C1 ASSIGNMENT (keep existing topic groups)
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group IS NOT NULL;

-- C2 ASSIGNMENT
UPDATE general_english_vocab SET topic_group = 'Advanced Concepts' WHERE cefr_level = 'C2' AND english_term IN ('curious', 'density', 'diversity', 'knife', 'limitation', 'summarize', 'trick', 'wander');
UPDATE general_english_vocab SET unit_code = 'C2.1' WHERE cefr_level = 'C2' AND topic_group = 'Advanced Concepts';

-- VERIFICATION
SELECT cefr_level, unit_code, topic_group, COUNT(*) as word_count FROM general_english_vocab WHERE unit_code IS NOT NULL GROUP BY cefr_level, unit_code, topic_group ORDER BY cefr_level, unit_code, word_count DESC;
