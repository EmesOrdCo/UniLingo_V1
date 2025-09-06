import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OnboardingOption } from '../components/OnboardingOption';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { LEARNING_GOALS_OPTIONS, validateStep } from '../schema';

export function LearningGoalsScreen() {
  const theme = useThemeTokens();
  const { learningGoals, updateField, nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGoalToggle = (goal: string) => {
    const currentGoals = learningGoals;
    const isSelected = currentGoals.includes(goal);
    
    let newGoals: string[];
    if (isSelected) {
      newGoals = currentGoals.filter(g => g !== goal);
    } else {
      if (currentGoals.length >= 3) {
        return; // Max 3 goals
      }
      newGoals = [...currentGoals, goal];
    }
    
    updateField('learningGoals', newGoals);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateStep(4, {
      learningGoals,
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    markStepCompleted(4);
    nextStep();
  };

  const styles = StyleSheet.create({
    instructions: {
      fontSize: theme.fonts.sizes.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
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
      title="What would you like to be able to do in Spanish?"
      onBack={previousStep}
    >
      <Text style={styles.instructions}>Select a maximum of 3 goals.</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {LEARNING_GOALS_OPTIONS.map((goal) => (
            <OnboardingOption
              key={goal}
              title={goal}
              isSelected={learningGoals.includes(goal)}
              onPress={() => handleGoalToggle(goal)}
            />
          ))}
        </View>

        {errors.learningGoals && (
          <Text style={styles.errorText}>{errors.learningGoals}</Text>
        )}

        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={learningGoals.length === 0}
          style={styles.continueButton}
        />
      </ScrollView>
    </OnboardingLayout>
  );
}

