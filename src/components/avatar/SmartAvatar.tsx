import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AnimatedAvatar from './AnimatedAvatar';
import FallbackAvatar from './FallbackAvatar';

interface SmartAvatarProps {
  size?: number;
  style?: any;
  animationType?: 'idle' | 'blink' | 'celebrate' | 'equip' | 'none';
  onAnimationComplete?: () => void;
  enableAnimations?: boolean;
  fallbackOnError?: boolean;
}

/**
 * Smart Avatar Component
 * Automatically falls back to static avatar if animations fail
 * Provides graceful degradation for better reliability
 */
export const SmartAvatar: React.FC<SmartAvatarProps> = ({
  size = 200,
  style,
  animationType = 'idle',
  onAnimationComplete,
  enableAnimations = true,
  fallbackOnError = true,
}) => {
  const [useFallback, setUseFallback] = useState(!enableAnimations);
  const [fallbackReason, setFallbackReason] = useState<string>('');

  useEffect(() => {
    if (!enableAnimations) {
      setUseFallback(true);
      setFallbackReason('Animations disabled');
      return;
    }

    // Test if animations are supported
    const testAnimationSupport = () => {
      try {
        // Simple test to see if Animated API is working
        const testValue = new (require('react-native').Animated.Value)(0);
        if (testValue && typeof testValue.setValue === 'function') {
          setUseFallback(false);
          setFallbackReason('');
        } else {
          throw new Error('Animated API not available');
        }
      } catch (error) {
        console.warn('Animation support test failed, using fallback:', error);
        setUseFallback(true);
        setFallbackReason('Animation API unavailable');
      }
    };

    testAnimationSupport();
  }, [enableAnimations]);

  // Handle animation errors
  const handleAnimationError = (error: Error) => {
    console.error('Animation error, falling back to static avatar:', error);
    if (fallbackOnError) {
      setUseFallback(true);
      setFallbackReason('Animation error');
    }
  };

  if (useFallback) {
    return (
      <FallbackAvatar 
        size={size}
        style={style}
        fallbackReason={fallbackReason}
      />
    );
  }

  return (
    <View style={style}>
      <AnimatedAvatar
        size={size}
        animationType={animationType}
        onAnimationComplete={onAnimationComplete}
      />
    </View>
  );
};

export default SmartAvatar;
