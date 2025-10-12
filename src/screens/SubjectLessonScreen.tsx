import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { SubjectLessonService, SubjectLessonData } from '../lib/subjectLessonService';
import { XPService } from '../lib/xpService';
import { logger } from '../lib/logger';
import { GeneralLessonProgressService } from '../lib/generalLessonProgressService';
import LessonFlashcards from '../components/lesson/LessonFlashcards';
import LessonFlashcardQuiz from '../components/lesson/LessonFlashcardQuiz';
import LessonSentenceScramble from '../components/lesson/LessonSentenceScramble';
import LessonWordScramble from '../components/lesson/LessonWordScramble';
import LessonFillInTheBlank from '../components/lesson/LessonFillInTheBlank';
import LessonListen from '../components/lesson/LessonListen';
import LessonSpeak from '../components/lesson/LessonSpeak';

type ExerciseStep = 'flow-preview' | 'words' | 'listen' | 'speak' | 'write' | 'roleplay' | 'completed';

interface RouteParams {
  subjectName: string;
  cefrLevel?: string;
}

export default function SubjectLessonScreen() {
  const [currentStep, setCurrentStep] = useState<ExerciseStep>('flow-preview');
  const [lessonData, setLessonData] = useState<SubjectLessonData | null>(null);
  const [formattedVocabulary, setFormattedVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseScores, setExerciseScores] = useState({
    flashcards: 0,
    flashcardQuiz: 0,
    sentenceScramble: 0,
    wordScramble: 0,
    fillInBlank: 0,
    listen: 0,
    speak: 0,
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalActiveTime, setTotalActiveTime] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionMessage, setTransitionMessage] = useState<string>('');

  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  const { subjectName, cefrLevel } = route.params as RouteParams;

  const sessionStartTimeRef = useRef<Date | null>(null);
  const totalActiveTimeRef = useRef<number>(0);

  useEffect(() => {
    loadLessonData();
  }, []);

  // Track app state for timing
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && !isActive && currentStep !== 'flow-preview' && currentStep !== 'completed') {
        // App became active, restart timing
        setIsActive(true);
        const now = new Date();
        sessionStartTimeRef.current = now;
        setSessionStartTime(now);
        logger.info('⏱️ App became active - restarting timing');
      } else if (nextAppState.match(/inactive|background/) && isActive) {
        // App went to background, pause timing
        const sessionTime = calculateSessionTime();
        totalActiveTimeRef.current += sessionTime;
        setTotalActiveTime(prev => prev + sessionTime);
        setIsActive(false);
        sessionStartTimeRef.current = null;
        setSessionStartTime(null);
        logger.info(`⏸️ App went to background - paused timing. Session time: ${sessionTime}s`);
      }
    });

    return () => subscription?.remove();
  }, [isActive, currentStep]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      logger.info(`📚 Loading lesson data for subject: ${subjectName}`);

      const nativeLanguage = profile?.native_language || 'French';
      const data = await SubjectLessonService.getSubjectLesson(subjectName, nativeLanguage);

      if (!data.vocabulary || data.vocabulary.length === 0) {
        Alert.alert('No Content', 'This subject doesn\'t have any vocabulary yet.');
        navigation.goBack();
        return;
      }

      setLessonData(data);

      // Format vocabulary for exercises
      const formatted = SubjectLessonService.formatVocabularyForExercises(
        data.vocabulary,
        nativeLanguage
      );
      setFormattedVocabulary(formatted);

      logger.info(`✅ Loaded ${formatted.length} vocabulary items for ${subjectName}`);
    } catch (error) {
      logger.error('Error loading subject lesson:', error);
      Alert.alert('Error', 'Failed to load lesson data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const calculateSessionTime = (): number => {
    if (!sessionStartTimeRef.current) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - sessionStartTimeRef.current.getTime()) / 1000);
  };

  const navigateToExercise = (exerciseType: ExerciseStep) => {
    // Reset transition state
    setIsTransitioning(false);
    setTransitionMessage('');
    
    // Initialize start time if not already set
    if (!startTime) {
      setStartTime(new Date());
    }

    // Initialize active timing if not already active
    if (!isActive) {
      setIsActive(true);
      const now = new Date();
      sessionStartTimeRef.current = now;
      setSessionStartTime(now);
      logger.info('🕐 Started lesson timing');
    }

    // Navigate to the selected exercise
    setCurrentStep(exerciseType);
  };

  const handleExerciseComplete = async (exerciseType: string, score: number, maxScore: number) => {
    logger.info(`✅ Exercise completed: ${exerciseType}, Score: ${score}/${maxScore}`);

    // Update scores
    setExerciseScores(prev => ({
      ...prev,
      [exerciseType]: score
    }));

    // Mark exercise as completed
    setCompletedExercises(prev => new Set(prev).add(exerciseType));

    // Record progress in database
    if (user && cefrLevel) {
      try {
        const sessionTime = calculateSessionTime();
        const accuracy = maxScore > 0 ? (score / maxScore) * 100 : 0;
        
        await GeneralLessonProgressService.recordExerciseCompletion(
          user.id,
          subjectName,
          cefrLevel,
          {
            exerciseName: exerciseType,
            score,
            maxScore,
            accuracy,
            timeSpentSeconds: sessionTime
          }
        );
        
        logger.info(`📊 Progress recorded for ${exerciseType}`);
      } catch (error) {
        logger.error('Error recording progress:', error);
      }
    }

    // Define exercise flow order
    const exerciseFlow: ExerciseStep[] = [
      'words',
      'listen',
      'speak',
      'write',
      'roleplay'
    ];

    // Find current exercise index
    const currentIndex = exerciseFlow.indexOf(exerciseType as ExerciseStep);
    
    // Check if there's a next exercise
    if (currentIndex < exerciseFlow.length - 1) {
      const nextExercise = exerciseFlow[currentIndex + 1];
      const exerciseNames: { [key: string]: string } = {
        'words': 'Words',
        'listen': 'Listen',
        'speak': 'Speak',
        'write': 'Write',
        'roleplay': 'Roleplay'
      };
      
      logger.info(`🔄 Auto-advancing to next exercise: ${nextExercise}`);
      setIsTransitioning(true);
      setTransitionMessage(`Moving to ${exerciseNames[nextExercise]}...`);
      
      // Small delay for better UX
      setTimeout(() => {
        setCurrentStep(nextExercise);
        setIsTransitioning(false);
        setTransitionMessage('');
      }, 1500);
    } else {
      // All exercises completed, show completion screen
      logger.info(`🎉 All exercises completed!`);
      setIsTransitioning(true);
      setTransitionMessage('All exercises completed!');
      
      setTimeout(() => {
        setCurrentStep('completed');
        setIsTransitioning(false);
        setTransitionMessage('');
      }, 1500);
    }
  };

  const calculateTotalScore = (): { totalScore: number; maxScore: number } => {
    const scores = Object.values(exerciseScores);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const maxScore = completedExercises.size * 100; // Assuming max 100 per exercise
    return { totalScore, maxScore };
  };

  const handleCompleteLesson = async () => {
    try {
      // Calculate final timing
      const sessionTime = isActive ? calculateSessionTime() : 0;
      const finalTotalTime = totalActiveTimeRef.current + sessionTime;

      logger.info(`🎉 Lesson completed! Total time: ${finalTotalTime}s`);

      const { totalScore, maxScore } = calculateTotalScore();

      // Award XP based on completion
      if (user) {
        const xpEarned = Math.floor(totalScore / 10); // 1 XP per 10 points
        await XPService.addXP(user.id, xpEarned, `Completed ${subjectName} lesson`);
        logger.info(`🎁 Awarded ${xpEarned} XP`);
      }

      setCurrentStep('completed');
      setIsActive(false);
    } catch (error) {
      logger.error('Error completing lesson:', error);
    }
  };

  const handleExit = () => {
    // Reset transition state
    setIsTransitioning(false);
    setTransitionMessage('');
    
    Alert.alert(
      'Exit Lesson',
      'Are you sure you want to exit? Your progress will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Transition screen between exercises
  if (isTransitioning) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>{transitionMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Helper function to count B sentences in lesson script
  const countBSentences = (script: string): number => {
    if (!script) return 0;
    const bMatches = script.match(/B: /g);
    return bMatches ? bMatches.length : 0;
  };

  // Get lesson script for Write and Roleplay scoring
  const lessonScript = lessonData?.lessonScript?.english_lesson_script || '';
  const bSentenceCount = countBSentences(lessonScript);

  // Calculate correct max scores for each exercise
  const maxScoreWords = formattedVocabulary.length; // Flashcards: number of cards
  const maxScoreListen = formattedVocabulary.length; // Listen: number of words
  const maxScoreSpeak = formattedVocabulary.length; // Speak: number of words (binary scoring)
  const maxScoreWrite = bSentenceCount || formattedVocabulary.length; // Write: number of B sentences
  const maxScoreRoleplay = bSentenceCount || formattedVocabulary.length; // Roleplay: number of B sentences

  // Render current exercise
  if (currentStep === 'words') {
    return (
      <LessonFlashcards
        vocabulary={formattedVocabulary}
        onComplete={(score) => handleExerciseComplete('words', score, maxScoreWords)}
        onClose={handleExit}
      />
    );
  }

  if (currentStep === 'listen') {
    return (
      <LessonListen
        vocabulary={formattedVocabulary}
        onComplete={(score) => handleExerciseComplete('listen', score, maxScoreListen)}
        onClose={handleExit}
      />
    );
  }

  if (currentStep === 'speak') {
    return (
      <LessonSpeak
        vocabulary={formattedVocabulary}
        onComplete={(score) => handleExerciseComplete('speak', score, maxScoreSpeak)}
        onClose={handleExit}
      />
    );
  }

  if (currentStep === 'write') {
    return (
      <LessonFillInTheBlank
        vocabulary={formattedVocabulary}
        onComplete={(score) => handleExerciseComplete('write', score, maxScoreWrite)}
        onClose={handleExit}
      />
    );
  }

  if (currentStep === 'roleplay') {
    return (
      <LessonSentenceScramble
        vocabulary={formattedVocabulary}
        onComplete={(score) => handleExerciseComplete('roleplay', score, maxScoreRoleplay)}
        onClose={handleExit}
      />
    );
  }

  // Completed screen
  if (currentStep === 'completed') {
    const { totalScore, maxScore } = calculateTotalScore();
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          <Text style={styles.completedTitle}>Lesson Complete!</Text>
          <Text style={styles.completedSubtitle}>{subjectName}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{percentage}%</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{completedExercises.size}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formattedVocabulary.length}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Back to Subjects</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Flow preview screen
  const exercises = [
    { id: 'flashcards', title: 'Flashcards', icon: 'card-outline', color: '#6366f1' },
    { id: 'flashcard-quiz', title: 'Quiz', icon: 'help-circle-outline', color: '#8b5cf6' },
    { id: 'word-scramble', title: 'Word Scramble', icon: 'shuffle-outline', color: '#ec4899' },
    { id: 'sentence-scramble', title: 'Sentence Scramble', icon: 'swap-horizontal-outline', color: '#f59e0b' },
    { id: 'fill-in-blank', title: 'Fill in the Blank', icon: 'create-outline', color: '#10b981' },
    { id: 'listen', title: 'Listen', icon: 'headset-outline', color: '#3b82f6' },
    { id: 'speak', title: 'Speak', icon: 'mic-outline', color: '#ef4444' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{subjectName}</Text>
          {cefrLevel && (
            <View style={styles.cefrBadge}>
              <Text style={styles.cefrBadgeText}>{cefrLevel}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Lesson Info */}
        <View style={styles.infoCard}>
          <Ionicons name="book-outline" size={40} color="#6366f1" />
          <Text style={styles.infoTitle}>Learn {formattedVocabulary.length} Words</Text>
          <Text style={styles.infoSubtitle}>
            Complete exercises to master this subject
          </Text>
        </View>

        {/* Exercises Grid */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {exercises.map((exercise) => {
            const isCompleted = completedExercises.has(exercise.id);
            return (
              <TouchableOpacity
                key={exercise.id}
                style={[styles.exerciseCard, isCompleted && styles.exerciseCardCompleted]}
                onPress={() => navigateToExercise(exercise.id as ExerciseStep)}
              >
                <View style={[styles.exerciseIcon, { backgroundColor: exercise.color + '20' }]}>
                  <Ionicons name={exercise.icon as any} size={28} color={exercise.color} />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.exerciseSubtitle}>
                    {isCompleted ? '✓ Completed' : 'Tap to start'}
                  </Text>
                </View>
                <Ionicons 
                  name={isCompleted ? 'checkmark-circle' : 'chevron-forward'} 
                  size={24} 
                  color={isCompleted ? '#10b981' : '#9ca3af'} 
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Complete Button */}
        {completedExercises.size > 0 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteLesson}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#ffffff" />
            <Text style={styles.completeButtonText}>Complete Lesson</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  cefrBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cefrBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#f0f4ff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  exercisesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseCardCompleted: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  exerciseIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    color: '#000000',
    marginBottom: 4,
  },
  exerciseSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginTop: 24,
  },
  completedSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 32,
    gap: 16,
  },
  statBox: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

