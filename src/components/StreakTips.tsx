import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StreakTipsProps {
  style?: any;
}

export default function StreakTips({ style }: StreakTipsProps) {
  return (
    <View style={[styles.tipsCard, style]}>
      <Text style={styles.tipsTitle}>💡 Streak Tips</Text>
      <View style={styles.tipItem}>
        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        <Text style={styles.tipText}>Study for at least 15 minutes daily</Text>
      </View>
      <View style={styles.tipItem}>
        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        <Text style={styles.tipText}>Complete at least one lesson per day</Text>
      </View>
      <View style={styles.tipItem}>
        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        <Text style={styles.tipText}>Review flashcards regularly</Text>
      </View>
      <View style={styles.tipItem}>
        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        <Text style={styles.tipText}>Track your daily goals progress</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tipsCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 16,
    color: '#0c4a6e',
    marginLeft: 12,
    flex: 1,
  },
});
