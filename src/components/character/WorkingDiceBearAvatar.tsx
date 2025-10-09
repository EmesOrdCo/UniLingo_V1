import React, { useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { CharacterAppearance } from '../../types/character';

interface WorkingDiceBearAvatarProps {
  appearance: CharacterAppearance;
  size?: number;
  style?: any;
}

const WorkingDiceBearAvatar: React.FC<WorkingDiceBearAvatarProps> = ({ 
  appearance, 
  size = 200, 
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Simple approach - just use basic DiceBear with minimal parameters
  const getDiceBearUrl = () => {
    const { skinTone, hairColor, eyeColor, shirtColor } = appearance;
    
    // Use minimal parameters that we know work
    const params = new URLSearchParams();
    
    // Only add parameters that are known to work
    switch (skinTone) {
      case 'light': params.append('skinColor', 'light'); break;
      case 'medium': params.append('skinColor', 'tanned'); break;
      case 'tan': params.append('skinColor', 'yellow'); break;
      case 'dark': params.append('skinColor', 'dark'); break;
      default: params.append('skinColor', 'tanned');
    }
    
    switch (hairColor) {
      case 'black': params.append('hairColor', 'black'); break;
      case 'brown': params.append('hairColor', 'brown'); break;
      case 'blonde': params.append('hairColor', 'blonde'); break;
      case 'red': params.append('hairColor', 'red'); break;
      case 'gray': params.append('hairColor', 'gray'); break;
      default: params.append('hairColor', 'brown');
    }
    
    switch (eyeColor) {
      case 'brown': params.append('eyeColor', 'brown'); break;
      case 'blue': params.append('eyeColor', 'blue'); break;
      case 'green': params.append('eyeColor', 'green'); break;
      case 'hazel': params.append('eyeColor', 'hazel'); break;
      case 'gray': params.append('eyeColor', 'gray'); break;
      default: params.append('eyeColor', 'brown');
    }
    
    switch (shirtColor) {
      case 'white': params.append('clothingColor', 'white'); break;
      case 'black': params.append('clothingColor', 'black'); break;
      case 'blue': params.append('clothingColor', 'blue'); break;
      case 'red': params.append('clothingColor', 'red'); break;
      case 'green': params.append('clothingColor', 'green'); break;
      case 'yellow': params.append('clothingColor', 'yellow'); break;
      case 'purple': params.append('clothingColor', 'purple'); break;
      default: params.append('clothingColor', 'blue');
    }
    
    // Background color
    params.append('backgroundColor', 'b6e3f4');
    
    return `https://api.dicebear.com/7.x/avataaars/png?${params.toString()}`;
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

export default WorkingDiceBearAvatar;
