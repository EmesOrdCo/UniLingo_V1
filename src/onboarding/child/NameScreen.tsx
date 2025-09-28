import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { validateField } from '../schema';

export function NameScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const { value: firstName, setValue: setFirstName } = useOnboardingField('firstName');
  
  const [inputValue, setInputValue] = useState(firstName || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textInputRef = useRef<TextInput>(null);

  // Validate input in real-time
  const validateInput = (value: string) => {
    const validation = validateField('firstName', value.trim());
    setValidationError(validation.valid ? null : validation.errors?.firstName || null);
    return validation.valid;
  };

  // Check if form is valid
  const canContinue = inputValue.trim().length > 0 && !validationError;

  // Handle text change
  const handleTextChange = (text: string) => {
    setInputValue(text);
    validateInput(text);
  };

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      const trimmedValue = inputValue.trim();
      setFirstName(trimmedValue);
      Keyboard.dismiss();
      nextStep();
    }
  };

  // Handle back
  const handleBack = () => {
    // Save current value even if not valid
    if (inputValue.trim()) {
      setFirstName(inputValue.trim());
    }
    previousStep();
  };

  // Handle keyboard submit
  const handleSubmit = () => {
    if (canContinue) {
      handleContinue();
    }
  };

  return (
    <Screen
      title="What's your first name?"
      subtitle="We'll use this to personalize your experience"
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.container}>
        {/* Text Input Container */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, { 
            borderColor: validationError ? theme.colors.status.error : theme.colors.border.primary,
            backgroundColor: theme.colors.background.surface,
          }]}>
            {/* Person Icon */}
            <Text style={styles.personIcon}>👤</Text>
            
            {/* Text Input */}
            <TextInput
              ref={textInputRef}
              style={[styles.textInput, { 
                color: theme.colors.text.dark,
                fontFamily: theme.fonts.families.system,
              }]}
              value={inputValue}
              onChangeText={handleTextChange}
              onSubmitEditing={handleSubmit}
              placeholder="Enter your first name"
              placeholderTextColor={theme.colors.text.light}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              enablesReturnKeyAutomatically={true}
              maxLength={50}
              accessibilityLabel="First name input"
              accessibilityHint="Enter your first name to continue"
            />
          </View>

          {/* Error Message */}
          {validationError && (
            <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
              {validationError}
            </Text>
          )}

          {/* Character Count */}
          <Text style={[styles.charCount, { color: theme.colors.text.light }]}>
            {inputValue.length}/50
          </Text>
        </View>

        {/* Helper Text */}
        <View style={styles.helperContainer}>
          <Text style={[styles.helperText, { color: theme.colors.text.medium }]}>
            Don't worry, you can change this later in your profile settings.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  personIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  helperContainer: {
    paddingHorizontal: 8,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

