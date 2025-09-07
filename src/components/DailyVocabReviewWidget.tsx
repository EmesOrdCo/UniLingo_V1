import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DailyVocabReviewWidgetProps {
  onStartReview?: () => void;
}

export default function DailyVocabReviewWidget({ onStartReview }: DailyVocabReviewWidgetProps) {
  const handleStartReview = () => {
    if (onStartReview) {
      onStartReview();
    } else {
      // Placeholder functionality for now
      console.log('Starting daily vocab review...');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="book" size={20} color="#6366f1" style={styles.icon} />
          <Text style={styles.title}>Daily Vocab Review</Text>
        </View>
        <View style={styles.streakContainer}>
          <Ionicons name="flame" size={16} color="#f59e0b" />
          <Text style={styles.streakText}>0</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Time for a quick review</Text>
        <Text style={styles.description}>
          Review your vocabulary and strengthen your memory with spaced repetition
        </Text>
        
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartReview}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Review</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
  },
  content: {
    gap: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});


