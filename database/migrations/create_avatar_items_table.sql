-- Create avatar_items table for unlockable avatar customization options
-- Similar to arcade_games table but for avatar items
-- 
-- SECURITY: Each user's unlocks are stored separately in user_avatar_unlocks table
-- with RLS policies ensuring users can only see/modify their own unlocks.
-- When a user unlocks an item, it only affects their account - other users
-- must unlock the same item separately with their own XP.

CREATE TABLE IF NOT EXISTS avatar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'hair', 'facialHair', 'clothing', 'accessories', 'eyes', 'eyebrows', 'mouth', 'skinColor', 'hairColor', 'clotheColor'
  item_value TEXT NOT NULL, -- The actual value (e.g., 'bigHair', 'sunglasses', 'f2d3b1')
  xp_cost INTEGER NOT NULL DEFAULT 0, -- Cost to unlock (0 = free)
  rarity TEXT DEFAULT 'common', -- 'free', 'common', 'rare', 'epic', 'legendary'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_avatar_items_category ON avatar_items(category);
CREATE INDEX IF NOT EXISTS idx_avatar_items_active ON avatar_items(is_active);
CREATE INDEX IF NOT EXISTS idx_avatar_items_cost ON avatar_items(xp_cost);

-- Enable RLS (Row Level Security)
ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for avatar_items (everyone can read active items)
CREATE POLICY "Anyone can view active avatar items"
  ON avatar_items FOR SELECT
  USING (is_active = true);

-- Create user_avatar_unlocks table to track what users have unlocked
CREATE TABLE IF NOT EXISTS user_avatar_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES avatar_items(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  xp_spent INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, item_id)
);

-- Enable RLS for user_avatar_unlocks
ALTER TABLE user_avatar_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_avatar_unlocks
CREATE POLICY "Users can view their own unlocks"
  ON user_avatar_unlocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocks"
  ON user_avatar_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for user_avatar_unlocks
CREATE INDEX IF NOT EXISTS idx_user_avatar_unlocks_user_id ON user_avatar_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_avatar_unlocks_item_id ON user_avatar_unlocks(item_id);

-- Insert free/default avatar items (these are always available)
INSERT INTO avatar_items (category, item_value, xp_cost, rarity) VALUES
-- Free skin colors
('skinColor', 'f2d3b1', 0, 'free'),
('skinColor', 'edb98a', 0, 'free'),
('skinColor', 'd08b5b', 0, 'free'),
('skinColor', 'ae5d29', 0, 'free'),
('skinColor', '614335', 0, 'free'),

-- Free hair colors
('hairColor', '2c1b18', 0, 'free'),
('hairColor', '4a312c', 0, 'free'),
('hairColor', '724133', 0, 'free'),
('hairColor', 'a55728', 0, 'free'),
('hairColor', 'b58143', 0, 'free'),

-- Free hair styles
('hair', 'Blank', 0, 'free'),
('hair', 'shortWaved', 0, 'free'),
('hair', 'shortFlat', 0, 'free'),
('hair', 'shortRound', 0, 'free'),

-- Free facial hair
('facialHair', 'Blank', 0, 'free'),

-- Free clothing
('clothing', 'Blank', 0, 'free'),
('clothing', 'shirtCrewNeck', 0, 'free'),

-- Free clothing colors
('clotheColor', '3c4f5c', 0, 'free'),
('clotheColor', 'e6e6e6', 0, 'free'),
('clotheColor', 'ffffff', 0, 'free'),
('clotheColor', '262e33', 0, 'free'),

-- Free eyes
('eyes', 'default', 0, 'free'),

-- Free eyebrows
('eyebrows', 'default', 0, 'free'),

-- Free mouth
('mouth', 'default', 0, 'free'),

-- Free accessories
('accessories', 'Blank', 0, 'free');

-- Insert common items (5 XP)
INSERT INTO avatar_items (category, item_value, xp_cost, rarity) VALUES
-- Common hair colors
('hairColor', 'd6b370', 5, 'common'),
('hairColor', 'ecdcbf', 5, 'common'),

-- Common hair styles
('hair', 'bob', 5, 'common'),
('hair', 'bun', 5, 'common'),
('hair', 'curly', 5, 'common'),
('hair', 'longButNotTooLong', 5, 'common'),
('hair', 'shaggy', 5, 'common'),
('hair', 'shortCurly', 5, 'common'),

