import React, { useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { CharacterAppearance, DEFAULT_CHARACTER } from '../../types/character';

interface DebugDiceBearAvatarProps {
  appearance?: CharacterAppearance;
  size?: number;
  style?: any;
}

const DebugDiceBearAvatar: React.FC<DebugDiceBearAvatarProps> = ({ 
  appearance = DEFAULT_CHARACTER,
  size = 200, 
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
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
    
    const finalUrl = `https://api.dicebear.com/7.x/avataaars/png?${params.toString()}`;
    setDebugInfo(finalUrl);
    
    return finalUrl;
  };
  
  if (imageError) {
    // Fallback: simple colored circle with emoji
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View style={[styles.fallbackCircle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.fallbackText}>👤</Text>
          <Text style={styles.errorText}>Error</Text>
        </View>
        <Text style={styles.debugText} numberOfLines={3}>
          {debugInfo}
        </Text>
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
          console.log('Failed URL:', debugInfo);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('DiceBear avatar loaded successfully');
          console.log('Success URL:', debugInfo);
        }}
      />
      <Text style={styles.urlText} numberOfLines={2}>
        {debugInfo}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'blue',
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
  errorText: {
    fontSize: 10,
    color: 'white',
    marginTop: 4,
  },
  debugText: {
    position: 'absolute',
    bottom: -60,
    fontSize: 8,
    color: 'red',
    backgroundColor: 'white',
    padding: 4,
    maxWidth: 300,
  },
  urlText: {
    position: 'absolute',
    bottom: -40,
    fontSize: 6,
    color: 'blue',
    backgroundColor: 'white',
    padding: 2,
    maxWidth: 250,
  },
});

export default DebugDiceBearAvatar;
