-- Fix ambiguous column reference in avatar unlock functions
-- This script fixes the "column reference 'available_xp' is ambiguous" error

-- Drop and recreate the can_unlock_avatar_item function with fixed variable names
DROP FUNCTION IF EXISTS can_unlock_avatar_item(UUID, UUID);

CREATE OR REPLACE FUNCTION can_unlock_avatar_item(p_user_id UUID, p_item_id UUID)
RETURNS TABLE (
  can_unlock BOOLEAN,
  available_xp INTEGER,
  item_cost INTEGER,
  message TEXT
) AS $$
DECLARE
  v_item avatar_items%ROWTYPE;
  v_user_xp INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Get the item details
  SELECT * INTO v_item FROM avatar_items WHERE id = p_item_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'Item not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM user_avatar_unlocks 
    WHERE user_id = p_user_id AND item_id = p_item_id
  ) INTO v_already_unlocked;
  
  IF v_already_unlocked THEN
    RETURN QUERY SELECT false, 0, v_item.xp_cost, 'Already unlocked'::TEXT;
    RETURN;
  END IF;
  
  -- If free item, always allow
  IF v_item.xp_cost = 0 THEN
    RETURN QUERY SELECT true, 0, 0, 'Free item'::TEXT;
    RETURN;
  END IF;
  
  -- Get user's available XP
  SELECT available_xp INTO v_user_xp 
  FROM user_learning_stats 
  WHERE user_id = p_user_id;
  
  IF v_user_xp IS NULL THEN
    v_user_xp := 0;
  END IF;
  
  -- Check if user has enough XP
  IF v_user_xp >= v_item.xp_cost THEN
    RETURN QUERY SELECT true, v_user_xp, v_item.xp_cost, 'Can unlock'::TEXT;
  ELSE
    RETURN QUERY SELECT false, v_user_xp, v_item.xp_cost, 
      FORMAT('Need %s XP (You have %s XP)', v_item.xp_cost, v_user_xp)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the unlock_avatar_item function with fixed variable names
DROP FUNCTION IF EXISTS unlock_avatar_item(UUID, UUID);

CREATE OR REPLACE FUNCTION unlock_avatar_item(p_user_id UUID, p_item_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_item avatar_items%ROWTYPE;
  v_can_unlock RECORD;
  v_rows_affected INTEGER;
BEGIN
  -- Get the item details
  SELECT * INTO v_item FROM avatar_items WHERE id = p_item_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Item not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if can unlock
  SELECT * INTO v_can_unlock FROM can_unlock_avatar_item(p_user_id, p_item_id);
  
  IF NOT v_can_unlock.can_unlock THEN
    RETURN QUERY SELECT false, v_can_unlock.message;
    RETURN;
  END IF;
  
  -- If item has a cost, spend the XP
  IF v_item.xp_cost > 0 THEN
    -- Spend XP using the existing XPService logic
    UPDATE user_learning_stats 
    SET available_xp = user_learning_stats.available_xp - v_item.xp_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND user_learning_stats.available_xp >= v_item.xp_cost;
    
    -- Check if XP was actually spent
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected = 0 THEN
      RETURN QUERY SELECT false, 'Failed to spend XP'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Unlock the item
  INSERT INTO user_avatar_unlocks (user_id, item_id, xp_spent)
  VALUES (p_user_id, p_item_id, v_item.xp_cost)
  ON CONFLICT (user_id, item_id) DO NOTHING;
  
  RETURN QUERY SELECT true, 'Item unlocked successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_unlock_avatar_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_avatar_item(UUID, UUID) TO authenticated;
