# Avatar System Quick Start Guide
## Recommended Implementation: Avataaars with DiceBear

This guide provides step-by-step instructions for implementing the recommended avatar system in UniLingo.

---

## Overview

We're implementing a Bitmoji-style avatar system using the Avataaars library through DiceBear. This gives us:
- ✅ Free, open-source solution
- ✅ Professional cartoon aesthetic
- ✅ Full customization control
- ✅ Perfect React Native integration
- ✅ No external dependencies or data sharing

---

## Phase 1: Installation & Setup (Day 1)

### Step 1: Install Dependencies

```bash
npm install @dicebear/core @dicebear/collection react-native-svg
```

### Step 2: Create Avatar Component

Create `src/components/Avatar/UserAvatar.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { SvgXml } from 'react-native-svg';

interface AvatarConfig {
  topType?: string;
  accessoriesType?: string;
  hairColor?: string;
  facialHairType?: string;
  clotheType?: string;
  clotheColor?: string;
  eyeType?: string;
  eyebrowType?: string;
  mouthType?: string;
  skinColor?: string;
}

interface UserAvatarProps {
  config: AvatarConfig;
  size?: number;
  style?: any;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  config, 
  size = 100, 
  style 
}) => {
  const avatar = createAvatar(avataaars, {
    ...config,
  });

  const svgString = avatar.toString();

  return (
    <View style={[styles.container, style]}>
      <SvgXml xml={svgString} width={size} height={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

### Step 3: Test Basic Rendering

Add to any screen to test:

```typescript
import { UserAvatar } from '@/components/Avatar/UserAvatar';

// In your component
<UserAvatar 
  config={{
    topType: 'LongHairStraight',
    hairColor: 'BrownDark',
    skinColor: 'Light',
    eyeType: 'Happy',
    mouthType: 'Smile',
  }}
  size={120}
/>
```

---

## Phase 2: Database Setup (Day 1-2)

### Step 1: Create Supabase Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Avatar configurations
CREATE TABLE user_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  avatar_config JSONB NOT NULL DEFAULT '{
    "topType": "ShortHairShortFlat",
    "accessoriesType": "Blank",
    "hairColor": "BrownDark",
    "facialHairType": "Blank",
    "clotheType": "ShirtCrewNeck",
    "clotheColor": "Blue03",
    "eyeType": "Default",
    "eyebrowType": "Default",
    "mouthType": "Smile",
    "skinColor": "Light"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avatar items catalog
CREATE TABLE avatar_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('hair', 'facial_hair', 'clothes', 'accessories', 'colors')),
  item_type TEXT NOT NULL,
  item_value TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  xp_cost INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  preview_config JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, item_type, item_value)
);

-- User's owned items
CREATE TABLE user_avatar_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  item_id UUID REFERENCES avatar_items(id) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Indexes
CREATE INDEX idx_user_avatars_user_id ON user_avatars(user_id);
CREATE INDEX idx_user_inventory_user_id ON user_avatar_inventory(user_id);
CREATE INDEX idx_avatar_items_category ON avatar_items(category);
CREATE INDEX idx_avatar_items_default ON avatar_items(is_default) WHERE is_default = true;

-- RLS Policies
ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_avatar_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own avatar
CREATE POLICY "Users can view own avatar"
  ON user_avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar"
  ON user_avatars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar"
  ON user_avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view all items in catalog
CREATE POLICY "Anyone can view avatar items"
  ON avatar_items FOR SELECT
  TO authenticated
  USING (true);

-- Users can view their own inventory
CREATE POLICY "Users can view own inventory"
  ON user_avatar_inventory FOR SELECT
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_avatars_updated_at
  BEFORE UPDATE ON user_avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: Populate Default Items

```sql
-- Default Hair Styles (Free)
INSERT INTO avatar_items (category, item_type, item_value, name, is_default, xp_cost) VALUES
('hair', 'topType', 'ShortHairShortFlat', 'Short Flat', true, 0),
('hair', 'topType', 'LongHairStraight', 'Long Straight', true, 0),
('hair', 'topType', 'ShortHairShortCurly', 'Short Curly', true, 0),
('hair', 'topType', 'LongHairCurly', 'Long Curly', false, 100),
('hair', 'topType', 'ShortHairDreads01', 'Dreads', false, 150),
('hair', 'topType', 'LongHairBun', 'Bun', false, 100);