-- Common facial hair
('facialHair', 'beardLight', 5, 'common'),
('facialHair', 'beardMedium', 5, 'common'),

-- Common clothing
('clothing', 'shirtScoopNeck', 5, 'common'),
('clothing', 'shirtVNeck', 5, 'common'),
('clothing', 'graphicShirt', 5, 'common'),

-- Common clothing colors
('clotheColor', '65c9ff', 5, 'common'),
('clotheColor', '5199e4', 5, 'common'),
('clotheColor', 'ff5c5c', 5, 'common'),
('clotheColor', 'ff488e', 5, 'common'),
('clotheColor', '5fad47', 5, 'common'),

-- Common eyes
('eyes', 'happy', 5, 'common'),
('eyes', 'wink', 5, 'common'),
('eyes', 'surprised', 5, 'common'),

-- Common eyebrows
('eyebrows', 'defaultNatural', 5, 'common'),
('eyebrows', 'raisedExcited', 5, 'common'),

-- Common mouth
('mouth', 'smile', 5, 'common'),
('mouth', 'concerned', 5, 'common'),

-- Common accessories
('accessories', 'round', 5, 'common'),
('accessories', 'prescription01', 5, 'common');

-- Insert rare items (10 XP)
INSERT INTO avatar_items (category, item_value, xp_cost, rarity) VALUES
-- Rare hair colors
('hairColor', 'f59797', 10, 'rare'),

-- Rare hair styles
('hair', 'bigHair', 10, 'rare'),
('hair', 'curvy', 10, 'rare'),
('hair', 'dreads', 10, 'rare'),
('hair', 'fro', 10, 'rare'),
('hair', 'miaWallace', 10, 'rare'),
('hair', 'shaggyMullet', 10, 'rare'),
('hair', 'shavedSides', 10, 'rare'),
('hair', 'straight01', 10, 'rare'),
('hair', 'straight02', 10, 'rare'),
('hair', 'theCaesar', 10, 'rare'),

-- Rare facial hair
('facialHair', 'beardMajestic', 10, 'rare'),
('facialHair', 'moustacheFancy', 10, 'rare'),
('facialHair', 'moustacheMagnum', 10, 'rare'),

-- Rare clothing
('clothing', 'blazerAndShirt', 10, 'rare'),
('clothing', 'blazerAndSweater', 10, 'rare'),
('clothing', 'collarAndSweater', 10, 'rare'),
('clothing', 'overall', 10, 'rare'),

-- Rare clothing colors
('clotheColor', '25557c', 10, 'rare'),
('clotheColor', '929598', 10, 'rare'),
('clotheColor', 'ff67ff', 10, 'rare'),
('clotheColor', 'b8e986', 10, 'rare'),
('clotheColor', 'f8d25c', 10, 'rare'),
('clotheColor', 'e59338', 10, 'rare'),

-- Rare eyes
('eyes', 'hearts', 10, 'rare'),
('eyes', 'eyeRoll', 10, 'rare'),
('eyes', 'squint', 10, 'rare'),
('eyes', 'winkWacky', 10, 'rare'),

-- Rare eyebrows
('eyebrows', 'angry', 10, 'rare'),
('eyebrows', 'raisedExcitedNatural', 10, 'rare'),
('eyebrows', 'sadConcerned', 10, 'rare'),
('eyebrows', 'unibrowNatural', 10, 'rare'),

-- Rare mouth
('mouth', 'disbelief', 10, 'rare'),
('mouth', 'eating', 10, 'rare'),
('mouth', 'grimace', 10, 'rare'),
('mouth', 'tongue', 10, 'rare'),
('mouth', 'twinkle', 10, 'rare'),

-- Rare accessories
('accessories', 'prescription02', 10, 'rare'),
('accessories', 'sunglasses', 10, 'rare');

-- Insert epic items (15 XP)
INSERT INTO avatar_items (category, item_value, xp_cost, rarity) VALUES
-- Epic hair styles
('hair', 'frida', 15, 'epic'),
('hair', 'frizzle', 15, 'epic'),
('hair', 'froBand', 15, 'epic'),
('hair', 'hat', 15, 'epic'),
('hair', 'hijab', 15, 'epic'),
('hair', 'sides', 15, 'epic'),
('hair', 'straightAndStrand', 15, 'epic'),
('hair', 'theCaesarAndSidePart', 15, 'epic'),
('hair', 'turban', 15, 'epic'),
('hair', 'winterHat1', 15, 'epic'),
('hair', 'winterHat02', 15, 'epic'),
('hair', 'winterHat03', 15, 'epic'),
('hair', 'winterHat04', 15, 'epic'),

