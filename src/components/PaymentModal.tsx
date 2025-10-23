import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { stripeService } from '../lib/stripeService';
import { useTranslation } from '../lib/i18n';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  item: {
    id: string;
    category: string;
    item_value: string;
    price_gbp: number;
    rarity: string;
  };
  onPurchaseSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  item,
  onPurchaseSuccess,
}) => {
  const { t } = useTranslation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      
      console.log('💳 Starting purchase for:', item);
      
      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(item.id, item.price_gbp);
      
      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'UniLingo',
        paymentIntentClientSecret: paymentIntent.clientSecret,
        allowsDelayedPaymentMethods: true,
        applePay: {
          merchantCountryCode: 'GB',
        },
        googlePay: {
          merchantCountryCode: 'GB',
          testEnvironment: __DEV__,
        },
      });

      if (initError) {
        console.error('❌ Payment sheet initialization error:', initError);
        Alert.alert(
          t('payment.error.title'),
          initError.message || t('payment.error.message'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        console.error('❌ Payment sheet presentation error:', presentError);
        if (presentError.code !== 'Canceled') {
          Alert.alert(
            t('payment.failed.title'),
            presentError.message || t('payment.failed.message'),
            [{ text: t('common.ok') }]
          );
        }
        return;
      }

      // Payment succeeded
      Alert.alert(
        t('payment.success.title'),
        t('payment.success.message', { itemName: item.item_value }),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              onPurchaseSuccess();
              onClose();
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('❌ Purchase error:', error);
      Alert.alert(
        t('payment.error.title'),
        t('payment.error.message'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9D4EDD';
      case 'rare':
        return '#3B82F6';
      case 'common':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'star';
      case 'epic':
        return 'diamond';
      case 'rare':
        return 'sparkles';
      case 'common':
        return 'checkmark-circle';
      default:
        return 'ellipse';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('payment.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.itemInfo}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.item_value}</Text>
              <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
                <Ionicons 
                  name={getRarityIcon(item.rarity)} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.itemCategory}>{item.category}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>{t('payment.price')}</Text>
              <Text style={styles.price}>£{item.price_gbp.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>{t('payment.features.title')}</Text>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>{t('payment.features.permanent')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>{t('payment.features.allAvatars')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>{t('payment.features.noRecurring')}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>{t('payment.button.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="white" />
                  <Text style={styles.purchaseButtonText}>{t('payment.button.purchase')} £{item.price_gbp.toFixed(2)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            {t('payment.disclaimer')}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  itemInfo: {
    marginBottom: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#374151',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  features: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  purchaseButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    gap: 8,
  },
  purchaseButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});
