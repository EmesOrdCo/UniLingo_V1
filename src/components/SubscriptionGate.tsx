import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export default function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { user, profile, refreshSubscriptionStatus, signOut } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user has active subscription
  const hasActiveSubscription = profile?.has_active_subscription === true;

  // If user has active subscription, show the app
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // If no active subscription, show blocking screen
  const handleRedirectToSubscription = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please try signing in again.');
      return;
    }

    setIsRedirecting(true);

    try {
      // Construct the subscription URL with user data
      const subscriptionUrl = `https://unilingo.co.uk/subscription.html?user_id=${user.id}&email=${encodeURIComponent(user.email || '')}&token=${user.id}`;
      
      console.log('🔗 Redirecting to account setup page:', subscriptionUrl);

      const canOpen = await Linking.canOpenURL(subscriptionUrl);
      
      if (canOpen) {
        await Linking.openURL(subscriptionUrl);
      } else {
        Alert.alert(
          'Unable to Open Link',
          'Please visit https://unilingo.co.uk/subscription.html to complete your account setup.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error redirecting to subscription:', error);
        Alert.alert(
          'Error',
          'Failed to open setup page. Please try again or visit https://unilingo.co.uk/subscription.html manually.',
          [{ text: 'OK' }]
        );
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleRefreshSubscriptionStatus = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      Alert.alert('Error', 'Failed to refresh subscription status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBackToLanding = async () => {
    // Sign out user to return to landing page
    try {
      await signOut();
      console.log('✅ User signed out, returning to landing page');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to return to landing page. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Account Setup Required</Text>

        {/* Message */}
        <Text style={styles.message}>
          You're almost done! To activate your account and unlock all features, please finish setup securely on our website.
        </Text>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, isRedirecting && styles.subscribeButtonDisabled]}
          onPress={handleRedirectToSubscription}
          disabled={isRedirecting}
        >
          <Ionicons 
            name={isRedirecting ? "hourglass" : "open-outline"} 
            size={24} 
            color="white" 
          />
          <Text style={styles.subscribeButtonText}>
            {isRedirecting ? 'Redirecting...' : 'Complete Account Setup'}
          </Text>
        </TouchableOpacity>

        {/* Refresh Button */}
        <TouchableOpacity
          style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
          onPress={handleRefreshSubscriptionStatus}
          disabled={isRefreshing}
        >
          <Ionicons 
            name={isRefreshing ? "hourglass" : "refresh"} 
            size={20} 
            color="#6366f1" 
          />
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? 'Checking...' : 'Already Complete? Refresh'}
          </Text>
        </TouchableOpacity>

        {/* Help Text */}
        <Text style={styles.helpText}>
          After completing setup, you'll have full access to all UniLingo features.
        </Text>

        {/* Back to Landing Button */}
        <TouchableOpacity
          style={styles.backToLandingButton}
          onPress={handleBackToLanding}
        >
          <Ionicons 
            name="arrow-back" 
            size={20} 
            color="#6b7280" 
          />
          <Text style={styles.backToLandingText}>Back to Landing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  refreshButtonDisabled: {
    borderColor: '#9ca3af',
  },
  refreshButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backToLandingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backToLandingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
});
