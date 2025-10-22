import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectAvatarOptions } from '../../store/slices/avatarSlice';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { SvgXml } from 'react-native-svg';

interface AvatarProps {
  size?: number;
  style?: any;
}

/**
 * Avatar Component for UniLingo
 * Renders actual DiceBear Avataaars SVG avatars
 * This is the real avatar system from fe-react-avatar-maker
 */
export const Avatar: React.FC<AvatarProps> = ({ size = 200, style }) => {
  const options = useSelector(selectAvatarOptions);

  // Generate avatar SVG using DiceBear Avataaars
  const avatar = createAvatar(avataaars, {
    seed: 'avatar',
    // Map options to avataaars options (with proper types for the library)
    skinColor: [options.skinColor],
    hairColor: [options.hairColor],
    facialHair: [options.facialHairType] as any,
    facialHairProbability: 100,
    facialHairColor: [options.facialHairColor],
    top: [options.topType] as any,
    topProbability: 100,
    clothing: [options.clotheType] as any,
    clothesColor: [options.clotheColor],
    eyes: [options.eyeType] as any,
    eyebrows: [options.eyebrowType] as any,
    mouth: [options.mouthType] as any,
    accessories: [options.accessoriesType] as any,
    accessoriesProbability: 100,
  });

  const svgString = avatar.toString();

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={styles.avatarFrame}>
        <SvgXml 
          xml={svgString} 
          width={size * 0.8} 
          height={size * 0.8}
          style={styles.avatarSvg}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 1000, // Makes it perfectly circular
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarSvg: {
    borderRadius: 10,
  },
});

export default Avatar;