-- Default Clothes (Free)
INSERT INTO avatar_items (category, item_type, item_value, name, is_default, xp_cost) VALUES
('clothes', 'clotheType', 'ShirtCrewNeck', 'T-Shirt', true, 0),
('clothes', 'clotheType', 'Hoodie', 'Hoodie', true, 0),
('clothes', 'clotheType', 'ShirtVNeck', 'V-Neck', true, 0),
('clothes', 'clotheType', 'BlazerShirt', 'Blazer', false, 250),
('clothes', 'clotheType', 'CollarSweater', 'Sweater', false, 200);

-- Accessories
INSERT INTO avatar_items (category, item_type, item_value, name, is_default, xp_cost) VALUES
('accessories', 'accessoriesType', 'Blank', 'None', true, 0),
('accessories', 'accessoriesType', 'Prescription01', 'Glasses', false, 150),
('accessories', 'accessoriesType', 'Sunglasses', 'Sunglasses', false, 200),
('accessories', 'accessoriesType', 'Kurt', 'Kurt Glasses', false, 250);

-- Eye Types
INSERT INTO avatar_items (category, item_type, item_value, name, is_default, xp_cost) VALUES
('face', 'eyeType', 'Default', 'Default Eyes', true, 0),
('face', 'eyeType', 'Happy', 'Happy Eyes', true, 0),
('face', 'eyeType', 'Wink', 'Wink', false, 100),
('face', 'eyeType', 'Hearts', 'Heart Eyes', false, 300);

-- Mouth Types
INSERT INTO avatar_items (category, item_type, item_value, name, is_default, xp_cost) VALUES
('face', 'mouthType', 'Smile', 'Smile', true, 0),
('face', 'mouthType', 'Default', 'Neutral', true, 0),
('face', 'mouthType', 'Twinkle', 'Twinkle', false, 100),
('face', 'mouthType', 'Tongue', 'Tongue Out', false, 150);
```

---

## Phase 3: Avatar Context & Hooks (Day 2-3)

### Create Avatar Context

Create `src/contexts/AvatarContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarConfig {
  topType: string;
  accessoriesType: string;
  hairColor: string;
  facialHairType: string;
  clotheType: string;
  clotheColor: string;
  eyeType: string;
  eyebrowType: string;
  mouthType: string;
  skinColor: string;
}

interface AvatarItem {
  id: string;
  category: string;
  item_type: string;
  item_value: string;
  name: string;
  description?: string;
  xp_cost: number;
  is_premium: boolean;
  is_default: boolean;
}

interface AvatarContextType {
  avatarConfig: AvatarConfig | null;
  ownedItems: string[];
  availableItems: AvatarItem[];
  loading: boolean;
  updateAvatar: (config: AvatarConfig) => Promise<void>;
  purchaseItem: (itemId: string) => Promise<boolean>;
  loadAvatar: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAvatar = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user's avatar config
      const { data: avatarData, error: avatarError } = await supabase
        .from('user_avatars')
        .select('avatar_config')
        .eq('user_id', user.id)
        .single();

      if (avatarError && avatarError.code !== 'PGRST116') {
        throw avatarError;
      }

      if (avatarData) {
        setAvatarConfig(avatarData.avatar_config);
      } else {
        // Create default avatar for new user
        const defaultConfig: AvatarConfig = {
          topType: 'ShortHairShortFlat',
          accessoriesType: 'Blank',
          hairColor: 'BrownDark',
          facialHairType: 'Blank',
          clotheType: 'ShirtCrewNeck',
          clotheColor: 'Blue03',
          eyeType: 'Default',
          eyebrowType: 'Default',
          mouthType: 'Smile',
          skinColor: 'Light',
        };

        await supabase.from('user_avatars').insert({
          user_id: user.id,
          avatar_config: defaultConfig,
        });

        setAvatarConfig(defaultConfig);
      }

