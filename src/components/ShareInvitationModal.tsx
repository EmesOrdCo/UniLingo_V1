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
import { useTranslation } from '../lib/i18n';

interface ShareInvitationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ShareInvitationModal({ visible, onClose }: ShareInvitationModalProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [isSharing, setIsSharing] = useState(false);

  const handleShareInvitation = async () => {
    setIsSharing(true);
    
    try {
      const inviterName = profile?.name || user?.email?.split('@')[0] || 'UniLingo User';
      
      // Get platform-specific app store link
      const appStoreLink = getAppStoreLink();
      
      const shareMessage = t('invite.shareMessage', { inviterName, appStoreLink });

      const result = await Share.share({
        message: shareMessage,
        title: t('invite.shareTitle'),
        url: appStoreLink,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert(
          t('invite.sharedSuccessfully'),
          t('invite.sharedMessage'),
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(t('profile.picture.error'), t('invite.shareError'));
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
            <Text style={styles.modalTitle}>{t('invite.title')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.iconContainer}>
              <Ionicons name="share-social" size={64} color="#6366f1" />
            </View>
            
            <Text style={styles.description}>
              {t('invite.description')}
            </Text>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>{t('invite.benefitsTitle')}</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.benefitText}>{t('invite.benefit1')}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.benefitText}>{t('invite.benefit2')}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.benefitText}>{t('invite.benefit3')}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.benefitText}>{t('invite.benefit4')}</Text>
              </View>
            </View>

            <View style={styles.appStoreContainer}>
              <Text style={styles.appStoreTitle}>{t('invite.appStoreTitle')}</Text>
              <View style={styles.appStoreItem}>
                <Ionicons 
                  name={getPlatformIcon()} 
                  size={20} 
                  color={getPlatformIconColor()} 
                />
                <Text style={styles.appStoreText}>
                  {Platform.OS === 'ios' ? t('invite.iosAppStore') : t('invite.googlePlayStore')}
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
                {isSharing ? t('invite.sharing') : t('invite.shareButton')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.note}>
              {t('invite.note')}
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
