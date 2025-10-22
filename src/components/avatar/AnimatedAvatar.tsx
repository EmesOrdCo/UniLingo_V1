import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { selectAvatarOptions } from '../../store/slices/avatarSlice';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { SvgXml } from 'react-native-svg';

interface AnimatedAvatarProps {
  size?: number;
  style?: any;
  animationType?: 'idle' | 'blink' | 'celebrate' | 'equip' | 'disappointed' | 'none';
  onAnimationComplete?: () => void;
  showCircle?: boolean; // New prop to control circle background
}

/**
 * Animated Avatar Component for UniLingo
 * Adds subtle animations to existing DiceBear Avataaars SVG avatars
 * Maintains the flat design aesthetic with minimal, elegant animations
 */
export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ 
  size = 200, 
  style, 
  animationType = 'idle',
  onAnimationComplete,
  showCircle = true // Default to showing circle for backward compatibility
}) => {
  const options = useSelector(selectAvatarOptions);
  
  // Animation values
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate avatar SVG using DiceBear Avataaars with error handling
  let avatar;
  let svgString = '';
  
  try {
    avatar = createAvatar(avataaars, {
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
    svgString = avatar.toString();
  } catch (error) {
    console.error('Error generating avatar:', error);
    setHasError(true);
    // Fallback to default avatar
    avatar = createAvatar(avataaars, { seed: 'default' });
    svgString = avatar.toString();
  }

  // Idle bounce animation (subtle, continuous, only when not animating)
  useEffect(() => {
    if (animationType === 'idle' && !isAnimating) {
      console.log('😌 Starting idle animation');
      const idleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -2,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      idleAnimation.start();
      return () => {
        console.log('😌 Stopping idle animation');
        idleAnimation.stop();
        bounceAnim.setValue(0); // Reset to prevent state issues
      };
    }
  }, [animationType, bounceAnim, isAnimating]);

  // Blink animation (subtle, occasional)
  useEffect(() => {
    if (animationType === 'blink') {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 0.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
      return () => {
        blinkAnimation.stop();
        blinkAnim.setValue(1); // Reset to prevent state issues
      };
    }
  }, [animationType, blinkAnim]);

  // Celebrate animation (one-time, triggered)
  useEffect(() => {
    if (animationType === 'celebrate' && !isAnimating) {
      setIsAnimating(true);
      console.log('🎉 Starting celebrate animation - initial values:', {
        scale: scaleAnim._value,
        rotate: rotateAnim._value,
        bounce: bounceAnim._value
      });
      
      const celebrateAnimation = Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
      
      celebrateAnimation.start((finished) => {
        console.log('🎉 Celebrate animation completed');
        setIsAnimating(false);
        resetAnimations(); // Reset after animation completes
        onAnimationComplete?.();
      });
    }
  }, [animationType, scaleAnim, rotateAnim, isAnimating, onAnimationComplete]);

  // Equip animation (one-time, triggered)
  useEffect(() => {
    if (animationType === 'equip' && !isAnimating) {
      setIsAnimating(true);
      const equipAnimation = Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]);
      
      equipAnimation.start(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      });
    }
  }, [animationType, scaleAnim, isAnimating, onAnimationComplete]);

  // Disappointed animation (one-time, triggered)
  useEffect(() => {
    if (animationType === 'disappointed' && !isAnimating) {
      setIsAnimating(true);
      console.log('😞 Starting disappointed animation - initial values:', {
        scale: scaleAnim._value,
        rotate: rotateAnim._value,
        bounce: bounceAnim._value
      });
      
      const disappointedAnimation = Animated.sequence([
        // Shake left
        Animated.timing(rotateAnim, {
          toValue: -0.5,
          duration: 100,
          useNativeDriver: true,
        }),
        // Shake right
        Animated.timing(rotateAnim, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: true,
        }),
        // Shake left again
        Animated.timing(rotateAnim, {
          toValue: -0.3,
          duration: 100,
          useNativeDriver: true,
        }),
        // Shake right again
        Animated.timing(rotateAnim, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: true,
        }),
        // Return to center
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]);
      
      disappointedAnimation.start(() => {
        console.log('😞 Disappointed animation completed');
        setIsAnimating(false);
        resetAnimations(); // Reset after animation completes
        onAnimationComplete?.();
      });
    }
  }, [animationType, bounceAnim, scaleAnim, rotateAnim, isAnimating, onAnimationComplete]);

  // Reset animations only when component mounts
  useEffect(() => {
    console.log('🔄 Initializing animations');
    bounceAnim.setValue(0);
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
    blinkAnim.setValue(1);
  }, []); // Only run once on mount

  // Manual reset function for when animations complete
  const resetAnimations = () => {
    console.log('🔄 Manually resetting animations');
    bounceAnim.setValue(0);
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
    blinkAnim.setValue(1);
  };

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Stop all animations and reset values
      bounceAnim.stopAnimation();
      scaleAnim.stopAnimation();
      rotateAnim.stopAnimation();
      blinkAnim.stopAnimation();
    };
  }, []);

  // Calculate rotation interpolation
  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.View 
        style={[
          showCircle ? styles.avatarFrame : styles.avatarFrameNoCircle,
          {
            transform: [
              { translateY: bounceAnim },
              { scale: scaleAnim },
              { rotate: rotateInterpolation },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.avatarSvg,
            {
              opacity: blinkAnim,
            },
          ]}
        >
          <SvgXml 
            xml={svgString} 
            width={showCircle ? size * 0.8 : size} 
            height={showCircle ? size * 0.8 : size}
          />
        </Animated.View>
      </Animated.View>
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
  avatarFrameNoCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSvg: {
    borderRadius: 10,
  },
});

export default AnimatedAvatar;
