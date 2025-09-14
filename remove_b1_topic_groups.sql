-- Remove all B1 topic_group and unit_code entries
-- This script clears all topic_group and unit_code assignments for B1 level words

UPDATE general_english_vocab 
SET topic_group = NULL, unit_code = NULL
WHERE cefr_level = 'B1';

-- Verify the removal
SELECT COUNT(*) as remaining_b1_groups
FROM general_english_vocab 
WHERE cefr_level = 'B1' AND topic_group IS NOT NULL;

SELECT COUNT(*) as remaining_b1_unit_codes
FROM general_english_vocab 
WHERE cefr_level = 'B1' AND unit_code IS NOT NULL;

-- Show total B1 words (should all have NULL topic_group and unit_code now)
SELECT COUNT(*) as total_b1_words
FROM general_english_vocab 
WHERE cefr_level = 'B1';
