import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OnboardingOption } from '../components/OnboardingOption';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { validateStep } from '../schema';

export function NotificationsScreen() {
  const theme = useThemeTokens();
  const { notificationsEnabled, updateField, nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNotificationToggle = (enabled: boolean) => {
    updateField('notificationsEnabled', enabled);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateStep(8, {
      notificationsEnabled,
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    markStepCompleted(8);
    nextStep();
  };

  const styles = StyleSheet.create({
    iconContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    notificationIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    optionsContainer: {
      marginBottom: theme.spacing.xl,
    },
    errorText: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.status.error,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    continueButton: {
      marginTop: theme.spacing.xl,
    },
  });

  return (
    <OnboardingLayout
      title="Stay on track"
      subtitle="Get learning reminders so you don't miss a beat. You can always turn them off in Settings."
      onBack={previousStep}
      showCloseButton={true}
    >
      <View style={styles.iconContainer}>
        <View style={styles.notificationIcon}>
          <Ionicons
            name="notifications"
            size={40}
            color={theme.colors.text.secondary}
          />
        </View>
      </View>

      <View style={styles.optionsContainer}>
        <OnboardingOption
          title="Remind me"
          subtitle="Get daily learning reminders"
          icon="notifications"
          isSelected={notificationsEnabled}
          onPress={() => handleNotificationToggle(true)}
        />
        
        <OnboardingOption
          title="Maybe later"
          subtitle="I'll set this up later in Settings"
          icon="time"
          isSelected={!notificationsEnabled}
          onPress={() => handleNotificationToggle(false)}
        />
      </View>

      {errors.notificationsEnabled && (
        <Text style={styles.errorText}>{errors.notificationsEnabled}</Text>
      )}

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        style={styles.continueButton}
      />
    </OnboardingLayout>
  );
}

