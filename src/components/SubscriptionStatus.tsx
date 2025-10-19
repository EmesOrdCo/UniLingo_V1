import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTranslation } from '../lib/i18n';

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
}

export default function SubscriptionStatus({ onUpgrade }: SubscriptionStatusProps) {
  const { t } = useTranslation();
  const { currentPlan, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('subscription.loading')}</Text>
      </View>
    );
  }

  const isPremium = currentPlan && currentPlan.id !== 'free';
  const isTrial = currentPlan?.status === 'trial';
  const isCancelled = currentPlan?.status === 'cancelled';
  const isInactive = currentPlan?.status === 'inactive';

  const getStatusColor = () => {
    if (isCancelled) return '#ef4444';
    if (isTrial) return '#f59e0b';
    if (isInactive) return '#f59e0b';
    if (isPremium) return '#10b981';
    return '#6b7280';
  };

  const getStatusText = () => {
    if (isCancelled) return t('subscription.status.cancelled');
    if (isTrial) return t('subscription.status.trial');
    if (isInactive) return t('subscription.status.inactive');
    if (isPremium) return t('subscription.status.active');
    return t('subscription.dataUnavailable');
  };

  const getStatusIcon = () => {
    if (isCancelled) return 'close-circle';
    if (isTrial) return 'time';
    if (isInactive) return 'pause-circle';
    if (isPremium) return 'checkmark-circle';
    return 'help-circle';
  };

  const getTranslatedFeature = (feature: string) => {
    const featureMap: { [key: string]: string } = {
      'AI flashcards': t('subscription.features.aiFlashcards'),
      'AI lessons': t('subscription.features.aiLessons'),
      'Advanced progress analytics': t('subscription.features.advancedAnalytics'),
    };
    return featureMap[feature] || feature;
  };

  const getTranslatedPlanName = (planName: string) => {
    const planMap: { [key: string]: string } = {
      'Premium Yearly': t('subscription.planNames.premiumYearly'),
      'Premium Monthly': t('subscription.planNames.premiumMonthly'),
    };
    return planMap[planName] || planName;
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      Alert.alert(
        t('subscription.upgradeTitle'),
        t('subscription.upgradeMessage'),
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="card" size={24} color="#6366f1" />
        <Text style={styles.title}>{t('subscription.title')}</Text>
      </View>

      <View style={styles.planContainer}>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{currentPlan?.name ? getTranslatedPlanName(currentPlan.name) : t('subscription.dataUnavailable')}</Text>
          <View style={styles.statusContainer}>
            <Ionicons
              name={getStatusIcon() as any}
              size={16}
              color={getStatusColor()}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {!isPremium && (
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>{t('subscription.upgrade')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentPlan?.renewalDate && (
        <View style={styles.expiryContainer}>
          <Text style={styles.expiryLabel}>
            {isTrial ? t('subscription.trialExpires') : t('subscription.renews')}
          </Text>
          <Text style={styles.expiryDate}>
            {currentPlan.renewalDate.toLocaleDateString()}
          </Text>
        </View>
      )}

      {currentPlan?.cost && (
        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>{t('subscription.cost')}</Text>
          <Text style={styles.costAmount}>
            £{currentPlan.cost ? currentPlan.cost + '/' : ''}{currentPlan.planType === 'yearly' ? t('subscription.billingPeriod.year') : t('subscription.billingPeriod.month')}
          </Text>
        </View>
      )}

      {currentPlan?.planType && (
        <View style={styles.planTypeContainer}>
          <Text style={styles.planTypeLabel}>{t('subscription.plan')}</Text>
          <Text style={styles.planTypeText}>
            {currentPlan.planType === 'yearly' ? t('subscription.yearlyBilling') : t('subscription.monthlyBilling')}
          </Text>
        </View>
      )}

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>{t('subscription.featuresTitle')}</Text>
        {currentPlan?.features.slice(0, 3).map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={isPremium ? '#10b981' : '#6b7280'}
            />
            <Text style={styles.featureText}>{getTranslatedFeature(feature)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  planContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  expiryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  expiryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  costContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  planTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  planTypeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  planTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  featuresContainer: {
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
});
