import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConsistentHeader from '../components/ConsistentHeader';
import LevelProgressWidget from '../components/LevelProgressWidget';

export default function LevelProgressScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <ConsistentHeader pageName="Level Progress" />
      
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.widgetContainer}>
          <LevelProgressWidget />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  widgetContainer: {
    padding: 20,
  },
});
