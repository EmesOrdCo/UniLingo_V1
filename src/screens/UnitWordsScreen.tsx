import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { GeneralVocabService, ProcessedVocabItem } from '../lib/generalVocabService';
import { ProgressTrackingService } from '../lib/progressTrackingService';

interface UnitWordsScreenProps {
  navigation: any;
  route: any;
}

export default function UnitWordsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  
  const { unitId, unitTitle, topicGroup } = route.params || { unitId: 1, unitTitle: 'Basic Actions', topicGroup: 'basic_actions' };
  
  const [vocabulary, setVocabulary] = useState<ProcessedVocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'flashcards' | 'quiz' | 'completed'>('flashcards');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      const vocab = await GeneralVocabService.getVocabByTopicGroup(topicGroup, profile?.native_language || 'english');
      setVocabulary(vocab);
      console.log(`📚 Loaded ${vocab.length} vocabulary items for ${topicGroup}`);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      Alert.alert('Error', 'Failed to load vocabulary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlashcardNext = () => {
    if (flashcardIndex < vocabulary.length - 1) {
      setFlashcardIndex(flashcardIndex + 1);
      setShowAnswer(false);
    } else {
      // Move to quiz
      setCurrentStep('quiz');
      console.log('🎯 Moving to flashcard quiz');
    }
  };

  const handleQuizAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === vocabulary[quizIndex].english_term;
    if (isCorrect) {
      setQuizScore(quizScore + 1);
    }
    
    const newAnswers = [...quizAnswers];
    newAnswers[quizIndex] = answer;
    setQuizAnswers(newAnswers);
    
    setTimeout(() => {
      if (quizIndex < vocabulary.length - 1) {
        setQuizIndex(quizIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Quiz completed
        setCurrentStep('completed');
        recordActivity();
      }
    }, 1500);
  };

  const recordActivity = async () => {
    if (!user) return;
    
    try {
      const accuracyPercentage = Math.round((quizScore / vocabulary.length) * 100);
      
      await ProgressTrackingService.recordLessonActivity({
        activityType: 'lesson',
        activityName: `${unitTitle} - Words`,
        durationSeconds: 300, // 5 minutes estimated
        score: quizScore,
        maxScore: vocabulary.length,
        accuracyPercentage: accuracyPercentage,
      });
      
      console.log('✅ Unit Words activity recorded');
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  };

  const restartExercise = () => {
    setCurrentStep('flashcards');
    setFlashcardIndex(0);
    setShowAnswer(false);
    setQuizIndex(0);
    setQuizAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizScore(0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - Words</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading vocabulary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - Words</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No vocabulary found for this unit.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVocabulary}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (currentStep === 'flashcards') {
    const currentVocab = vocabulary[flashcardIndex];
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - Words</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {flashcardIndex + 1} of {vocabulary.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((flashcardIndex + 1) / vocabulary.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.flashcardContainer}>
            <View style={styles.flashcard}>
              <Text style={styles.flashcardTerm}>{currentVocab.english_term}</Text>
              
              {showAnswer && (
                <View style={styles.flashcardAnswer}>
                  <Text style={styles.flashcardDefinition}>{currentVocab.definition}</Text>
                  <Text style={styles.flashcardTranslation}>{currentVocab.native_translation}</Text>
                  <Text style={styles.flashcardExample}>{currentVocab.example_sentence}</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.revealButton}
              onPress={() => setShowAnswer(!showAnswer)}
            >
              <Text style={styles.revealButtonText}>
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleFlashcardNext}
          >
            <Text style={styles.nextButtonText}>
              {flashcardIndex < vocabulary.length - 1 ? 'Next' : 'Start Quiz'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (currentStep === 'quiz') {
    const currentVocab = vocabulary[quizIndex];
    const options = [
      currentVocab.english_term,
      ...vocabulary
        .filter((_, index) => index !== quizIndex)
        .slice(0, 3)
        .map(v => v.english_term)
    ].sort(() => Math.random() - 0.5);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - Quiz</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {quizIndex + 1} of {vocabulary.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((quizIndex + 1) / vocabulary.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              What is the English term for: "{currentVocab.native_translation}"?
            </Text>
            
            <View style={styles.optionsContainer}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === option && styles.selectedOption,
                    showResult && option === currentVocab.english_term && styles.correctOption,
                    showResult && selectedAnswer === option && option !== currentVocab.english_term && styles.incorrectOption
                  ]}
                  onPress={() => !showResult && handleQuizAnswer(option)}
                  disabled={showResult}
                >
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === option && styles.selectedOptionText,
                    showResult && option === currentVocab.english_term && styles.correctOptionText,
                    showResult && selectedAnswer === option && option !== currentVocab.english_term && styles.incorrectOptionText
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentStep === 'completed') {
    const accuracyPercentage = Math.round((quizScore / vocabulary.length) * 100);
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - Completed</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>
            
            <Text style={styles.completionTitle}>Great Job!</Text>
            <Text style={styles.completionSubtitle}>You completed the Words exercise</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score: {quizScore}/{vocabulary.length}</Text>
              <Text style={styles.accuracyText}>Accuracy: {accuracyPercentage}%</Text>
            </View>
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.restartButton} onPress={restartExercise}>
                <Ionicons name="refresh" size={20} color="#6366f1" />
                <Text style={styles.restartButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  flashcardContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  flashcard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flashcardTerm: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  flashcardAnswer: {
    marginTop: 20,
    alignItems: 'center',
  },
  flashcardDefinition: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  flashcardTranslation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 12,
  },
  flashcardExample: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  revealButton: {
    marginTop: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  revealButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  nextButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  questionContainer: {
    marginTop: 40,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  incorrectOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#10b981',
    fontWeight: '600',
  },
  incorrectOptionText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  completionContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  completionIcon: {
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  scoreContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
    gap: 8,
  },
  restartButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
