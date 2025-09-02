import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getAppStoreLink, getPlatformIcon, getPlatformIconColor } from '../config/appStore';

interface ShareInvitationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ShareInvitationModal({ visible, onClose }: ShareInvitationModalProps) {
  const { user, profile } = useAuth();
  const [isSharing, setIsSharing] = useState(false);

  const handleShareInvitation = async () => {
    setIsSharing(true);
    
    try {
      const inviterName = profile?.name || user?.email?.split('@')[0] || 'UniLingo User';
      
      // Get platform-specific app store link
      const appStoreLink = getAppStoreLink();
      
      const shareMessage = `🎓 ${inviterName} thinks you'd love UniLingo!

📱 UniLingo is an innovative language learning app that uses AI to create personalized flashcards from your study materials.

✨ What makes UniLingo special:
• AI-powered flashcard generation from PDFs and text
• Personalized learning paths
• Interactive games and challenges
• Progress tracking and streaks
• Study with friends and compete

🚀 Download UniLingo now and start learning smarter!

${appStoreLink}

#UniLingo #LanguageLearning #AI #Education`;

      const result = await Share.share({
        message: shareMessage,
        title: 'Join me on UniLingo!',
        url: appStoreLink,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert(
          'Shared Successfully!',
          'Your invitation has been shared. Your friends can now download UniLingo!',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share invitation. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    if (!isSharing) {
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
            <Text style={styles.modalTitle}>Invite Friends</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.iconContainer}>
              <Ionicons name="share-social" size={64} color="#6366f1" />
            </View>
            
            <Text style={styles.description}>
              Share UniLingo with your friends using your device's native sharing!
            </Text>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Why use native sharing?</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.benefitText}>Works with any app (WhatsApp, Messages, Email, etc.)</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.benefitText}>No network connectivity issues</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.benefitText}>Uses your existing contacts and apps</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.benefitText}>No backend server required</Text>
              </View>
            </View>

            <View style={styles.appStoreContainer}>
              <Text style={styles.appStoreTitle}>App Store Links Included:</Text>
              <View style={styles.appStoreItem}>
                <Ionicons 
                  name={getPlatformIcon()} 
                  size={20} 
                  color={getPlatformIconColor()} 
                />
                <Text style={styles.appStoreText}>
                  {Platform.OS === 'ios' ? 'iOS App Store' : 'Google Play Store'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
              onPress={handleShareInvitation}
              disabled={isSharing}
            >
              <Ionicons name="share" size={20} color="#ffffff" />
              <Text style={styles.shareButtonText}>
                {isSharing ? 'Sharing...' : 'Share Invitation'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.note}>
              Tap the button above to open your device's share sheet and choose how to share UniLingo with your friends!
            </Text>
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  shareButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  appStoreContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  appStoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  appStoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appStoreText: {
    fontSize: 14,
    color: '#0c4a6e',
    marginLeft: 8,
    fontWeight: '500',
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
