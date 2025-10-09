-- =====================================================
-- UniLingo Character & Shop System Database Schema
-- =====================================================
-- This creates all tables needed for avatar customization
-- and purchasable items system
-- =====================================================

-- =====================================================
-- 1. USER CHARACTERS TABLE
-- =====================================================
-- Stores each user's avatar/character data
CREATE TABLE IF NOT EXISTS user_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Avatar data (for Ready Player Me or custom system)
  avatar_url TEXT, -- RPM: GLB file URL, Custom: JSON data
  avatar_id TEXT,  -- Unique avatar identifier
  avatar_type TEXT DEFAULT 'ready_player_me', -- 'ready_player_me', 'custom_2d', 'dicebear'
  
  -- Customization data for custom systems
  custom_appearance JSONB DEFAULT '{}'::JSONB,
  
  -- Items
  purchased_items TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of item IDs
  equipped_items TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Currently equipped items
  
  -- Metadata
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_characters_level ON user_characters(level);

-- =====================================================
-- 2. CHARACTER SHOP ITEMS TABLE
-- =====================================================
-- Catalog of all purchasable items/accessories
CREATE TABLE IF NOT EXISTS character_shop_items (
  id TEXT PRIMARY KEY, -- e.g., 'hat_wizard_01', 'hair_style_15'
  
  -- Item details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'hair', 'outfit', 'accessory', 'background', 'effect'
  subcategory TEXT,       -- 'hat', 'glasses', 'necklace', etc.
  
  -- Pricing
  price INTEGER NOT NULL DEFAULT 0,        -- Cost in gems/coins
  currency_type TEXT DEFAULT 'gems',       -- 'gems', 'coins', 'premium'
  is_premium BOOLEAN DEFAULT false,        -- Requires subscription
  
  -- Rarity & Value
  rarity TEXT NOT NULL DEFAULT 'common',   -- 'common', 'rare', 'epic', 'legendary'
  value_score INTEGER DEFAULT 1,           -- For trade/gift systems
  
  -- Visuals
  preview_image_url TEXT,                  -- Preview thumbnail
  full_image_url TEXT,                     -- Full resolution
  icon_url TEXT,                           -- Small icon for inventory
  
  -- For Ready Player Me
  rpm_asset_id TEXT,                       -- Ready Player Me specific asset ID
  
  -- For custom 2D systems
  asset_data JSONB,                        -- SVG paths, colors, layers, etc.
  
  -- Unlock Requirements
  unlock_requirement JSONB DEFAULT '{}'::JSONB, 
  -- Example: {"type": "level", "value": 10}
  -- Example: {"type": "streak", "value": 7}
  -- Example: {"type": "lesson_complete", "lesson_id": "spanish_unit_1"}
  
  required_level INTEGER DEFAULT 1,
  required_achievement TEXT,               -- Reference to achievement system
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_seasonal BOOLEAN DEFAULT false,
  season_start DATE,
  season_end DATE,
  is_limited_edition BOOLEAN DEFAULT false,
  quantity_limit INTEGER,                  -- NULL = unlimited
  
  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],     -- For search/filter
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON character_shop_items(category);
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON character_shop_items(rarity);
CREATE INDEX IF NOT EXISTS idx_shop_items_price ON character_shop_items(price);
CREATE INDEX IF NOT EXISTS idx_shop_items_featured ON character_shop_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_shop_items_available ON character_shop_items(is_available);
CREATE INDEX IF NOT EXISTS idx_shop_items_tags ON character_shop_items USING GIN(tags);

