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
import { TIME_COMMITMENT_OPTIONS, validateStep } from '../schema';

export function TimeCommitmentScreen() {
  const theme = useThemeTokens();
  const { timeCommitment, updateField, nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTimeCommitmentSelect = (commitment: string) => {
    updateField('timeCommitment', commitment);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateStep(1, {
      timeCommitment,
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    markStepCompleted(1);
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
      title={`How much time do you want to commit to learning English?`}
      subtitle="Relaxed pace or challenging? Choose a goal that feels right for you."
      onBack={previousStep}
    >
      <View style={styles.optionsContainer}>
        {TIME_COMMITMENT_OPTIONS.map((option) => (
          <OnboardingOption
            key={option}
            title={option}
            isSelected={timeCommitment === option}
            onPress={() => handleTimeCommitmentSelect(option)}
          />
        ))}
      </View>

      {errors.timeCommitment && (
        <Text style={styles.errorText}>{errors.timeCommitment}</Text>
      )}

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!timeCommitment}
        style={styles.continueButton}
      />
    </OnboardingLayout>
  );
}

