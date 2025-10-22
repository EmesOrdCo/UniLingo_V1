import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectAvatarOptions, updateAvatarOption, resetAvatar } from '../../store/slices/avatarSlice';
import {
  SKIN_COLORS,
  HAIR_COLORS,
  TOP_TYPES,
  FACIAL_HAIR_TYPES,
  CLOTHE_TYPES,
  CLOTHE_COLORS,
  EYE_TYPES,
  EYEBROW_TYPES,
  MOUTH_TYPES,
  ACCESSORIES_TYPES
} from './constants';

const AvatarCustomizer: React.FC = () => {
  const dispatch = useDispatch();
  const options = useSelector(selectAvatarOptions);

  const handleOptionChange = (option: keyof typeof options, value: string) => {
    dispatch(updateAvatarOption({ option, value }));
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Avatar',
      'Are you sure you want to reset your avatar to default settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => dispatch(resetAvatar()) }
      ]
    );
  };

  const renderColorOptions = (
    optionType: keyof typeof options,
    options: Array<{ value: string; label: string }>,
    currentValue: string
  ) => (
    <View style={styles.colorGroup}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.colorOption,
            { backgroundColor: `#${option.value}` },
            currentValue === option.value && styles.selectedColorOption
          ]}
          onPress={() => handleOptionChange(optionType, option.value)}
        />
      ))}
    </View>
  );

  const renderSelectOptions = (
    optionType: keyof typeof options,
    options: Array<{ value: string; label: string }>,
    currentValue: string
  ) => (
    <View style={styles.selectGroup}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.selectOption,
            currentValue === option.value && styles.selectedSelectOption
          ]}
          onPress={() => handleOptionChange(optionType, option.value)}
        >
          <Text style={[
            styles.selectOptionText,
            currentValue === option.value && styles.selectedSelectOptionText
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skin Color</Text>
        {renderColorOptions('skinColor', SKIN_COLORS, options.skinColor)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hair Style</Text>
        {renderSelectOptions('topType', TOP_TYPES, options.topType)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hair Color</Text>
        {renderColorOptions('hairColor', HAIR_COLORS, options.hairColor)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facial Hair</Text>
        {renderSelectOptions('facialHairType', FACIAL_HAIR_TYPES, options.facialHairType)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facial Hair Color</Text>
        {renderColorOptions('facialHairColor', HAIR_COLORS, options.facialHairColor)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eyes</Text>
        {renderSelectOptions('eyeType', EYE_TYPES, options.eyeType)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eyebrows</Text>
        {renderSelectOptions('eyebrowType', EYEBROW_TYPES, options.eyebrowType)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mouth</Text>
        {renderSelectOptions('mouthType', MOUTH_TYPES, options.mouthType)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clothing</Text>
        {renderSelectOptions('clotheType', CLOTHE_TYPES, options.clotheType)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clothing Color</Text>
        {renderColorOptions('clotheColor', CLOTHE_COLORS, options.clotheColor)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessories</Text>
        {renderSelectOptions('accessoriesType', ACCESSORIES_TYPES, options.accessoriesType)}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset Avatar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  colorGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  selectGroup: {
    gap: 8,
  },
  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  selectedSelectOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  selectedSelectOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AvatarCustomizer;
