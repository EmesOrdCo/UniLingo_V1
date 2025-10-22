import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Alert,
  ActivityIndicator,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { selectAvatarOptions, updateAvatarOption } from '../../store/slices/avatarSlice';
import { useAuth } from '../../contexts/AuthContext';
import { AvatarUnlockService, AvatarItem } from '../../lib/avatarUnlockService';
import { XPService } from '../../lib/xpService';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedAvatar from './AnimatedAvatar';
import { useAvatarAnimation } from '../../hooks/useAvatarAnimation';
import * as AvatarConstants from './constants';

const { width } = Dimensions.get('window');

type CustomizationCategory = 'skin' | 'hair' | 'facialHair' | 'eyes' | 'eyebrows' | 'mouth' | 'clothing' | 'accessories';

interface SubcategoryPageProps {
  category: CustomizationCategory;
  categoryName: string;
  categoryIcon: string;
}

const SubcategoryPage: React.FC<SubcategoryPageProps> = ({ category, categoryName, categoryIcon }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const options = useSelector(selectAvatarOptions);
  
  const [availableItems, setAvailableItems] = useState<AvatarItem[]>([]);
  const [unlockedItems, setUnlockedItems] = useState<Set<string>>(new Set());
  const [availableXP, setAvailableXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [originalValue, setOriginalValue] = useState<string>('');
  
  // Animation controls
  const { currentAnimation, triggerEquip, triggerCelebration, triggerBlink } = useAvatarAnimation();

  useEffect(() => {
    loadData();
    // Store original value when component mounts
    const optionKey = getOptionKeyForCategory(category);
    if (optionKey) {
      setOriginalValue(options[optionKey]);
    }
  }, [user?.id, category]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [previewMode, originalValue]);

  // Cleanup effect to restore original value if component unmounts in preview mode
  useEffect(() => {
    return () => {
      if (previewMode) {
        const optionKey = getOptionKeyForCategory(category);
        if (optionKey) {
          dispatch(updateAvatarOption({ option: optionKey, value: originalValue, persist: true }));
        }
      }
    };
  }, [previewMode, originalValue, category]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Load items for this category
      const items = await AvatarUnlockService.getItemsByCategory(category, user.id);
      setAvailableItems(items);
      
      // Load user's unlocked items
      const unlocked = await AvatarUnlockService.getUserUnlockedItems(user.id);
      const unlockedSet = new Set(unlocked.map(item => item.item_value));
      setUnlockedItems(unlockedSet);
      
      // Load user's available XP
      const xp = await XPService.getAvailableXP(user.id);
      setAvailableXP(xp);
      
    } catch (error) {
      console.error('Error loading avatar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (optionKey: keyof import('../../store/slices/avatarSlice').AvatarOptions, value: string) => {
    const item = availableItems.find(item => item.item_value === value);
    const isUnlocked = isItemUnlocked(value, item?.xp_cost || 0);
    
    if (item && item.xp_cost > 0 && !isUnlocked) {
      // Allow preview but show unlock option
      Alert.alert(
        'Item Locked',
        `This item costs ${item.xp_cost} XP to unlock. You have ${availableXP} XP available.`,
        [
          { text: 'Preview Only', style: 'cancel', onPress: () => {
            // Allow preview by updating the avatar temporarily WITHOUT persisting
            dispatch(updateAvatarOption({ option: optionKey, value, persist: false }));
            setPreviewMode(true);
          }},
          { text: 'Unlock & Use', onPress: () => handleUnlock(item) }
        ]
      );
      return;
    }
    
    // If unlocked or free, allow selection and exit preview mode
    dispatch(updateAvatarOption({ option: optionKey, value, persist: true }));
    setPreviewMode(false);
  };

  const handleUnlock = async (item: AvatarItem) => {
    if (!user?.id) return;
    
    try {
      setUnlocking(item.id);
      
      const result = await AvatarUnlockService.unlockItem(user.id, item.id);
      
      if (result.success) {
        // Add to unlocked items
        setUnlockedItems(prev => new Set([...prev, item.item_value]));
        
        // Update available XP
        const newXP = await XPService.getAvailableXP(user.id);
        setAvailableXP(newXP);
        
        // Auto-select the unlocked item and exit preview mode
        const optionKey = getOptionKeyForCategory(category);
        if (optionKey) {
          dispatch(updateAvatarOption({ option: optionKey, value: item.item_value, persist: true }));
        }
        setPreviewMode(false);
        
        // Trigger equip animation for successful unlock
        triggerEquip();
        
        Alert.alert('Success!', `${AvatarUnlockService.getItemLabel(category, item.item_value)} unlocked!`);
      } else {
        Alert.alert('Unlock Failed', result.message || 'Failed to unlock item');
      }
    } catch (error) {
      console.error('Error unlocking item:', error);
      Alert.alert('Error', 'Failed to unlock item. Please try again.');
    } finally {
      setUnlocking(null);
    }
  };

  const getOptionKeyForCategory = (cat: CustomizationCategory): keyof import('../../store/slices/avatarSlice').AvatarOptions | null => {
    switch (cat) {
      case 'skin': return 'skinColor';
      case 'hair': return 'topType';
      case 'facialHair': return 'facialHairType';
      case 'eyes': return 'eyeType';
      case 'eyebrows': return 'eyebrowType';
      case 'mouth': return 'mouthType';
      case 'clothing': return 'clotheType';
      case 'accessories': return 'accessoriesType';
      default: return null;
    }
  };

  const isItemUnlocked = (itemValue: string, itemCost: number): boolean => {
    return itemCost === 0 || unlockedItems.has(itemValue);
  };

  // Rarity Color System
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'free':
        return '#10b981'; // Green - Free items
      case 'common':
        return '#6b7280'; // Gray - Common items
      case 'rare':
        return '#3b82f6'; // Blue - Rare items
      case 'epic':
        return '#8b5cf6'; // Purple - Epic items
      default:
        return '#6b7280';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'free':
        return ['#10b981', '#059669'];
      case 'common':
        return ['#6b7280', '#4b5563'];
      case 'rare':
        return ['#3b82f6', '#2563eb'];
      case 'epic':
        return ['#8b5cf6', '#7c3aed'];
      default:
        return ['#6b7280', '#4b5563'];
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'free':
        return 'checkmark-circle';
      case 'common':
        return 'ellipse';
      case 'rare':
        return 'diamond';
      case 'epic':
        return 'star';
      default:
        return 'ellipse';
    }
  };

  const handleBackPress = () => {
    if (previewMode) {
      Alert.alert(
        'Preview Mode Active',
        'You are currently previewing a locked item. You must select an unlocked item or revert to your original selection before leaving.',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Revert to Original', onPress: () => {
            const optionKey = getOptionKeyForCategory(category);
            if (optionKey) {
              dispatch(updateAvatarOption({ option: optionKey, value: originalValue, persist: true }));
            }
            setPreviewMode(false);
            navigation.goBack();
          }}
        ]
      );
      return true; // Always prevent back action in preview mode
    }
    return false; // Allow default back action
  };

  const renderColorPalette = (colors: Array<{ value: string; label: string }>, currentValue: string, optionKey: keyof import('../../store/slices/avatarSlice').AvatarOptions) => (
    <View style={styles.colorPalette}>
      {colors.map((color) => {
        const item = availableItems.find(item => item.item_value === color.value);
        const isUnlocked = isItemUnlocked(color.value, item?.xp_cost || 0);
        const isUnlocking = unlocking === item?.id;
        
        return (
          <TouchableOpacity
            key={color.value}
            style={[
              styles.colorSwatch,
              { backgroundColor: `#${color.value}` },
              currentValue === color.value && styles.selectedColorSwatch,
              !isUnlocked && styles.lockedSwatch
            ]}
            onPress={() => handleOptionChange(optionKey, color.value)}
            disabled={isUnlocking}
          >
            {currentValue === color.value && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
            
            {/* Rarity Badge for Unlocked Items */}
            {isUnlocked && item?.rarity && item.rarity !== 'free' && (
              <LinearGradient
                colors={getRarityGradient(item.rarity)}
                style={styles.rarityBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={getRarityIcon(item.rarity)} size={8} color="#ffffff" />
              </LinearGradient>
            )}
            
            {!isUnlocked && (
              <LinearGradient
                colors={getRarityGradient(item?.rarity || 'common')}
                style={styles.lockOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isUnlocking ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name={getRarityIcon(item?.rarity || 'common')} size={10} color="#ffffff" />
                    <Text style={styles.xpCost}>{item?.xp_cost}</Text>
                  </>
                )}
              </LinearGradient>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStyleGrid = (styleOptions: Array<{ value: string; label: string }>, currentValue: string, optionKey: keyof import('../../store/slices/avatarSlice').AvatarOptions) => (
    <View style={styles.styleGrid}>
      {styleOptions.map((option) => {
        const item = availableItems.find(item => item.item_value === option.value);
        const isUnlocked = isItemUnlocked(option.value, item?.xp_cost || 0);
        const isUnlocking = unlocking === item?.id;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.styleOption,
              currentValue === option.value && styles.selectedStyleOption,
              !isUnlocked && styles.lockedStyleOption
            ]}
            onPress={() => handleOptionChange(optionKey, option.value)}
            disabled={isUnlocking}
          >
            <Text style={[
              styles.styleOptionText,
              currentValue === option.value && styles.selectedStyleOptionText,
              !isUnlocked && styles.lockedStyleOptionText
            ]}>
              {option.label}
            </Text>
            
            {/* Rarity Badge for Unlocked Items */}
            {isUnlocked && item?.rarity && item.rarity !== 'free' && (
              <LinearGradient
                colors={getRarityGradient(item.rarity)}
                style={styles.styleRarityBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={getRarityIcon(item.rarity)} size={8} color="#ffffff" />
              </LinearGradient>
            )}
            
            {!isUnlocked && (
              <LinearGradient
                colors={getRarityGradient(item?.rarity || 'common')}
                style={styles.styleLockOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isUnlocking ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name={getRarityIcon(item?.rarity || 'common')} size={10} color="#ffffff" />
                    <Text style={styles.styleXpCost}>{item?.xp_cost}</Text>
                  </>
                )}
              </LinearGradient>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderCategoryContent = () => {
    switch (category) {
      case 'skin':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Skin Tone</Text>
            <Text style={styles.sectionSubtitle}>Select a skin color that represents you</Text>
            {renderColorPalette(AvatarConstants.SKIN_COLORS, options.skinColor, 'skinColor')}
          </View>
        );
      case 'hair':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hair Color</Text>
            <Text style={styles.sectionSubtitle}>Choose your hair color</Text>
            {renderColorPalette(AvatarConstants.HAIR_COLORS, options.hairColor, 'hairColor')}
            
            <Text style={styles.sectionTitle}>Hairstyle</Text>
            <Text style={styles.sectionSubtitle}>Pick a hairstyle that suits you</Text>
            {renderStyleGrid(AvatarConstants.TOP_TYPES, options.topType, 'topType')}
          </View>
        );
      case 'facialHair':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facial Hair Style</Text>
            <Text style={styles.sectionSubtitle}>Add some facial hair if you like</Text>
            {renderStyleGrid(AvatarConstants.FACIAL_HAIR_TYPES, options.facialHairType, 'facialHairType')}
            
            <Text style={styles.sectionTitle}>Facial Hair Color</Text>
            <Text style={styles.sectionSubtitle}>Choose the color of your facial hair</Text>
            {renderColorPalette(AvatarConstants.HAIR_COLORS, options.facialHairColor, 'facialHairColor')}
          </View>
        );
      case 'eyes':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eye Expression</Text>
            <Text style={styles.sectionSubtitle}>Choose how your eyes look</Text>
            {renderStyleGrid(AvatarConstants.EYE_TYPES, options.eyeType, 'eyeType')}
          </View>
        );
      case 'eyebrows':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eyebrow Style</Text>
            <Text style={styles.sectionSubtitle}>Shape your eyebrows</Text>
            {renderStyleGrid(AvatarConstants.EYEBROW_TYPES, options.eyebrowType, 'eyebrowType')}
          </View>
        );
      case 'mouth':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mouth Expression</Text>
            <Text style={styles.sectionSubtitle}>Choose your expression</Text>
            {renderStyleGrid(AvatarConstants.MOUTH_TYPES, options.mouthType, 'mouthType')}
          </View>
        );
      case 'clothing':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outfit Style</Text>
            <Text style={styles.sectionSubtitle}>Dress up your avatar</Text>
            {renderStyleGrid(AvatarConstants.CLOTHE_TYPES, options.clotheType, 'clotheType')}
            
            <Text style={styles.sectionTitle}>Outfit Color</Text>
            <Text style={styles.sectionSubtitle}>Choose the color of your outfit</Text>
            {renderColorPalette(AvatarConstants.CLOTHE_COLORS, options.clotheColor, 'clotheColor')}
          </View>
        );
      case 'accessories':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessories</Text>
            <Text style={styles.sectionSubtitle}>Add some cool accessories</Text>
            {renderStyleGrid(AvatarConstants.ACCESSORIES_TYPES, options.accessoriesType, 'accessoriesType')}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>{categoryIcon}</Text>
          <Text style={styles.headerTitle}>{categoryName}</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* XP Display */}
      <View style={styles.xpDisplay}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.xpGradientContainer}
        >
          <View style={styles.xpContent}>
            <View style={styles.xpIconContainer}>
              <Ionicons name="star" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.xpTextContainer}>
              <Text style={styles.xpAmount}>{availableXP}</Text>
              <Text style={styles.xpLabel}>XP Available</Text>
            </View>
            <View style={styles.xpSparkleContainer}>
              <Text style={styles.xpSparkle}>✨</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Animated Avatar Preview */}
      <View style={styles.previewSection}>
        <View style={styles.avatarContainer}>
          <AnimatedAvatar 
            size={Math.min(width * 0.35, 160)} 
            animationType={currentAnimation}
            onAnimationComplete={() => {
              console.log('Avatar animation completed');
            }}
          />
          {previewMode && (
            <View style={styles.previewModeIndicator}>
              <Ionicons name="eye" size={16} color="#ffffff" />
              <Text style={styles.previewModeText}>Preview</Text>
            </View>
          )}
        </View>
        <Text style={styles.previewText}>
          {previewMode ? 'Preview Mode - Select unlocked item to continue' : 'Live Preview'}
        </Text>
        
        {/* Animation Test Controls (Temporary) */}
        <View style={styles.testControls}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={triggerCelebration}
          >
            <Text style={styles.testButtonText}>🎉 Test Celebrate</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={triggerBlink}
          >
            <Text style={styles.testButtonText}>👁️ Test Blink</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customization Options */}
      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading customization options...</Text>
          </View>
        ) : (
          renderCategoryContent()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 1000,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  previewModeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  previewModeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Test Controls (Temporary)
  testControls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  testButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorSwatch: {
    borderColor: '#3b82f6',
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  checkmark: {
    backgroundColor: '#3b82f6',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  styleOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minWidth: (width - 72) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedStyleOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    transform: [{ scale: 1.05 }],
  },
  styleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  selectedStyleOptionText: {
    color: '#ffffff',
  },
  // XP Display Styles
  xpDisplay: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  xpGradientContainer: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  xpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  xpTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  xpAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpSparkleContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpSparkle: {
    fontSize: 18,
  },
  // Rarity Badge Styles
  rarityBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  styleRarityBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  // Lock and Unlock Styles - Elegant Design
  lockedSwatch: {
    opacity: 0.7,
    borderColor: '#d1d5db',
    borderWidth: 2,
  },
  lockOverlay: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  xpCost: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },
  lockedStyleOption: {
    opacity: 0.7,
    borderColor: '#d1d5db',
    borderWidth: 2,
    backgroundColor: '#f8fafc',
  },
  lockedStyleOptionText: {
    opacity: 0.7,
    color: '#6b7280',
  },
  styleLockOverlay: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  styleXpCost: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default SubcategoryPage;
