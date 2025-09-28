import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { completeOnboarding } from '../onboarding/completeOnboarding';

interface EmailConfirmationScreenProps {
  route?: {
    params?: {
      email?: string;
      onboardingData?: any;
    };
  };
}

export default function EmailConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);

  useEffect(() => {
    // Get email and onboarding data from route params
    const emailParam = (route.params as any)?.email;
    const onboardingParam = (route.params as any)?.onboardingData;
    if (emailParam) {
      setEmail(emailParam);
    }
    if (onboardingParam) {
      setOnboardingData(onboardingParam);
    }

    // Start cooldown timer
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [route.params]);

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address not found. Please try signing up again.');
      return;
    }

    if (resendCooldown > 0) {
      Alert.alert('Please wait', `You can resend the email in ${resendCooldown} seconds.`);
      return;
    }

    setIsResending(true);
    setResendCooldown(60); // 60 second cooldown

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'unilingo://auth/confirm'
        }
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Email Sent',
          'A new confirmation email has been sent to your email address.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Resend email error:', error);
      Alert.alert('Error', 'Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };


  const handleBackToLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email'
      });

      if (error) {
        Alert.alert('Error', error.message || 'Invalid verification code');
        return;
      }

      // Verification successful, create user database entry
      if (onboardingData) {
        try {
          const result = await completeOnboarding({ data: onboardingData });
          if (!result.ok) {
            Alert.alert('Error', result.error || 'Failed to save profile data. Please try again.');
            return;
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to save profile data. Please try again.');
          return;
        }
      }

      // Navigate to subscription website directly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const subscriptionUrl = `https://unilingo.co.uk/subscription.html?user_id=${user.id}&email=${encodeURIComponent(user.email || '')}&token=${user.id}`;
        
        const { Linking } = require('react-native');
        const canOpen = await Linking.canOpenURL(subscriptionUrl);
        
        if (canOpen) {
          await Linking.openURL(subscriptionUrl);
        } else {
          Alert.alert('Error', 'Cannot open subscription page. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Email</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={80} color="#6366f1" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Check Your Email</Text>

          {/* Description */}
          <Text style={styles.description}>
            We've sent a confirmation link to:
          </Text>
          
          <Text style={styles.emailText}>{email}</Text>

          <Text style={styles.description}>
            Enter the 6-digit verification code sent to your email to confirm your account.
          </Text>

          {/* Verification Code Input */}
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter 6-digit code"
              keyboardType="numeric"
              maxLength={6}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleVerifyCode}
              blurOnSubmit={false}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!verificationCode.trim() || isVerifying) && styles.verifyButtonDisabled
              ]}
              onPress={handleVerifyCode}
              disabled={!verificationCode.trim() || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              )}
              <Text style={[
                styles.verifyButtonText,
                (!verificationCode.trim() || isVerifying) && styles.verifyButtonTextDisabled
              ]}>
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resendButton,
                (isResending || resendCooldown > 0) && styles.resendButtonDisabled
              ]}
              onPress={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
            >
              {isResending ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Ionicons name="refresh" size={20} color="#6366f1" />
              )}
              <Text style={[
                styles.resendButtonText,
                (isResending || resendCooldown > 0) && styles.resendButtonTextDisabled
              ]}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder or try resending.
            </Text>
          </View>
        </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  codeInput: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    backgroundColor: '#ffffff',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginTop: 32,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  verifyButtonTextDisabled: {
    color: '#ffffff',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
  },
  resendButtonDisabled: {
    borderColor: '#cbd5e1',
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  resendButtonTextDisabled: {
    color: '#94a3b8',
  },
  helpContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
