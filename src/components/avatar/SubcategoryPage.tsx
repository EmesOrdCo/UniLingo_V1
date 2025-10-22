import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { selectAvatarOptions, updateAvatarOption } from '../../store/slices/avatarSlice';
import Avatar from './Avatar';
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
  const options = useSelector(selectAvatarOptions);

  const handleOptionChange = (optionKey: keyof import('../../store/slices/avatarSlice').AvatarOptions, value: string) => {
    dispatch(updateAvatarOption({ option: optionKey, value }));
  };

  const renderColorPalette = (colors: Array<{ value: string; label: string }>, currentValue: string, optionKey: keyof import('../../store/slices/avatarSlice').AvatarOptions) => (
    <View style={styles.colorPalette}>
      {colors.map((color) => (
        <TouchableOpacity
          key={color.value}
          style={[
            styles.colorSwatch,
            { backgroundColor: `#${color.value}` },
            currentValue === color.value && styles.selectedColorSwatch
          ]}
          onPress={() => handleOptionChange(optionKey, color.value)}
        >
          {currentValue === color.value && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStyleGrid = (styleOptions: Array<{ value: string; label: string }>, currentValue: string, optionKey: keyof import('../../store/slices/avatarSlice').AvatarOptions) => (
    <View style={styles.styleGrid}>
      {styleOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.styleOption,
            currentValue === option.value && styles.selectedStyleOption
          ]}
          onPress={() => handleOptionChange(optionKey, option.value)}
        >
          <Text style={[
            styles.styleOptionText,
            currentValue === option.value && styles.selectedStyleOptionText
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
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

      {/* Avatar Preview */}
      <View style={styles.previewSection}>
        <View style={styles.avatarContainer}>
          <Avatar size={Math.min(width * 0.35, 160)} />
        </View>
        <Text style={styles.previewText}>Live Preview</Text>
      </View>

      {/* Customization Options */}
      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
        {renderCategoryContent()}
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
});

export default SubcategoryPage;
