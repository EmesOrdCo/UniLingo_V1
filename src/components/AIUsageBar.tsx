import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimpleTokenTracker } from '../lib/simpleTokenTracker';
import { useAuth } from '../contexts/AuthContext';

const AIUsageBar: React.FC = () => {
  const { user } = useAuth();
  const [spendingPercentage, setSpendingPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUsage();
    }
  }, [user?.id]);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const percentage = await SimpleTokenTracker.getSpendingPercentage(user!.id);
      setSpendingPercentage(percentage);
    } catch (error) {
      console.error('Error loading token usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (spendingPercentage >= 100) return '#ef4444'; // Red
    if (spendingPercentage >= 80) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const getStatusText = () => {
    if (spendingPercentage >= 100) return 'Limit Exceeded';
    if (spendingPercentage >= 80) return 'Near Limit';
    return 'Normal';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading usage...</Text>
      </View>
    );
  }

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  return (
    <TouchableOpacity style={styles.container} onPress={loadUsage}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="analytics" size={20} color={statusColor} />
          <Text style={styles.title}>AI Usage</Text>
        </View>
        <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>
      </View>
      
      <View style={styles.usageInfo}>
        <Text style={styles.percentageText}>
          {spendingPercentage.toFixed(1)}% used
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${Math.min(spendingPercentage, 100)}%`,
              backgroundColor: statusColor
            }
          ]} 
        />
      </View>
      
      <View style={styles.footer}>
        <Ionicons name="refresh" size={16} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  usageInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    alignItems: 'flex-end',
  },
});

export default AIUsageBar;
