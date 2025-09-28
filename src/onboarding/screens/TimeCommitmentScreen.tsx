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
import { validateScreen } from '../schema';

export function TimeCommitmentScreen() {
  const theme = useThemeTokens();
  const { data, updateField, nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const timeCommitment = data.dailyCommitmentMinutes;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTimeCommitmentSelect = (commitment: string) => {
    updateField('dailyCommitmentMinutes', parseInt(commitment) as 5 | 15 | 30 | 60);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateScreen('time-commitment', {
      timeCommitment,
    });

    if (!validation.valid) {
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
        {['5 minutes', '15 minutes', '30 minutes', '60 minutes'].map((option: any) => (
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

