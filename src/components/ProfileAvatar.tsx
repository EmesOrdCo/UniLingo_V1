import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfilePictureService } from '../lib/profilePictureService';
import { useAuth } from '../contexts/AuthContext';

interface ProfileAvatarProps {
  size?: number;
  color?: string;
  onPress?: () => void;
  showCameraIcon?: boolean;
  style?: any;
  refreshTrigger?: number; // Add refresh trigger prop
}

export default function ProfileAvatar({ 
  size = 48, 
  color = '#6366f1', 
  onPress, 
  showCameraIcon = false,
  style,
  refreshTrigger = 0
}: ProfileAvatarProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadProfilePicture();
  }, [refreshTrigger, user?.id]);

  const loadProfilePicture = async () => {
    if (!user?.id) return;
    
    try {
      const savedImageUri = await ProfilePictureService.loadProfilePicture(user.id);
      if (savedImageUri) {
        setProfileImage(savedImageUri);
      }
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const iconSize = size * 0.6; // Icon size relative to avatar size
  const cameraIconSize = size * 0.25; // Camera icon size relative to avatar size

  return (
    <TouchableOpacity 
      style={[styles.container, avatarStyle, style]} 
      onPress={onPress}
      disabled={!onPress}
    >
      {profileImage ? (
        <Image source={{ uri: profileImage }} style={[styles.image, avatarStyle]} />
      ) : (
        <View style={[styles.defaultAvatar, avatarStyle, { backgroundColor: color + '20' }]}>
          <Ionicons name="person" size={iconSize} color={color} />
        </View>
      )}
      
      {showCameraIcon && (
        <View style={[styles.cameraIconContainer, { width: cameraIconSize, height: cameraIconSize }]}>
          <Ionicons name="camera" size={cameraIconSize * 0.6} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
