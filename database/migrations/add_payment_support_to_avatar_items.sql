-- Add payment support to avatar items
-- This migration adds fields to support Stripe payments for avatar items

-- Add price fields to avatar_items table
ALTER TABLE avatar_items 
ADD COLUMN IF NOT EXISTS price_gbp DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_paid_item BOOLEAN DEFAULT FALSE;

-- Add payment tracking to user_avatar_unlocks table
ALTER TABLE user_avatar_unlocks 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) DEFAULT NULL;

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_user_avatar_unlocks_payment_intent 
ON user_avatar_unlocks(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_avatar_items_paid 
ON avatar_items(is_paid_item);

-- Update the eyepatch item to be a paid item (£99)
UPDATE avatar_items 
SET 
  price_gbp = 99.00,
  is_paid_item = TRUE,
  xp_cost = 0, -- Remove XP cost for paid items
  rarity = 'legendary', -- Make it legendary since it's expensive
  updated_at = NOW()
WHERE category = 'accessories' AND item_value = 'eyepatch';

-- Create a function to check if user can purchase an avatar item
CREATE OR REPLACE FUNCTION can_purchase_avatar_item(p_user_id UUID, p_item_id UUID)
RETURNS TABLE (
  can_purchase BOOLEAN,
  item_price DECIMAL(10,2),
  message TEXT
) AS $$
DECLARE
  v_item avatar_items%ROWTYPE;
  v_already_owned BOOLEAN;
BEGIN
  -- Get the item details
  SELECT * INTO v_item FROM avatar_items WHERE id = p_item_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Item not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already owned
  SELECT EXISTS(
    SELECT 1 FROM user_avatar_unlocks 
    WHERE user_id = p_user_id AND item_id = p_item_id
  ) INTO v_already_owned;
  
  IF v_already_owned THEN
    RETURN QUERY SELECT false, v_item.price_gbp, 'Already owned'::TEXT;
    RETURN;
  END IF;
  
  -- Check if it's a paid item
  IF NOT v_item.is_paid_item OR v_item.price_gbp IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Item not available for purchase'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, v_item.price_gbp, 'Can purchase'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to purchase an avatar item (for webhook use)
CREATE OR REPLACE FUNCTION purchase_avatar_item(
  p_user_id UUID, 
  p_item_id UUID, 
  p_payment_intent_id TEXT,
  p_payment_amount DECIMAL(10,2)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_item avatar_items%ROWTYPE;
  v_can_purchase RECORD;
BEGIN
  -- Get the item details
  SELECT * INTO v_item FROM avatar_items WHERE id = p_item_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Item not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if can purchase
  SELECT * INTO v_can_purchase FROM can_purchase_avatar_item(p_user_id, p_item_id);
  
  IF NOT v_can_purchase.can_purchase THEN
    RETURN QUERY SELECT false, v_can_purchase.message;
    RETURN;
  END IF;
  
  -- Record the purchase
  INSERT INTO user_avatar_unlocks (
    user_id, 
    item_id, 
    xp_spent,
    payment_intent_id,
    purchased_at,
    payment_amount
  )
  VALUES (
    p_user_id, 
    p_item_id, 
    0, -- No XP spent for paid items
    p_payment_intent_id,
    NOW(),
    p_payment_amount
  )
  ON CONFLICT (user_id, item_id) DO NOTHING;
  
  RETURN QUERY SELECT true, 'Item purchased successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_purchase_avatar_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_avatar_item(UUID, UUID, TEXT, DECIMAL) TO authenticated;

-- Add comments
COMMENT ON COLUMN avatar_items.price_gbp IS 'Price in GBP for paid items (NULL for XP-only items)';
COMMENT ON COLUMN avatar_items.stripe_price_id IS 'Stripe Price ID for this item';
COMMENT ON COLUMN avatar_items.is_paid_item IS 'Whether this item requires payment (vs XP)';
COMMENT ON COLUMN user_avatar_unlocks.payment_intent_id IS 'Stripe Payment Intent ID for paid purchases';
COMMENT ON COLUMN user_avatar_unlocks.purchased_at IS 'When the item was purchased (for paid items)';
COMMENT ON COLUMN user_avatar_unlocks.payment_amount IS 'Amount paid for this item';

-- Show summary of changes
SELECT 
  'Updated eyepatch to paid item:' as message,
  COUNT(CASE WHEN is_paid_item = true THEN 1 END) as paid_items,
  COUNT(CASE WHEN is_paid_item = false THEN 1 END) as xp_items,
  COUNT(*) as total_items
FROM avatar_items 
WHERE is_active = true;
