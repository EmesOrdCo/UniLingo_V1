import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G } from 'react-native-svg';
import { AvatarAsset, AvatarConfig } from '../../types/avatar';

interface AvatarRendererProps {
  assets: AvatarAsset[];
  selectedAssets: AvatarConfig;
  size?: number;
}

/**
 * AvatarRenderer - Renders the composed avatar from selected assets
 * Layers SVG assets in the correct z-index order
 */
const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  assets,
  selectedAssets,
  size = 200,
}) => {
  // Get selected assets in z-index order
  const selectedAssetsList = Object.entries(selectedAssets)
    .map(([type, assetId]) => {
      const asset = assets.find(a => a.id === assetId);
      return asset ? { ...asset, type } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.z_index - b!.z_index);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <G>
          {selectedAssetsList.map((asset, index) => (
            <AssetLayer
              key={`${asset!.type}-${asset!.id}-${index}`}
              asset={asset!}
              size={size}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
};

/**
 * AssetLayer - Renders a single SVG asset layer
 */
interface AssetLayerProps {
  asset: AvatarAsset;
  size: number;
}

const AssetLayer: React.FC<AssetLayerProps> = ({ asset, size }) => {
  // In a real implementation, this would load and render the actual SVG content
  // For now, we'll render a placeholder based on the asset type
  const getPlaceholderContent = () => {
    switch (asset.type) {
      case 'body':
        return (
          <g>
            <circle cx="100" cy="120" r="60" fill="#f4c2a1" />
            <circle cx="100" cy="80" r="40" fill="#f4c2a1" />
          </g>
        );
      case 'hair':
        return (
          <g>
            <ellipse cx="100" cy="60" rx="45" ry="35" fill="#8b4513" />
          </g>
        );
      case 'top':
        return (
          <g>
            <rect x="70" y="100" width="60" height="80" fill="#007AFF" />
          </g>
        );
      case 'accessory':
        return (
          <g>
            <circle cx="100" cy="100" r="8" fill="#ffd700" />
          </g>
        );
      case 'hat':
        return (
          <g>
            <ellipse cx="100" cy="45" rx="50" ry="20" fill="#ff6b6b" />
          </g>
        );
      default:
        return null;
    }
  };

  return getPlaceholderContent();
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AvatarRenderer;
