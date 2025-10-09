import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CharacterAppearance } from '../../types/character';
import Face from './Face';
import Eyes from './Eyes';
import Hair from './Hair';
import Mouth from './Mouth';
import Shirt from './Shirt';
import Accessories from './Accessories';

interface CharacterRendererProps {
  appearance: CharacterAppearance;
  size?: number;
  style?: any;
}

const CharacterRenderer: React.FC<CharacterRendererProps> = ({ 
  appearance, 
  size = 200, 
  style 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Render character parts in correct order (back to front) */}
      
      {/* Face (base layer) */}
      <View style={styles.layer}>
        <Face appearance={appearance} size={size} />
      </View>
      
      {/* Hair (on top of face) */}
      <View style={styles.layer}>
        <Hair appearance={appearance} size={size} />
      </View>
      
      {/* Eyes (on top of face and hair) */}
      <View style={styles.layer}>
        <Eyes appearance={appearance} size={size} />
      </View>
      
      {/* Mouth (on top of face) */}
      <View style={styles.layer}>
        <Mouth appearance={appearance} size={size} />
      </View>
      
      {/* Shirt (bottom part) */}
      <View style={styles.layer}>
        <Shirt appearance={appearance} size={size} />
      </View>
      
      {/* Accessories (on top of everything) */}
      <View style={styles.layer}>
        <Accessories appearance={appearance} size={size} />
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

export default CharacterRenderer;
