import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoControls, VideoCategory } from './VideoControls';

interface FlashcardSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  
  // Language settings
  showNativeLanguage: boolean;
  onToggleLanguage: () => void;
  nativeLanguage?: string;
  
  // Video settings
  videoCategory: VideoCategory;
  onCategoryChange: (category: VideoCategory) => void;
  isVideoMuted: boolean;
  onMuteToggle: () => void;
}

export const FlashcardSettingsModal: React.FC<FlashcardSettingsModalProps> = ({
  visible,
  onClose,
  showNativeLanguage,
  onToggleLanguage,
  nativeLanguage,
  videoCategory,
  onCategoryChange,
  isVideoMuted,
  onMuteToggle,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Study Settings</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {/* Language Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language Display</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="language" size={20} color="#6366f1" />
                <Text style={styles.settingLabel}>Show Native Language</Text>
              </View>
              <Switch
                value={showNativeLanguage}
                onValueChange={onToggleLanguage}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor={showNativeLanguage ? '#ffffff' : '#ffffff'}
              />
            </View>
            <Text style={styles.settingDescription}>
              Toggle between {nativeLanguage || 'Native'} and English display
            </Text>
          </View>
          
          {/* Video Background Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Video Background</Text>
            
            {/* Video Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons 
                  name={videoCategory ? "videocam" : "videocam-off"} 
                  size={20} 
                  color={videoCategory ? "#6366f1" : "#6b7280"} 
                />
                <Text style={styles.settingLabel}>Enable Video Background</Text>
              </View>
              <Switch
                value={!!videoCategory}
                onValueChange={(value) => onCategoryChange(value ? 'mix' : null)}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor={videoCategory ? '#ffffff' : '#ffffff'}
              />
            </View>
            
            {/* Video Category Selection */}
            {videoCategory && (
              <View style={styles.videoCategorySection}>
                <Text style={styles.categoryLabel}>Video Category:</Text>
                <View style={styles.categoryButtons}>
                  {[
                    { key: 'minecraft', label: 'Minecraft', icon: 'cube' },
                    { key: 'gta', label: 'GTA', icon: 'car' },
                    { key: 'subway_surfers', label: 'Subway Surfers', icon: 'train' },
                    { key: 'mix', label: 'Mix', icon: 'shuffle' },
                  ].map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryButton,
                        videoCategory === category.key && styles.activeCategoryButton,
                      ]}
                      onPress={() => onCategoryChange(category.key as VideoCategory)}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={16}
                        color={videoCategory === category.key ? '#ffffff' : '#6366f1'}
                      />
                      <Text
                        style={[
                          styles.categoryButtonText,
                          videoCategory === category.key && styles.activeCategoryButtonText,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Mute Toggle */}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons 
                      name={isVideoMuted ? "volume-mute" : "volume-high"} 
                      size={20} 
                      color={isVideoMuted ? "#6b7280" : "#6366f1"} 
                    />
                    <Text style={styles.settingLabel}>Video Audio</Text>
                  </View>
                  <Switch
                    value={!isVideoMuted}
                    onValueChange={() => onMuteToggle()}
                    trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                    thumbColor={!isVideoMuted ? '#ffffff' : '#ffffff'}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  {isVideoMuted ? 'Videos will play silently' : 'Videos will play with audio'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 28,
  },
  videoCategorySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
    justifyContent: 'center',
  },
  activeCategoryButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  activeCategoryButtonText: {
    color: '#ffffff',
  },
});
