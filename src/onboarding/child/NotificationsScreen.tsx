import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, OnboardingButton } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { validateScreen } from '../schema';
import { NotificationService } from '../../lib/notificationService';

export function NotificationsScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const { value: wantsNotifications, setValue: setWantsNotifications } = useOnboardingField('wantsNotifications');
  const [isLoading, setIsLoading] = useState(false);

  // Handle "Remind me" button
  const handleRemindMe = async () => {
    try {
      setIsLoading(true);
      
      // Request notification permissions
      const hasPermission = await NotificationService.requestPermissions();
      setWantsNotifications(hasPermission);
      
      if (hasPermission) {
        // Schedule daily reminder with random time between 1-3 PM
        const scheduled = await NotificationService.scheduleDailyReminder();
        
        if (scheduled) {
          Alert.alert(
            'Notifications Enabled! 🔔',
            'You\'ll receive daily reminders between 1-3 PM to keep your learning streak going!',
            [{ text: 'Perfect!', onPress: () => nextStep() }]
          );
        } else {
          Alert.alert(
            'Notifications Enabled',
            'You\'ll receive helpful reminders to keep your learning streak going!',
            [{ text: 'Great!', onPress: () => nextStep() }]
          );
        }
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in your device settings.',
          [{ text: 'OK', onPress: () => nextStep() }]
        );
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      Alert.alert(
        'Error',
        'There was an issue setting up notifications. You can try again later.',
        [{ text: 'OK', onPress: () => nextStep() }]
      );
    } finally {
      setIsLoading(false);
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
            We'll send you friendly reminders between 1-3 PM to practice, celebrate your progress, and help you build a consistent learning habit.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <OnboardingButton
            title={isLoading ? "Setting up..." : "Remind me"}
            onPress={handleRemindMe}
            variant="primary"
            style={styles.primaryButton}
            disabled={isLoading}
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

