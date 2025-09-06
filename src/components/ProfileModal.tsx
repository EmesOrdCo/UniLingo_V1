import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useProfilePicture } from '../contexts/ProfilePictureContext';
import { HolisticProgressService } from '../lib/holisticProgressService';
import { ProfilePictureService } from '../lib/profilePictureService';
import ProfileAvatar from './ProfileAvatar';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { user, profile, signOut } = useAuth();
  const { triggerRefresh, refreshTrigger } = useProfilePicture();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreak = async () => {
      if (visible && user?.id) {
        try {
          const streak = await HolisticProgressService.getCurrentStreak(user.id, 'daily_study');
          setCurrentStreak(streak?.current_streak || 0);
        } catch (error) {
          console.error('Error fetching streak:', error);
        }
      }
    };

    const loadProfilePicture = async () => {
      try {
        const savedImageUri = await ProfilePictureService.loadProfilePicture();
        if (savedImageUri) {
          setProfileImage(savedImageUri);
        }
      } catch (error) {
        console.error('Error loading profile picture:', error);
      }
    };

    fetchStreak();
    loadProfilePicture();
  }, [visible, user?.id]);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to make this work!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile picture
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Save to persistent storage
        try {
          await ProfilePictureService.saveProfilePicture(imageUri);
          triggerRefresh(); // Use global refresh trigger
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          console.error('Error saving profile picture:', error);
          Alert.alert('Error', 'Failed to save profile picture. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profile</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
                    <TouchableOpacity style={styles.profileAvatarContainer} onPress={pickImage}>
          <ProfileAvatar 
            size={80} 
            color="#ffffff" 
            onPress={pickImage}
            showCameraIcon={true}
            refreshTrigger={refreshTrigger}
          />
        </TouchableOpacity>
            <Text style={styles.profileName}>{profile?.name || 'User Name'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatNumber}>1,247</Text>
              <Text style={styles.profileStatLabel}>Total Cards</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatNumber}>892</Text>
              <Text style={styles.profileStatLabel}>Mastered</Text>
            </View>
            <View style={styles.profileStat}>
              <View style={styles.streakDisplay}>
                <Ionicons name="flame" size={16} color="#f59e0b" />
                <Text style={styles.profileStatNumber}>{currentStreak}</Text>
              </View>
              <Text style={styles.profileStatLabel}>Day Streak</Text>
            </View>
          </View>
          
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.profileActionButton}>
              <Ionicons name="person" size={20} color="#6366f1" />
              <Text style={styles.profileActionText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileActionButton}>
              <Ionicons name="settings" size={20} color="#6366f1" />
              <Text style={styles.profileActionText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.profileActionButton, styles.signOutButton]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={[styles.profileActionText, styles.signOutText]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  streakDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileActions: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  profileActionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#fef2f2',
  },
  signOutText: {
    color: '#ef4444',
  },
});
