import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import AnimatedAvatar from '../components/avatar/AnimatedAvatar';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';

/**
 * Example component showing how to integrate animated avatars
 * This demonstrates the subtle animations in action
 */
const AvatarAnimationDemo: React.FC = () => {
  const { 
    currentAnimation, 
    triggerCelebration, 
    triggerEquip, 
    triggerBlink 
  } = useAvatarAnimation();

  return (
    <View style={styles.container}>
      {/* Animated Avatar Display */}
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
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={triggerCelebration}
        >
          <Text style={styles.buttonText}>🎉 Celebrate</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={triggerEquip}
        >
          <Text style={styles.buttonText}>👕 Equip Item</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={triggerBlink}
        >
          <Text style={styles.buttonText}>👁️ Blink</Text>
        </TouchableOpacity>
      </View>

      {/* Current Animation Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Current Animation: {currentAnimation}
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
  avatarContainer: {
    marginBottom: 40,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});

export default AvatarAnimationDemo;
