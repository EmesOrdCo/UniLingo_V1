-- =====================================================
-- Remove Ready Player Me Character Tables
-- =====================================================
-- Run this in your Supabase SQL Editor to clean up
-- =====================================================

-- =====================================================
-- 1. DROP TABLES (in correct order due to foreign keys)
-- =====================================================

-- Drop user_character_items first (has foreign keys)
DROP TABLE IF EXISTS user_character_items CASCADE;

-- Drop character_shop_items
DROP TABLE IF EXISTS character_shop_items CASCADE;

-- Drop user_characters
DROP TABLE IF EXISTS user_characters CASCADE;

-- =====================================================
-- 2. DROP FUNCTIONS (if they exist)
-- =====================================================

-- Drop any functions we created
DROP FUNCTION IF EXISTS add_character_experience(UUID, INTEGER);
DROP FUNCTION IF EXISTS purchase_character_item(UUID, TEXT, TEXT);

-- =====================================================
-- 3. VERIFY CLEANUP
-- =====================================================

-- Check that tables are gone (should return empty results)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_characters', 'character_shop_items', 'user_character_items');

-- =====================================================
-- END OF CLEANUP
-- =====================================================
