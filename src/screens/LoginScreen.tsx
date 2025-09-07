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
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting login process...');
      
      // First try password authentication
      const { error } = await signIn(email, password);
      
      if (error) {
        console.log('❌ Password login failed, trying OTP method...');
        
        // If password fails, try OTP method for users created with magic links
        try {
          const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
            email: email,
            options: { 
              shouldCreateUser: false // Don't create new users, only sign in existing ones
            }
          });
          
          if (otpError) {
            console.error('❌ OTP login failed:', otpError.message);
            Alert.alert('Login Failed', 'Invalid email or password. If you signed up with a magic link, please check your email for the verification code.');
            return;
          }
          
          console.log('✅ OTP code sent successfully to:', email);
          
          // Show OTP input modal with password setup option
          Alert.prompt(
            'Enter Verification Code',
            `We've sent a 6-digit code to ${email}. After verification, you can set up a password for easier future sign-ins.`,
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Verify',
                onPress: async (otpCode) => {
                  if (!otpCode || otpCode.length !== 6) {
                    Alert.alert('Error', 'Please enter a valid 6-digit code.');
                    return;
                  }
                  
                  // Verify the OTP code and set up password
                  await verifyOTPAndSetupPassword(email, otpCode);
                }
              }
            ],
            'plain-text',
            '',
            'numeric'
          );
          
        } catch (otpError) {
          console.error('❌ OTP error:', otpError);
          Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
        }
      } else {
        console.log('✅ Password login successful!');
        // Navigation will be handled by AuthContext automatically
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPAndSetupPassword = async (email: string, otpCode: string) => {
    try {
      console.log('🔐 Verifying OTP code and setting up password...');
      
      const { data, error } = await supabase.auth.verifyOtp({
        type: 'email',
        email,
        token: otpCode.trim(),
      });
      
      if (error) {
        console.error('❌ OTP verification failed:', error);
        Alert.alert('Verification Failed', 'Invalid code. Please try again.');
        return;
      }
      
      console.log('✅ OTP verification successful!');
      
      // Now prompt user to set up a password for future logins
      Alert.prompt(
        'Set Up Password',
        'Please create a password for easier future sign-ins:',
        [
          {
            text: 'Set Password',
            onPress: async (newPassword) => {
              if (!newPassword || newPassword.length < 6) {
                Alert.alert('Error', 'Password must be at least 6 characters long.');
                return;
              }
              
              await setupPasswordForUser(newPassword);
            }
          }
        ],
        'secure-text',
        '',
        'default'
      );
      
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      Alert.alert('Error', 'Verification failed. Please try again.');
    }
  };

  const setupPasswordForUser = async (newPassword: string) => {
    try {
      console.log('🔑 Setting up password for user...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('❌ Password setup failed:', error);
        Alert.alert('Error', 'Failed to set up password. You can still sign in with verification codes.');
        return;
      }
      
      console.log('✅ Password set up successfully!');
      Alert.alert(
        'Password Set Up!',
        'Your password has been set up successfully. You can now sign in with your email and password.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Password setup error:', error);
      Alert.alert('Error', 'Failed to set up password. You can still sign in with verification codes.');
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
  };

  const handleSignUp = () => {
    navigation.navigate('Register' as never);
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
                onChangeText={setEmail}
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
                onChangeText={setPassword}
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
            
            <Text style={styles.helpText}>
              If you signed up with a magic link, we'll send you a verification code and help you set up a password.
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

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={20} color="#000000" />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#64748b',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
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
