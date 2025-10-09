import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CharacterAppearance } from '../../types/character';
import FaceSimple from './FaceSimple';
import EyesSimple from './EyesSimple';
import HairSimple from './HairSimple';
import MouthSimple from './MouthSimple';
import ShirtSimple from './ShirtSimple';
import AccessoriesSimple from './AccessoriesSimple';

interface CharacterRendererProps {
  appearance: CharacterAppearance;
  size?: number;
  style?: any;
}

const CharacterRendererSimple: React.FC<CharacterRendererProps> = ({ 
  appearance, 
  size = 200, 
  style 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Render character parts in correct order (back to front) */}
      
      {/* Face (base layer) */}
      <View style={styles.layer}>
        <FaceSimple appearance={appearance} size={size} />
      </View>
      
      {/* Hair (on top of face) */}
      <View style={styles.layer}>
        <HairSimple appearance={appearance} size={size} />
      </View>
      
      {/* Eyes (on top of face and hair) */}
      <View style={styles.layer}>
        <EyesSimple appearance={appearance} size={size} />
      </View>
      
      {/* Mouth (on top of face) */}
      <View style={styles.layer}>
        <MouthSimple appearance={appearance} size={size} />
      </View>
      
      {/* Shirt (bottom part) */}
      <View style={styles.layer}>
        <ShirtSimple appearance={appearance} size={size} />
      </View>
      
      {/* Accessories (on top of everything) */}
      <View style={styles.layer}>
        <AccessoriesSimple appearance={appearance} size={size} />
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

export default CharacterRendererSimple;