      // Load owned items
      const { data: inventory } = await supabase
        .from('user_avatar_inventory')
        .select('item_id')
        .eq('user_id', user.id);

      setOwnedItems(inventory?.map(i => i.item_id) || []);

      // Load available items
      const { data: items } = await supabase
        .from('avatar_items')
        .select('*')
        .order('sort_order');

      setAvailableItems(items || []);

    } catch (error) {
      console.error('Error loading avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async (config: AvatarConfig) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('user_avatars')
      .update({ avatar_config: config })
      .eq('user_id', user.id);

    if (error) throw error;

    setAvatarConfig(config);
  };

  const purchaseItem = async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    const item = availableItems.find(i => i.id === itemId);
    if (!item) return false;

    // Check if user has enough XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', user.id)
      .single();

    if (!profile || profile.total_xp < item.xp_cost) {
      return false;
    }

    try {
      // Deduct XP and add item to inventory
      const { error: xpError } = await supabase
        .from('profiles')
        .update({ total_xp: profile.total_xp - item.xp_cost })
        .eq('id', user.id);

      if (xpError) throw xpError;

      const { error: inventoryError } = await supabase
        .from('user_avatar_inventory')
        .insert({
          user_id: user.id,
          item_id: itemId,
        });

      if (inventoryError) throw inventoryError;

      setOwnedItems([...ownedItems, itemId]);
      return true;

    } catch (error) {
      console.error('Error purchasing item:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadAvatar();
    }
  }, [user]);

  return (
    <AvatarContext.Provider
      value={{
        avatarConfig,
        ownedItems,
        availableItems,
        loading,
        updateAvatar,
        purchaseItem,
        loadAvatar,
      }}
    >
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within AvatarProvider');
  }
  return context;
};
```

---

## Phase 4: Avatar Editor Screen (Day 3-5)

### Create Avatar Editor

Create `src/screens/AvatarEditorScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { UserAvatar } from '@/components/Avatar/UserAvatar';
import { useAvatar } from '@/contexts/AvatarContext';

const CATEGORIES = [
  { key: 'hair', label: 'Hair' },
  { key: 'face', label: 'Face' },
  { key: 'clothes', label: 'Clothes' },
  { key: 'accessories', label: 'Accessories' },
];

