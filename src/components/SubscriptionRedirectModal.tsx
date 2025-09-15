import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionRedirectModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionRedirectModal({ visible, onClose }: SubscriptionRedirectModalProps) {
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleRedirectToSubscription = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please try signing in again.');
      return;
    }

    setIsRedirecting(true);

    try {
      // Construct the subscription URL with user data
      const subscriptionUrl = `https://unilingo.co.uk/subscription.html?user_id=${user.id}&email=${encodeURIComponent(user.email || '')}&token=${user.id}&plan=pro`;
      
      console.log('🔗 Redirecting to account setup page:', subscriptionUrl);

      const canOpen = await Linking.canOpenURL(subscriptionUrl);
      
      if (canOpen) {
        await Linking.openURL(subscriptionUrl);
        
        Alert.alert(
          'Complete Registration',
          'You will be redirected to complete your account setup. Once completed, you can return to the app.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                onClose();
              }
            }
          ]
        );
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

  const handleClose = () => {
    if (!isRedirecting) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Registration</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.iconContainer}>
              <Ionicons name="card" size={64} color="#6366f1" />
            </View>
            
            <Text style={styles.description}>
              To complete your registration and unlock all features, please complete your subscription setup.
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Unlimited flashcards</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Unlimited study sessions</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Advanced analytics</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>AI recommendations</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Ad-free experience</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.redirectButton, isRedirecting && styles.redirectButtonDisabled]}
              onPress={handleRedirectToSubscription}
              disabled={isRedirecting}
            >
              {isRedirecting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="arrow-forward" size={24} color="white" />
              )}
              <Text style={styles.redirectButtonText}>
                {isRedirecting ? 'Redirecting...' : 'Complete Registration'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleClose}
              disabled={isRedirecting}
            >
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 24,
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
  redirectButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  redirectButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  redirectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
});
