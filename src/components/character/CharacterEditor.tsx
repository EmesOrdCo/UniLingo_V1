import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CharacterAppearance, DEFAULT_CHARACTER, SKIN_TONES, HAIR_COLORS, SHIRT_COLORS } from '../../types/character';
import BasicDiceBearAvatar from './BasicDiceBearAvatar';

interface CharacterEditorProps {
  initialAppearance?: CharacterAppearance;
  onSave?: (appearance: CharacterAppearance) => void;
  onCancel?: () => void;
  visible: boolean;
}

const CharacterEditor: React.FC<CharacterEditorProps> = ({
  initialAppearance = DEFAULT_CHARACTER,
  onSave,
  onCancel,
  visible
}) => {
  const [appearance, setAppearance] = useState<CharacterAppearance>(initialAppearance);
  const [activeTab, setActiveTab] = useState<'face' | 'hair' | 'clothing' | 'expression' | 'accessories'>('face');

  const updateAppearance = (key: keyof CharacterAppearance, value: any) => {
    setAppearance(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleAccessory = (accessory: string) => {
    setAppearance(prev => ({
      ...prev,
      accessories: prev.accessories.includes(accessory)
        ? prev.accessories.filter(a => a !== accessory)
        : [...prev.accessories, accessory]
    }));
  };

  const renderFaceTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Face Shape</Text>
      <View style={styles.optionsContainer}>
        {['round', 'oval', 'square', 'heart'].map((shape) => (
          <TouchableOpacity
            key={shape}
            style={[
              styles.optionButton,
              appearance.faceShape === shape && styles.selectedOption
            ]}
            onPress={() => updateAppearance('faceShape', shape)}
          >
            <Text style={styles.optionText}>{shape.charAt(0).toUpperCase() + shape.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Skin Tone</Text>
      <View style={styles.colorOptionsContainer}>
        {Object.entries(SKIN_TONES).map(([tone, color]) => (
          <TouchableOpacity
            key={tone}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              appearance.skinTone === tone && styles.selectedColor
            ]}
            onPress={() => updateAppearance('skinTone', tone)}
          />
        ))}
      </View>
    </View>
  );

  const renderHairTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Hair Style</Text>
      <View style={styles.optionsContainer}>
        {['short', 'medium', 'long', 'curly', 'afro', 'bald'].map((style) => (
          <TouchableOpacity
            key={style}
            style={[
              styles.optionButton,
              appearance.hairStyle === style && styles.selectedOption
            ]}
            onPress={() => updateAppearance('hairStyle', style)}
          >
            <Text style={styles.optionText}>{style.charAt(0).toUpperCase() + style.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hair Color</Text>
      <View style={styles.colorOptionsContainer}>
        {Object.entries(HAIR_COLORS).map(([color, hex]) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: hex },
              appearance.hairColor === color && styles.selectedColor
            ]}
            onPress={() => updateAppearance('hairColor', color)}
          />
        ))}
      </View>
    </View>
  );

  const renderClothingTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Shirt Style</Text>
      <View style={styles.optionsContainer}>
        {['casual', 'formal', 'hoodie', 'dress', 'tank'].map((style) => (
          <TouchableOpacity
            key={style}
            style={[
              styles.optionButton,
              appearance.shirtStyle === style && styles.selectedOption
            ]}
            onPress={() => updateAppearance('shirtStyle', style)}
          >
            <Text style={styles.optionText}>{style.charAt(0).toUpperCase() + style.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Shirt Color</Text>
      <View style={styles.colorOptionsContainer}>
        {Object.entries(SHIRT_COLORS).map(([color, hex]) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: hex },
              appearance.shirtColor === color && styles.selectedColor
            ]}
            onPress={() => updateAppearance('shirtColor', color)}
          />
        ))}
      </View>
    </View>
  );

  const renderExpressionTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Expression</Text>
      <View style={styles.optionsContainer}>
        {['happy', 'neutral', 'wink', 'surprised'].map((expression) => (
          <TouchableOpacity
            key={expression}
            style={[
              styles.optionButton,
              appearance.expression === expression && styles.selectedOption
            ]}
            onPress={() => updateAppearance('expression', expression)}
          >
            <Text style={styles.optionText}>{expression.charAt(0).toUpperCase() + expression.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAccessoriesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Accessories</Text>
      <View style={styles.optionsContainer}>
        {['glasses', 'hat', 'earrings', 'necklace'].map((accessory) => (
          <TouchableOpacity
            key={accessory}
            style={[
              styles.optionButton,
              appearance.accessories.includes(accessory) && styles.selectedOption
            ]}
            onPress={() => toggleAccessory(accessory)}
          >
            <Text style={styles.optionText}>{accessory.charAt(0).toUpperCase() + accessory.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'face': return renderFaceTab();
      case 'hair': return renderHairTab();
      case 'clothing': return renderClothingTab();
      case 'expression': return renderExpressionTab();
      case 'accessories': return renderAccessoriesTab();
      default: return renderFaceTab();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customize Character</Text>
          <TouchableOpacity 
            onPress={() => onSave?.(appearance)} 
            style={styles.headerButton}
          >
            <Ionicons name="checkmark" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Character Preview */}
        <View style={styles.previewContainer}>
          <BasicDiceBearAvatar appearance={appearance} size={150} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'face' && styles.activeTab]}
            onPress={() => setActiveTab('face')}
          >
            <Ionicons name="person" size={20} color={activeTab === 'face' ? '#007AFF' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'face' && styles.activeTabText]}>Face</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'hair' && styles.activeTab]}
            onPress={() => setActiveTab('hair')}
          >
            <Ionicons name="cut" size={20} color={activeTab === 'hair' ? '#007AFF' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'hair' && styles.activeTabText]}>Hair</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'clothing' && styles.activeTab]}
            onPress={() => setActiveTab('clothing')}
          >
            <Ionicons name="shirt" size={20} color={activeTab === 'clothing' ? '#007AFF' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'clothing' && styles.activeTabText]}>Clothes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'expression' && styles.activeTab]}
            onPress={() => setActiveTab('expression')}
          >
            <Ionicons name="happy" size={20} color={activeTab === 'expression' ? '#007AFF' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'expression' && styles.activeTabText]}>Mood</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'accessories' && styles.activeTab]}
            onPress={() => setActiveTab('accessories')}
          >
            <Ionicons name="diamond" size={20} color={activeTab === 'accessories' ? '#007AFF' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'accessories' && styles.activeTabText]}>Style</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.tabContentContainer}>
          {renderTabContent()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
    marginTop: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    borderWidth: 1,
    borderColor: '#D5D5D5',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
});

export default CharacterEditor;
