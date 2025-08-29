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
import { 
  ImprovedLessonService, 
  ImprovedLesson, 
  ImprovedLessonVocabulary, 
  ImprovedLessonExercise,
  ImprovedExerciseData,
  ExerciseQuestion
} from '../lib/improvedLessonService';

import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');

interface LessonViewerRouteParams {
  lessonId: string;
}

export default function ImprovedLessonViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { lessonId } = route.params as LessonViewerRouteParams;
  const { user, profile } = useAuth();

  const [lesson, setLesson] = useState<ImprovedLesson | null>(null);
  const [vocabulary, setVocabulary] = useState<ImprovedLessonVocabulary[]>([]);
  const [exercises, setExercises] = useState<ImprovedLessonExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [exercisesActuallyCompleted, setExercisesActuallyCompleted] = useState(0);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const lessonData = await ImprovedLessonService.getImprovedLesson(lessonId);
      
      if (lessonData) {
        setLesson(lessonData.lesson);
        setVocabulary(lessonData.vocabulary);
        setExercises(lessonData.exercises);
        
        // Calculate total possible score from structured exercises
        const totalQuestions = lessonData.exercises.reduce((total, exercise) => {
          return total + (exercise.exercise_data.questions?.length || 0);
        }, 0);
        
        setMaxPossibleScore(totalQuestions);
        console.log(`🎯 Total questions calculated from structured exercises: ${totalQuestions}`);
      } else {
        setError('Lesson not found');
      }
    } catch (err) {
      setError('Failed to load lesson');
      console.error('Error loading improved lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const startLesson = () => {
    setStartTime(new Date());
    setExerciseStartTime(new Date());
    setCurrentExerciseIndex(0);
    setTotalScore(0);
    setExerciseScore(0);
    setExercisesActuallyCompleted(0);
    setExerciseAttempts({});
    setExerciseScores({});
    setExerciseTimes({});
    setVocabularyPerformance({});
    setCorrectStreak(0);
    setMaxStreak(0);
  };

  const completeExercise = (score: number) => {
    console.log(`🎯 Exercise ${currentExerciseIndex} completed with score: ${score}`);
    
    const newTotalScore = totalScore + score;
    setTotalScore(newTotalScore);
    setExerciseScore(score);
    setExercisesActuallyCompleted(prev => prev + 1);

    // Track exercise completion time
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

    if (nextIndex >= (exercises ? exercises.length : 0)) {
      // Lesson completed - show vocabulary modal
      setShowVocabularyModal(true);
      
      // Update lesson progress with completion data
      if (user?.id) {
        try {
          const { LessonService } = await import('../lib/lessonService');
          await LessonService.updateLessonProgress(user.id, lessonId, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            total_score: totalScore,
            max_possible_score: maxPossibleScore,
            exercises_completed: exercisesActuallyCompleted,
            time_spent_seconds: startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0
          });
          console.log('✅ Lesson progress updated with completion data');
        } catch (error) {
          console.error('❌ Failed to update lesson progress:', error);
        }
      }
      
      // Award XP for lesson completion
      if (user?.id) {
        const finalScore = Math.round((totalScore / maxPossibleScore) * 100);
        
        // Award XP
        import('../lib/xpService').then(({ XPService }) => {
          XPService.awardXP(
            user.id,
            'lesson',
            totalScore,
            maxPossibleScore,
            finalScore,
            lesson?.title
          ).then((xpResult) => {
            if (xpResult) {
              console.log('🎯 XP awarded for improved lesson completion:', xpResult.totalXP);
            }
          }).catch(error => {
            console.error('❌ Error awarding XP for improved lesson:', error);
          });
        }).catch(error => {
          console.error('❌ Error importing XP service:', error);
        });
        
        // Update daily goals
        import('../lib/dailyGoalsService').then(({ DailyGoalsService }) => {
          DailyGoalsService.updateGoalProgress(user.id, 'lessons_completed', 1);
          
          // Calculate total study time in minutes
          const totalTimeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000 / 60) : 0;
          if (totalTimeSpent > 0) {
            DailyGoalsService.updateGoalProgress(user.id, 'study_time', totalTimeSpent);
          }
          
          console.log('✅ Daily goals updated for improved lesson completion');
        }).catch(error => {
          console.error('❌ Failed to update daily goals:', error);
        });
      }
    }
  };

  const updateScore = (score: number) => {
    setExerciseScore(score);
  };

  const renderExercise = (exercise: ImprovedLessonExercise) => {
    console.log(`🔍 Rendering IMPROVED exercise ${currentExerciseIndex}, type: ${exercise.exercise_type}`);
    console.log(`🔍 Exercise data structure:`, exercise.exercise_data);
    
    // Use the structured exercise data from the improved service
    switch (exercise.exercise_type) {
      case 'flashcard_match':
        return <ImprovedFlashcardMatchExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} currentExerciseIndex={currentExerciseIndex} />;
      case 'multiple_choice':
        return <ImprovedMultipleChoiceExercise exercise={exercise} onComplete={completeExercise} />;
      case 'fill_in_blank':
        return <ImprovedFillInBlankExercise exercise={exercise} onComplete={completeExercise} />;
      case 'typing':
        return <ImprovedTypingExercise exercise={exercise} onComplete={completeExercise} />;
      case 'sentence_ordering':
        return <ImprovedSentenceOrderingExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} />;
      case 'memory_game':
        return <ImprovedMemoryGameExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} />;
      case 'word_scramble':
        return <ImprovedWordScrambleExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} profile={profile} />;
      case 'speed_challenge':
        return <ImprovedSpeedChallengeExercise exercise={exercise} onComplete={completeExercise} vocabulary={vocabulary} />;
      default:
        return <Text>Unknown exercise type: {exercise.exercise_type}</Text>;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading improved lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLesson}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !exercises) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Lesson data not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const progressPercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{lesson.title}</Text>
          <Text style={styles.headerSubtitle}>{lesson.subject} • {lesson.estimated_duration} min</Text>
        </View>
        <TouchableOpacity onPress={() => setShowVocabularyModal(true)} style={styles.vocabButton}>
          <Ionicons name="book" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Exercise {currentExerciseIndex + 1} of {exercises ? exercises.length : 0}</Text>
          <Text style={styles.progressText}>{Math.round(progressPercentage)}% Complete</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {totalScore}/{maxPossibleScore}</Text>
        <Text style={styles.scoreText}>Progress: {Math.round(progressPercentage)}%</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!startTime ? (
          <View style={styles.startContainer}>
            <Text style={styles.startTitle}>Ready to start?</Text>
            <Text style={styles.startDescription}>
              This lesson will teach you {vocabulary ? vocabulary.length : 0} key terms in {lesson.subject}.
              Estimated time: {lesson.estimated_duration} minutes
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startLesson}>
              <Text style={styles.startButtonText}>Start Lesson</Text>
            </TouchableOpacity>
          </View>
        ) : currentExercise ? (
          <View style={styles.exerciseContainer}>
            <Text style={styles.exerciseTitle}>Exercise {currentExerciseIndex + 1}</Text>
            {renderExercise(currentExercise)}
          </View>
        ) : (
          <View style={styles.completeContainer}>
            <Text style={styles.completeTitle}>Lesson Complete!</Text>
            <Text style={styles.completeScore}>Final Score: {totalScore}/{maxPossibleScore}</Text>
            <Text style={styles.completePercentage}>{Math.round(progressPercentage)}%</Text>
            <TouchableOpacity style={styles.reviewButton} onPress={() => setShowVocabularyModal(true)}>
              <Text style={styles.reviewButtonText}>Review Vocabulary</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Vocabulary Modal */}
      <Modal
        visible={showVocabularyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📚 Lesson Vocabulary</Text>
            <TouchableOpacity onPress={() => setShowVocabularyModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.vocabularyList} showsVerticalScrollIndicator={false}>
            {vocabulary.map((item, index) => (
              <View key={index} style={styles.vocabularyItem}>
                <View style={styles.vocabularyHeader}>
                  <Text style={styles.englishTerm}>{item.english_term}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (profile?.native_language === 'English') {
                        Speech.speak(item.english_term, { language: 'en' });
                      } else {
                        Speech.speak(item.native_translation, { language: profile?.native_language || 'en' });
                      }
                    }}
                    style={styles.speakButton}
                  >
                    <Ionicons name="volume-high" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.definition}>{item.definition}</Text>
                <Text style={styles.nativeTranslation}>{item.native_translation}</Text>
                <Text style={styles.exampleSentence}>{item.example_sentence_en}</Text>
                <Text style={styles.exampleSentenceNative}>{item.example_sentence_native}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================================
// IMPROVED EXERCISE COMPONENTS WITH STRUCTURED DATA
// ============================================================================

// Improved Flashcard Match Exercise
const ImprovedFlashcardMatchExercise = ({ 
  exercise, 
  onComplete, 
  vocabulary, 
  currentExerciseIndex 
}: { 
  exercise: ImprovedLessonExercise, 
  onComplete: (score: number) => void, 
  vocabulary: ImprovedLessonVocabulary[], 
  currentExerciseIndex: number 
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [completed, setCompleted] = useState(false);

  const handleAnswerSelect = (questionId: string, selectedAnswer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: selectedAnswer }));
  };

  const checkAnswers = () => {
    let correct = 0;
    const questions = exercise.exercise_data.questions || [];
    
    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correct_answer) {
        correct++;
      }
    });

    const score = correct;
    setCompleted(true);
    onComplete(score);
  };

  const canCheckAnswers = () => {
    const questions = exercise.exercise_data.questions || [];
    return Object.keys(selectedAnswers).length === questions.length;
  };

  const questions = exercise.exercise_data.questions || [];

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      {exercise.exercise_data.instructions && (
        <Text style={styles.exerciseInstructions}>{exercise.exercise_data.instructions}</Text>
      )}
      
      {questions.map((question, index) => (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          <View style={styles.optionsContainer}>
            {question.options?.map((option, optionIndex) => (
              <TouchableOpacity
                key={optionIndex}
                style={[
                  styles.optionButton,
                  selectedAnswers[question.id] === option && styles.selectedOption
                ]}
                onPress={() => handleAnswerSelect(question.id, option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedAnswers[question.id] === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {!completed && (
        <TouchableOpacity 
          style={[styles.checkButton, !canCheckAnswers() && styles.checkButtonDisabled]} 
          onPress={checkAnswers}
          disabled={!canCheckAnswers()}
        >
          <Text style={styles.checkButtonText}>Check Answers</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Improved Multiple Choice Exercise
const ImprovedMultipleChoiceExercise = ({ 
  exercise, 
  onComplete 
}: { 
  exercise: ImprovedLessonExercise, 
  onComplete: (score: number) => void 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const questions = exercise.exercise_data.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const score = isCorrect ? 1 : 0;
    
    if (currentQuestionIndex + 1 < questions.length) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Exercise complete
      setCompleted(true);
      onComplete(score);
    }
  };

  if (!currentQuestion) {
    return <Text>No questions available</Text>;
  }

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      {exercise.exercise_data.instructions && (
        <Text style={styles.exerciseInstructions}>{exercise.exercise_data.instructions}</Text>
      )}
      
      <Text style={styles.questionCounter}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
      <Text style={styles.questionText}>{currentQuestion.question}</Text>
      
      <View style={styles.optionsContainer}>
        {currentQuestion.options?.map((option, index) => (
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
      </View>

      {selectedAnswer && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>
            {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'Complete Exercise'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Improved Fill in Blank Exercise
const ImprovedFillInBlankExercise = ({ 
  exercise, 
  onComplete 
}: { 
  exercise: ImprovedLessonExercise, 
  onComplete: (score: number) => void 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const questions = exercise.exercise_data.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const score = isCorrect ? 1 : 0;
    
    if (currentQuestionIndex + 1 < questions.length) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Exercise complete
      setCompleted(true);
      onComplete(score);
    }
  };

  if (!currentQuestion) {
    return <Text>No questions available</Text>;
  }

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      {exercise.exercise_data.instructions && (
        <Text style={styles.exerciseInstructions}>{exercise.exercise_data.instructions}</Text>
      )}
      
      <Text style={styles.questionCounter}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
      <Text style={styles.questionText}>{currentQuestion.question}</Text>
      
      <View style={styles.optionsContainer}>
        {currentQuestion.options?.map((option, index) => (
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
      </View>

      {selectedAnswer && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>
            {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'Complete Exercise'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Placeholder components for other exercise types
const ImprovedTypingExercise = ({ exercise, onComplete }: { exercise: ImprovedLessonExercise, onComplete: (score: number) => void }) => (
  <View style={styles.exerciseContent}>
    <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
    <Text style={styles.comingSoon}>Typing exercise coming soon!</Text>
    <TouchableOpacity style={styles.checkButton} onPress={() => onComplete(1)}>
      <Text style={styles.checkButtonText}>Continue</Text>
    </TouchableOpacity>
  </View>
);

const ImprovedSentenceOrderingExercise = ({ exercise, onComplete, vocabulary }: { exercise: ImprovedLessonExercise, onComplete: (score: number) => void, vocabulary: ImprovedLessonVocabulary[] }) => (
  <View style={styles.exerciseContent}>
    <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
    <Text style={styles.comingSoon}>Sentence ordering exercise coming soon!</Text>
    <TouchableOpacity style={styles.checkButton} onPress={() => onComplete(1)}>
      <Text style={styles.checkButtonText}>Continue</Text>
    </TouchableOpacity>
  </View>
);

const ImprovedMemoryGameExercise = ({ exercise, onComplete, vocabulary }: { exercise: ImprovedLessonExercise, onComplete: (score: number) => void, vocabulary: ImprovedLessonVocabulary[] }) => (
  <View style={styles.exerciseContent}>
    <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
    <Text style={styles.comingSoon}>Memory game exercise coming soon!</Text>
    <TouchableOpacity style={styles.checkButton} onPress={() => onComplete(1)}>
      <Text style={styles.checkButtonText}>Continue</Text>
    </TouchableOpacity>
  </View>
);

const ImprovedWordScrambleExercise = ({ exercise, onComplete, vocabulary, profile }: { exercise: ImprovedLessonExercise, onComplete: (score: number) => void, vocabulary: ImprovedLessonVocabulary[], profile: any }) => (
  <View style={styles.exerciseContent}>
    <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
    <Text style={styles.comingSoon}>Word scramble exercise coming soon!</Text>
    <TouchableOpacity style={styles.checkButton} onPress={() => onComplete(1)}>
      <Text style={styles.checkButtonText}>Continue</Text>
    </TouchableOpacity>
  </View>
);

const ImprovedSpeedChallengeExercise = ({ exercise, onComplete, vocabulary }: { exercise: ImprovedLessonExercise, onComplete: (score: number) => void, vocabulary: ImprovedLessonVocabulary[] }) => (
  <View style={styles.exerciseContent}>
    <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
    <Text style={styles.comingSoon}>Speed challenge exercise coming soon!</Text>
    <TouchableOpacity style={styles.checkButton} onPress={() => onComplete(1)}>
      <Text style={styles.checkButtonText}>Continue</Text>
    </TouchableOpacity>
  </View>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  vocabButton: {
    padding: 8,
    borderRadius: 8,
  },
  progressContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  scoreContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  startContainer: {
    padding: 40,
    alignItems: 'center',
  },
  startTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  startDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseContainer: {
    padding: 20,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  completeContainer: {
    padding: 40,
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  completeScore: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  completePercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 32,
  },
  reviewButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  vocabularyList: {
    flex: 1,
    padding: 20,
  },
  vocabularyItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  vocabularyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  englishTerm: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  speakButton: {
    padding: 8,
    borderRadius: 8,
  },
  definition: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  nativeTranslation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  exampleSentence: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 20,
  },
  exampleSentenceNative: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  exerciseContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exercisePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  exerciseInstructions: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  questionCounter: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedOption: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  checkButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoon: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
});


