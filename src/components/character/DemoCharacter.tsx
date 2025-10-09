import React from 'react';
import { View, StyleSheet } from 'react-native';
import FullDiceBearAvatar from './FullDiceBearAvatar';
import { CharacterAppearance } from '../../types/character';

// Demo character with interesting features to showcase the 8-bit system
const DEMO_CHARACTER: CharacterAppearance = {
  faceShape: 'oval',
  skinTone: 'medium',
  hairStyle: 'curly',
  hairColor: 'blue',
  eyeColor: 'brown',
  eyeShape: 'normal',
  facialHair: 'none',
  shirtStyle: 'hoodie',
  shirtColor: 'blue',
  accessories: ['glasses', 'hat'],
  expression: 'happy'
};

interface DemoCharacterProps {
  size?: number;
  style?: any;
}

const DemoCharacter: React.FC<DemoCharacterProps> = ({ size = 200, style }) => {
  return (
    <View style={[styles.container, style]}>
      <FullDiceBearAvatar appearance={DEMO_CHARACTER} size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DemoCharacter;
