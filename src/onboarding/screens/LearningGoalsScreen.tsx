import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, OptionGrid } from '../ui';
import { useOnboardingStore, useOnboardingGoals } from '../state';
import { goals } from '../constants';
import { validateScreen } from '../schema';

export function LearningGoalsScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const { goals: selectedGoals, toggleGoal, canAddMore } = useOnboardingGoals();

  // Check if at least one goal is selected
  const canContinue = selectedGoals.length >= 1;

  // Handle goal selection
  const handleGoalChange = (selectedIds: string[]) => {
    // Find the goal that was just toggled
    const currentGoals = selectedGoals;
    const newGoal = selectedIds.find(id => !currentGoals.includes(id));
    const removedGoal = currentGoals.find(id => !selectedIds.includes(id));
    
    if (newGoal) {
      toggleGoal(newGoal);
    } else if (removedGoal) {
      toggleGoal(removedGoal);
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      // Validate the current data
      const validation = validateScreen('learning-goals', {
        goals: selectedGoals,
      });

      if (validation.valid) {
        nextStep();
      }
    }
  };

  // Handle back
  const handleBack = () => {
    previousStep();
  };

  // Convert goals to grid format
  const goalOptions = goals.map(goal => ({
    id: goal.key,
    title: goal.label,
    disabled: !canAddMore && !selectedGoals.includes(goal.key),
  }));

  return (
    <Screen
      title="What do you want to achieve?"
      subtitle="Select up to 3 goals that matter most to you"
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.container}>
        {/* Counter */}
        <View style={styles.counterContainer}>
          <Text style={[styles.counter, { color: theme.colors.text.secondary }]}>
            {selectedGoals.length}/3 selected
          </Text>
        </View>

        {/* Goals Grid */}
        <OptionGrid
          options={goalOptions}
          selectedIds={selectedGoals}
          multiSelect={true}
          onSelectionChange={handleGoalChange}
          accessibilityLabel="Select your learning goals"
        />

        {/* Helper Text */}
        {selectedGoals.length === 0 && (
          <View style={styles.helperContainer}>
            <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>
              Choose at least one goal to continue
            </Text>
          </View>
        )}

        {selectedGoals.length === 3 && (
          <View style={styles.helperContainer}>
            <Text style={[styles.helperText, { color: theme.colors.primary }]}>
              Great! You've selected 3 goals. You can deselect any to choose different ones.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  counterContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});