-- C1 Unit Code Assignment (4 Units)
-- Distributes C1 topic groups across C1.1, C1.2, C1.3, C1.4

-- First, let's see what C1 topic groups we have
SELECT 
    topic_group,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'C1' AND topic_group IS NOT NULL
GROUP BY topic_group
ORDER BY word_count DESC;

-- Now assign unit codes to C1 words based on topic groups
-- (This will be updated once we see the actual topic groups)

-- Example distribution (to be updated based on actual topic groups):
-- C1.1: First 25% of topic groups
-- C1.2: Second 25% of topic groups  
-- C1.3: Third 25% of topic groups
-- C1.4: Fourth 25% of topic groups

-- Reset all C1 unit codes first
UPDATE general_english_vocab
SET unit_code = NULL
WHERE cefr_level = 'C1';

-- C1.1: Abstract Concepts & Core Actions (11 groups, ~100 words)
UPDATE general_english_vocab SET unit_code = 'C1.1' WHERE cefr_level = 'C1' AND topic_group IN (
    'Abstract Concepts & Qualities', 'Actions & Achievements', 'Actions & Changes', 
    'Actions of Discovery & Investigation', 'Adverbs of Manner & Degree', 'Adverbs of Time & Frequency',
    'Communication & Academic Actions', 'Communication & Academic Terms', 'Communication & Media',
    'Describing Feelings & Qualities', 'Describing Location & Movement'
);

-- C1.2: People, Society & Business (11 groups, ~100 words)
UPDATE general_english_vocab SET unit_code = 'C1.2' WHERE cefr_level = 'C1' AND topic_group IN (
    'People & Roles in Business', 'Social & Political Terms', 'Communication & Social Interactions',
    'Describing Personality & Behavior', 'Family & Relationships', 'Feelings & Emotions',
    'Feelings & Social Interactions', 'Financial & Business Actions', 'Financial & Business Terms',
    'Organizations & Groups', 'Social & Cultural Terms'
);

-- C1.3: Daily Life & Health (11 groups, ~100 words)
UPDATE general_english_vocab SET unit_code = 'C1.3' WHERE cefr_level = 'C1' AND topic_group IN (
    'Daily Routines & Hygiene', 'Body & Health', 'Clothing & Apparel', 'Food & Drink',
    'Health & Well-being', 'Household & Domestic Items', 'Materials & Substances',
    'Physical Qualities & Conditions', 'Social Events & Occasions', 'Travel & Transport',
    'Light & Sound'
);

-- C1.4: Science, Nature & Technology (11 groups, ~100 words)
UPDATE general_english_vocab SET unit_code = 'C1.4' WHERE cefr_level = 'C1' AND topic_group IN (
    'Art, Music & Media', 'Geographical & Political Terms', 'Medical & Scientific Terms',
    'Nature & Environment', 'Negative Conditions & States', 'Physical Actions & Movement',
    'Scientific & Academic Terms', 'Technology & Internet', 'Measurement & Comparison',
    'Measurement & Mathematics', 'Descriptions & Definitions'
);

-- Verification: Check distribution
SELECT 
    unit_code,
    topic_group,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'C1' AND unit_code IS NOT NULL
GROUP BY unit_code, topic_group
ORDER BY unit_code, word_count DESC;

-- Summary by unit
SELECT 
    unit_code,
    COUNT(DISTINCT topic_group) as group_count,
    COUNT(*) as total_words
FROM general_english_vocab 
WHERE cefr_level = 'C1' AND unit_code IS NOT NULL
GROUP BY unit_code
ORDER BY unit_code;
