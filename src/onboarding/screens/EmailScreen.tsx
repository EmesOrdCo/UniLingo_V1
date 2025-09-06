import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { validateStep } from '../schema';

export function EmailScreen() {
  const theme = useThemeTokens();
  const { email, updateField, nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEmailChange = (text: string) => {
    updateField('email', text);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateStep(6, {
      email,
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    markStepCompleted(6);
    nextStep();
  };

  const styles = StyleSheet.create({
    inputContainer: {
      marginBottom: theme.spacing.xl,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border.primary,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      fontSize: theme.fonts.sizes.md,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.primary,
    },
    focusedInput: {
      borderColor: theme.colors.primary,
    },
    errorText: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.status.error,
      marginTop: theme.spacing.sm,
    },
    continueButton: {
      marginTop: theme.spacing.xl,
    },
  });

  return (
    <OnboardingLayout
      title="What's your email?"
      onBack={previousStep}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              email && !errors.email && styles.focusedInput,
            ]}
            placeholder="Email address"
            placeholderTextColor={theme.colors.text.tertiary}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={!email}
          style={styles.continueButton}
        />
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
}

