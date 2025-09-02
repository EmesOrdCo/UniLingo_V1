import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import DailyGoalsWidget from './DailyGoalsWidget';
import RecentActivitiesWidget from './RecentActivitiesWidget';
import LevelProgressWidget from './LevelProgressWidget';
import ConversationPracticeCard from './ConversationPracticeCard';

interface DashboardContentProps {
  progressData: any;
  loadingProgress: boolean;
}

export default function DashboardContent({ progressData, loadingProgress }: DashboardContentProps) {
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Conversation Practice Card */}
      <ConversationPracticeCard />
      
      {/* Daily Goals Widget */}
      <DailyGoalsWidget />
      
      {/* Level Progress Widget */}
      <LevelProgressWidget />
      
      {/* Recent Activities Widget */}
      <RecentActivitiesWidget />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
});
