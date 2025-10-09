import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CharacterAppearance } from '../../types/character';
import Face8Bit from './Face8Bit';
import Eyes8Bit from './Eyes8Bit';
import Hair8Bit from './Hair8Bit';
import Mouth8Bit from './Mouth8Bit';
import Shirt8Bit from './Shirt8Bit';
import Accessories8Bit from './Accessories8Bit';

interface CharacterRendererProps {
  appearance: CharacterAppearance;
  size?: number;
  style?: any;
}

const CharacterRenderer8Bit: React.FC<CharacterRendererProps> = ({ 
  appearance, 
  size = 200, 
  style 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Render character parts in correct order (back to front) */}
      
      {/* Face (base layer) */}
      <View style={styles.layer}>
        <Face8Bit appearance={appearance} size={size} />
      </View>
      
      {/* Hair (on top of face) */}
      <View style={styles.layer}>
        <Hair8Bit appearance={appearance} size={size} />
      </View>
      
      {/* Eyes (on top of face and hair) */}
      <View style={styles.layer}>
        <Eyes8Bit appearance={appearance} size={size} />
      </View>
      
      {/* Mouth (on top of face) */}
      <View style={styles.layer}>
        <Mouth8Bit appearance={appearance} size={size} />
      </View>
      
      {/* Shirt (bottom part) */}
      <View style={styles.layer}>
        <Shirt8Bit appearance={appearance} size={size} />
      </View>
      
      {/* Accessories (on top of everything) */}
      <View style={styles.layer}>
        <Accessories8Bit appearance={appearance} size={size} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default CharacterRenderer8Bit;
