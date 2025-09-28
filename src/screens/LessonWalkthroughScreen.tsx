import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson, LessonProgress } from '../lib/lessonService';
import { XPService } from '../lib/xpService';
import { ProgressTrackingService } from '../lib/progressTrackingService';
import { logger } from '../lib/logger';
import LessonFlashcards from '../components/lesson/LessonFlashcards';
import LessonFlashcardQuiz from '../components/lesson/LessonFlashcardQuiz';
import LessonSentenceScramble from '../components/lesson/LessonSentenceScramble';
import LessonWordScramble from '../components/lesson/LessonWordScramble';
import LessonFillInTheBlank from '../components/lesson/LessonFillInTheBlank';

type ExerciseStep = 'flow-preview' | 'flashcards' | 'flashcard-quiz' | 'sentence-scramble' | 'word-scramble' | 'fill-in-blank' | 'completed';

interface RouteParams {
  lessonId: string;
  lessonTitle: string;
}

export default function LessonWalkthroughScreen() {
  const [currentStep, setCurrentStep] = useState<ExerciseStep>('flow-preview');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonVocabulary, setLessonVocabulary] = useState<any[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseScores, setExerciseScores] = useState({
    flashcards: 0,
    flashcardQuiz: 0,
    sentenceScramble: 0,
    wordScramble: 0,
    fillInBlank: 0
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalActiveTime, setTotalActiveTime] = useState<number>(0); // Total active time in seconds
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null); // Current session start time
  const [isActive, setIsActive] = useState<boolean>(false); // Whether user is currently active
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [currentExercise, setCurrentExercise] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId, lessonTitle } = route.params as RouteParams;

  // Use refs for timing values to prevent infinite loops
  const sessionStartTimeRef = useRef<Date | null>(null);
  const totalActiveTimeRef = useRef<number>(0);

  useEffect(() => {
    loadLessonData();
  }, []);

  // Track active time when screen is focused/blurred
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - start timing
      if (isActive) {
        sessionStartTimeRef.current = new Date();
        setSessionStartTime(sessionStartTimeRef.current);
        console.log('🕐 Lesson screen focused - starting active timer');
      }
      
      return () => {
        // Screen is blurred - stop timing and accumulate
        if (isActive && sessionStartTimeRef.current) {
          const sessionDuration = Math.floor((new Date().getTime() - sessionStartTimeRef.current.getTime()) / 1000);
          totalActiveTimeRef.current += sessionDuration;
          setTotalActiveTime(totalActiveTimeRef.current);
          console.log(`🕐 Lesson screen blurred - accumulated ${sessionDuration}s, total: ${totalActiveTimeRef.current}s`);
        }
      };
    }, [isActive]) // Only depend on isActive to prevent infinite loops
  );

  // Save active time periodically to preserve it during resume
  const saveActiveTime = async () => {
    if (!isActive || !sessionStartTimeRef.current) return;
    
    const currentSessionTime = Math.floor((new Date().getTime() - sessionStartTimeRef.current.getTime()) / 1000);
    const totalTime = totalActiveTimeRef.current + currentSessionTime;
    
    try {
      await LessonService.updateLessonProgress(lessonId, user?.id || '', {
        time_spent_seconds: totalTime
      });
      logger.debug(`Saved active time: ${totalTime}s`);
    } catch (error) {
      logger.error('Error saving active time:', error);
    }
  };

  // Save active time every 30 seconds
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(saveActiveTime, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [isActive]); // Removed totalActiveTime and sessionStartTime to prevent infinite loop

  // Track app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && isActive && sessionStartTimeRef.current) {
        // App went to background - pause timing
        const sessionDuration = Math.floor((new Date().getTime() - sessionStartTimeRef.current.getTime()) / 1000);
        totalActiveTimeRef.current += sessionDuration;
        setTotalActiveTime(totalActiveTimeRef.current);
        sessionStartTimeRef.current = null;
        setSessionStartTime(null);
        logger.debug(`App backgrounded - paused timing, accumulated ${sessionDuration}s`);
      } else if (nextAppState === 'active' && isActive && !sessionStartTimeRef.current) {
        // App came to foreground - resume timing
        sessionStartTimeRef.current = new Date();
        setSessionStartTime(sessionStartTimeRef.current);
        logger.debug('App foregrounded - resumed active timer');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isActive]); // Only depend on isActive to prevent infinite loops

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
          
          // Restore state if lesson was in progress
          if (progress.started_at && !progress.completed_at) {
            // Set start time from database
            setStartTime(new Date(progress.started_at));
            
            // Determine current step based on progress
            // For now, always start from flow preview for consistency
            setCurrentStep('flow-preview');
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

  const startNewLesson = async () => {
    if (!user) return;
    
    const now = new Date();
    setStartTime(now);
    setCurrentStep('flashcards'); // Go directly to first exercise
    
    // Reset all scores and completed exercises
    setExerciseScores({
      flashcards: 0,
      flashcardQuiz: 0,
      sentenceScramble: 0,
      wordScramble: 0,
      fillInBlank: 0
    });
    setCompletedExercises(new Set());
    
    // Initialize progress in database
    try {
      const maxPossibleScore = lessonVocabulary.length * 5; // 5 points per word across all exercises
      await LessonService.updateLessonProgress(lessonId, user.id, {
        started_at: now.toISOString(),
        completed_at: undefined,
        total_score: 0,
        max_possible_score: maxPossibleScore,
        time_spent_seconds: 0
      });
      
      // Update local progress state
      setLessonProgress(prev => prev ? {
        ...prev,
        started_at: now.toISOString(),
        completed_at: undefined,
        total_score: 0,
        max_possible_score: maxPossibleScore,
        time_spent_seconds: 0
      } : null);
    } catch (error) {
      console.error('Error initializing lesson progress:', error);
      // Continue without database progress tracking
    }
  };

  const startLesson = async () => {
    if (!user) return;
    
    const now = new Date();
    setStartTime(now);
    setCurrentStep('flashcards'); // Go directly to first exercise
    
    // Initialize active timing
    setIsActive(true);
    sessionStartTimeRef.current = now;
    setSessionStartTime(now);
    totalActiveTimeRef.current = 0;
    setTotalActiveTime(0);
    
    // Reset all scores and completed exercises
    setExerciseScores({
      flashcards: 0,
      flashcardQuiz: 0,
      sentenceScramble: 0,
      wordScramble: 0,
      fillInBlank: 0
    });
    setCompletedExercises(new Set());
    
    // Initialize progress in database
    try {
      await LessonService.updateLessonProgress(lessonId, user.id, {
        started_at: now.toISOString(),
        completed_at: undefined // Ensure it's not completed
      });
      
      // Update local progress state
      setLessonProgress(prev => prev ? {
        ...prev,
        started_at: now.toISOString(),
        completed_at: undefined
      } : null);
    } catch (error) {
      console.error('Error initializing lesson progress:', error);
      // Continue without database progress tracking
    }
  };

  const resumeLesson = async () => {
    if (!lessonProgress || !user) return;
    
    // Initialize active timing for resume
    setIsActive(true);
    const now = new Date();
    sessionStartTimeRef.current = now;
    setSessionStartTime(now);
    
    // Restore the total active time from previous sessions
    // We'll estimate this based on the time_spent_seconds in the database
    // This is a fallback - ideally we'd store active time separately
    const estimatedActiveTime = lessonProgress.time_spent_seconds || 0;
    totalActiveTimeRef.current = estimatedActiveTime;
    setTotalActiveTime(estimatedActiveTime);
    
    // Restore exercise scores based on progress
    // We'll estimate which exercises were completed based on total score
    const estimatedScorePerExercise = lessonVocabulary.length; // Each exercise is worth vocabulary length points
    const completedExerciseCount = Math.floor(lessonProgress.total_score / estimatedScorePerExercise);
    
    // Restore completed exercises set
    const exerciseTypes = ['flashcards', 'flashcardQuiz', 'sentenceScramble', 'wordScramble', 'fillInBlank'];
    const completedExercisesSet = new Set(exerciseTypes.slice(0, completedExerciseCount));
    setCompletedExercises(completedExercisesSet);
    
    // Restore exercise scores (estimated based on progress)
    const estimatedScorePerCompletedExercise = Math.floor(lessonProgress.total_score / Math.max(1, completedExerciseCount));
    const restoredScores = {
      flashcards: completedExerciseCount > 0 ? estimatedScorePerCompletedExercise : 0,
      flashcardQuiz: completedExerciseCount > 1 ? estimatedScorePerCompletedExercise : 0,
      sentenceScramble: completedExerciseCount > 2 ? estimatedScorePerCompletedExercise : 0,
      wordScramble: completedExerciseCount > 3 ? estimatedScorePerCompletedExercise : 0,
      fillInBlank: completedExerciseCount > 4 ? estimatedScorePerCompletedExercise : 0
    };
    setExerciseScores(restoredScores);
    
    // Try to load exact resume position from local storage (only if not transitioning)
    const resumePosition = await loadResumePosition();
    if (resumePosition && resumePosition.exercise && resumePosition.questionIndex !== undefined && !isTransitioning) {
      setCurrentExercise(resumePosition.exercise);
      setCurrentQuestionIndex(resumePosition.questionIndex);
      setCurrentStep(resumePosition.exercise as ExerciseStep);
      console.log(`Resuming to exact position: ${resumePosition.exercise} at question ${resumePosition.questionIndex}`);
    } else {
      // Fallback to estimated position
      if (completedExerciseCount === 0) {
        setCurrentStep('flashcards');
        setCurrentExercise('flashcards');
        setCurrentQuestionIndex(0);
      } else if (completedExerciseCount >= exerciseTypes.length) {
        setCurrentStep('completed');
      } else {
        // Resume from the next exercise
        const nextExercise = exerciseTypes[completedExerciseCount] as ExerciseStep;
        setCurrentStep(nextExercise);
        setCurrentExercise(nextExercise);
        setCurrentQuestionIndex(0);
        console.log(`Setting next exercise: ${nextExercise} (exerciseTypes[${completedExerciseCount}])`);
      }
      console.log(`Resuming to estimated position: exercise ${completedExerciseCount}`);
    }
    
    console.log(`Resuming lesson (progress: ${lessonProgress.total_score}/${lessonVocabulary.length * 5}, completed exercises: ${completedExerciseCount})`);
  };

  const saveResumePosition = async (exercise: string, questionIndex: number) => {
    try {
      const resumeData = {
        exercise: exercise,
        questionIndex: questionIndex,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(`lesson_resume_${lessonId}`, JSON.stringify(resumeData));
      console.log(`Resume position saved: ${exercise} at question ${questionIndex}`);
    } catch (error) {
      console.error('Error saving resume position:', error);
    }
  };

  // Memoized progress update functions to prevent infinite loops
  const handleFlashcardsProgressUpdate = useCallback((questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex);
    saveResumePosition('flashcards', questionIndex);
  }, []);

  const handleFlashcardQuizProgressUpdate = useCallback((questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex);
    saveResumePosition('flashcard-quiz', questionIndex);
  }, []);

  const handleSentenceScrambleProgressUpdate = useCallback((questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex);
    saveResumePosition('sentence-scramble', questionIndex);
  }, []);

  const handleWordScrambleProgressUpdate = useCallback((questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex);
    saveResumePosition('word-scramble', questionIndex);
  }, []);

  const handleFillInBlankProgressUpdate = useCallback((questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex);
    saveResumePosition('fill-in-blank', questionIndex);
  }, []);

  const loadResumePosition = async () => {
    try {
      const resumeData = await AsyncStorage.getItem(`lesson_resume_${lessonId}`);
      if (resumeData) {
        const parsed = JSON.parse(resumeData);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading resume position:', error);
    }
    return null;
  };

  const clearResumePosition = async () => {
    try {
      await AsyncStorage.removeItem(`lesson_resume_${lessonId}`);
      console.log('Resume position cleared');
    } catch (error) {
      console.error('Error clearing resume position:', error);
    }
  };

  const navigateToExercise = (exerciseType: ExerciseStep) => {
    // Initialize start time if not already set
    if (!startTime) {
      const now = new Date();
      setStartTime(now);
      
      // Initialize progress in database if user exists
      if (user) {
        LessonService.updateLessonProgress(lessonId, user.id, {
          started_at: now.toISOString(),
          completed_at: undefined
        }).catch(error => {
          console.error('Error initializing lesson progress:', error);
        });
      }
    }
    
    // Initialize active timing if not already active
    if (!isActive) {
      setIsActive(true);
      const now = new Date();
      sessionStartTimeRef.current = now;
      setSessionStartTime(now);
      console.log('🕐 Started lesson timing');
    }
    
    // Set current exercise tracking
    setCurrentExercise(exerciseType);
    setCurrentQuestionIndex(0);
    
    // Navigate to the selected exercise
    setCurrentStep(exerciseType);
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

    // Set transitioning flag to prevent resume position loading
    setIsTransitioning(true);
    
    // Reset question index for next exercise
    setCurrentQuestionIndex(0);
    console.log(`🔄 Reset question index to 0 after completing ${exerciseType}`);

    // Clear resume position to prevent carrying over question index to next exercise
    await clearResumePosition();
    console.log(`🧹 Cleared resume position after completing ${exerciseType}`);

    // Update progress in database using new service
    try {
      const totalScore = Object.values({
        ...exerciseScores,
        [exerciseType]: score
      }).reduce((sum, s) => sum + s, 0);
      
      const accuracyPercentage = Math.round((score / maxScore) * 100);
      const timeSpentSeconds = 60; // Default 1 minute per exercise

      // Update lesson progress
      await ProgressTrackingService.updateLessonProgress({
        lessonId,
        totalScore: totalScore,
        maxPossibleScore: lessonVocabulary.length * 5,
        exercisesCompleted: completedExercises.size + 1,
        totalExercises: 5, // Total number of exercises
        timeSpentSeconds: timeSpentSeconds,
        status: completedExercises.size + 1 >= 5 ? 'completed' : 'in_progress',
      });

      console.log('✅ Lesson progress updated successfully');
    } catch (error) {
      console.error('❌ Error updating lesson progress:', error);
    }

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
        nextStep = 'fill-in-blank';
        break;
      case 'fill-in-blank':
        nextStep = 'completed';
        break;
      default:
        return;
    }

    // Move to next step
    setTimeout(() => {
      setCurrentStep(nextStep);
      setCurrentExercise(nextStep);
      setIsTransitioning(false); // Clear transitioning flag
      console.log(`🎯 Transitioning to ${nextStep} with question index 0`);
    }, 1000);
  };

  const handleLessonComplete = async () => {
    if (!user) return;

    // Calculate final active time
    let finalActiveTime = totalActiveTime;
    if (isActive && sessionStartTime) {
      const currentSessionTime = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
      finalActiveTime += currentSessionTime;
    }
    
    console.log(`⏱️ Lesson completion timing: totalActiveTime=${totalActiveTime}s, isActive=${isActive}, sessionStartTime=${sessionStartTime}, finalActiveTime=${finalActiveTime}s`);

    const totalScore = Object.values(exerciseScores).reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = lessonVocabulary.length * 5; // 5 exercises
    const accuracyPercentage = Math.round((totalScore / maxPossibleScore) * 100);

    // Stop active timing
    setIsActive(false);
    setSessionStartTime(null);

    // Clear resume position since lesson is completed
    await clearResumePosition();

    // Record lesson activity using new progress tracking service
    try {
      await ProgressTrackingService.recordLessonActivity({
        activityType: 'lesson',
        activityName: lesson?.title || 'Lesson',
        durationSeconds: finalActiveTime,
        score: totalScore,
        maxScore: maxPossibleScore,
        accuracyPercentage: accuracyPercentage,
        lessonId: lessonId,
      });

      logger.info(`Lesson activity recorded successfully - Active time: ${finalActiveTime}s`);

      // Award XP for completing the lesson
      try {
        const xpResult = await XPService.awardXP(
          user.id,
          'lesson',
          totalScore,
          maxPossibleScore,
          accuracyPercentage,
          lesson?.title || 'Lesson',
          finalActiveTime
        );
        
        if (xpResult) {
          logger.info(`XP awarded for lesson: ${xpResult.totalXP} XP`);
        }
      } catch (xpError) {
        logger.error('Error awarding XP for lesson:', xpError);
      }
    } catch (error) {
      logger.error('Error recording lesson activity:', error);
    }

    // Complete lesson (with error handling)
    try {
      await LessonService.completeLesson(lessonId, user.id, totalScore, maxPossibleScore, finalActiveTime);
    } catch (error) {
      logger.error('Error completing lesson:', error);
      // Continue without database completion tracking
    }
    
    Alert.alert(
      '🎉 Lesson Complete!',
      `Congratulations! You've completed "${lessonTitle || lesson?.title || 'this lesson'}" with a score of ${totalScore}/${maxPossibleScore}`,
      [
        {
          text: 'Back to Lessons',
          onPress: () => navigation.goBack()
        },
        {
          text: 'Redo Lesson',
          onPress: () => redoLesson()
        }
      ]
    );
  };

  const redoLesson = async () => {
    if (!user) return;
    
    // Clear resume position for fresh start
    await clearResumePosition();
    
    // Reset all state for a fresh start
    const now = new Date();
    setStartTime(now);
    setCurrentStep('flashcards'); // Go directly to first exercise
    setCurrentExercise('flashcards');
    setCurrentQuestionIndex(0);
    
    setExerciseScores({
      flashcards: 0,
      flashcardQuiz: 0,
      sentenceScramble: 0,
      wordScramble: 0,
      fillInBlank: 0
    });
    setCompletedExercises(new Set());
    
    // Reset progress in database
    try {
      const maxPossibleScore = lessonVocabulary.length * 5; // 5 points per word across all exercises
      await LessonService.updateLessonProgress(lessonId, user.id, {
        started_at: now.toISOString(),
        completed_at: undefined,
        total_score: 0,
        max_possible_score: maxPossibleScore,
        time_spent_seconds: 0
      });
      
      // Update local progress state
      setLessonProgress(prev => prev ? {
        ...prev,
        started_at: now.toISOString(),
        completed_at: undefined,
        total_score: 0,
        max_possible_score: maxPossibleScore,
        time_spent_seconds: 0
      } : null);
    } catch (error) {
      console.error('Error resetting lesson progress:', error);
      // Continue without database progress tracking
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  // Debug logging
  console.log(`Current step: ${currentStep}, Current exercise: ${currentExercise}, Question index: ${currentQuestionIndex}`);

  // Render flow preview screen
  if (currentStep === 'flow-preview') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
                     <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
             <Ionicons name="arrow-back" size={24} color="#6366f1" />
           </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Flow</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.flowContainer}>
            <View style={styles.flowHeader}>
              <Text style={styles.flowTitle}>Ready to Start?</Text>
              <Text style={styles.flowSubtitle}>
                Here's what you'll be doing in this lesson
              </Text>
              
              {/* Progress indicator for in-progress lessons */}
              {lessonProgress && !lessonProgress.completed_at && (
                <View style={styles.progressBox}>
                  <View style={styles.progressBoxIcon}>
                    <Ionicons name="analytics" size={32} color="#6366f1" />
                  </View>
                  <View style={styles.progressBoxInfo}>
                    <Text style={styles.progressBoxTitle}>Progress</Text>
                    <Text style={styles.progressBoxDescription}>
                      {lessonProgress.total_score > 0 ? 
                        `${lessonProgress.total_score}/${lessonVocabulary.length * 5} points earned` :
                        'Lesson started - Ready to continue'
                      }
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${lessonProgress.total_score > 0 ? (lessonProgress.total_score / (lessonVocabulary.length * 5)) * 100 : 0}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressBoxDuration}>
                      {lessonProgress.total_score > 0 ? 
                        `${Math.floor(lessonProgress.total_score / lessonVocabulary.length)} of 5 exercises completed` :
                        'Click "Resume Lesson" to continue where you left off'
                      }
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.exerciseFlow}>
              {/* Exercise 1: Flashcards */}
              <TouchableOpacity 
                style={styles.flowExercise}
                onPress={() => navigateToExercise('flashcards')}
                activeOpacity={0.7}
              >
                <View style={styles.flowExerciseNumber}>
                  <Text style={styles.flowExerciseNumberText}>1</Text>
                </View>
                <View style={styles.flowExerciseContent}>
                  <View style={styles.flowExerciseIcon}>
                    <Ionicons name="card" size={32} color="#6366f1" />
                  </View>
                  <View style={styles.flowExerciseInfo}>
                    <Text style={styles.flowExerciseTitle}>Flashcards</Text>
                    <Text style={styles.flowExerciseDescription}>
                      Review all {lessonVocabulary.length} vocabulary terms with definitions, translations, and examples
                    </Text>
                    <Text style={styles.flowExerciseDuration}>~2-3 minutes</Text>
                  </View>
                  <View style={styles.flowExerciseArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Exercise 2: Flashcard Quiz */}
              <TouchableOpacity 
                style={styles.flowExercise}
                onPress={() => navigateToExercise('flashcard-quiz')}
                activeOpacity={0.7}
              >
                <View style={styles.flowExerciseNumber}>
                  <Text style={styles.flowExerciseNumberText}>2</Text>
                </View>
                <View style={styles.flowExerciseContent}>
                  <View style={styles.flowExerciseIcon}>
                    <Ionicons name="help-circle" size={32} color="#6366f1" />
                  </View>
                  <View style={styles.flowExerciseInfo}>
                    <Text style={styles.flowExerciseTitle}>Flashcard Quiz</Text>
                    <Text style={styles.flowExerciseDescription}>
                      Test your knowledge with multiple choice questions about definitions and translations
                    </Text>
                    <Text style={styles.flowExerciseDuration}>~3-4 minutes</Text>
                  </View>
                  <View style={styles.flowExerciseArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Exercise 3: Sentence Scramble */}
              <TouchableOpacity 
                style={styles.flowExercise}
                onPress={() => navigateToExercise('sentence-scramble')}
                activeOpacity={0.7}
              >
                <View style={styles.flowExerciseNumber}>
                  <Text style={styles.flowExerciseNumberText}>3</Text>
                </View>
                <View style={styles.flowExerciseContent}>
                  <View style={styles.flowExerciseIcon}>
                    <Ionicons name="text" size={32} color="#6366f1" />
                  </View>
                  <View style={styles.flowExerciseInfo}>
                    <Text style={styles.flowExerciseTitle}>Sentence Scramble</Text>
                    <Text style={styles.flowExerciseDescription}>
                      Unscramble example sentences to practice vocabulary in context
                    </Text>
                    <Text style={styles.flowExerciseDuration}>~2-3 minutes</Text>
                  </View>
                  <View style={styles.flowExerciseArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Exercise 4: Word Scramble */}
              <TouchableOpacity 
                style={styles.flowExercise}
                onPress={() => navigateToExercise('word-scramble')}
                activeOpacity={0.7}
              >
                <View style={styles.flowExerciseNumber}>
                  <Text style={styles.flowExerciseNumberText}>4</Text>
                </View>
                <View style={styles.flowExerciseContent}>
                  <View style={styles.flowExerciseIcon}>
                    <Ionicons name="grid" size={32} color="#6366f1" />
                  </View>
                  <View style={styles.flowExerciseInfo}>
                    <Text style={styles.flowExerciseTitle}>Word Scramble</Text>
                    <Text style={styles.flowExerciseDescription}>
                      Unscramble vocabulary words using definitions as hints
                    </Text>
                    <Text style={styles.flowExerciseDuration}>~2-3 minutes</Text>
                  </View>
                  <View style={styles.flowExerciseArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Exercise 5: Fill in the Blank */}
              <TouchableOpacity 
                style={styles.flowExercise}
                onPress={() => navigateToExercise('fill-in-blank')}
                activeOpacity={0.7}
              >
                <View style={styles.flowExerciseNumber}>
                  <Text style={styles.flowExerciseNumberText}>5</Text>
                </View>
                <View style={styles.flowExerciseContent}>
                  <View style={styles.flowExerciseIcon}>
                    <Ionicons name="create" size={32} color="#6366f1" />
                  </View>
                  <View style={styles.flowExerciseInfo}>
                    <Text style={styles.flowExerciseTitle}>Fill in the Blank</Text>
                    <Text style={styles.flowExerciseDescription}>
                      Complete example sentences by typing the missing vocabulary words
                    </Text>
                    <Text style={styles.flowExerciseDuration}>~3-4 minutes</Text>
                  </View>
                  <View style={styles.flowExerciseArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.flowActions}>
              {lessonProgress && !lessonProgress.completed_at ? (
                <View style={styles.inProgressActions}>
                  <TouchableOpacity 
                    style={styles.resumeButton} 
                    onPress={resumeLesson}
                  >
                    <Ionicons name="play" size={20} color="#ffffff" />
                    <Text style={styles.resumeButtonText}>Resume Lesson</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.restartButton} 
                    onPress={startNewLesson}
                  >
                    <Ionicons name="refresh" size={20} color="#6366f1" />
                    <Text style={styles.restartButtonText}>Restart Lesson</Text>
                  </TouchableOpacity>
                </View>
              ) : lessonProgress && lessonProgress.completed_at ? (
                <TouchableOpacity 
                  style={styles.redoButton} 
                  onPress={redoLesson}
                >
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                  <Text style={styles.redoButtonText}>Redo Lesson</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.startFlowButton} 
                  onPress={startNewLesson}
                >
                  <Ionicons name="play" size={20} color="#ffffff" />
                  <Text style={styles.startFlowButtonText}>Start Lesson</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  if (currentStep === 'flashcards') {
    return (
      <LessonFlashcards
        vocabulary={lessonVocabulary}
        onComplete={(score) => handleExerciseComplete('flashcards', score, lessonVocabulary.length)}
        onClose={() => {
          console.log('Flashcards close button pressed');
          navigation.goBack();
        }}
        onProgressUpdate={handleFlashcardsProgressUpdate}
        initialQuestionIndex={0}
      />
    );
  }

  if (currentStep === 'flashcard-quiz') {
    return (
      <LessonFlashcardQuiz
        vocabulary={lessonVocabulary}
        onComplete={(score) => {
          handleExerciseComplete('flashcard-quiz', score, lessonVocabulary.length);
          navigateToExercise('sentence-scramble');
        }}
        onClose={() => {
          console.log('Flashcard quiz close button pressed');
          navigation.goBack();
        }}
        onProgressUpdate={handleFlashcardQuizProgressUpdate}
        initialQuestionIndex={0}
      />
    );
  }

  if (currentStep === 'sentence-scramble') {
    return (
      <LessonSentenceScramble
        vocabulary={lessonVocabulary}
        onComplete={(score) => {
          handleExerciseComplete('sentence-scramble', score, lessonVocabulary.length);
          navigateToExercise('word-scramble');
        }}
        onClose={() => {
          console.log('Sentence scramble close button pressed');
          navigation.goBack();
        }}
        onProgressUpdate={handleSentenceScrambleProgressUpdate}
        initialQuestionIndex={0}
      />
    );
  }

  if (currentStep === 'word-scramble') {
    return (
      <LessonWordScramble
        vocabulary={lessonVocabulary}
        onComplete={(score) => {
          handleExerciseComplete('word-scramble', score, lessonVocabulary.length);
          navigateToExercise('fill-in-blank');
        }}
        onClose={() => {
          console.log('Word scramble close button pressed');
          navigation.goBack();
        }}
        onProgressUpdate={handleWordScrambleProgressUpdate}
        initialQuestionIndex={0}
      />
    );
  }

  if (currentStep === 'fill-in-blank') {
    return (
      <LessonFillInTheBlank
        vocabulary={lessonVocabulary}
        onComplete={(score) => handleExerciseComplete('fill-in-blank', score, lessonVocabulary.length)}
        onClose={() => {
          console.log('Fill in the blank close button pressed');
          navigation.goBack();
        }}
        onProgressUpdate={handleFillInBlankProgressUpdate}
        initialQuestionIndex={0}
      />
    );
  }

  if (currentStep === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lesson Complete</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.completionContainer}>
          <View style={styles.completionContent}>
            <Ionicons name="trophy" size={80} color="#fbbf24" />
            <Text style={styles.completionTitle}>🎉 Lesson Complete!</Text>
            <Text style={styles.completionSubtitle}>{lessonTitle || lesson?.title || 'Lesson Complete'}</Text>
            
            <View style={styles.scoreSummary}>
              <Text style={styles.scoreText}>
                Total Score: {Object.values(exerciseScores).reduce((sum, score) => sum + score, 0)}/{lessonVocabulary.length * 5}
              </Text>
            </View>

            <View style={styles.completionActions}>
              <TouchableOpacity style={styles.completionRedoButton} onPress={redoLesson}>
                <Ionicons name="refresh" size={20} color="#6366f1" />
                <Text style={styles.completionRedoButtonText}>Redo Lesson</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.completionButton} onPress={handleLessonComplete}>
                <Text style={styles.completionButtonText}>Finish Lesson</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
    paddingVertical: 20,
    paddingTop: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
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
  redoButton: {
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
  redoButtonText: {
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
    backgroundColor: '#f8fafc',
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
  completionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  completionRedoButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  completionRedoButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completionButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  completionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Flow preview styles
  flowContainer: {
    padding: 20,
  },
  flowHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  flowTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  flowSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  exerciseFlow: {
    gap: 20,
    marginBottom: 32,
  },
  flowExercise: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  flowExerciseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flowExerciseNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  flowExerciseContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flowExerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flowExerciseInfo: {
    flex: 1,
  },
  flowExerciseTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  flowExerciseDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  flowExerciseDuration: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  flowExerciseArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  flowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  skipFlowButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  skipFlowButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  startFlowButton: {
    flex: 2,
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
  startFlowButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Progress box styles - clean and purposeful
  progressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressBoxIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressBoxInfo: {
    flex: 1,
  },
  progressBoxTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  progressBoxDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressBoxDuration: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
    marginTop: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  // In-progress actions styles
  inProgressActions: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  restartButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#6366f1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  restartButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flexShrink: 0,
  },
});
