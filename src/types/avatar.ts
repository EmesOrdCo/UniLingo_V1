/**
 * Avatar system types for UniLingo Avatar Customizer
 */

export interface AvatarAsset {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: AvatarAssetType;
  z_index: number;
  xp_cost: number;
  svg_path: string;
  thumbnail_path: string;
  unlocked_by_default?: boolean;
  tags?: string[];
}

export type AvatarAssetType = 'body' | 'hair' | 'top' | 'accessory' | 'hat';

export interface AvatarManifest {
  version: string;
  assets: AvatarAsset[];
}

export interface AvatarConfig {
  [key: string]: string; // assetId -> selectedAssetId
}

export interface UserXP {
  balance: number;
}

export interface PurchaseRequest {
  itemId: string;
}

export interface PurchaseResponse {
  success: boolean;
  message?: string;
  newBalance?: number;
}

export interface SaveAvatarRequest {
  avatarConfig: AvatarConfig;
  userId: string;
}

export interface SaveAvatarResponse {
  success: boolean;
  jobId: string;
  message?: string;
}

export interface RenderJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string;
  error?: string;
}

export interface AvatarEditorState {
  manifest: AvatarManifest | null;
  userXP: number;
  unlockedAssets: Set<string>;
  selectedAssets: AvatarConfig;
  loading: boolean;
  error: string | null;
}

export interface AssetCategory {
  type: AvatarAssetType;
  assets: AvatarAsset[];
  selectedAsset: AvatarAsset | null;
}
