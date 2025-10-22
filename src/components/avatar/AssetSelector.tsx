import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AvatarAsset } from '../../types/avatar';

interface AssetSelectorProps {
  assets: AvatarAsset[];
  selectedAsset: string | undefined;
  unlockedAssets: Set<string>;
  userXP: number;
  onSelectAsset: (asset: AvatarAsset) => void;
  onPurchaseAsset: (asset: AvatarAsset) => void;
}

/**
 * AssetSelector - Displays available assets for a category with purchase options
 * Shows locked/unlocked state and XP costs
 */
const AssetSelector: React.FC<AssetSelectorProps> = ({
  assets,
  selectedAsset,
  unlockedAssets,
  userXP,
  onSelectAsset,
  onPurchaseAsset,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {assets.map((asset) => {
          const isUnlocked = unlockedAssets.has(asset.id);
          const isSelected = selectedAsset === asset.id;
          const canAfford = userXP >= asset.xp_cost;

          return (
            <AssetCard
              key={asset.id}
              asset={asset}
              isUnlocked={isUnlocked}
              isSelected={isSelected}
              canAfford={canAfford}
              onSelect={() => onSelectAsset(asset)}
              onPurchase={() => onPurchaseAsset(asset)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

interface AssetCardProps {
  asset: AvatarAsset;
  isUnlocked: boolean;
  isSelected: boolean;
  canAfford: boolean;
  onSelect: () => void;
  onPurchase: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isUnlocked,
  isSelected,
  canAfford,
  onSelect,
  onPurchase,
}) => {
  const handlePress = () => {
    if (isUnlocked) {
      onSelect();
    } else if (canAfford) {
      onPurchase();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        !isUnlocked && styles.lockedCard,
      ]}
      onPress={handlePress}
      disabled={!isUnlocked && !canAfford}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {asset.thumbnail_path ? (
          <Image
            source={{ uri: asset.thumbnail_path }}
            style={styles.thumbnail}
            onError={() => {
              // Handle image loading error
            }}
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Text style={styles.placeholderText}>
              {asset.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Lock overlay for locked assets */}
        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>

      {/* Asset info */}
      <View style={styles.cardInfo}>
        <Text style={styles.assetName} numberOfLines={1}>
          {asset.name}
        </Text>
        
        {!isUnlocked ? (
          <View style={styles.xpContainer}>
            <Text style={[styles.xpCost, !canAfford && styles.insufficientXP]}>
              {asset.xp_cost} XP
            </Text>
            {!canAfford && (
              <Text style={styles.insufficientText}>Insufficient XP</Text>
            )}
          </View>
        ) : (
          <Text style={styles.unlockedText}>Unlocked</Text>
        )}
      </View>

      {/* Action button */}
      <View style={styles.actionContainer}>
        {isUnlocked ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isSelected ? styles.selectedButton : styles.selectButton,
            ]}
            onPress={onSelect}
          >
            <Text style={styles.actionButtonText}>
              {isSelected ? 'Selected' : 'Select'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.purchaseButton,
              !canAfford && styles.disabledButton,
            ]}
            onPress={onPurchase}
            disabled={!canAfford}
          >
            <Text style={[
              styles.actionButtonText,
              !canAfford && styles.disabledButtonText,
            ]}>
              Buy
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  card: {
    width: 140,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  lockedCard: {
    opacity: 0.7,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 80,
    backgroundColor: '#f8f9fa',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 20,
  },
  cardInfo: {
    padding: 8,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28a745',
  },
  insufficientXP: {
    color: '#dc3545',
  },
  insufficientText: {
    fontSize: 10,
    color: '#dc3545',
  },
  unlockedText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  actionContainer: {
    padding: 8,
    paddingTop: 0,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: '#007AFF',
  },
  selectedButton: {
    backgroundColor: '#28a745',
  },
  purchaseButton: {
    backgroundColor: '#ffc107',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButtonText: {
    color: '#6c757d',
  },
});

export default AssetSelector;
