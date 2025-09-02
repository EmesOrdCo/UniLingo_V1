import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
}

export default function SubscriptionStatus({ onUpgrade }: SubscriptionStatusProps) {
  const { currentPlan, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    );
  }

  const isPremium = currentPlan?.id !== 'free';
  const isTrial = currentPlan?.status === 'trial';
  const isCancelled = currentPlan?.status === 'cancelled';

  const getStatusColor = () => {
    if (isCancelled) return '#ef4444';
    if (isTrial) return '#f59e0b';
    if (isPremium) return '#10b981';
    return '#6b7280';
  };

  const getStatusText = () => {
    if (isCancelled) return 'Cancelled';
    if (isTrial) return 'Trial';
    if (isPremium) return 'Active';
    return 'Free';
  };

  const getStatusIcon = () => {
    if (isCancelled) return 'close-circle';
    if (isTrial) return 'time';
    if (isPremium) return 'checkmark-circle';
    return 'person';
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      Alert.alert(
        'Upgrade Subscription',
        'Contact support to upgrade your subscription.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="card" size={24} color="#6366f1" />
        <Text style={styles.title}>Subscription</Text>
      </View>

      <View style={styles.planContainer}>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{currentPlan?.name || 'Free'} Plan</Text>
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
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentPlan?.expiresAt && (
        <View style={styles.expiryContainer}>
          <Text style={styles.expiryLabel}>
            {isTrial ? 'Trial expires:' : 'Renews:'}
          </Text>
          <Text style={styles.expiryDate}>
            {currentPlan.expiresAt.toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Your plan includes:</Text>
        {currentPlan?.features.slice(0, 3).map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={isPremium ? '#10b981' : '#6b7280'}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        {currentPlan?.features.length > 3 && (
          <Text style={styles.moreFeaturesText}>
            +{currentPlan.features.length - 3} more features
          </Text>
        )}
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
  moreFeaturesText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
});
