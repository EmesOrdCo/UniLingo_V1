import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import DailyGoalsWidget from './DailyGoalsWidget';
import LevelProgressWidget from './LevelProgressWidget';

interface DashboardContentProps {
  progressData: any;
  loadingProgress: boolean;
}

export default function DashboardContent({ progressData, loadingProgress }: DashboardContentProps) {
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Daily Goals Widget */}
      <DailyGoalsWidget />
      
      {/* Level Progress Widget */}
      <LevelProgressWidget />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
});
