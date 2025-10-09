import React, { useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { CharacterAppearance } from '../../types/character';

interface BasicDiceBearAvatarProps {
  appearance: CharacterAppearance;
  size?: number;
  style?: any;
}

const BasicDiceBearAvatar: React.FC<BasicDiceBearAvatarProps> = ({ 
  appearance, 
  size = 200, 
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Start with the basic URL that we know works
  const getDiceBearUrl = () => {
    // Basic URL that works - just add background color
    return 'https://api.dicebear.com/7.x/avataaars/png?backgroundColor=b6e3f4';
  };
  
  if (imageError) {
    // Fallback: simple colored circle with emoji
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View style={[styles.fallbackCircle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.fallbackText}>👤</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={{ uri: getDiceBearUrl() }}
        style={styles.image}
        onError={(error) => {
          console.log('DiceBear avatar load error:', error);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('DiceBear avatar loaded successfully');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  fallbackCircle: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 40,
    color: 'white',
  },
});

export default BasicDiceBearAvatar;
