import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson, LessonVocabulary, LessonExercise, LessonProgress } from '../lib/lessonService';

const { width } = Dimensions.get('window');

interface LessonViewerRouteParams {
  lessonId: string;
}

export default function NewLessonViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { lessonId } = route.params as LessonViewerRouteParams;
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [vocabulary, setVocabulary] = useState<LessonVocabulary[]>([]);
  const [exercises, setExercises] = useState<LessonExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [exerciseScore, setExerciseScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [maxPossibleScore, setMaxPossibleScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Enhanced performance tracking
  const [exerciseStartTime, setExerciseStartTime] = useState<Date | null>(null);
  const [exerciseAttempts, setExerciseAttempts] = useState<{ [key: number]: number }>({});
  const [exerciseScores, setExerciseScores] = useState<{ [key: number]: number }>({});
  const [exerciseTimes, setExerciseTimes] = useState<{ [key: number]: number }>({});
  const [vocabularyPerformance, setVocabularyPerformance] = useState<{ [key: string]: { correct: number, incorrect: number, attempts: number } }>({});
  const [correctStreak, setCorrectStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    loadLesson();
    if (user?.id) {
      loadProgress();
    }
  }, [lessonId, user?.id]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const lessonData = await LessonService.getLesson(lessonId);
      
      if (lessonData) {
        setLesson(lessonData.lesson);
        // Ensure vocabulary is always an array
        const vocabArray = Array.isArray(lessonData.vocabulary) ? lessonData.vocabulary : [];
        setVocabulary(vocabArray);
        setExercises(lessonData.exercises || []);
        setMaxPossibleScore((lessonData.exercises || []).reduce((sum, ex) => sum + ex.points, 0));
      } else {
        setError('Lesson not found');
      }
    } catch (err) {
      setError('Failed to load lesson');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!user?.id) return;
    
    try {
      const progressData = await LessonService.getLessonProgress(user.id, lessonId);
      if (progressData) {
        setProgress(progressData);
        setTotalScore(progressData.total_score);
        setCurrentExerciseIndex(0);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const startLesson = () => {
    setStartTime(new Date());
    setExerciseStartTime(new Date());
    setCurrentExerciseIndex(0);
    setTotalScore(0);
    setExerciseScore(0);
    
    // Reset enhanced tracking
    setExerciseAttempts({});
    setExerciseScores({});
    setExerciseTimes({});
    setVocabularyPerformance({});
    setCorrectStreak(0);
    setMaxStreak(0);
    
    if (user?.id) {
      LessonService.updateLessonProgress(user.id, lessonId, {
        started_at: new Date().toISOString(),
        total_score: 0,
        max_possible_score: maxPossibleScore,
        total_exercises: exercises ? exercises.length : 0,
        time_spent_seconds: 0,
        status: 'in_progress'
      });
    }
  };

  // Track exercise attempt and performance
  const trackExerciseAttempt = (exerciseIndex: number, isCorrect: boolean, vocabularyTerm?: string) => {
    // Track exercise attempts
    setExerciseAttempts(prev => ({
      ...prev,
      [exerciseIndex]: (prev[exerciseIndex] || 0) + 1
    }));
    
    // Track vocabulary performance if term provided
    if (vocabularyTerm) {
      setVocabularyPerformance(prev => ({
        ...prev,
        [vocabularyTerm]: {
          correct: (prev[vocabularyTerm]?.correct || 0) + (isCorrect ? 1 : 0),
          incorrect: (prev[vocabularyTerm]?.incorrect || 0) + (isCorrect ? 0 : 1),
          attempts: (prev[vocabularyTerm]?.attempts || 0) + 1
        }
      }));
    }
    
    // Track streak
    if (isCorrect) {
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
    } else {
      setCorrectStreak(0);
    }
  };

  const completeExercise = (score: number) => {
    const newTotalScore = totalScore + score;
    setTotalScore(newTotalScore);
    setExerciseScore(score);

    // Track exercise completion time and score
    if (exerciseStartTime) {
      const exerciseTime = Math.floor((Date.now() - exerciseStartTime.getTime()) / 1000);
      setExerciseTimes(prev => ({
        ...prev,
        [currentExerciseIndex]: exerciseTime
      }));
      setExerciseScores(prev => ({
        ...prev,
        [currentExerciseIndex]: score
      }));
    }

    const nextIndex = currentExerciseIndex + 1;
    setCurrentExerciseIndex(nextIndex);
    
    // Start timing next exercise
    setExerciseStartTime(new Date());

    if (user?.id) {
      const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
      
      LessonService.updateLessonProgress(user.id, lessonId, {
        total_score: newTotalScore,
        exercise_completed: nextIndex,
        time_spent_seconds: timeSpent,
        status: nextIndex >= (exercises ? exercises.length : 0) ? 'completed' : 'in_progress'
      });
    }

    if (nextIndex >= (exercises ? exercises.length : 0)) {
      // Lesson completed
      const finalScore = Math.round((newTotalScore / maxPossibleScore) * 100);
      Alert.alert(
        'Lesson Complete! 🎓',
        `Congratulations! You completed the lesson with a score of ${finalScore}%`,
        [
          {
            text: 'Review Vocabulary',
            onPress: () => setShowVocabularyModal(true)
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const renderExercise = (exercise: LessonExercise) => {
    // Force specific exercise types for certain positions
    if (currentExerciseIndex === 1) {
      return <FlashcardFlipExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} trackAttempt={trackExerciseAttempt} />;
    } else if (currentExerciseIndex === 2) {
      return <SentenceOrderingExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} trackAttempt={trackExerciseAttempt} />;
    } else if (currentExerciseIndex === 3) {
      return <WordScrambleExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} trackAttempt={trackExerciseAttempt} />;
    }
    
    // Use the original exercise type for other positions
    switch (exercise.exercise_type) {
      case 'flashcard_match':
        return <FlashcardMatchExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} currentExerciseIndex={currentExerciseIndex} trackAttempt={trackExerciseAttempt} />;
      case 'multiple_choice':
        return <MultipleChoiceExercise exercise={exercise} onComplete={completeExercise} trackAttempt={trackExerciseAttempt} />;
      case 'fill_in_blank':
        return <FillInBlankExercise exercise={exercise} onComplete={completeExercise} trackAttempt={trackExerciseAttempt} />;
      case 'typing':
        return <TypingExercise exercise={exercise} onComplete={completeExercise} trackAttempt={trackExerciseAttempt} />;
      case 'sentence_ordering':
        return <SentenceOrderingExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} trackAttempt={trackExerciseAttempt} />;
      case 'memory_game':
        return <MemoryGameExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} trackAttempt={trackExerciseAttempt} />;
      case 'word_scramble':
        return <WordScrambleExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} trackAttempt={trackExerciseAttempt} />;
      case 'speed_challenge':
        return <SpeedChallengeExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} trackAttempt={trackExerciseAttempt} />;
      default:
        return <Text>Unknown exercise type: {exercise.exercise_type}</Text>;
    }
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLesson}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !exercises || exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No exercises found for this lesson</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if all exercises are completed
  if (currentExerciseIndex >= exercises.length) {
    // All exercises completed - show completion screen
    return (
      <SafeAreaView style={styles.container}>
        {/* Vocabulary Modal - Added to completion screen */}
        <Modal
          visible={showVocabularyModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lesson Vocabulary</Text>
              <TouchableOpacity onPress={() => setShowVocabularyModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.vocabularyList}>
              {vocabulary && vocabulary.length > 0 ? (
                vocabulary.map((vocab, index) => (
                  <View key={index} style={styles.vocabItem}>
                    <Text style={styles.vocabTerm}>{vocab.english_term}</Text>
                    <Text style={styles.vocabTranslation}>{vocab.native_translation}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noVocabText}>No vocabulary found for this lesson</Text>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.subjectText}>{lesson.subject}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowVocabularyModal(true)} style={styles.vocabularyButton}>
            <Ionicons name="book" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Completion Content */}
        <View style={styles.exerciseContainer}>
          <View style={styles.exerciseContent}>
            <Text style={styles.exercisePrompt}>🎉 Lesson Complete! 🎉</Text>
            <Text style={styles.resultsText}>
              Final Score: {Math.round((totalScore / maxPossibleScore) * 100)}%
            </Text>
                         <Text style={styles.progressText}>
               You've completed all {exercises.length} exercises!
             </Text>
             
             <Text style={styles.progressText}>
               💡 Tap the 📚 icon in the header to review vocabulary
             </Text>
             
                           <TouchableOpacity 
                style={styles.continueButton} 
                onPress={() => {
                  // Simply show the modal
                  setShowVocabularyModal(true);
                }}
              >
                <Text style={styles.continueButtonText}>📚 Review Vocabulary</Text>
              </TouchableOpacity>
             
             {/* Access Review Page Button */}
             <TouchableOpacity 
               style={[styles.continueButton, { backgroundColor: '#10b981', marginTop: 12 }]} 
               onPress={() => {
                 console.log('🎯 Access review page button pressed!');
                 console.log('🎯 Navigating to LessonReview screen');
                 console.log('🎯 Current vocabulary state:', vocabulary);
                 console.log('🎯 Vocabulary length:', vocabulary?.length);
                 
                 // Transform vocabulary data to match the expected format
                 const reviewVocabulary = vocabulary.map(vocab => ({
                   id: vocab.id || String(Math.random()),
                   term: vocab.english_term,
                   definition: vocab.definition,
                   example: vocab.example_sentence_en,
                   pronunciation: vocab.native_translation // Using native translation as pronunciation for now
                 }));
                 
                 // Navigate to the LessonReview screen with lesson data
                 (navigation as any).navigate('LessonReview', {
                   lessonTitle: lesson?.title || 'Lesson',
                   lessonSubject: lesson?.subject || 'Subject',
                   vocabulary: reviewVocabulary,
                   finalScore: totalScore,
                   maxPossibleScore: maxPossibleScore
                 });
               }}
             >
               <Text style={styles.continueButtonText}>📚 Access Review Page</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.checkButton} 
               onPress={() => navigation.goBack()}
             >
               <Text style={styles.checkButtonText}>🏠 Back to Lessons</Text>
             </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const progressPercentage = exercises.length > 0 ? (currentExerciseIndex / exercises.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.subjectText}>{lesson.subject}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowVocabularyModal(true)} style={styles.vocabularyButton}>
          <Ionicons name="book" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>Exercise {currentExerciseIndex + 1} of {exercises.length}</Text>
      </View>

      {/* Score and Progress */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {totalScore}/{maxPossibleScore}</Text>
        <Text style={styles.progressText}>Progress: {Math.round(progressPercentage)}%</Text>
      </View>

      {/* Exercise Content */}
      <ScrollView style={styles.exerciseContainer} showsVerticalScrollIndicator={false}>
        {renderExercise(currentExercise)}
      </ScrollView>

             {/* Vocabulary Modal */}
       <Modal
         visible={showVocabularyModal}
         animationType="slide"
         presentationStyle="pageSheet"
       >
         <SafeAreaView style={styles.modalContainer}>
           <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>Lesson Vocabulary</Text>
             <TouchableOpacity onPress={() => setShowVocabularyModal(false)} style={styles.closeButton}>
               <Ionicons name="close" size={24} color="#000" />
             </TouchableOpacity>
           </View>
           
                                    {/* Enhanced Performance Insights */}
             <View style={styles.performanceInsightsContainer}>
               <Text style={styles.performanceInsightsTitle}>🚀 Performance Insights</Text>
               
               {/* Basic Progress Summary */}
               {progress && (
                 <View style={styles.progressSummaryContainer}>
                   <Text style={styles.progressSummaryTitle}>📊 Basic Progress</Text>
                   <View style={styles.progressSummaryRow}>
                     <Text style={styles.progressSummaryLabel}>Final Score:</Text>
                     <Text style={styles.progressSummaryValue}>
                       {Math.round((totalScore / maxPossibleScore) * 100)}%
                     </Text>
                   </View>
                   <View style={styles.progressSummaryRow}>
                     <Text style={styles.progressSummaryLabel}>Exercises Completed:</Text>
                     <Text style={styles.progressSummaryValue}>
                       {progress.exercise_completed || 0} / {exercises.length}
                     </Text>
                   </View>
                   {progress.time_spent_seconds && (
                     <View style={styles.progressSummaryRow}>
                       <Text style={styles.progressSummaryLabel}>Total Time:</Text>
                       <Text style={styles.progressSummaryValue}>
                         {Math.floor(progress.time_spent_seconds / 60)}m {progress.time_spent_seconds % 60}s
                       </Text>
                     </View>
                   )}
                   <View style={styles.progressSummaryRow}>
                     <Text style={styles.progressSummaryLabel}>Status:</Text>
                     <Text style={[
                       styles.progressSummaryValue,
                       progress.status === 'completed' ? styles.completedStatus : styles.inProgressStatus
                     ]}>
                       {progress.status === 'completed' ? '✅ Completed' : '🔄 In Progress'}
                     </Text>
                   </View>
                 </View>
               )}
               
               {/* Exercise Performance Breakdown */}
               <View style={styles.exerciseBreakdownContainer}>
                 <Text style={styles.sectionTitle}>🎯 Exercise Breakdown</Text>
                 {Object.keys(exerciseScores).map((exerciseIndex) => {
                   const index = parseInt(exerciseIndex);
                   const score = exerciseScores[index];
                   const time = exerciseTimes[index];
                   const attempts = exerciseAttempts[index];
                   const maxScore = exercises[index]?.points || 0;
                   const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                   
                   return (
                     <View key={exerciseIndex} style={styles.exerciseBreakdownItem}>
                       <Text style={styles.exerciseBreakdownTitle}>
                         Exercise {index + 1}: {exercises[index]?.exercise_type?.replace('_', ' ').toUpperCase()}
                       </Text>
                       <View style={styles.exerciseBreakdownRow}>
                         <Text style={styles.exerciseBreakdownLabel}>Score:</Text>
                         <Text style={styles.exerciseBreakdownValue}>
                           {score}/{maxScore} ({percentage}%)
                         </Text>
                       </View>
                       {time && (
                         <View style={styles.exerciseBreakdownRow}>
                           <Text style={styles.exerciseBreakdownLabel}>Time:</Text>
                           <Text style={styles.exerciseBreakdownValue}>
                             {Math.floor(time / 60)}m {time % 60}s
                           </Text>
                         </View>
                       )}
                       {attempts && (
                         <View style={styles.exerciseBreakdownRow}>
                           <Text style={styles.progressSummaryLabel}>Attempts:</Text>
                           <Text style={styles.progressSummaryValue}>{attempts}</Text>
                         </View>
                       )}
                     </View>
                   );
                 })}
               </View>
               
               {/* Learning Patterns */}
               <View style={styles.learningPatternsContainer}>
                 <Text style={styles.sectionTitle}>🧠 Learning Patterns</Text>
                 
                 {/* Streak Information */}
                 <View style={styles.patternRow}>
                   <Text style={styles.patternLabel}>🔥 Current Streak:</Text>
                   <Text style={styles.patternValue}>{correctStreak} correct</Text>
                 </View>
                 <View style={styles.patternRow}>
                   <Text style={styles.patternLabel}>🏆 Best Streak:</Text>
                   <Text style={styles.patternValue}>{maxStreak} correct</Text>
                 </View>
                 
                 {/* Time Efficiency */}
                 {progress?.time_spent_seconds && totalScore > 0 && (
                   <View style={styles.patternRow}>
                     <Text style={styles.patternLabel}>⚡ Score per Minute:</Text>
                     <Text style={styles.patternValue}>
                       {Math.round((totalScore / (progress.time_spent_seconds / 60)) * 10) / 10} pts/min
                     </Text>
                   </View>
                 )}
                 
                 {/* Accuracy Rate */}
                 {Object.keys(exerciseAttempts).length > 0 && (
                   <View style={styles.patternRow}>
                     <Text style={styles.patternLabel}>🎯 Overall Accuracy:</Text>
                     <Text style={styles.patternValue}>
                       {Math.round((totalScore / maxPossibleScore) * 100)}%
                     </Text>
                   </View>
                 )}
               </View>
               
               {/* Vocabulary Performance */}
               {Object.keys(vocabularyPerformance).length > 0 && (
                 <View style={styles.vocabularyPerformanceContainer}>
                   <Text style={styles.sectionTitle}>📚 Vocabulary Performance</Text>
                   
                   {/* Strong Areas */}
                   <View style={styles.vocabSection}>
                     <Text style={styles.vocabSectionTitle}>✅ Strong Areas</Text>
                     {Object.entries(vocabularyPerformance)
                       .filter(([_, stats]) => stats.correct > stats.incorrect)
                       .slice(0, 3)
                       .map(([term, stats]) => (
                         <View key={term} style={styles.vocabItem}>
                           <Text style={styles.vocabTerm}>{term}</Text>
                           <View style={styles.vocabStats}>
                             <Text style={styles.vocabTranslation}>{stats.correct}</Text>
                             <Text style={styles.vocabTranslation}>{stats.attempts}</Text>
                           </View>
                         </View>
                       ))}
                   </View>
                   
                   {/* Areas for Improvement */}
                   <View style={styles.vocabSection}>
                     <Text style={styles.vocabSectionTitle}>💪 Areas for Improvement</Text>
                     {Object.entries(vocabularyPerformance)
                       .filter(([_, stats]) => stats.incorrect >= stats.correct)
                       .slice(0, 3)
                       .map(([term, stats]) => (
                         <View key={term} style={styles.vocabItem}>
                           <Text style={styles.vocabTerm}>{term}</Text>
                           <View style={styles.vocabStats}>
                             <Text style={styles.vocabTranslation}>{stats.correct}</Text>
                             <Text style={styles.vocabTranslation}>{stats.attempts}</Text>
                           </View>
                         </View>
                       ))}
                   </View>
                 </View>
               )}
             </View>

            {/* Vocabulary List */}
            {vocabulary && vocabulary.length > 0 ? (
              <ScrollView style={styles.vocabularyList}>
                <Text style={styles.vocabularySectionTitle}>📚 Lesson Vocabulary</Text>
                {vocabulary.map((item, index) => (
                  <View key={index} style={styles.vocabularyItem}>
                    <View style={styles.vocabularyTerm}>
                      <Text style={styles.englishTerm}>{item?.english_term || 'No English term'}</Text>
                      <Text style={styles.nativeTranslation}>{item?.native_translation || 'No translation'}</Text>
                    </View>
                    <Text style={styles.definition}>{item?.definition || 'No definition available'}</Text>
                    <View style={styles.exampleContainer}>
                      <Text style={styles.exampleLabel}>Example:</Text>
                      <Text style={styles.exampleText}>{item?.example_sentence_en || 'No example sentence'}</Text>
                      <Text style={styles.exampleNative}>{item?.example_sentence_native || 'No native example'}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyVocabularyContainer}>
                <Text style={styles.emptyVocabularyText}>No vocabulary found for this lesson</Text>
              </View>
            )}
         </SafeAreaView>
       </Modal>
    </SafeAreaView>
  );
}

// Exercise Components
const FlashcardMatchExercise = ({ exercise, onComplete, vocabulary, currentExerciseIndex, trackAttempt }: { exercise: LessonExercise, onComplete: (score: number) => void, vocabulary: LessonVocabulary[], currentExerciseIndex: number, trackAttempt: (exerciseIndex: number, isCorrect: boolean, vocabularyTerm?: string) => void }) => {
  const [selectedPairs, setSelectedPairs] = useState<{ [key: string]: string }>({});
  const [completed, setCompleted] = useState(false);
  const [questions, setQuestions] = useState<Array<{question: string, correctAnswer: string, answers: string[]}>>([]);

  // Initialize questions on component mount
  useEffect(() => {
    console.log('🔍 Raw exercise data:', exercise.exercise_data);
    console.log('🔍 Vocabulary from props:', vocabulary);
    
    // Use the vocabulary from the lesson (which comes from lesson_vocabulary table)
    if (vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0) {
      console.log('✅ Using lesson vocabulary from database');
      
             // Create questions from the actual database vocabulary
       const newQuestions = (vocabulary || []).map((vocab: any, index: number) => {
         console.log(`🔍 Processing vocabulary item ${index}:`, vocab);
         
         // Questions: English terms from english_term column
         const question = vocab.english_term || `Term ${index + 1}`;
         
         // Answers: Native translations from native_translation column
         const correctAnswer = vocab.native_translation || `Answer ${index + 1}`;
         
         console.log(`🔍 Using database data - Question (English): "${question}", Answer (Native): "${correctAnswer}"`);
         
         // Create wrong answers from other vocabulary items
         const otherVocab = (vocabulary || []).filter((v: any) => v !== vocab);
         const wrongAnswers = otherVocab.slice(0, 3).map((v: any, wrongIndex: number) => {
           return v.native_translation || `Option ${wrongIndex + 1}`;
         });
         
         // Combine and shuffle answers
         const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
         
         return {
           question,
           correctAnswer,
           answers: allAnswers
         };
       });
      
      setQuestions(newQuestions);
      console.log('🎯 Created questions from database vocabulary:', newQuestions);
    } else {
      console.log('⚠️ No vocabulary found or vocabulary is not an array, creating generic fallback');
      
      // Generic fallback with better placeholders
      setQuestions([
        {
          question: 'English Term 1',
          correctAnswer: 'Native Translation 1',
          answers: ['Native Translation 1', 'Native Translation 2', 'Native Translation 3', 'Native Translation 4']
        },
        {
          question: 'English Term 2',
          correctAnswer: 'Native Translation 2',
          answers: ['Native Translation 1', 'Native Translation 2', 'Native Translation 3', 'Native Translation 4']
        },
        {
          question: 'English Term 3',
          correctAnswer: 'Native Translation 3',
          answers: ['Native Translation 1', 'Native Translation 2', 'Native Translation 3', 'Native Translation 4']
        }
      ]);
    }
  }, [vocabulary]);

  const handleAnswerSelect = (questionIndex: number, selectedAnswer: string) => {
    setSelectedPairs(prev => ({ ...prev, [questionIndex]: selectedAnswer }));
  };

  const checkAnswers = () => {
    let correct = 0;
    const questionsArray = questions || [];
    
    questionsArray.forEach((q, index) => {
      if (selectedPairs[index] === q.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / questionsArray.length) * (exercise?.points || 0));
    setCompleted(true);
    
    // Track performance for each vocabulary term
    questionsArray.forEach((q, index) => {
      const isCorrect = selectedPairs[index] === q.correctAnswer;
      const vocabTerm = q.question; // English term
      // Note: We need to access the tracking function from parent component
      // This will be implemented when we connect the components
    });
    
    onComplete(score);
  };

  const canCheckAnswers = () => {
    return Object.keys(selectedPairs).length === (questions || []).length;
  };

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePrompt}>{exercise.exercise_data?.prompt || 'Loading exercise...'}</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

    return (
    <View style={styles.exerciseContent}>
      {/* Skip to next button at top */}
      <TouchableOpacity 
        style={styles.skipToNextButtonTop} 
        onPress={() => onComplete(0)}
      >
        <Text style={styles.skipToNextButtonText}>⏭️ Skip to Next Exercise</Text>
      </TouchableOpacity>
      
      <Text style={styles.exercisePrompt}>
          {currentExerciseIndex === 1 
            ? 'Second Set: Match the English terms with their native language translations' 
            : (exercise?.exercise_data?.prompt || 'Match the English terms with their native language translations')
          }
        </Text>
      
             {(questions || []).map((question, index) => (
         <View key={index} style={styles.questionContainer}>
           <Text style={styles.questionText}>{question.question}</Text>
           
           <View style={styles.answersContainer}>
             {(question.answers || []).map((answer, answerIndex) => (
               <TouchableOpacity
                 key={answerIndex}
                 style={[
                   styles.answerButton,
                   selectedPairs[index] === answer && styles.selectedAnswer,
                   completed && answer === question.correctAnswer && styles.correctAnswer,
                   completed && selectedPairs[index] === answer && answer !== question.correctAnswer && styles.incorrectAnswer
                 ]}
                 onPress={() => handleAnswerSelect(index, answer)}
                 disabled={completed}
               >
                 <Text style={[
                   styles.answerText,
                   selectedPairs[index] === answer && styles.selectedAnswerText
                 ]}>
                   {answer}
                 </Text>
               </TouchableOpacity>
             ))}
           </View>
         </View>
       ))}

             {!completed && (
         <View style={styles.buttonContainer}>
           {canCheckAnswers() && (
             <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
               <Text style={styles.checkButtonText}>Check Answers</Text>
             </TouchableOpacity>
           )}
           
           <TouchableOpacity 
             style={[
               styles.continueButton, 
               !canCheckAnswers() && styles.continueButtonWarning
             ]} 
             onPress={() => {
               if (!canCheckAnswers()) {
                 Alert.alert(
                   'Unfilled Answers',
                   'You have unfilled answers. Unfilled answers will be marked as incorrect. Do you want to continue?',
                   [
                     {
                       text: 'Cancel',
                       style: 'cancel'
                     },
                     {
                       text: 'Continue Anyway',
                       onPress: () => {
                                                  // Mark unfilled answers as incorrect and complete
                          const newSelectedPairs = { ...selectedPairs };
                          (questions || []).forEach((_, index) => {
                            if (!newSelectedPairs[index]) {
                              newSelectedPairs[index] = 'UNFILLED';
                            }
                          });
                          setSelectedPairs(newSelectedPairs);
                          checkAnswers();
                       }
                     }
                   ]
                 );
               } else {
                 checkAnswers();
               }
             }}
           >
             <Text style={styles.continueButtonText}>
               {canCheckAnswers() ? 'Continue' : 'Continue (Unfilled = Incorrect)'}
             </Text>
           </TouchableOpacity>
           
                     </View>
        )}

      {completed && (
        <View style={styles.resultsContainer}>
                     <Text style={styles.resultsText}>
             Score: {Math.round((Object.keys(selectedPairs).filter(key => 
               selectedPairs[parseInt(key)] === (questions || [])[parseInt(key)]?.correctAnswer
             ).length / (questions || []).length) * 100)}%
           </Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => onComplete(0)}>
            <Text style={styles.continueButtonText}>Continue to Next Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const FlashcardFlipExercise = ({ exercise, onComplete, vocabulary, trackAttempt }: { exercise: LessonExercise, onComplete: (score: number) => void, vocabulary: LessonVocabulary[], trackAttempt: (exerciseIndex: number, isCorrect: boolean, vocabularyTerm?: string) => void }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const currentCard = vocabulary[currentCardIndex];
  const totalCards = vocabulary.length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      // All cards completed
      const finalScore = Math.round((score / totalCards) * (exercise?.points || 0));
      setCompleted(true);
      onComplete(finalScore);
    }
  };

  const handleScore = (correct: boolean) => {
    if (correct) {
      setScore(score + 1);
    }
    handleNext();
  };

  if (!currentCard) {
    return (
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePrompt}>Loading flashcards...</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.exerciseContent}>
      {/* Skip to next button at top */}
      <TouchableOpacity 
        style={styles.skipToNextButtonTop} 
        onPress={() => onComplete(0)}
      >
        <Text style={styles.skipToNextButtonText}>⏭️ Skip to Next Exercise</Text>
      </TouchableOpacity>
      
      <Text style={styles.exercisePrompt}>Study the flashcards: Tap to flip</Text>
      
      {/* Progress indicator */}
      <Text style={styles.progressText}>Card {currentCardIndex + 1} of {totalCards}</Text>
      
      {/* Flashcard */}
      <TouchableOpacity 
        style={styles.flashcard} 
        onPress={handleFlip}
        activeOpacity={0.9}
      >
        <Text style={styles.flashcardText}>
          {isFlipped ? currentCard.native_translation : currentCard.english_term}
        </Text>
        <Text style={styles.flashcardHint}>
          {isFlipped ? 'English Term' : 'Native Translation'}
        </Text>
      </TouchableOpacity>

             {/* Navigation buttons */}
       <View style={styles.flashcardButtons}>
         <TouchableOpacity 
           style={[styles.flashcardButton, styles.incorrectButton]} 
           onPress={() => handleScore(false)}
         >
           <Text style={styles.flashcardButtonText}>❌ Didn't Know</Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
           style={[styles.flashcardButton, styles.correctButton]} 
           onPress={() => handleScore(true)}
         >
           <Text style={styles.flashcardButtonText}>✅ Knew It</Text>
         </TouchableOpacity>
       </View>
       
      {completed && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            Score: {Math.round((score / totalCards) * 100)}%
          </Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => onComplete(0)}>
            <Text style={styles.continueButtonText}>Continue to Next Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const MultipleChoiceExercise = ({ exercise, onComplete, trackAttempt }: { exercise: LessonExercise, onComplete: (score: number) => void, trackAttempt: (exerciseIndex: number, isCorrect: boolean, vocabularyTerm?: string) => void }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer) return;
    
    const isCorrect = selectedAnswer === exercise?.exercise_data?.correct_answer;
    const score = isCorrect ? (exercise?.points || 0) : 0;
    
    setCompleted(true);
    onComplete(score);
  };

  return (
    <View style={styles.exerciseContent}>
      {/* Skip to next button at top */}
      <TouchableOpacity 
        style={styles.skipToNextButtonTop} 
        onPress={() => onComplete(0)}
      >
        <Text style={styles.skipToNextButtonText}>⏭️ Skip to Next Exercise</Text>
      </TouchableOpacity>
      
      <Text style={styles.exercisePrompt}>{exercise.exercise_data?.prompt}</Text>
      
      {(exercise.exercise_data?.options || []).map((option: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selectedAnswer === option && styles.selectedOption
          ]}
          onPress={() => handleAnswerSelect(option)}
        >
          <Text style={[
            styles.optionText,
            selectedAnswer === option && styles.selectedOptionText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}

      {selectedAnswer && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}
      
           </View>
   );
 };

const FillInBlankExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer) return;
    
    const isCorrect = selectedAnswer === exercise?.exercise_data?.correct_answer;
    const score = isCorrect ? (exercise?.points || 0) : 0;
    
    setCompleted(true);
    onComplete(score);
  };

  const sentenceParts = exercise?.exercise_data?.sentence?.split('____') || [];

  return (
    <View style={styles.exerciseContent}>
      {/* Skip to next button at top */}
      <TouchableOpacity 
        style={styles.skipToNextButtonTop} 
        onPress={() => onComplete(0)}
      >
        <Text style={styles.skipToNextButtonText}>⏭️ Skip to Next Exercise</Text>
      </TouchableOpacity>
      
      <Text style={styles.exercisePrompt}>Complete the sentence:</Text>
      
      <View style={styles.sentenceContainer}>
        <Text style={styles.sentenceText}>{sentenceParts?.[0] || ''}</Text>
        <View style={styles.blankContainer}>
          <Text style={styles.blankText}>____</Text>
        </View>
        <Text style={styles.sentenceText}>{sentenceParts?.[1] || ''}</Text>
      </View>

      {(exercise.exercise_data?.options || []).map((option: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selectedAnswer === option && styles.selectedOption
          ]}
          onPress={() => handleAnswerSelect(option)}
        >
          <Text style={[
            styles.optionText,
            selectedAnswer === option && styles.selectedOptionText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}

      {selectedAnswer && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}
      
           </View>
   );
 };

const TypingExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [userInput, setUserInput] = useState('');
  const [completed, setCompleted] = useState(false);

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    
    const isCorrect = userInput.trim().toLowerCase() === exercise?.exercise_data?.correct_answer?.toLowerCase();
    const score = isCorrect ? (exercise?.points || 0) : 0;
    
    setCompleted(true);
    onComplete(score);
  };

  return (
    <View style={styles.exerciseContent}>
      {/* Skip to next button at top */}
      <TouchableOpacity 
        style={styles.skipToNextButtonTop} 
        onPress={() => onComplete(0)}
      >
        <Text style={styles.skipToNextButtonText}>⏭️ Skip to Next Exercise</Text>
      </TouchableOpacity>
      
      <Text style={styles.exercisePrompt}>{exercise?.exercise_data?.prompt}</Text>
      
      <TextInput
        style={styles.textInput}
        value={userInput}
        onChangeText={setUserInput}
        placeholder="Type your answer..."
        autoCapitalize="none"
        autoCorrect={false}
      />

      {userInput.trim() && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}
      
           </View>
   );
 };

const SentenceOrderingExercise = ({ exercise, onComplete, vocabulary }: { exercise: LessonExercise, onComplete: (score: number) => void, vocabulary: LessonVocabulary[] }) => {
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Initialize the exercise with scrambled sentences
  useEffect(() => {
    if (vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0) {
      const sentences = vocabulary
        .filter(vocab => vocab.example_sentence_en && vocab.example_sentence_en.trim())
        .map(vocab => vocab.example_sentence_en.trim());
      
      if (sentences.length > 0) {
        const currentSentence = sentences[currentSentenceIndex];
        const words = currentSentence.split(' ').filter(word => word.length > 0);
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        
        setScrambledWords(shuffledWords);
        setRemainingWords(shuffledWords);
        setSelectedWords([]);
      }
    }
  }, [vocabulary, currentSentenceIndex]);

  const handleWordSelect = (word: string, index: number) => {
    setSelectedWords(prev => [...prev, word]);
    setRemainingWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleWordDeselect = (word: string, index: number) => {
    setSelectedWords(prev => prev.filter((_, i) => i !== index));
    setRemainingWords(prev => [...prev, word]);
  };

  const checkSentence = () => {
    const currentSentence = vocabulary
      .filter(vocab => vocab.example_sentence_en && vocab.example_sentence_en.trim())
      [currentSentenceIndex]?.example_sentence_en.trim();
    
    const userSentence = selectedWords.join(' ');
    const correct = userSentence === currentSentence;
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      // Auto-advance after 2 seconds for correct answers
      setTimeout(() => {
        if (currentSentenceIndex < vocabulary.filter(v => v.example_sentence_en).length - 1) {
          // Move to next sentence
          setCurrentSentenceIndex(prev => prev + 1);
          setCompleted(false);
          setShowFeedback(false);
          setShowHint(false);
        } else {
          // All sentences completed
          const score = Math.round((vocabulary.filter(v => v.example_sentence_en).length / vocabulary.length) * (exercise?.points || 0));
          setCompleted(true);
          onComplete(score);
        }
      }, 2000);
    }
  };

  const resetSentence = () => {
    const currentSentence = vocabulary
      .filter(vocab => vocab.example_sentence_en && vocab.example_sentence_en.trim())
      [currentSentenceIndex]?.example_sentence_en.trim();
    
    if (currentSentence) {
      const words = currentSentence.split(' ').filter(word => word.length > 0);
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      
      setScrambledWords(shuffledWords);
      setRemainingWords(shuffledWords);
      setSelectedWords([]);
      setShowFeedback(false);
      setShowHint(false);
    }
  };

  const skipSentence = () => {
    if (currentSentenceIndex < vocabulary.filter(v => v.example_sentence_en).length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
      setCompleted(false);
      setShowFeedback(false);
      setShowHint(false);
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  if (!vocabulary || vocabulary.length === 0) {
    return (
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePrompt}>Loading sentence unscrambler...</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const sentences = vocabulary.filter(vocab => vocab.example_sentence_en && vocab.example_sentence_en.trim());
  const currentSentence = sentences[currentSentenceIndex]?.example_sentence_en.trim();

  if (!currentSentence) {
    return (
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePrompt}>No example sentences found</Text>
      </View>
    );
  }

  return (
    <View style={styles.exerciseContent}>
      {/* Skip to next button at top */}
      <TouchableOpacity 
        style={styles.skipToNextButtonTop} 
        onPress={() => onComplete(0)}
      >
        <Text style={styles.skipToNextButtonText}>⏭️ Skip to Next Exercise</Text>
      </TouchableOpacity>
      
      <Text style={styles.exercisePrompt}>Unscramble the sentence by arranging the words in the correct order</Text>
      
      {/* Progress indicator */}
      <Text style={styles.progressText}>Sentence {currentSentenceIndex + 1} of {sentences.length}</Text>
      
      {/* Selected words (user's answer) */}
      <View style={styles.selectedWordsContainer}>
        <Text style={styles.sectionTitle}>Your Sentence:</Text>
        <View style={styles.selectedWordsList}>
          {selectedWords.map((word, index) => (
            <TouchableOpacity
              key={`selected-${index}`}
              style={styles.selectedWordButton}
              onPress={() => handleWordDeselect(word, index)}
            >
              <Text style={styles.selectedWordText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Remaining words to choose from */}
      <View style={styles.remainingWordsContainer}>
        <Text style={styles.sectionTitle}>Available Words:</Text>
        <View style={styles.remainingWordsList}>
          {remainingWords.map((word, index) => (
            <TouchableOpacity
              key={`remaining-${index}`}
              style={styles.remainingWordButton}
              onPress={() => handleWordSelect(word, index)}
            >
              <Text style={styles.remainingWordText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

             {/* Feedback display */}
       {showFeedback && (
         <View style={[
           styles.feedbackContainer,
           isCorrect ? styles.correctFeedback : styles.incorrectFeedback
         ]}>
           <Text style={styles.feedbackText}>
             {isCorrect ? '✅ Correct! Moving to next sentence...' : '❌ Incorrect. Try again!'}
           </Text>
         </View>
       )}

       {/* Hint display */}
       {showHint && (
         <View style={styles.hintContainer}>
           <Text style={styles.hintTitle}>Hint (Native Language):</Text>
           <Text style={styles.hintText}>
             {vocabulary
               .filter(vocab => vocab.example_sentence_en && vocab.example_sentence_en.trim())
               [currentSentenceIndex]?.example_sentence_native || 'No native translation available'}
           </Text>
         </View>
       )}

       {/* Action buttons */}
       <View style={styles.sentenceButtons}>
         <TouchableOpacity style={styles.resetButton} onPress={resetSentence}>
           <Text style={styles.resetButtonText}>Reset</Text>
         </TouchableOpacity>
         
         <TouchableOpacity style={styles.hintButton} onPress={toggleHint}>
           <Text style={styles.hintButtonText}>💡 Hint</Text>
         </TouchableOpacity>
         
         <TouchableOpacity style={styles.skipButton} onPress={skipSentence}>
           <Text style={styles.skipButtonText}>⏭️ Skip</Text>
         </TouchableOpacity>
       </View>

               {/* Check button (separate row) */}
        <TouchableOpacity 
          style={[
            styles.checkButton, 
            selectedWords.length === 0 && styles.disabledButton
          ]} 
          onPress={checkSentence}
          disabled={selectedWords.length === 0}
        >
          <Text style={styles.checkButtonText}>Check Sentence</Text>
        </TouchableOpacity>
        


      {completed && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            All sentences completed! 🎉
          </Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => onComplete(0)}>
            <Text style={styles.continueButtonText}>Continue to Next Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const MemoryGameExercise = ({ exercise, onComplete, vocabulary }: { exercise: LessonExercise, onComplete: (score: number) => void, vocabulary: LessonVocabulary[] }) => {
  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>Memory game exercise coming soon...</Text>
    </View>
  );
};

const WordScrambleExercise = ({ exercise, onComplete, vocabulary }: { exercise: LessonExercise, onComplete: (score: number) => void, vocabulary: LessonVocabulary[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize the exercise with scrambled words
  useEffect(() => {
    if (vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0) {
      const currentWord = vocabulary[currentWordIndex]?.english_term;
      if (currentWord) {
        // Scramble the word
        const wordArray = currentWord.split('');
        const scrambled = wordArray.sort(() => Math.random() - 0.5).join('');
        setScrambledWord(scrambled);
        setUserInput('');
        setShowHint(false);
        setShowFeedback(false);
      }
    }
  }, [vocabulary, currentWordIndex]);

  const handleCheckAnswer = () => {
    const currentWord = vocabulary[currentWordIndex]?.english_term;
    const correct = userInput.trim().toLowerCase() === currentWord?.toLowerCase();
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(score + 1);
      // Auto-advance after 2 seconds
      setTimeout(() => {
        if (currentWordIndex < vocabulary.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
        } else {
          // All words completed
          const finalScore = Math.round((score + 1) / vocabulary.length * (exercise?.points || 0));
          setCompleted(true);
          onComplete(finalScore);
        }
      }, 2000);
    }
  };

  const handleSkip = () => {
    if (currentWordIndex < vocabulary.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  if (!vocabulary || vocabulary.length === 0) {
    return (
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePrompt}>Loading word scramble...</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const currentWord = vocabulary[currentWordIndex];
  const totalWords = vocabulary.length;

  if (!currentWord) {
    return (
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePrompt}>No words found</Text>
      </View>
    );
  }

  return (
    <View style={styles.exerciseContent}>
      {/* Skip to next button at top */}
      <TouchableOpacity 
        style={styles.skipToNextButtonTop} 
        onPress={() => onComplete(0)}
      >
        <Text style={styles.skipToNextButtonText}>⏭️ Skip to Next Exercise</Text>
      </TouchableOpacity>
      
      <Text style={styles.exercisePrompt}>Unscramble the word</Text>
      
      {/* Progress indicator */}
      <Text style={styles.progressText}>Word {currentWordIndex + 1} of {totalWords}</Text>
      
      {/* Scrambled word display */}
      <View style={styles.scrambledWordContainer}>
        <Text style={styles.scrambledWordText}>{scrambledWord}</Text>
        <Text style={styles.scrambledWordHint}>Scrambled word</Text>
      </View>
      
      {/* User input */}
      <TextInput
        style={styles.wordInput}
        value={userInput}
        onChangeText={setUserInput}
        placeholder="Type the unscrambled word..."
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
      />
      
      {/* Feedback display */}
      {showFeedback && (
        <View style={[
          styles.feedbackContainer,
          isCorrect ? styles.correctFeedback : styles.incorrectFeedback
        ]}>
          <Text style={styles.feedbackText}>
            {isCorrect ? '✅ Correct! Moving to next word...' : '❌ Incorrect. Try again!'}
          </Text>
        </View>
      )}
      
      {/* Hint display */}
      {showHint && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintTitle}>Hint (Native Translation):</Text>
          <Text style={styles.hintText}>
            {currentWord.native_translation || 'No translation available'}
          </Text>
        </View>
      )}
      
      {/* Action buttons */}
      <View style={styles.wordScrambleButtons}>
        <TouchableOpacity style={styles.hintButton} onPress={toggleHint}>
          <Text style={styles.hintButtonText}>💡 Hint</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>⏭️ Skip</Text>
        </TouchableOpacity>
      </View>
      
             {/* Check button */}
       <TouchableOpacity 
         style={[
           styles.checkButton, 
           !userInput.trim() && styles.disabledButton
         ]} 
         onPress={handleCheckAnswer}
         disabled={!userInput.trim()}
       >
         <Text style={styles.checkButtonText}>Check Word</Text>
       </TouchableOpacity>
       
       
      
      {completed && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            All words completed! 🎉
          </Text>
          <Text style={styles.scoreText}>
            Final Score: {Math.round((score / totalWords) * 100)}%
          </Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => onComplete(0)}>
            <Text style={styles.continueButtonText}>Continue to Next Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const SpeedChallengeExercise = ({ exercise, onComplete, vocabulary }: { exercise: LessonExercise, onComplete: (score: number) => void, vocabulary: LessonVocabulary[] }) => {
  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>Speed challenge exercise coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  subjectText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vocabularyButton: {
    padding: 8,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  scoreText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  exerciseContainer: {
    flex: 1,
    padding: 16,
  },
  exerciseContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exercisePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  answersContainer: {
    gap: 12,
  },
  answerButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedAnswer: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  correctAnswer: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  incorrectAnswer: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  answerText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  selectedAnswerText: {
    color: 'white',
    fontWeight: '600',
  },
  checkButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  resultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  sentenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  sentenceText: {
    fontSize: 16,
    color: '#000',
  },
  blankContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  blankText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  vocabularyList: {
    flex: 1,
    padding: 16,
  },
  vocabularyItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  vocabularyTerm: {
    marginBottom: 8,
  },
  englishTerm: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  nativeTranslation: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  definition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  exampleContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  exampleText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  exampleNative: {
    fontSize: 14,
    color: '#6366f1',
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  continueButtonWarning: {
    backgroundColor: '#f59e0b',
  },
  // Flashcard styles
  flashcard: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 16,
    padding: 32,
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  flashcardText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  flashcardHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  flashcardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    gap: 16,
  },
  flashcardButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  incorrectButton: {
    backgroundColor: '#ef4444',
  },
  correctButton: {
    backgroundColor: '#10b981',
  },
  flashcardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Sentence ordering styles
  selectedWordsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectedWordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedWordButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 2,
  },
  selectedWordText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  remainingWordsContainer: {
    marginBottom: 24,
  },
  remainingWordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  remainingWordButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 2,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  remainingWordText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  sentenceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    marginTop: 24,
  },
  resetButton: {
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 8,
    flex: 1,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
    opacity: 0.6,
  },
  // Feedback and hint styles
  feedbackContainer: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    alignItems: 'center',
  },
  correctFeedback: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  incorrectFeedback: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  hintContainer: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hintText: {
    fontSize: 16,
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  hintButton: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 8,
    flex: 1,
  },
  hintButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 8,
    flex: 1,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Word scramble styles
  scrambledWordContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
    padding: 24,
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrambledWordText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  scrambledWordHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  wordInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  wordScrambleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    marginBottom: 24,
  },
  // Skip to next button styles
  skipToNextButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  skipToNextButtonTop: {
    backgroundColor: '#8b5cf6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  skipToNextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Progress summary styles
  progressSummaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  progressSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressSummaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  progressSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  completedStatus: {
    color: '#10b981',
  },
  inProgressStatus: {
    color: '#f59e0b',
  },
  vocabularySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  // Empty vocabulary styles
  emptyVocabularyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyVocabularyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Performance Insights Styles
  performanceInsightsContainer: {
    marginBottom: 20,
  },
  performanceInsightsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  exerciseBreakdownContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  exerciseBreakdownItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  exerciseBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  exerciseBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseBreakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  exerciseBreakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  learningPatternsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  patternValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  vocabularyPerformanceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  vocabSection: {
    marginBottom: 16,
  },
  vocabSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  vocabItem: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  vocabTerm: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  vocabStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  vocabTranslation: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  noVocabText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Missing styles for performance insights
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
});
