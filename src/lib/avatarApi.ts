import { AvatarManifest, UserXP, PurchaseRequest, PurchaseResponse, SaveAvatarRequest, SaveAvatarResponse } from '../types/avatar';

/**
 * Avatar API service for local frontend-only implementation
 * Handles manifest loading, XP management, asset purchasing, and avatar saving using local storage
 */
class AvatarApiService {
  private manifestCache: AvatarManifest | null = null;

  constructor() {
    // Frontend-only implementation - no backend dependencies
  }

  /**
   * Load avatar manifest from local storage or bundled asset
   */
  async getManifest(): Promise<AvatarManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    try {
      // In a real implementation, this would load from a bundled asset or local storage
      // For now, return the manifest we created
      this.manifestCache = this.getLocalManifest();
      return this.manifestCache;
    } catch (error) {
      throw new Error('Failed to load avatar manifest');
    }
  }

  /**
   * Get user XP balance from local storage
   */
  async getUserXP(userId: string): Promise<UserXP> {
    try {
      const storedXP = localStorage.getItem(`avatar-xp-${userId}`);
      return {
        balance: storedXP ? parseInt(storedXP, 10) : 500 // Default 500 XP for demo
      };
    } catch (error) {
      return { balance: 500 }; // Fallback to default XP
    }
  }

  /**
   * Purchase an asset with XP
   */
  async purchaseAsset(userId: string, assetId: string): Promise<PurchaseResponse> {
    const request: PurchaseRequest = { itemId: assetId };
    
    const response = await fetch(`${this.baseUrl}/user/${userId}/xp/spend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to purchase asset: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Save avatar configuration
   */
  async saveAvatar(userId: string, avatarConfig: any): Promise<SaveAvatarResponse> {
    const request: SaveAvatarRequest = {
      avatarConfig,
      userId,
    };
    
    const response = await fetch(`${this.baseUrl}/avatar/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to save avatar: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Get render job status
   */
  async getRenderJobStatus(jobId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/avatar/render/${jobId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get render status: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Fallback method to load local manifest when API is unavailable
   */
  private async getLocalManifest(): Promise<AvatarManifest> {
    try {
      // In a real implementation, this would load from a bundled asset
      // For now, return a minimal manifest for development
      return {
        version: '1.0.0',
        assets: [
          {
            id: 'body-default',
            slug: 'default-body',
            name: 'Default Body',
            description: 'Basic avatar body',
            type: 'body',
            z_index: 1,
            xp_cost: 0,
            svg_path: 'avatar/body/default.svg',
            thumbnail_path: 'avatar/thumbnails/body-default.png',
            unlocked_by_default: true,
            tags: ['basic', 'default'],
          },
        ],
      };
    } catch (error) {
      throw new Error('Failed to load local manifest');
    }
  }
}

// Export singleton instance
export const avatarApi = new AvatarApiService();
