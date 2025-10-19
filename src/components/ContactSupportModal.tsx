import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../lib/i18n';

interface ContactSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ContactSupportModal({ visible, onClose }: ContactSupportModalProps) {
  const { t } = useTranslation();
  const [isSending, setIsSending] = useState(false);

  const handleContactSupport = async () => {
    setIsSending(true);
    
    try {
      // Just open email app with "To" and "Subject" fields pre-filled
      const mailtoUrl = `mailto:unilingo.help@gmail.com?subject=UniLingo Support Request`;
      
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert(
          t('support.emailOpened'),
          t('support.emailOpenedMessage'),
          [{ text: 'OK', onPress: () => {
            onClose();
          }}]
        );
      } else {
        // Fallback - show email details
        Alert.alert(
          t('support.supportRequest'),
          t('support.emailFallback'),
          [{ text: 'OK', onPress: () => {
            onClose();
          }}]
        );
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(t('profile.picture.error'), t('support.emailError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('support.title')}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                  <Ionicons name="mail" size={64} color="#6366f1" />
                </View>
                
                <Text style={styles.description}>
                  {t('support.description')}
                </Text>

                <TouchableOpacity
                  style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                  onPress={handleContactSupport}
                  disabled={isSending}
                >
                  <Ionicons 
                    name={isSending ? "hourglass" : "mail"} 
                    size={24} 
                    color="white" 
                  />
                  <Text style={styles.sendButtonText}>
                    {isSending ? t('support.openingEmail') : t('support.openEmailButton')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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
  keyboardAvoidingView: {
    flex: 1,
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
    marginBottom: 30,
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
