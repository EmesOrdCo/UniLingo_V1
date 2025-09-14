-- Consolidate Groups with 1-3 Words
-- Merges small groups into larger, more meaningful categories

-- A2 CONSOLIDATIONS
-- Merge small A2.1 groups into Daily Life & People
UPDATE general_english_vocab SET topic_group = 'Daily Life & People' WHERE cefr_level = 'A2' AND topic_group IN ('Household Activities', 'Daily Routines', 'Personal Care');

-- Merge small A2.2 groups into Communication & Objects
UPDATE general_english_vocab SET topic_group = 'Communication & Objects' WHERE cefr_level = 'A2' AND topic_group IN ('Food & Meals', 'Cooking & Ingredients');

-- Merge small A2.3 groups into Nature & Environment
UPDATE general_english_vocab SET topic_group = 'Nature & Environment' WHERE cefr_level = 'A2' AND topic_group IN ('Products & Items', 'Money & Payment');

-- Merge small A2.4 groups into Emotions & Work
UPDATE general_english_vocab SET topic_group = 'Emotions & Work' WHERE cefr_level = 'A2' AND topic_group IN ('Travel & Tourism', 'Directions & Location', 'Transportation');

-- Merge small A2.5 groups into Places & Activities
UPDATE general_english_vocab SET topic_group = 'Places & Activities' WHERE cefr_level = 'A2' AND topic_group IN ('Entertainment', 'Sports & Activities');

-- B2 CONSOLIDATIONS
-- Merge small B2.2 group into larger B2.2 category
UPDATE general_english_vocab SET topic_group = 'Descriptive Qualities (General)' WHERE cefr_level = 'B2' AND topic_group = 'Education & Learning';

-- C1 CONSOLIDATIONS
-- Merge very small C1 groups into larger categories
UPDATE general_english_vocab SET topic_group = 'Abstract Concepts & Qualities' WHERE cefr_level = 'C1' AND topic_group IN ('Actions & Opposition', 'Religion & Beliefs', 'Communication & Sound', 'Actions & Expectations', 'Political & Social Actions', 'Sports & Competition', 'Animals', 'Comparison & Opposition', 'Causes & Origins', 'Ownership & Possession', 'Physical Objects & Equipment', 'Titles & Forms of Address', 'Biological & Natural Terms');

-- Merge 2-word groups into larger categories
UPDATE general_english_vocab SET topic_group = 'Social & Political Terms' WHERE cefr_level = 'C1' AND topic_group IN ('Travel & Leisure', 'Actions of Authority & Rights', 'Actions & Tasks', 'Actions of Dismissal & Rejection', 'Colors', 'Places of Science & Work', 'People & Roles in Academia');

-- Merge 3-word groups into larger categories
UPDATE general_english_vocab SET topic_group = 'People & Roles in Business' WHERE cefr_level = 'C1' AND topic_group IN ('Describing Qualities', 'Places & Architecture', 'People & Roles in Art', 'Growth & Development');

-- VERIFICATION: Check for remaining small groups
SELECT cefr_level, unit_code, topic_group, COUNT(*) as word_count
FROM general_english_vocab
WHERE unit_code IS NOT NULL
GROUP BY cefr_level, unit_code, topic_group
HAVING COUNT(*) < 5
ORDER BY word_count ASC, cefr_level, unit_code;

-- FINAL DISTRIBUTION
SELECT cefr_level, unit_code, topic_group, COUNT(*) as word_count
FROM general_english_vocab
WHERE unit_code IS NOT NULL
GROUP BY cefr_level, unit_code, topic_group
ORDER BY cefr_level, unit_code, word_count DESC;