export const AvatarEditorScreen: React.FC = () => {
  const { avatarConfig, updateAvatar, availableItems, ownedItems } = useAvatar();
  const [selectedCategory, setSelectedCategory] = useState('hair');
  const [tempConfig, setTempConfig] = useState(avatarConfig);

  if (!tempConfig) return null;

  const categoryItems = availableItems.filter(
    item => item.category === selectedCategory
  );

  const handleItemSelect = (item: any) => {
    const isOwned = item.is_default || ownedItems.includes(item.id);
    if (!isOwned) return;

    setTempConfig({
      ...tempConfig,
      [item.item_type]: item.item_value,
    });
  };

  const handleSave = async () => {
    await updateAvatar(tempConfig);
    // Navigate back or show success message
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Preview */}
      <View style={styles.previewSection}>
        <UserAvatar config={tempConfig} size={200} />
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.tab,
              selectedCategory === cat.key && styles.tabActive,
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === cat.key && styles.tabTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items Grid */}
      <ScrollView style={styles.itemsContainer}>
        <View style={styles.itemsGrid}>
          {categoryItems.map(item => {
            const isOwned = item.is_default || ownedItems.includes(item.id);
            const isSelected = tempConfig[item.item_type] === item.item_value;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  isSelected && styles.itemCardSelected,
                  !isOwned && styles.itemCardLocked,
                ]}
                onPress={() => handleItemSelect(item)}
                disabled={!isOwned}
              >
                <Text style={styles.itemName}>{item.name}</Text>
                {!isOwned && (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockText}>🔒 {item.xp_cost} XP</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Avatar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  previewSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  itemsContainer: {
    flex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  itemCard: {
    width: '45%',
    margin: '2.5%',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  itemCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  itemCardLocked: {
    opacity: 0.6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  lockBadge: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFA726',
    borderRadius: 12,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    margin: 15,
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## Phase 5: Avatar Shop (Day 5-7)

### Create Shop Screen

Create `src/screens/AvatarShopScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { UserAvatar } from '@/components/Avatar/UserAvatar';
import { useAvatar } from '@/contexts/AvatarContext';

export const AvatarShopScreen: React.FC = () => {
  const { avatarConfig, availableItems, ownedItems, purchaseItem } = useAvatar();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const shopItems = availableItems.filter(
    item => !item.is_default && !ownedItems.includes(item.id)
  );

  const handlePurchase = async (item: any) => {
    Alert.alert(
      'Purchase Item',
      `Buy "${item.name}" for ${item.xp_cost} XP?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            const success = await purchaseItem(item.id);
            if (success) {
              Alert.alert('Success!', `You now own ${item.name}!`);
            } else {
              Alert.alert('Failed', 'Not enough XP or error occurred');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => handlePurchase(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{item.xp_cost} XP</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.itemDescription}>{item.description}</Text>
      )}
      <TouchableOpacity style={styles.buyButton}>
        <Text style={styles.buyButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Avatar Shop</Text>
        <Text style={styles.subtitle}>Customize your character!</Text>
      </View>

      <FlatList
        data={shopItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 5,
  },
  list: {
    padding: 15,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  priceBadge: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  priceText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
```

---

## Phase 6: Integration (Day 7-10)

### Add Avatar to Profile Screen

```typescript
import { UserAvatar } from '@/components/Avatar/UserAvatar';
import { useAvatar } from '@/contexts/AvatarContext';

// In your ProfileScreen component
const { avatarConfig } = useAvatar();

<UserAvatar config={avatarConfig} size={150} />
```

### Add to Navigation

```typescript
// In your navigation config
import { AvatarEditorScreen } from '@/screens/AvatarEditorScreen';
import { AvatarShopScreen } from '@/screens/AvatarShopScreen';

// Add routes
<Stack.Screen 
  name="AvatarEditor" 
  component={AvatarEditorScreen}
  options={{ title: 'Customize Avatar' }}
/>
<Stack.Screen 
  name="AvatarShop" 
  component={AvatarShopScreen}
  options={{ title: 'Avatar Shop' }}
/>
```

### Wrap App with AvatarProvider

```typescript
// In App.tsx
import { AvatarProvider } from '@/contexts/AvatarContext';

<AuthProvider>
  <AvatarProvider>
    {/* Your app content */}
  </AvatarProvider>
</AuthProvider>
```

---

## Testing Checklist

- [ ] Avatar displays correctly on profile
- [ ] Can edit avatar and see changes in real-time
- [ ] Save avatar updates database
- [ ] Shop shows locked items
- [ ] Can purchase items with XP
- [ ] XP deducts correctly after purchase
- [ ] Purchased items appear in editor
- [ ] Avatar persists across app restarts
- [ ] Performance is smooth (no lag)
- [ ] Works on both iOS and Android

---

## Next Steps

1. **Add More Items:** Create themed collections (French, Spanish, etc.)
2. **Animations:** Add celebration animations for purchases
3. **Social Features:** Display avatars on leaderboard
4. **Achievements:** Unlock special items for achievements
5. **Seasonal Content:** Add holiday-themed items

---

## Troubleshooting

### Avatar Not Displaying
- Check if `react-native-svg` is properly installed
- Verify avatar config is not null
- Check console for SVG parsing errors

### Purchase Not Working
- Verify user has enough XP
- Check RLS policies in Supabase
- Ensure user is authenticated

### Performance Issues
- Implement avatar caching
- Reduce avatar size in lists
- Use `useMemo` for avatar generation

---

## Resources

- [DiceBear Docs](https://dicebear.com/docs/)
- [Avataaars Figma File](https://www.figma.com/community/file/829741575478342595)
- [React Native SVG](https://github.com/software-mansion/react-native-svg)

---

**Estimated Timeline:** 7-10 days  
**Difficulty:** Medium  
**Cost:** $0 (open source)

Good luck with your implementation! 🎨

