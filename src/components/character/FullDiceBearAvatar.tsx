import React, { useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { CharacterAppearance } from '../../types/character';

interface FullDiceBearAvatarProps {
  appearance: CharacterAppearance;
  size?: number;
  style?: any;
}

const FullDiceBearAvatar: React.FC<FullDiceBearAvatarProps> = ({ 
  appearance, 
  size = 200, 
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Convert our character appearance to DiceBear style parameters
  const getDiceBearUrl = () => {
    const { faceShape, skinTone, hairStyle, hairColor, eyeColor, shirtStyle, shirtColor, accessories } = appearance;
    
    // Map our properties to DiceBear style parameters
    const params = new URLSearchParams();
    
    // Face shape -> mood
    switch (faceShape) {
      case 'round': params.append('mood', 'happy'); break;
      case 'oval': params.append('mood', 'neutral'); break;
      case 'square': params.append('mood', 'sad'); break;
      case 'heart': params.append('mood', 'excited'); break;
      default: params.append('mood', 'happy');
    }
    
    // Skin tone
    switch (skinTone) {
      case 'light': params.append('skinColor', 'light'); break;
      case 'medium': params.append('skinColor', 'tanned'); break;
      case 'tan': params.append('skinColor', 'yellow'); break;
      case 'dark': params.append('skinColor', 'dark'); break;
      default: params.append('skinColor', 'tanned');
    }
    
    // Hair style and color
    switch (hairStyle) {
      case 'short': params.append('top', 'shortHair'); break;
      case 'medium': params.append('top', 'longHair'); break;
      case 'long': params.append('top', 'longHairFroBand'); break;
      case 'curly': params.append('top', 'longHairCurly'); break;
      case 'afro': params.append('top', 'longHairFro'); break;
      case 'bald': params.append('top', 'noHair'); break;
      default: params.append('top', 'shortHair');
    }
    
    // Hair color
    switch (hairColor) {
      case 'black': params.append('hairColor', 'black'); break;
      case 'brown': params.append('hairColor', 'brown'); break;
      case 'blonde': params.append('hairColor', 'blonde'); break;
      case 'red': params.append('hairColor', 'red'); break;
      case 'gray': params.append('hairColor', 'gray'); break;
      case 'blue': params.append('hairColor', 'auburn'); break;
      case 'pink': params.append('hairColor', 'blonde'); break;
      default: params.append('hairColor', 'brown');
    }
    
    // Eye color
    switch (eyeColor) {
      case 'brown': params.append('eyeColor', 'brown'); break;
      case 'blue': params.append('eyeColor', 'blue'); break;
      case 'green': params.append('eyeColor', 'green'); break;
      case 'hazel': params.append('eyeColor', 'hazel'); break;
      case 'gray': params.append('eyeColor', 'gray'); break;
      default: params.append('eyeColor', 'brown');
    }
    
    // Clothing
    switch (shirtStyle) {
      case 'casual': params.append('clothing', 'shirtCrewNeck'); break;
      case 'formal': params.append('clothing', 'blazerShirt'); break;
      case 'hoodie': params.append('clothing', 'hoodie'); break;
      case 'dress': params.append('clothing', 'dress'); break;
      case 'tank': params.append('clothing', 'tankTop'); break;
      default: params.append('clothing', 'shirtCrewNeck');
    }
    
    // Clothing color
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
    
    // Accessories
    if (accessories.includes('glasses')) {
      params.append('accessories', 'eyewear');
    }
    if (accessories.includes('hat')) {
      params.append('top', 'hat');
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
          <View style={styles.emojiContainer}>
            <Text style={styles.fallbackText}>👤</Text>
          </View>
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
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 40,
    color: 'white',
  },
});

export default FullDiceBearAvatar;
