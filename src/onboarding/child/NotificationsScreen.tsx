import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, OnboardingButton } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { validateScreen } from '../schema';

// Check if expo-notifications is available
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  // expo-notifications not available
}

export function NotificationsScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const { value: wantsNotifications, setValue: setWantsNotifications } = useOnboardingField('wantsNotifications');

  // Handle "Remind me" button
  const handleRemindMe = async () => {
    try {
      if (Notifications) {
        // Request permission if expo-notifications is available
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        setWantsNotifications(granted);
        
        if (granted) {
          Alert.alert(
            'Notifications Enabled',
            'You\'ll receive helpful reminders to keep your learning streak going!',
            [{ text: 'Great!', onPress: () => nextStep() }]
          );
        } else {
          Alert.alert(
            'Notifications Disabled',
            'You can enable notifications later in your device settings.',
            [{ text: 'OK', onPress: () => nextStep() }]
          );
        }
      } else {
        // Fallback: just set to true if expo-notifications not available
        setWantsNotifications(true);
        nextStep();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      // Fallback: set to true and continue
      setWantsNotifications(true);
      nextStep();
    }
  };

  // Handle "Maybe later" button
  const handleMaybeLater = () => {
    setWantsNotifications(false);
    nextStep();
  };

  // Handle back
  const handleBack = () => {
    previousStep();
  };

  return (
    <Screen
      title="Stay on track"
      subtitle="Get gentle reminders to keep your learning streak going"
      canContinue={false} // We handle navigation in button handlers
      onBack={handleBack}
      onContinue={() => {}} // Not used
      showBackButton={true}
    >
      <View style={styles.container}>
        {/* Bell Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.bellIcon}>🔔</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: theme.colors.textMedium }]}>
            We'll send you friendly reminders to practice, celebrate your progress, and help you build a consistent learning habit.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <OnboardingButton
            title="Remind me"
            onPress={handleRemindMe}
            variant="primary"
            style={styles.primaryButton}
            accessibilityLabel="Enable notifications and continue"
            accessibilityHint="Tap to enable learning reminders"
          />
          
          <OnboardingButton
            title="Maybe later"
            onPress={handleMaybeLater}
            variant="secondary"
            style={styles.secondaryButton}
            accessibilityLabel="Skip notifications for now"
            accessibilityHint="Tap to continue without notifications"
          />
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyContainer}>
          <Text style={[styles.privacyText, { color: theme.colors.textLight }]}>
            You can change this anytime in your device settings
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 80,
    lineHeight: 80,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    minHeight: 56,
  },
  secondaryButton: {
    minHeight: 56,
  },
  privacyContainer: {
    paddingHorizontal: 16,
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});

