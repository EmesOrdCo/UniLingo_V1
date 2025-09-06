import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OnboardingOption } from '../components/OnboardingOption';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { AGE_OPTIONS, validateStep } from '../schema';

export function AgeScreen() {
  const theme = useThemeTokens();
  const { age, updateField, nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAgeSelect = (selectedAge: string) => {
    updateField('age', selectedAge);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateStep(2, {
      age,
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    markStepCompleted(2);
    nextStep();
  };

  const styles = StyleSheet.create({
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
      title="How old are you?"
      onBack={previousStep}
    >
      <View style={styles.optionsContainer}>
        {AGE_OPTIONS.map((option) => (
          <OnboardingOption
            key={option}
            title={option}
            isSelected={age === option}
            onPress={() => handleAgeSelect(option)}
          />
        ))}
      </View>

      {errors.age && (
        <Text style={styles.errorText}>{errors.age}</Text>
      )}

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!age}
        style={styles.continueButton}
      />
    </OnboardingLayout>
  );
}

