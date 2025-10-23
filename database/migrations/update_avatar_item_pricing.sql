-- Update avatar item pricing from 5, 10, 15 to 25, 50, 100
-- This migration updates the XP costs for avatar items to make them more expensive

-- Update items that cost 5 XP to cost 25 XP
UPDATE avatar_items 
SET xp_cost = 25, updated_at = NOW()
WHERE xp_cost = 5;

-- Update items that cost 10 XP to cost 50 XP  
UPDATE avatar_items 
SET xp_cost = 50, updated_at = NOW()
WHERE xp_cost = 10;

-- Update items that cost 15 XP to cost 100 XP
UPDATE avatar_items 
SET xp_cost = 100, updated_at = NOW()
WHERE xp_cost = 15;

-- Show summary of changes
SELECT 
  'Updated pricing summary:' as message,
  COUNT(CASE WHEN xp_cost = 25 THEN 1 END) as items_now_25_xp,
  COUNT(CASE WHEN xp_cost = 50 THEN 1 END) as items_now_50_xp,
  COUNT(CASE WHEN xp_cost = 100 THEN 1 END) as items_now_100_xp,
  COUNT(CASE WHEN xp_cost = 0 THEN 1 END) as free_items,
  COUNT(*) as total_items
FROM avatar_items 
WHERE is_active = true;
