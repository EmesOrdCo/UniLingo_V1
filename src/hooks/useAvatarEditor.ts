import { useState, useCallback } from 'react';
import { AvatarAsset, AvatarConfig, AvatarManifest, UserXP, SaveAvatarResponse } from '../types/avatar';
import { avatarApi } from '../lib/avatarApi';

/**
 * Custom hook for managing avatar editor state and operations
 * Handles manifest loading, XP management, asset selection, and avatar saving
 */
export const useAvatarEditor = () => {
  const [manifest, setManifest] = useState<AvatarManifest | null>(null);
  const [userXP, setUserXP] = useState<number>(0);
  const [unlockedAssets, setUnlockedAssets] = useState<Set<string>>(new Set());
  const [selectedAssets, setSelectedAssets] = useState<AvatarConfig>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load avatar manifest from API
   */
  const loadManifest = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const manifestData = await avatarApi.getManifest();
      setManifest(manifestData);
      
      // Initialize unlocked assets based on manifest
      const defaultUnlocked = manifestData.assets
        .filter(asset => asset.unlocked_by_default)
        .map(asset => asset.id);
      setUnlockedAssets(new Set(defaultUnlocked));
      
      // Initialize selected assets with default unlocked assets
      const defaultConfig: AvatarConfig = {};
      manifestData.assets.forEach(asset => {
        if (asset.unlocked_by_default) {
          defaultConfig[asset.type] = asset.id;
        }
      });
      setSelectedAssets(defaultConfig);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load avatar manifest');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load user XP balance
   */
  const loadUserXP = useCallback(async (userId: string) => {
    try {
      const xpData = await avatarApi.getUserXP(userId);
      setUserXP(xpData.balance);
    } catch (err) {
      console.error('Failed to load user XP:', err);
      // Don't set error state for XP loading failure - it's not critical
    }
  }, []);

  /**
   * Purchase an asset with XP
   */
  const purchaseAsset = useCallback(async (userId: string, assetId: string): Promise<boolean> => {
    try {
      const result = await avatarApi.purchaseAsset(userId, assetId);
      
      if (result.success && result.newBalance !== undefined) {
        setUserXP(result.newBalance);
        setUnlockedAssets(prev => new Set([...prev, assetId]));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to purchase asset:', err);
      throw err;
    }
  }, []);

  /**
   * Select an asset for the avatar
   */
  const selectAsset = useCallback((category: string, assetId: string) => {
    setSelectedAssets(prev => ({
      ...prev,
      [category]: assetId,
    }));
  }, []);

  /**
   * Save avatar configuration
   */
  const saveAvatar = useCallback(async (userId: string, avatarConfig: AvatarConfig): Promise<SaveAvatarResponse> => {
    setSaveLoading(true);
    
    try {
      const result = await avatarApi.saveAvatar(userId, avatarConfig);
      return result;
    } catch (err) {
      throw err;
    } finally {
      setSaveLoading(false);
    }
  }, []);

  return {
    manifest,
    userXP,
    unlockedAssets,
    selectedAssets,
    loading,
    saveLoading,
    error,
    loadManifest,
    loadUserXP,
    purchaseAsset,
    selectAsset,
    saveAvatar,
  };
};
