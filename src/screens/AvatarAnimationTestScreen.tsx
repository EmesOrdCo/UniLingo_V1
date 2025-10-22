import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedAvatar from '../components/avatar/AnimatedAvatar';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';

/**
 * Simple Avatar Animation Test Screen
 * Add this to your navigation to test animations
 */
const AvatarAnimationTestScreen: React.FC = () => {
  const { 
    currentAnimation, 
    triggerCelebration, 
    triggerEquip, 
    triggerBlink,
    triggerDisappointed,
    resetToIdle 
  } = useAvatarAnimation();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Avatar Animation Test</Text>
      
      {/* Animated Avatar */}
      <View style={styles.avatarContainer}>
        <AnimatedAvatar 
          size={200}
          animationType={currentAnimation}
          onAnimationComplete={() => {
            console.log('Animation completed!');
          }}
        />
      </View>

      {/* Animation Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.celebrateButton]} 
          onPress={() => {
            console.log('🎉 Correct answer button pressed');
            triggerCelebration();
          }}
        >
          <Text style={styles.buttonText}>🎉 Correct Answer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.disappointedButton]} 
          onPress={() => {
            console.log('😞 Wrong answer button pressed');
            triggerDisappointed();
          }}
        >
          <Text style={styles.buttonText}>😞 Wrong Answer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.equipButton]} 
          onPress={() => {
            console.log('👕 Equip button pressed');
            triggerEquip();
          }}
        >
          <Text style={styles.buttonText}>👕 Equip Item</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.blinkButton]} 
          onPress={() => {
            console.log('👁️ Blink button pressed');
            triggerBlink();
          }}
        >
          <Text style={styles.buttonText}>👁️ Blink</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.idleButton]} 
          onPress={() => {
            console.log('😌 Idle button pressed');
            resetToIdle();
          }}
        >
          <Text style={styles.buttonText}>😌 Idle</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.status}>
        <Text style={styles.statusText}>
          Current Animation: {currentAnimation}
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          • Idle: Subtle bounce (automatic){'\n'}
          • Correct Answer: Scale + rotate (success){'\n'}
          • Wrong Answer: Left-right shake (disappointment){'\n'}
          • Equip Item: Quick scale pop (item unlock){'\n'}
          • Blink: Eye fade (acknowledgment)
        </Text>
      </View>
    </SafeAreaView>
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
  disappointedButton: {
    backgroundColor: '#ef4444',
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

export default AvatarAnimationTestScreen;
