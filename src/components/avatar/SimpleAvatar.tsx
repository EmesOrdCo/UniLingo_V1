import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { selectAvatarOptions } from '../../store/slices/avatarSlice';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { SvgXml } from 'react-native-svg';

interface SimpleAvatarProps {
  size?: number;
  style?: any;
}

/**
 * Simple Avatar Component for Dashboard Exercises
 * Displays just the avatar character without the circle background
 */
// Default avatar options as fallback
const defaultAvatarOptions = {
  skinColor: 'f2d3b1',
  hairColor: '2c1b18',
  facialHairType: 'Blank',
  facialHairColor: '2c1b18',
  topType: 'shortWaved',
  clotheType: 'shirtCrewNeck',
  clotheColor: '3c4f5c',
  eyeType: 'default',
  eyebrowType: 'default',
  mouthType: 'default',
  accessoriesType: 'Blank',
};

export const SimpleAvatar: React.FC<SimpleAvatarProps> = ({ 
  size = 60, 
  style 
}) => {
  const options = useSelector(selectAvatarOptions);
  const [hasError, setHasError] = useState(false);
  const [svgString, setSvgString] = useState('');

  useEffect(() => {
    try {
      // Check if options are properly initialized
      if (!options || Object.keys(options).length === 0) {
        console.warn('Avatar options not initialized, using default');
        const defaultAvatar = createAvatar(avataaars, { seed: 'default' });
        setSvgString(defaultAvatar.toString());
        setHasError(false);
        return;
      }

      // Use options or fallback to defaults
      const avatarOptions = options && Object.keys(options).length > 0 ? options : defaultAvatarOptions;
      
      const avatar = createAvatar(avataaars, {
        seed: 'avatar',
        skinColor: [avatarOptions.skinColor],
        hairColor: [avatarOptions.hairColor],
        facialHair: [avatarOptions.facialHairType] as any,
        facialHairProbability: avatarOptions.facialHairType && avatarOptions.facialHairType !== 'Blank' ? 100 : 0,
        facialHairColor: [avatarOptions.facialHairColor],
        top: [avatarOptions.topType] as any,
        topProbability: 100,
        clothing: [avatarOptions.clotheType] as any,
        clothesColor: [avatarOptions.clotheColor],
        eyes: [avatarOptions.eyeType] as any,
        eyebrows: [avatarOptions.eyebrowType] as any,
        mouth: [avatarOptions.mouthType] as any,
        accessories: [avatarOptions.accessoriesType] as any,
        accessoriesProbability: avatarOptions.accessoriesType && avatarOptions.accessoriesType !== 'Blank' ? 100 : 0,
      });
      
      const svg = avatar.toString();
      if (svg && svg.trim().length > 0) {
        setSvgString(svg);
        setHasError(false);
      } else {
        throw new Error('Generated SVG is empty');
      }
    } catch (error) {
      console.error('Error generating simple avatar:', error);
      setHasError(true);
      // Use default avatar as fallback
      try {
        const defaultAvatar = createAvatar(avataaars, { seed: 'default' });
        const fallbackSvg = defaultAvatar.toString();
        if (fallbackSvg && fallbackSvg.trim().length > 0) {
          setSvgString(fallbackSvg);
        } else {
          setSvgString(''); // Will show error state
        }
      } catch (defaultError) {
        console.error('Default avatar generation failed:', defaultError);
        setSvgString(''); // Empty string will show error state
      }
    }
  }, [options]);

  if (hasError && !svgString) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>?</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {svgString && svgString.trim().length > 0 ? (
        <SvgXml 
          xml={svgString} 
          width={size} 
          height={size}
          style={styles.avatarSvg}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>?</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSvg: {
    borderRadius: 0, // No border radius for clean look
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
  },
});

export default SimpleAvatar;
