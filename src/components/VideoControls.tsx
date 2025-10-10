import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoDebugService } from '../lib/videoDebugService';
import { StorageTestService } from '../lib/storageTestService';

export type VideoCategory = 'minecraft' | 'gta' | 'subway_surfers' | 'mix' | null;

interface VideoControlsProps {
  selectedCategory: VideoCategory;
  onCategoryChange: (category: VideoCategory) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const CATEGORIES = [
  { key: 'minecraft', label: 'Minecraft', icon: 'cube' },
  { key: 'gta', label: 'GTA', icon: 'car' },
  { key: 'subway_surfers', label: 'Subway Surfers', icon: 'train' },
  { key: 'mix', label: 'Mix', icon: 'shuffle' },
] as const;

export const VideoControls: React.FC<VideoControlsProps> = ({
  selectedCategory,
  onCategoryChange,
  isMuted,
  onMuteToggle,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedCategoryData = CATEGORIES.find(cat => cat.key === selectedCategory);

  const handleCategorySelect = (category: VideoCategory) => {
    onCategoryChange(category);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDebugBucket = async () => {
    console.log('🔍 Running bucket debug...');
    await StorageTestService.testStorageAccess();
    await VideoDebugService.debugBrainrotBucket();
    await VideoDebugService.listAllBuckets();
  };

  return (
    <View style={styles.container}>
      {/* Video Background Toggle */}
      <TouchableOpacity
        style={[
          styles.controlButton,
          selectedCategory ? styles.activeControlButton : styles.inactiveControlButton,
        ]}
        onPress={() => {
          if (selectedCategory) {
            onCategoryChange(null); // Turn off video background
          } else {
            onCategoryChange('mix'); // Default to mix when turning on
          }
        }}
      >
        <Ionicons
          name={selectedCategory ? 'videocam' : 'videocam-off'}
          size={18}
          color={selectedCategory ? '#ffffff' : '#6366f1'}
        />
      </TouchableOpacity>

      {/* Category Dropdown (only show when video is enabled) */}
      {selectedCategory && (
        <>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={toggleDropdown}
          >
            <Ionicons name={selectedCategoryData?.icon || 'cube'} size={16} color="#6366f1" />
            <Text style={styles.dropdownText}>
              {selectedCategoryData?.label || 'Select'}
            </Text>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#6366f1"
            />
          </TouchableOpacity>

          {/* Mute Toggle (only show when video is enabled) */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              isMuted ? styles.inactiveControlButton : styles.activeControlButton,
            ]}
            onPress={onMuteToggle}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={18}
              color={isMuted ? '#6366f1' : '#ffffff'}
            />
          </TouchableOpacity>

          {/* Debug Button (only show when video is enabled) */}
          <TouchableOpacity
            style={[styles.controlButton, styles.debugButton]}
            onPress={handleDebugBucket}
          >
            <Ionicons
              name="bug"
              size={18}
              color="#ef4444"
            />
          </TouchableOpacity>
        </>
      )}

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdownContainer}>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedCategory === item.key && styles.selectedDropdownItem,
                  ]}
                  onPress={() => handleCategorySelect(item.key as VideoCategory)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={selectedCategory === item.key ? '#ffffff' : '#6366f1'}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCategory === item.key && styles.selectedDropdownItemText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedCategory === item.key && (
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  activeControlButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  inactiveControlButton: {
    backgroundColor: '#f0f4ff',
    borderColor: '#6366f1',
  },
  debugButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
    minWidth: 100,
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedDropdownItem: {
    backgroundColor: '#6366f1',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
    flex: 1,
  },
  selectedDropdownItemText: {
    color: '#ffffff',
  },
});
