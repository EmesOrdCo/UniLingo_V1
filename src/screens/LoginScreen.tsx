import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { handleError } from '../lib/errorHandler';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigation = useNavigation();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    // Clear any previous error messages
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    setLoading(true);
    try {
      const { error } = await signIn(sanitizedEmail, sanitizedPassword);
      
      if (error) {
        
        // Handle specific error types with more helpful messages
        if (error.message?.includes('Invalid login credentials')) {
          setErrorMessage('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message?.includes('Email not confirmed')) {
          setErrorMessage('Please check your email and click the confirmation link before signing in.');
          // Offer to redirect to email confirmation screen
          setTimeout(() => {
            Alert.alert(
              'Email Confirmation Required',
              'Your email address needs to be confirmed before you can sign in. Would you like to go to the confirmation screen?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Go to Confirmation', 
                  onPress: () => (navigation as any).navigate('EmailConfirmation', { email })
                },
              ]
            );
          }, 1000);
        } else if (error.message?.includes('Too many requests')) {
          setErrorMessage('Too many login attempts. Please wait a moment before trying again.');
        } else if (error.message?.includes('User not found')) {
          setErrorMessage('No account found with this email address. Please check your email or sign up.');
        } else {
          setErrorMessage('Login failed. Please check your credentials and try again.');
        }
        return;
      }
      
      // Login successful - navigation will be handled by AuthContext automatically
      
    } catch (error) {
      // Use the error handler for consistent error handling
      const errorMessage = handleError(error, 'Login', {
        showUserMessage: true,
        fallbackMessage: 'An unexpected error occurred. Please try again.'
      });
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Clear any previous error messages
    setErrorMessage('');
    
    if (!email) {
      setErrorMessage('Please enter your email address first to reset your password.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address to reset your password.');
      return;
    }

    // TODO: Implement actual password reset functionality
    setErrorMessage('Password reset functionality coming soon! Please contact support for assistance.');
  };

  const handleSignUp = () => {
    navigation.navigate('OnboardingFlow' as never);
  };

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {/* Logo and Title */}
          <View style={styles.logoSection}>
            <View
              style={styles.logo}
            >
              <Ionicons name="book" size={48} color="#ffffff" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your learning journey
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError();
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
            
            {/* Error Message Display */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" style={styles.errorIcon} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            
            <Text style={styles.helpText}>
              Enter your email and password to sign in to your account.
            </Text>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <View
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#6366f1', // Added background color for gradient effect
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  passwordToggle: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  helpText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#6366f1', // Added background color for gradient effect
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  signUpText: {
    fontSize: 16,
    color: '#64748b',
  },
  signUpLink: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
});
