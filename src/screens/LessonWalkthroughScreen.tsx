import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson, LessonProgress } from '../lib/lessonService';
import LessonFlashcards from '../components/lesson/LessonFlashcards';
import LessonFlashcardQuiz from '../components/lesson/LessonFlashcardQuiz';
import LessonSentenceScramble from '../components/lesson/LessonSentenceScramble';
import LessonWordScramble from '../components/lesson/LessonWordScramble';

type ExerciseStep = 'intro' | 'flashcards' | 'flashcard-quiz' | 'sentence-scramble' | 'word-scramble' | 'completed';

interface RouteParams {
  lessonId: string;
  lessonTitle: string;
}

export default function LessonWalkthroughScreen() {
  const [currentStep, setCurrentStep] = useState<ExerciseStep>('intro');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonVocabulary, setLessonVocabulary] = useState<any[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseScores, setExerciseScores] = useState({
    flashcards: 0,
    flashcardQuiz: 0,
    sentenceScramble: 0,
    wordScramble: 0
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId, lessonTitle } = route.params as RouteParams;

  useEffect(() => {
    loadLessonData();
  }, []);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      
      // Load lesson and vocabulary
      const lessonData = await LessonService.getLesson(lessonId);
      if (!lessonData) {
        Alert.alert('Error', 'Lesson not found');
        navigation.goBack();
        return;
      }

      setLesson(lessonData.lesson);
      setLessonVocabulary(lessonData.vocabulary);

      // Load or create progress
      if (user) {
        const progress = await LessonService.getLessonProgress(lessonId, user.id);
        if (progress) {
          setLessonProgress(progress);
          // If lesson is completed, show completion screen
          if (progress.completed_at) {
            setCurrentStep('completed');
          }
        }
      }

    } catch (error) {
      console.error('Error loading lesson data:', error);
      Alert.alert('Error', 'Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  const startLesson = async () => {
    if (!user) return;
    
    setStartTime(new Date());
    setCurrentStep('flashcards');
    
    // Initialize progress (with error handling)
    try {
      await LessonService.updateLessonProgress(lessonId, user.id, {
        started_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error initializing lesson progress:', error);
      // Continue without database progress tracking
    }
  };

  const resumeLesson = async () => {
    if (!lessonProgress || !user) return;
    
    setStartTime(new Date());
    setCurrentStep('flashcards'); // Always start from flashcards for simplicity
  };

  const handleExerciseComplete = async (exerciseType: string, score: number, maxScore: number) => {
    if (!user) return;

    // Update exercise scores
    setExerciseScores(prev => ({
      ...prev,
      [exerciseType]: score
    }));

    // Mark exercise as completed
    setCompletedExercises(prev => new Set([...prev, exerciseType]));

    // Determine next step
    let nextStep: ExerciseStep;

    switch (exerciseType) {
      case 'flashcards':
        nextStep = 'flashcard-quiz';
        break;
      case 'flashcard-quiz':
        nextStep = 'sentence-scramble';
        break;
      case 'sentence-scramble':
        nextStep = 'word-scramble';
        break;
      case 'word-scramble':
        nextStep = 'completed';
        break;
      default:
        return;
    }

    // Move to next step
    setTimeout(() => {
      setCurrentStep(nextStep);
    }, 1000);
  };

  const handleLessonComplete = async () => {
    if (!user || !startTime) return;

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const totalScore = Object.values(exerciseScores).reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = lessonVocabulary.length * 4; // 4 exercises

    // Complete lesson (with error handling)
    try {
      await LessonService.completeLesson(lessonId, user.id, totalScore, maxPossibleScore, timeSpent);
    } catch (error) {
      console.error('Error completing lesson:', error);
      // Continue without database completion tracking
    }
    
    Alert.alert(
      '🎉 Lesson Complete!',
      `Congratulations! You've completed "${lessonTitle}" with a score of ${totalScore}/${maxPossibleScore}`,
      [
        {
          text: 'Back to Lessons',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  // Render exercise components
  if (currentStep === 'flashcards') {
    return (
      <LessonFlashcards
        vocabulary={lessonVocabulary}
        onComplete={(score) => handleExerciseComplete('flashcards', score, lessonVocabulary.length)}
        onClose={() => navigation.goBack()}
      />
    );
  }

  if (currentStep === 'flashcard-quiz') {
    return (
      <LessonFlashcardQuiz
        vocabulary={lessonVocabulary}
        onComplete={(score) => handleExerciseComplete('flashcard-quiz', score, lessonVocabulary.length)}
        onClose={() => navigation.goBack()}
      />
    );
  }

  if (currentStep === 'sentence-scramble') {
    return (
      <LessonSentenceScramble
        vocabulary={lessonVocabulary}
        onComplete={(score) => handleExerciseComplete('sentence-scramble', score, lessonVocabulary.length)}
        onClose={() => navigation.goBack()}
      />
    );
  }

  if (currentStep === 'word-scramble') {
    return (
      <LessonWordScramble
        vocabulary={lessonVocabulary}
        onComplete={(score) => handleExerciseComplete('word-scramble', score, lessonVocabulary.length)}
        onClose={() => navigation.goBack()}
      />
    );
  }

  if (currentStep === 'completed') {
    return (
      <View style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Ionicons name="trophy" size={80} color="#fbbf24" />
          <Text style={styles.completionTitle}>🎉 Lesson Complete!</Text>
          <Text style={styles.completionSubtitle}>{lessonTitle}</Text>
          
          <View style={styles.scoreSummary}>
            <Text style={styles.scoreText}>
              Total Score: {Object.values(exerciseScores).reduce((sum, score) => sum + score, 0)}/{lessonVocabulary.length * 4}
            </Text>
          </View>

          <TouchableOpacity style={styles.completionButton} onPress={handleLessonComplete}>
            <Text style={styles.completionButtonText}>Finish Lesson</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Intro Screen
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson Walkthrough</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <View style={styles.lessonCard}>
            <Text style={styles.lessonTitle}>{lessonTitle}</Text>
            <Text style={styles.lessonSubtitle}>
              {lessonVocabulary.length} vocabulary terms to master
            </Text>
          </View>

          <View style={styles.exerciseOverview}>
            <Text style={styles.sectionTitle}>Exercise Overview</Text>
            
            <View style={styles.exerciseList}>
              <View style={styles.exerciseItem}>
                <View style={styles.exerciseIcon}>
                  <Ionicons name="card" size={24} color="#6366f1" />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>1. Flashcards</Text>
                  <Text style={styles.exerciseDescription}>Review all vocabulary terms</Text>
                </View>
                                 {completedExercises.has('flashcards') && (
                   <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                 )}
               </View>

               <View style={styles.exerciseItem}>
                 <View style={styles.exerciseIcon}>
                   <Ionicons name="help-circle" size={24} color="#6366f1" />
                 </View>
                 <View style={styles.exerciseInfo}>
                   <Text style={styles.exerciseTitle}>2. Flashcard Quiz</Text>
                   <Text style={styles.exerciseDescription}>Test your knowledge</Text>
                 </View>
                 {completedExercises.has('flashcard-quiz') && (
                   <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                 )}
               </View>

               <View style={styles.exerciseItem}>
                 <View style={styles.exerciseIcon}>
                   <Ionicons name="text" size={24} color="#6366f1" />
                 </View>
                 <View style={styles.exerciseInfo}>
                   <Text style={styles.exerciseTitle}>3. Sentence Scramble</Text>
                   <Text style={styles.exerciseDescription}>Unscramble example sentences</Text>
                 </View>
                 {completedExercises.has('sentence-scramble') && (
                   <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                 )}
               </View>

               <View style={styles.exerciseItem}>
                 <View style={styles.exerciseIcon}>
                   <Ionicons name="grid" size={24} color="#6366f1" />
                 </View>
                 <View style={styles.exerciseInfo}>
                   <Text style={styles.exerciseTitle}>4. Word Scramble</Text>
                   <Text style={styles.exerciseDescription}>Unscramble vocabulary words</Text>
                 </View>
                 {completedExercises.has('word-scramble') && (
                   <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                 )}
               </View>
            </View>
          </View>

                     {lessonProgress && !lessonProgress.completed_at ? (
             <TouchableOpacity style={styles.resumeButton} onPress={resumeLesson}>
               <Ionicons name="play" size={20} color="#ffffff" />
               <Text style={styles.resumeButtonText}>Resume Lesson</Text>
             </TouchableOpacity>
           ) : (
             <TouchableOpacity style={styles.startButton} onPress={startLesson}>
               <Ionicons name="play" size={20} color="#ffffff" />
               <Text style={styles.startButtonText}>Start Lesson</Text>
             </TouchableOpacity>
           )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  introContainer: {
    padding: 20,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  lessonSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  exerciseOverview: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  exerciseList: {
    gap: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  startButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  resumeButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  completionContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 24,
  },
  scoreSummary: {
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  completionButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  completionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
