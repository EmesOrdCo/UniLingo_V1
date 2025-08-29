import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface RouteParams {
  lessonId: string;
  progressId: string;
  totalScore: number;
  maxPossibleScore: number;
  exercisesCompleted: number;
  timeSpentSeconds: number;
}

interface FeedbackData {
  confidence_rating: number;
  difficulty_perceived: number;
  engagement_score: number;
  study_environment: string;
  energy_level: number;
  stress_level: number;
  notes: string;
}

export default function PostLessonFeedbackScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const params = route.params as RouteParams;

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData>({
    confidence_rating: 0,
    difficulty_perceived: 0,
    engagement_score: 0,
    study_environment: '',
    energy_level: 0,
    stress_level: 0,
    notes: '',
  });

  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');

  const environmentOptions = [
    'Quiet Room',
    'Library',
    'Coffee Shop',
    'Public Transport',
    'Office',
    'Outdoors',
    'Other',
  ];

  const renderRatingBar = (
    title: string,
    value: number,
    onValueChange: (value: number) => void,
    icon: string,
    color: string
  ) => (
    <View style={styles.ratingSection}>
      <View style={styles.ratingHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.ratingTitle}>{title}</Text>
      </View>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingButton,
              value >= rating && { backgroundColor: color }
            ]}
            onPress={() => onValueChange(rating)}
          >
            <Text style={[
              styles.ratingText,
              value >= rating && { color: 'white' }
            ]}>
              {rating}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingLabel}>
        {value === 0 ? 'Select rating' : `${value}/10`}
      </Text>
    </View>
  );

  const renderEnvironmentSelector = () => (
    <View style={styles.ratingSection}>
      <View style={styles.ratingHeader}>
        <Ionicons name="location" size={24} color="#8b5cf6" />
        <Text style={styles.ratingTitle}>Study Environment</Text>
      </View>
      <View style={styles.environmentGrid}>
        {environmentOptions.map((env) => (
          <TouchableOpacity
            key={env}
            style={[
              styles.environmentButton,
              selectedEnvironment === env && { backgroundColor: '#8b5cf6' }
            ]}
            onPress={() => setSelectedEnvironment(env)}
          >
            <Text style={[
              styles.environmentText,
              selectedEnvironment === env && { color: 'white' }
            ]}>
              {env}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selectedEnvironment === 'Other' && (
        <TextInput
          style={styles.customEnvironmentInput}
          placeholder="Describe your study environment..."
          placeholderTextColor="#9ca3af"
          value={feedback.study_environment}
          onChangeText={(text) => setFeedback(prev => ({ ...prev, study_environment: text }))}
          multiline
        />
      )}
    </View>
  );

  const renderNotesSection = () => (
    <View style={styles.ratingSection}>
      <View style={styles.ratingHeader}>
        <Ionicons name="create" size={24} color="#f59e0b" />
        <Text style={styles.ratingTitle}>Personal Notes</Text>
      </View>
      <TextInput
        style={styles.notesInput}
        placeholder="How did this lesson feel? Any thoughts or observations?"
        placeholderTextColor="#9ca3af"
        value={feedback.notes}
        onChangeText={(text) => setFeedback(prev => ({ ...prev, notes: text }))}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );

  const handleSubmit = async () => {
    // Validate required fields
    if (feedback.confidence_rating === 0 || 
        feedback.difficulty_perceived === 0 || 
        feedback.engagement_score === 0) {
      Alert.alert(
        'Missing Information',
        'Please rate your confidence, difficulty, and engagement before continuing.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!selectedEnvironment && !feedback.study_environment) {
      Alert.alert(
        'Missing Information',
        'Please select or describe your study environment.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      // Update the lesson_progress record with feedback
      const { error } = await supabase
        .from('lesson_progress')
        .update({
          confidence_rating: feedback.confidence_rating,
          difficulty_perceived: feedback.difficulty_perceived,
          engagement_score: feedback.engagement_score,
          study_environment: selectedEnvironment === 'Other' ? feedback.study_environment : selectedEnvironment,
          energy_level: feedback.energy_level,
          stress_level: feedback.stress_level,
          notes: feedback.notes,
        })
        .eq('id', params.progressId);

      if (error) throw error;

      Alert.alert(
        'Feedback Submitted!',
        'Thank you for your feedback. It will help improve your learning experience.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('LessonReview' as never, params as never)
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = feedback.confidence_rating > 0 && 
                   feedback.difficulty_perceived > 0 && 
                   feedback.engagement_score > 0 && 
                   (selectedEnvironment || feedback.study_environment);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson Feedback</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <View style={styles.introIcon}>
            <Ionicons name="star" size={32} color="#6366f1" />
          </View>
          <Text style={styles.introTitle}>How was your lesson?</Text>
          <Text style={styles.introSubtitle}>
            Your feedback helps us personalize your learning experience and track your progress better.
          </Text>
        </View>

        {/* Rating Sections */}
        {renderRatingBar(
          'Confidence Level',
          feedback.confidence_rating,
          (value) => setFeedback(prev => ({ ...prev, confidence_rating: value })),
          'trending-up',
          '#10b981'
        )}

        {renderRatingBar(
          'Difficulty Level',
          feedback.difficulty_perceived,
          (value) => setFeedback(prev => ({ ...prev, difficulty_perceived: value })),
          'speedometer',
          '#f59e0b'
        )}

        {renderRatingBar(
          'Engagement',
          feedback.engagement_score,
          (value) => setFeedback(prev => ({ ...prev, engagement_score: value })),
          'heart',
          '#ef4444'
        )}

        {renderRatingBar(
          'Energy Level',
          feedback.energy_level,
          (value) => setFeedback(prev => ({ ...prev, energy_level: value })),
          'flash',
          '#3b82f6'
        )}

        {renderRatingBar(
          'Stress Level',
          feedback.stress_level,
          (value) => setFeedback(prev => ({ ...prev, stress_level: value })),
          'pulse',
          '#8b5cf6'
        )}

        {/* Environment Selector */}
        {renderEnvironmentSelector()}

        {/* Notes Section */}
        {renderNotesSection()}

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="refresh" size={20} color="white" style={styles.spinning} />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('LessonReview' as never, params as never)}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  introSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  ratingSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  environmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  environmentButton: {
    width: (width - 80) / 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    alignItems: 'center',
  },
  environmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  customEnvironmentInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    minHeight: 60,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  submitSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 16,
    borderRadius: 16,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinning: {
    transform: [{ rotate: '0deg' }],
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});