-- Epic clothing
('clothing', 'hoodie', 15, 'epic'),

-- Epic eyes
('eyes', 'closed', 15, 'epic'),
('eyes', 'cry', 15, 'epic'),
('eyes', 'side', 15, 'epic'),
('eyes', 'xDizzy', 15, 'epic'),

-- Epic eyebrows
('eyebrows', 'angryNatural', 15, 'epic'),
('eyebrows', 'flatNatural', 15, 'epic'),
('eyebrows', 'frownNatural', 15, 'epic'),
('eyebrows', 'sadConcernedNatural', 15, 'epic'),
('eyebrows', 'upDown', 15, 'epic'),
('eyebrows', 'upDownNatural', 15, 'epic'),

-- Epic mouth
('mouth', 'sad', 15, 'epic'),
('mouth', 'screamOpen', 15, 'epic'),
('mouth', 'serious', 15, 'epic'),
('mouth', 'vomit', 15, 'epic'),

-- Epic accessories
('accessories', 'eyepatch', 15, 'epic'),
('accessories', 'kurt', 15, 'epic'),
('accessories', 'wayfarers', 15, 'epic');

-- Create a function to get user's unlocked avatar items
CREATE OR REPLACE FUNCTION get_user_unlocked_avatar_items(p_user_id UUID)
RETURNS TABLE (
  item_id UUID,
  category TEXT,
  item_value TEXT,
  xp_cost INTEGER,
  rarity TEXT,
  unlocked_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id as item_id,
    ai.category,
    ai.item_value,
    ai.xp_cost,
    ai.rarity,
    uau.unlocked_at
  FROM avatar_items ai
  LEFT JOIN user_avatar_unlocks uau ON ai.id = uau.item_id AND uau.user_id = p_user_id
  WHERE ai.is_active = true
  AND (ai.xp_cost = 0 OR uau.id IS NOT NULL) -- Free items or unlocked items
  ORDER BY ai.category, ai.xp_cost, ai.item_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can unlock an avatar item
CREATE OR REPLACE FUNCTION can_unlock_avatar_item(p_user_id UUID, p_item_id UUID)
RETURNS TABLE (
  can_unlock BOOLEAN,
  available_xp INTEGER,
  item_cost INTEGER,
  message TEXT
) AS $$
DECLARE
  v_item avatar_items%ROWTYPE;
  v_available_xp INTEGER;
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
  SELECT available_xp INTO v_available_xp 
  FROM user_learning_stats 
  WHERE user_id = p_user_id;
  
  IF v_available_xp IS NULL THEN
    v_available_xp := 0;
  END IF;
  
  -- Check if user has enough XP
  IF v_available_xp >= v_item.xp_cost THEN
    RETURN QUERY SELECT true, v_available_xp, v_item.xp_cost, 'Can unlock'::TEXT;
  ELSE
    RETURN QUERY SELECT false, v_available_xp, v_item.xp_cost, 
      FORMAT('Need %s XP (You have %s XP)', v_item.xp_cost, v_available_xp)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to unlock an avatar item
CREATE OR REPLACE FUNCTION unlock_avatar_item(p_user_id UUID, p_item_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_item avatar_items%ROWTYPE;
  v_can_unlock RECORD;
  v_available_xp INTEGER;
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
    SET available_xp = available_xp - v_item.xp_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND available_xp >= v_item.xp_cost;
    
    -- Check if XP was actually spent
    GET DIAGNOSTICS v_available_xp = ROW_COUNT;
    IF v_available_xp = 0 THEN
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
GRANT SELECT ON avatar_items TO authenticated;
GRANT SELECT, INSERT ON user_avatar_unlocks TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_unlocked_avatar_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_unlock_avatar_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_avatar_item(UUID, UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE avatar_items IS 'Available avatar customization items that can be unlocked with XP';
COMMENT ON TABLE user_avatar_unlocks IS 'Tracks which avatar items each user has unlocked';
COMMENT ON COLUMN avatar_items.xp_cost IS 'XP cost to unlock this item (0 = free)';
COMMENT ON COLUMN avatar_items.rarity IS 'Item rarity: free, common, rare, epic, legendary';
COMMENT ON COLUMN user_avatar_unlocks.xp_spent IS 'Amount of XP spent to unlock this item';
