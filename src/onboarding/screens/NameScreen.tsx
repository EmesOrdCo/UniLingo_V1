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
import { validateScreen } from '../schema';

export function NameScreen() {
  const theme = useThemeTokens();
  const { data, updateField, nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const name = data.firstName;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (text: string) => {
    updateField('firstName', text);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateScreen('name', {
      name,
    });

    if (!validation.valid) {
      setErrors(validation.errors || {});
      return;
    }

    markStepCompleted(7);
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
      title="What's your name?"
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
              name && !errors.name && styles.focusedInput,
            ]}
            placeholder="First name"
            placeholderTextColor={theme.colors.text.tertiary}
            value={name}
            onChangeText={handleNameChange}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
        </View>

        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={!name}
          style={styles.continueButton}
        />
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
}

