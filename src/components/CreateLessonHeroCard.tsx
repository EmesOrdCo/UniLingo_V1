import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

export default function CreateLessonHeroCard() {
  const navigation = useNavigation();
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create a continuous glow animation
    const glowLoop = () => {
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start(() => glowLoop());
    };
    
    glowLoop();
  }, [glowAnimation]);

  const handleCreateLesson = () => {
    // Navigate to CreateLesson screen (PDF upload)
    navigation.navigate('CreateLesson' as never);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Main card with gradient-like background */}
      <View style={styles.card}>
        {/* Glow effect overlay */}
        <Animated.View 
          style={[
            styles.glowOverlay,
            { opacity: glowOpacity }
          ]} 
        />
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>Ready to learn?</Text>
          <Text style={styles.title}>Start Studying Now</Text>
          <Text style={styles.description}>
            Craft your own lesson, start studying.
          </Text>
          
                      <TouchableOpacity
              style={styles.button}
              onPress={handleCreateLesson}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <Animated.View style={[styles.buttonContent, { transform: [{ scale: scaleAnimation }] }]}>
                <Text style={styles.buttonText}>Create a Lesson</Text>
                <Ionicons name="arrow-forward" size={20} color="#6466E9" />
              </Animated.View>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#6466E9',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#6466E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 32,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6466E9',
  },
});
