import { supabase } from './supabase';
import { XPService } from './xpService';
import * as AvatarConstants from '../components/avatar/constants';

export interface AvatarItem {
  id: string;
  category: string;
  item_value: string;
  xp_cost: number;
  rarity: 'free' | 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at: string;
  price_gbp?: number;
  is_paid_item?: boolean;
}

export interface UserAvatarUnlock {
  id: string;
  user_id: string;
  item_id: string;
  unlocked_at: string;
  xp_spent: number;
}

export interface UnlockCheck {
  can_unlock: boolean;
  available_xp: number;
  item_cost: number;
  message?: string;
}

export interface UnlockResult {
  success: boolean;
  message?: string;
}

export class AvatarUnlockService {
  /**
   * Get the user-friendly label for an avatar item
   * Looks up the label from the constants file based on category and item_value
   */
  static getItemLabel(category: string, itemValue: string): string {
    try {
      switch (category) {
        case 'skinColor':
          const skinItem = AvatarConstants.SKIN_COLORS.find(item => item.value === itemValue);
          return skinItem?.label || itemValue;
        
        case 'hairColor':
          const hairColorItem = AvatarConstants.HAIR_COLORS.find(item => item.value === itemValue);
          return hairColorItem?.label || itemValue;
        
        case 'hair':
          const hairItem = AvatarConstants.TOP_TYPES.find(item => item.value === itemValue);
          return hairItem?.label || itemValue;
        
        case 'facialHair':
          const facialHairItem = AvatarConstants.FACIAL_HAIR_TYPES.find(item => item.value === itemValue);
          return facialHairItem?.label || itemValue;
        
        case 'clothing':
          const clothingItem = AvatarConstants.CLOTHE_TYPES.find(item => item.value === itemValue);
          return clothingItem?.label || itemValue;
        
        case 'clotheColor':
          const clotheColorItem = AvatarConstants.CLOTHE_COLORS.find(item => item.value === itemValue);
          return clotheColorItem?.label || itemValue;
        
        case 'eyes':
          const eyeItem = AvatarConstants.EYE_TYPES.find(item => item.value === itemValue);
          return eyeItem?.label || itemValue;
        
        case 'eyebrows':
          const eyebrowItem = AvatarConstants.EYEBROW_TYPES.find(item => item.value === itemValue);
          return eyebrowItem?.label || itemValue;
        
        case 'mouth':
          const mouthItem = AvatarConstants.MOUTH_TYPES.find(item => item.value === itemValue);
          return mouthItem?.label || itemValue;
        
        case 'accessories':
          const accessoryItem = AvatarConstants.ACCESSORIES_TYPES.find(item => item.value === itemValue);
          return accessoryItem?.label || itemValue;
        
        default:
          return itemValue;
      }
    } catch (error) {
      console.error('Error getting item label:', error);
      return itemValue;
    }
  }
  /**
   * Get all available avatar items
   */
  static async getAvailableItems(): Promise<AvatarItem[]> {
    try {
      const { data, error } = await supabase
        .from('avatar_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('xp_cost', { ascending: true });

      if (error) {
        // Table doesn't exist yet - return empty array silently
        if (error.code === 'PGRST205') {
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching avatar items:', error);
      return [];
    }
  }

  /**
   * Get user's unlocked avatar items
   */
  static async getUserUnlockedItems(userId: string): Promise<AvatarItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_unlocked_avatar_items', { p_user_id: userId });

      if (error) {
        // Table doesn't exist yet - return empty array silently
        if (error.code === 'PGRST205') {
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching user unlocked items:', error);
      return [];
    }
  }

  /**
   * Get items by category
   */
  static async getItemsByCategory(
    category: string,
    userId?: string
  ): Promise<AvatarItem[]> {
    try {
      const items = await this.getAvailableItems();
      const filteredItems = items.filter(item => item.category === category);
      
      if (!userId) {
        return filteredItems;
      }

      // Get user's unlocked items to show unlock status
      const unlockedItems = await this.getUserUnlockedItems(userId);
      const unlockedItemIds = new Set(unlockedItems.map(item => item.id));
      
      return filteredItems.map(item => ({
        ...item,
        is_unlocked: item.xp_cost === 0 || unlockedItemIds.has(item.id)
      }));
    } catch (error) {
      console.error('Error fetching items by category:', error);
      return [];
    }
  }

  /**
   * Check if user can unlock an avatar item
   */
  static async canUnlockItem(
    userId: string, 
    itemId: string
  ): Promise<UnlockCheck> {
    try {
      const { data, error } = await supabase
        .rpc('can_unlock_avatar_item', { 
          p_user_id: userId, 
          p_item_id: itemId 
        });

      if (error) throw error;
      
      const result = data?.[0];
      return {
        can_unlock: result?.can_unlock || false,
        available_xp: result?.available_xp || 0,
        item_cost: result?.item_cost || 0,
        message: result?.message
      };
    } catch (error) {
      console.error('Error checking if user can unlock item:', error);
      return {
        can_unlock: false,
        available_xp: 0,
        item_cost: 0,
        message: 'Error checking unlock status'
      };
    }
  }

  /**
   * Unlock an avatar item (spends XP if needed)
   */
  static async unlockItem(
    userId: string, 
    itemId: string
  ): Promise<UnlockResult> {
    try {
      const { data, error } = await supabase
        .rpc('unlock_avatar_item', { 
          p_user_id: userId, 
          p_item_id: itemId 
        });

      if (error) throw error;
      
      const result = data?.[0];
      return {
        success: result?.success || false,
        message: result?.message
      };
    } catch (error) {
      console.error('Error unlocking avatar item:', error);
      return {
        success: false,
        message: 'Error processing unlock'
      };
    }
  }

  /**
   * Get user's total unlocked items count
   */
  static async getUserUnlockedCount(userId: string): Promise<number> {
    try {
      const unlockedItems = await this.getUserUnlockedItems(userId);
      return unlockedItems.length;
    } catch (error) {
      console.error('Error fetching user unlocked count:', error);
      return 0;
    }
  }

  /**
   * Get user's total XP spent on avatar items
   */
  static async getUserTotalXPSpent(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_avatar_unlocks')
        .select('xp_spent')
        .eq('user_id', userId);

      if (error) throw error;
      
      return data?.reduce((total, unlock) => total + unlock.xp_spent, 0) || 0;
    } catch (error) {
      console.error('Error fetching user total XP spent:', error);
      return 0;
    }
  }

  /**
   * Get items by rarity
   */
  static async getItemsByRarity(
    rarity: 'free' | 'common' | 'rare' | 'epic' | 'legendary',
    userId?: string
  ): Promise<AvatarItem[]> {
    try {
      const items = await this.getAvailableItems();
      const filteredItems = items.filter(item => item.rarity === rarity);
      
      if (!userId) {
        return filteredItems;
      }

      // Get user's unlocked items to show unlock status
      const unlockedItems = await this.getUserUnlockedItems(userId);
      const unlockedItemIds = new Set(unlockedItems.map(item => item.id));
      
      return filteredItems.map(item => ({
        ...item,
        is_unlocked: item.xp_cost === 0 || unlockedItemIds.has(item.id)
      }));
    } catch (error) {
      console.error('Error fetching items by rarity:', error);
      return [];
    }
  }

  /**
   * Get user's unlock progress by category
   */
  static async getUserUnlockProgress(userId: string): Promise<{
    [category: string]: {
      total: number;
      unlocked: number;
      percentage: number;
    };
  }> {
    try {
      const allItems = await this.getAvailableItems();
      const unlockedItems = await this.getUserUnlockedItems(userId);
      const unlockedItemIds = new Set(unlockedItems.map(item => item.id));

      const progress: { [category: string]: { total: number; unlocked: number; percentage: number } } = {};

      // Group items by category
      const itemsByCategory: { [category: string]: AvatarItem[] } = {};
      allItems.forEach(item => {
        if (!itemsByCategory[item.category]) {
          itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
      });

      // Calculate progress for each category
      Object.keys(itemsByCategory).forEach(category => {
        const categoryItems = itemsByCategory[category];
        const unlocked = categoryItems.filter(item => 
          item.xp_cost === 0 || unlockedItemIds.has(item.id)
        ).length;
        
        progress[category] = {
          total: categoryItems.length,
          unlocked,
          percentage: Math.round((unlocked / categoryItems.length) * 100)
        };
      });

      return progress;
    } catch (error) {
      console.error('Error fetching user unlock progress:', error);
      return {};
    }
  }

  /**
   * Get recently unlocked items
   */
  static async getRecentlyUnlockedItems(
    userId: string, 
    limit: number = 5
  ): Promise<AvatarItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_avatar_unlocks')
        .select(`
          unlocked_at,
          avatar_items (
            id,
            category,
            item_value,
            item_label,
            xp_cost,
            rarity,
            is_active,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data?.map(unlock => unlock.avatar_items).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching recently unlocked items:', error);
      return [];
    }
  }
}
