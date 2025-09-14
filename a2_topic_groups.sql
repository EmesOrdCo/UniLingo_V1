-- A2 Level Topic Group Assignment (47 topics → A2.1 to A2.5)
-- This script assigns topic_group values to existing A2 vocabulary
-- Focus: Only updating topic_group column

-- First, let's see what A2 vocabulary currently exists
-- SELECT english_term, cefr_level FROM general_english_vocab WHERE cefr_level = 'A2' ORDER BY english_term;

-- Update A2 vocabulary with appropriate topic groups
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

-- Verify the topic group assignments
-- Check how many A2 words are assigned to each topic group
SELECT 
    topic_group,
    COUNT(*) as word_count
FROM general_english_vocab 
WHERE cefr_level = 'A2' 
GROUP BY topic_group 
ORDER BY topic_group;

-- Check for any A2 words that don't have a topic group assigned
SELECT 
    english_term,
    cefr_level,
    topic_group
FROM general_english_vocab 
WHERE cefr_level = 'A2' AND topic_group IS NULL
ORDER BY english_term;
