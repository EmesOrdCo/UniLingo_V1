import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfilePictureService } from '../lib/profilePictureService';

interface ProfileAvatarProps {
  size?: number;
  color?: string;
  onPress?: () => void;
  showCameraIcon?: boolean;
  style?: any;
}

export default function ProfileAvatar({ 
  size = 48, 
  color = '#6366f1', 
  onPress, 
  showCameraIcon = false,
  style 
}: ProfileAvatarProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    loadProfilePicture();
  }, []);

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