-- =====================================================
-- 3. USER INVENTORY TABLE
-- =====================================================
-- Tracks which items each user has purchased
CREATE TABLE IF NOT EXISTS user_character_items (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT REFERENCES character_shop_items(id) NOT NULL,
  
  -- Purchase details
  purchased_at TIMESTAMP DEFAULT NOW(),
  purchase_price INTEGER,                  -- Price paid (may differ from current)
  purchase_currency TEXT DEFAULT 'gems',
  
  -- Item status
  is_equipped BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,
  
  -- Gifting
  gifted_by UUID REFERENCES auth.users(id),
  gift_message TEXT,
  
  PRIMARY KEY (user_id, item_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_character_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_equipped ON user_character_items(user_id, is_equipped) WHERE is_equipped = true;

-- =====================================================
-- 4. ITEM PURCHASE HISTORY TABLE
-- =====================================================
-- Audit log of all purchases for analytics
CREATE TABLE IF NOT EXISTS character_purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT REFERENCES character_shop_items(id) NOT NULL,
  
  -- Transaction details
  price_paid INTEGER NOT NULL,
  currency_type TEXT NOT NULL,
  payment_method TEXT, -- 'gems', 'subscription_bonus', 'reward', 'gift'
  
  -- Context
  purchased_from TEXT, -- 'shop', 'daily_reward', 'achievement', 'promotion'
  user_level INTEGER,
  
  -- Timestamps
  purchased_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_history_user ON character_purchase_history(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_item ON character_purchase_history(item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_date ON character_purchase_history(purchased_at);

-- =====================================================
-- 5. CHARACTER LEVEL PROGRESSION TABLE
-- =====================================================
-- Define level requirements and rewards
CREATE TABLE IF NOT EXISTS character_levels (
  level INTEGER PRIMARY KEY,
  experience_required INTEGER NOT NULL,
  
  -- Rewards for reaching this level
  reward_gems INTEGER DEFAULT 0,
  reward_coins INTEGER DEFAULT 0,
  unlock_items TEXT[] DEFAULT ARRAY[]::TEXT[], -- Item IDs unlocked
  
  -- Visual badge/title
  badge_name TEXT,
  badge_icon_url TEXT,
  title TEXT, -- "Novice Learner", "Language Master", etc.
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. ITEM COLLECTIONS TABLE
-- =====================================================
-- Group items into collections for challenges
CREATE TABLE IF NOT EXISTS character_item_collections (
  id TEXT PRIMARY KEY, -- e.g., 'summer_2024', 'spain_culture'
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  
  -- Items in collection
  item_ids TEXT[] NOT NULL,
  
  -- Completion reward
  completion_reward_gems INTEGER DEFAULT 0,
  completion_reward_item TEXT, -- Special item for completing collection
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. USER COLLECTION PROGRESS TABLE
-- =====================================================
-- Track user progress on collections
CREATE TABLE IF NOT EXISTS user_collection_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id TEXT REFERENCES character_item_collections(id),
  
  -- Progress
  items_collected TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  
  PRIMARY KEY (user_id, collection_id)
);

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_character_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_item_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collection_progress ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CREATE RLS POLICIES
-- =====================================================

-- User Characters Policies
DROP POLICY IF EXISTS "Users can view their own character" ON user_characters;
CREATE POLICY "Users can view their own character"
  ON user_characters FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own character" ON user_characters;
CREATE POLICY "Users can update their own character"
  ON user_characters FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own character" ON user_characters;
CREATE POLICY "Users can insert their own character"
  ON user_characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Shop Items Policies (public read)
DROP POLICY IF EXISTS "Shop items are public" ON character_shop_items;
CREATE POLICY "Shop items are public"
  ON character_shop_items FOR SELECT
  TO authenticated
  USING (true);

-- User Inventory Policies
DROP POLICY IF EXISTS "Users can view their own inventory" ON user_character_items;
CREATE POLICY "Users can view their own inventory"
  ON user_character_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to their inventory" ON user_character_items;
CREATE POLICY "Users can add to their inventory"
  ON user_character_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their inventory" ON user_character_items;
CREATE POLICY "Users can update their inventory"
  ON user_character_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Purchase History Policies
DROP POLICY IF EXISTS "Users can view their purchase history" ON character_purchase_history;
CREATE POLICY "Users can view their purchase history"
  ON character_purchase_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert purchase history" ON character_purchase_history;
CREATE POLICY "Users can insert purchase history"
  ON character_purchase_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Levels are public
DROP POLICY IF EXISTS "Levels are public" ON character_levels;
CREATE POLICY "Levels are public"
  ON character_levels FOR SELECT
  TO authenticated
  USING (true);

-- Collections are public
DROP POLICY IF EXISTS "Collections are public" ON character_item_collections;
CREATE POLICY "Collections are public"
  ON character_item_collections FOR SELECT
  TO authenticated
  USING (true);

-- User Collection Progress
DROP POLICY IF EXISTS "Users can view their collection progress" ON user_collection_progress;
CREATE POLICY "Users can view their collection progress"
  ON user_collection_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their collection progress" ON user_collection_progress;
CREATE POLICY "Users can update their collection progress"
  ON user_collection_progress FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 10. CREATE FUNCTIONS
-- =====================================================

-- Function to add experience and level up character
CREATE OR REPLACE FUNCTION add_character_experience(
  p_user_id UUID,
  p_experience INTEGER
)
RETURNS TABLE (
  new_level INTEGER,
  leveled_up BOOLEAN,
  reward_gems INTEGER,
  unlocked_items TEXT[]
) AS $$
DECLARE
  v_current_level INTEGER;
  v_current_exp INTEGER;
  v_new_exp INTEGER;
  v_new_level INTEGER;
  v_level_info RECORD;
  v_leveled_up BOOLEAN := false;
  v_reward_gems INTEGER := 0;
  v_unlocked_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get current character data
  SELECT level, experience INTO v_current_level, v_current_exp
  FROM user_characters
  WHERE user_id = p_user_id;
  
  -- If no character exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_characters (user_id, level, experience)
    VALUES (p_user_id, 1, p_experience)
    RETURNING level INTO v_current_level;
    v_new_exp := p_experience;
  ELSE
    v_new_exp := v_current_exp + p_experience;
  END IF;
  
  -- Check if user leveled up
  v_new_level := v_current_level;
  
  FOR v_level_info IN
    SELECT * FROM character_levels
    WHERE experience_required <= v_new_exp
    ORDER BY level DESC
    LIMIT 1
  LOOP
    IF v_level_info.level > v_current_level THEN
      v_new_level := v_level_info.level;
      v_leveled_up := true;
      v_reward_gems := v_level_info.reward_gems;
      v_unlocked_items := v_level_info.unlock_items;
    END IF;
  END LOOP;
  
  -- Update character
  UPDATE user_characters
  SET 
    experience = v_new_exp,
    level = v_new_level,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If leveled up, add rewards
  IF v_leveled_up THEN
    -- Add gems to profile
    IF v_reward_gems > 0 THEN
      UPDATE profiles
      SET gems = COALESCE(gems, 0) + v_reward_gems
      WHERE id = p_user_id;
    END IF;
    
    -- Auto-unlock items
    IF array_length(v_unlocked_items, 1) > 0 THEN
      INSERT INTO user_character_items (user_id, item_id, purchase_price, purchase_currency)
      SELECT p_user_id, unnest(v_unlocked_items), 0, 'level_reward'
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN QUERY SELECT v_new_level, v_leveled_up, v_reward_gems, v_unlocked_items;
END;
$$ LANGUAGE plpgsql;

-- Function to purchase item
CREATE OR REPLACE FUNCTION purchase_character_item(
  p_user_id UUID,
  p_item_id TEXT,
  p_currency_type TEXT DEFAULT 'gems'
)
RETURNS JSONB AS $$
DECLARE
  v_item_price INTEGER;
  v_user_currency INTEGER;
  v_result JSONB;
BEGIN
  -- Get item price
  SELECT price INTO v_item_price
  FROM character_shop_items
  WHERE id = p_item_id AND is_available = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or unavailable');
  END IF;
  
  -- Check if user already owns item
  IF EXISTS (SELECT 1 FROM user_character_items WHERE user_id = p_user_id AND item_id = p_item_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item already owned');
  END IF;
  
  -- Get user currency
  IF p_currency_type = 'gems' THEN
    SELECT COALESCE(gems, 0) INTO v_user_currency FROM profiles WHERE id = p_user_id;
  ELSIF p_currency_type = 'coins' THEN
    SELECT COALESCE(coins, 0) INTO v_user_currency FROM profiles WHERE id = p_user_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid currency type');
  END IF;
  
  -- Check sufficient funds
  IF v_user_currency < v_item_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  
  -- Deduct currency
  IF p_currency_type = 'gems' THEN
    UPDATE profiles SET gems = gems - v_item_price WHERE id = p_user_id;
  ELSIF p_currency_type = 'coins' THEN
    UPDATE profiles SET coins = coins - v_item_price WHERE id = p_user_id;
  END IF;
  
  -- Add item to inventory
  INSERT INTO user_character_items (user_id, item_id, purchase_price, purchase_currency)
  VALUES (p_user_id, p_item_id, v_item_price, p_currency_type);
  
  -- Add to purchase history
  INSERT INTO character_purchase_history (user_id, item_id, price_paid, currency_type, purchased_from)
  VALUES (p_user_id, p_item_id, v_item_price, p_currency_type, 'shop');
  
  RETURN jsonb_build_object('success', true, 'item_id', p_item_id, 'price_paid', v_item_price);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. SEED DATA - Character Levels
-- =====================================================

INSERT INTO character_levels (level, experience_required, reward_gems, title) VALUES
  (1, 0, 0, 'Beginner'),
  (2, 100, 50, 'Novice Learner'),
  (3, 250, 75, 'Student'),
  (4, 500, 100, 'Dedicated Student'),
  (5, 1000, 150, 'Language Enthusiast'),
  (10, 5000, 300, 'Polyglot in Training'),
  (15, 12000, 500, 'Word Master'),
  (20, 25000, 750, 'Fluency Seeker'),
  (25, 50000, 1000, 'Language Expert'),
  (30, 100000, 1500, 'Grand Master')
ON CONFLICT (level) DO NOTHING;

-- =====================================================
-- 12. SAMPLE SHOP ITEMS (for testing)
-- =====================================================

INSERT INTO character_shop_items (id, name, description, category, price, rarity) VALUES
  -- Hair styles
  ('hair_short_black', 'Short Black Hair', 'Classic short hairstyle', 'hair', 0, 'common'),
  ('hair_long_blonde', 'Long Blonde Hair', 'Flowing blonde locks', 'hair', 100, 'common'),
  ('hair_curly_brown', 'Curly Brown Hair', 'Natural curls', 'hair', 150, 'rare'),
  ('hair_spiky_blue', 'Spiky Blue Hair', 'Bold and colorful', 'hair', 300, 'epic'),
  
  -- Accessories
  ('glasses_round', 'Round Glasses', 'Stylish round frames', 'accessory', 50, 'common'),
  ('glasses_sunglasses', 'Cool Sunglasses', 'Look cool while learning', 'accessory', 150, 'rare'),
  ('hat_cap', 'Baseball Cap', 'Casual cap', 'accessory', 100, 'common'),
  ('hat_wizard', 'Wizard Hat', 'Magical learning powers', 'accessory', 500, 'legendary'),
  
  -- Outfits
  ('outfit_casual', 'Casual Outfit', 'Everyday wear', 'outfit', 0, 'common'),
  ('outfit_formal', 'Formal Outfit', 'Look professional', 'outfit', 200, 'rare'),
  ('outfit_hoodie', 'Cozy Hoodie', 'Perfect for study sessions', 'outfit', 150, 'common'),
  ('outfit_kimono', 'Japanese Kimono', 'Traditional Japanese attire', 'outfit', 400, 'epic'),
  
  -- Special items
  ('effect_sparkles', 'Sparkle Effect', 'Magical sparkles around avatar', 'effect', 250, 'epic'),
  ('background_library', 'Library Background', 'Scholarly atmosphere', 'background', 300, 'rare')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
