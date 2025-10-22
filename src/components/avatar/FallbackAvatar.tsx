import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { selectAvatarOptions } from '../store/slices/avatarSlice';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { SvgXml } from 'react-native-svg';

interface FallbackAvatarProps {
  size?: number;
  style?: any;
  fallbackReason?: string;
}

/**
 * Fallback Avatar Component
 * Used when animations fail or are disabled
 * Provides the same static avatar functionality as the original
 */
export const FallbackAvatar: React.FC<FallbackAvatarProps> = ({ 
  size = 200, 
  style, 
  fallbackReason = 'Animation disabled' 
}) => {
  const options = useSelector(selectAvatarOptions);
  const [hasError, setHasError] = useState(false);
  const [svgString, setSvgString] = useState('');

  useEffect(() => {
    try {
      const avatar = createAvatar(avataaars, {
        seed: 'avatar',
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
      setSvgString(avatar.toString());
      setHasError(false);
    } catch (error) {
      console.error('Fallback avatar generation failed:', error);
      setHasError(true);
      // Use default avatar as last resort
      try {
        const defaultAvatar = createAvatar(avataaars, { seed: 'default' });
        setSvgString(defaultAvatar.toString());
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
          <Text style={styles.errorText}>Avatar Error</Text>
          <Text style={styles.errorSubtext}>Unable to load avatar</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={styles.avatarFrame}>
        <SvgXml 
          xml={svgString} 
          width={size * 0.8} 
          height={size * 0.8}
          style={styles.avatarSvg}
        />
        {fallbackReason && (
          <View style={styles.fallbackIndicator}>
            <Text style={styles.fallbackText}>Static</Text>
          </View>
        )}
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
    borderRadius: 1000,
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
  fallbackIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fallbackText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: '600',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 10,
    color: '#9ca3af',
  },
});

export default FallbackAvatar;
