-- A2 Level Unit Code Assignment
-- This script assigns unit_code values to A2 vocabulary based on topic groups

-- A2.1: Daily Life & Routines
UPDATE general_english_vocab 
SET unit_code = 'A2.1'
WHERE cefr_level = 'A2' AND topic_group IN (
    'Daily Routines', 'Household Activities', 'Personal Care'
);

-- A2.2: Food & Dining
UPDATE general_english_vocab 
SET unit_code = 'A2.2'
WHERE cefr_level = 'A2' AND topic_group IN (
    'Food & Meals', 'Cooking & Ingredients', 'Kitchen & Cooking'
);

-- A2.3: Shopping & Money
UPDATE general_english_vocab 
SET unit_code = 'A2.3'
WHERE cefr_level = 'A2' AND topic_group IN (
    'Shopping', 'Money & Payment', 'Products & Items'
);

-- A2.4: Transportation & Travel
UPDATE general_english_vocab 
SET unit_code = 'A2.4'
WHERE cefr_level = 'A2' AND topic_group IN (
    'Transportation', 'Travel & Tourism', 'Directions & Location'
);

-- A2.5: Entertainment & Weather
UPDATE general_english_vocab 
SET unit_code = 'A2.5'
WHERE cefr_level = 'A2' AND topic_group IN (
    'Entertainment', 'Sports & Activities', 'Weather & Environment'
);

-- Verify the unit code assignments
-- Check how many A2 words are assigned to each unit
SELECT 
    unit_code,
    COUNT(*) as word_count,
    COUNT(DISTINCT topic_group) as topic_group_count
FROM general_english_vocab 
WHERE cefr_level = 'A2' 
GROUP BY unit_code 
ORDER BY unit_code;

-- Check for any A2 words that don't have a unit_code assigned
SELECT 
    english_term,
    cefr_level,
    topic_group,
    unit_code
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND unit_code IS NULL
ORDER BY english_term;
