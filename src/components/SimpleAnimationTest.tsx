import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Text } from 'react-native';

/**
 * Simple animation test to verify transforms work
 */
const SimpleAnimationTest: React.FC = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const testAnimation = () => {
    console.log('🧪 Testing simple animation - initial values:', {
      scale: scaleAnim._value,
      rotate: rotateAnim._value
    });

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      console.log('🧪 Simple animation completed - final values:', {
        scale: scaleAnim._value,
        rotate: rotateAnim._value
      });
    });
  };

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Animation Test</Text>
      
      <Animated.View 
        style={[
          styles.testBox,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolation },
            ],
          },
        ]}
      >
        <Text style={styles.boxText}>TEST</Text>
      </Animated.View>

      <TouchableOpacity style={styles.button} onPress={testAnimation}>
        <Text style={styles.buttonText}>Test Animation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1f2937',
  },
  testBox: {
    width: 100,
    height: 100,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  boxText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SimpleAnimationTest;
