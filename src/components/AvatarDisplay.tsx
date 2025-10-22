import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AvatarDisplayProps {
  size?: number;
  onPress?: () => void;
  showCustomizeButton?: boolean;
}

/**
 * Avatar Display Component for UniLingo
 * Shows user's current avatar with optional customization button
 */
const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ 
  size = 100, 
  onPress,
  showCustomizeButton = true 
}) => {
  return (
    <View style={styles.container}>
      {/* Avatar Preview */}
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        <Text style={styles.avatarPlaceholder}>
          👤
        </Text>
      </View>
      
      {/* Customize Button */}
      {showCustomizeButton && onPress && (
        <TouchableOpacity style={styles.customizeButton} onPress={onPress}>
          <Text style={styles.customizeButtonText}>Customize</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: 8,
  },
  avatarPlaceholder: {
    fontSize: 40,
  },
  customizeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  customizeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AvatarDisplay;
