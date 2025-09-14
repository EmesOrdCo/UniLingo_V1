-- FIX A2 ORGANIZATION - Restore proper A2 structure
-- This script will restore the original A2 topic groups and unit assignments

-- Step 1: Reset ALL A2 topic groups and unit codes to NULL
UPDATE general_english_vocab 
SET topic_group = NULL, unit_code = NULL
WHERE cefr_level = 'A2';

-- Step 2: Restore original A2 topic groups and units
-- A2.1: Daily Life & Routines (9-10 topics)
UPDATE general_english_vocab 
SET topic_group = 'Daily Routines'
WHERE cefr_level = 'A2' AND english_term IN (
    'morning', 'afternoon', 'evening', 'night', 'breakfast', 'lunch', 'dinner',
    'weekday', 'weekend', 'schedule'
);

UPDATE general_english_vocab 
SET topic_group = 'Household Activities'
WHERE cefr_level = 'A2' AND english_term IN (
    'cook', 'clean', 'wash', 'iron', 'vacuum', 'organize', 'repair', 'maintain',
    'garden', 'shopping'
);

UPDATE general_english_vocab 
SET topic_group = 'Personal Care'
WHERE cefr_level = 'A2' AND english_term IN (
    'shower', 'bath', 'brush', 'comb', 'shave', 'makeup', 'clothes', 'dress',
    'shoes', 'jewelry'
);

-- A2.2: Food & Dining (9-10 topics)
UPDATE general_english_vocab 
SET topic_group = 'Food & Meals'
WHERE cefr_level = 'A2' AND english_term IN (
    'restaurant', 'cafe', 'menu', 'order', 'waiter', 'bill', 'tip', 'delicious',
    'tasty', 'spicy'
);

UPDATE general_english_vocab 
SET topic_group = 'Cooking & Ingredients'
WHERE cefr_level = 'A2' AND english_term IN (
    'recipe', 'ingredient', 'spice', 'herb', 'sauce', 'oil', 'butter', 'flour',
    'sugar', 'salt'
);

UPDATE general_english_vocab 
SET topic_group = 'Kitchen & Cooking'
WHERE cefr_level = 'A2' AND english_term IN (
    'stove', 'oven', 'microwave', 'refrigerator', 'freezer', 'sink', 'cabinet',
    'cutting board', 'knife', 'spoon'
);

-- A2.3: Shopping & Money (9-10 topics)
UPDATE general_english_vocab 
SET topic_group = 'Shopping'
WHERE cefr_level = 'A2' AND english_term IN (
    'store', 'shop', 'mall', 'market', 'supermarket', 'bakery', 'pharmacy',
    'clothing store', 'bookstore', 'electronics'
);

UPDATE general_english_vocab 
SET topic_group = 'Money & Payment'
WHERE cefr_level = 'A2' AND english_term IN (
    'money', 'cash', 'credit card', 'debit card', 'coin', 'bill', 'change',
    'price', 'cost', 'expensive'
);

UPDATE general_english_vocab 
SET topic_group = 'Products & Items'
WHERE cefr_level = 'A2' AND english_term IN (
    'product', 'item', 'brand', 'size', 'color', 'quality', 'quantity',
    'discount', 'sale', 'bargain'
);

-- A2.4: Transportation & Travel (9-10 topics)
UPDATE general_english_vocab 
SET topic_group = 'Transportation'
WHERE cefr_level = 'A2' AND english_term IN (
    'car', 'bus', 'train', 'plane', 'taxi', 'bicycle', 'motorcycle', 'truck',
    'driver', 'passenger'
);

UPDATE general_english_vocab 
SET topic_group = 'Travel & Tourism'
WHERE cefr_level = 'A2' AND english_term IN (
    'travel', 'trip', 'vacation', 'holiday', 'hotel', 'hostel', 'booking',
    'reservation', 'passport', 'visa'
);

UPDATE general_english_vocab 
SET topic_group = 'Directions & Location'
WHERE cefr_level = 'A2' AND english_term IN (
    'direction', 'north', 'south', 'east', 'west', 'left', 'right', 'straight',
    'corner', 'intersection'
);

-- A2.5: Entertainment & Weather (9-10 topics)
UPDATE general_english_vocab 
SET topic_group = 'Entertainment'
WHERE cefr_level = 'A2' AND english_term IN (
    'movie', 'film', 'cinema', 'theater', 'concert', 'show', 'performance',
    'actor', 'actress', 'director'
);

UPDATE general_english_vocab 
SET topic_group = 'Sports & Activities'
WHERE cefr_level = 'A2' AND english_term IN (
    'sport', 'football', 'soccer', 'basketball', 'tennis', 'swimming', 'running',
    'cycling', 'gym', 'exercise'
);

UPDATE general_english_vocab 
SET topic_group = 'Weather & Environment'
WHERE cefr_level = 'A2' AND english_term IN (
    'weather', 'sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'hot', 'cold',
    'warm', 'cool'
);

-- Step 3: Assign unit codes
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

-- Step 4: Verify the restoration
SELECT 
    topic_group,
    unit_code,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'A2' 
GROUP BY topic_group, unit_code
ORDER BY unit_code, topic_group;
