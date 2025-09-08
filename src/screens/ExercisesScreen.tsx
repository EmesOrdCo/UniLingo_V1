import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ExercisesScreen() {
  const [selectedExercise, setSelectedExercise] = useState('');
  const navigation = useNavigation();

  const exercises = [
    { name: 'Vocabulary Quiz', icon: 'help-circle', color: '#3b82f6', description: 'Test your knowledge with multiple choice questions' },
    { name: 'Fill in the Blanks', icon: 'create', color: '#8b5cf6', description: 'Complete sentences with the correct terms' },
    { name: 'Matching Pairs', icon: 'git-compare', color: '#10b981', description: 'Match terms with their definitions' },
    { name: 'Sentence Building', icon: 'construct', color: '#f59e0b', description: 'Build sentences using learned vocabulary' },
    { name: 'Reading Comprehension', icon: 'book', color: '#ef4444', description: 'Read passages and answer questions' },
    { name: 'Listening Practice', icon: 'headset', color: '#ec4899', description: 'Listen and identify correct terms' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercises</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Practice & Learn</Text>
          <Text style={styles.introSubtitle}>
            Choose from various exercise types to reinforce your vocabulary and improve retention
          </Text>
        </View>

        <View style={styles.exercisesGrid}>
          {(exercises || []).map((exercise) => (
            <TouchableOpacity
              key={exercise.name}
              style={[
                styles.exerciseCard,
                selectedExercise === exercise.name && styles.selectedExerciseCard
              ]}
              onPress={() => setSelectedExercise(exercise.name)}
            >
              <View style={[styles.exerciseIcon, { backgroundColor: exercise.color }]}>
                <Ionicons name={exercise.icon as any} size={24} color="#ffffff" />
              </View>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedExercise && (
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Start {selectedExercise}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  exerciseCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedExerciseCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  actionSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
