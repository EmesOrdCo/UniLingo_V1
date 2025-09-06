import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useThemeTokens } from '../../theme/useThemeTokens';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  animated?: boolean;
  duration?: number;
}

export function ProgressBar({
  progress,
  height = 4,
  animated = true,
  duration = 300,
}: ProgressBarProps) {
  const theme = useThemeTokens();
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: Math.max(0, Math.min(1, progress)),
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(Math.max(0, Math.min(1, progress)));
    }
  }, [progress, animated, duration, animatedWidth]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: theme.colors.border,
          borderRadius: height / 2,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(progress * 100),
      }}
      accessibilityLabel={`Progress: ${Math.round(progress * 100)}%`}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            height,
            backgroundColor: theme.colors.primary,
            borderRadius: height / 2,
            width,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

