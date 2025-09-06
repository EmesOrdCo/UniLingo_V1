import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { validateField } from '../schema';

// Check if Supabase client is available
let supabase: any = null;
try {
  const { supabase: supabaseClient } = require('../../lib/supabase');
  supabase = supabaseClient;
} catch (error) {
  // Supabase not available
}

export function EmailScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const { value: email, setValue: setEmail } = useOnboardingField('email');
  
  const [inputValue, setInputValue] = useState(email || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const textInputRef = useRef<TextInput>(null);

  // Debounced email availability check
  useEffect(() => {
    if (!supabase || !inputValue.trim() || validationError) {
      setEmailStatus(null);
      return;
    }

    const trimmedEmail = inputValue.trim().toLowerCase();
    if (!trimmedEmail.includes('@')) {
      setEmailStatus(null);
      return;
    }

    setEmailStatus('checking');
    
    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', trimmedEmail)
          .single();

        if (error && error.code === 'PGRST116') {
          // No rows found - email is available
          setEmailStatus('available');
        } else if (data) {
          // Email already exists
          setEmailStatus('taken');
        } else {
          setEmailStatus(null);
        }
      } catch (error) {
        console.error('Error checking email availability:', error);
        setEmailStatus(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [inputValue, validationError]);

  // Validate input in real-time
  const validateInput = (value: string) => {
    const validation = validateField('email', value.trim().toLowerCase());
    setValidationError(validation.valid ? null : validation.errors?.email || null);
    return validation.valid;
  };

  // Check if form is valid
  const canContinue = inputValue.trim().length > 0 && !validationError;

  // Handle text change
  const handleTextChange = (text: string) => {
    const lowercaseText = text.toLowerCase();
    setInputValue(lowercaseText);
    validateInput(lowercaseText);
  };

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      const trimmedValue = inputValue.trim().toLowerCase();
      setEmail(trimmedValue);
      Keyboard.dismiss();
      nextStep();
    }
  };

  // Handle back
  const handleBack = () => {
    // Save current value even if not valid
    if (inputValue.trim()) {
      setEmail(inputValue.trim().toLowerCase());
    }
    previousStep();
  };

  // Handle keyboard submit
  const handleSubmit = () => {
    if (canContinue) {
      handleContinue();
    }
  };

  // Get status text and color
  const getStatusInfo = () => {
    switch (emailStatus) {
      case 'checking':
        return { text: 'Checking availability...', color: theme.colors.textMedium };
      case 'available':
        return { text: 'Looks good!', color: theme.colors.success };
      case 'taken':
        return { text: 'Already used', color: theme.colors.warning };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Screen
      title="What's your email?"
      subtitle="We'll use this to save your progress and send you updates"
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.container}>
        {/* Text Input Container */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, { 
            borderColor: validationError ? theme.colors.error : theme.colors.border,
            backgroundColor: theme.colors.surface,
          }]}>
            {/* Email Icon */}
            <Text style={styles.emailIcon}>📧</Text>
            
            {/* Text Input */}
            <TextInput
              ref={textInputRef}
              style={[styles.textInput, { 
                color: theme.colors.textDark,
                fontFamily: theme.fonts.regular,
              }]}
              value={inputValue}
              onChangeText={handleTextChange}
              onSubmitEditing={handleSubmit}
              placeholder="Enter your email address"
              placeholderTextColor={theme.colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="continue"
              enablesReturnKeyAutomatically={true}
              accessibilityLabel="Email input"
              accessibilityHint="Enter your email address to continue"
            />
          </View>

          {/* Error Message */}
          {validationError && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {validationError}
            </Text>
          )}

          {/* Status Message */}
          {statusInfo && !validationError && (
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          )}
        </View>

        {/* Helper Text */}
        <View style={styles.helperContainer}>
          <Text style={[styles.helperText, { color: theme.colors.textMedium }]}>
            We'll never spam you. You can unsubscribe anytime.
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
  emailIcon: {
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
  statusText: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
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

