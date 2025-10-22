import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import AnimatedAvatar from '../components/avatar/AnimatedAvatar';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';

/**
 * Simple test component to verify avatar animations work
 * Add this to your app temporarily to test the animations
 */
const AvatarAnimationTest: React.FC = () => {
  const { 
    currentAnimation, 
    triggerCelebration, 
    triggerEquip, 
    triggerBlink,
    resetToIdle 
  } = useAvatarAnimation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avatar Animation Test</Text>
      
      {/* Animated Avatar */}
      <View style={styles.avatarContainer}>
        <AnimatedAvatar 
          size={150}
          animationType={currentAnimation}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.celebrateButton]} 
          onPress={triggerCelebration}
        >
          <Text style={styles.buttonText}>🎉 Celebrate</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.equipButton]} 
          onPress={triggerEquip}
        >
          <Text style={styles.buttonText}>👕 Equip</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.blinkButton]} 
          onPress={triggerBlink}
        >
          <Text style={styles.buttonText}>👁️ Blink</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.idleButton]} 
          onPress={resetToIdle}
        >
          <Text style={styles.buttonText}>😌 Idle</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.status}>
        <Text style={styles.statusText}>
          Current: {currentAnimation}
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          • Idle: Subtle bounce (automatic){'\n'}
          • Celebrate: Scale + rotate (success){'\n'}
          • Equip: Quick scale pop (item unlock){'\n'}
          • Blink: Eye fade (acknowledgment)
        </Text>
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  celebrateButton: {
    backgroundColor: '#10b981',
  },
  equipButton: {
    backgroundColor: '#3b82f6',
  },
  blinkButton: {
    backgroundColor: '#8b5cf6',
  },
  idleButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  status: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 8,
    maxWidth: 300,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default AvatarAnimationTest;
