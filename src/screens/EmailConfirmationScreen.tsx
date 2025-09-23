import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

interface EmailConfirmationScreenProps {
  route?: {
    params?: {
      email?: string;
    };
  };
}

export default function EmailConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Get email from route params
    const emailParam = route.params?.email;
    if (emailParam) {
      setEmail(emailParam);
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

  const handleOpenEmailApp = () => {
    const emailUrl = `mailto:${email}`;
    Linking.canOpenURL(emailUrl).then(supported => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Cannot open email app. Please check your email manually.');
      }
    });
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleContinueToOnboarding = () => {
    // After email confirmation, continue to onboarding
    // Pass a flag to indicate we're continuing from email confirmation
    navigation.navigate('OnboardingFlow' as never, { 
      fromEmailConfirmation: true,
      prefillEmail: email 
    } as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            Click the link in the email to confirm your account and continue to UniLingo.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.openEmailButton}
              onPress={handleOpenEmailApp}
            >
              <Ionicons name="mail-open" size={20} color="#ffffff" />
              <Text style={styles.openEmailButtonText}>Open Email App</Text>
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

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinueToOnboarding}
            >
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              <Text style={styles.continueButtonText}>Continue to Setup</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginTop: 32,
  },
  openEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  openEmailButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#10b981',
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
