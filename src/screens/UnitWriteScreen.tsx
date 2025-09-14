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
import { SimpleUnitProgressService } from '../lib/simpleUnitProgressService';

interface UnitWriteScreenProps {
  navigation: any;
  route: any;
}

export default function UnitWriteScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  
  const { unitId, unitTitle, topicGroup, unitCode } = route.params || { unitId: 1, unitTitle: 'Basic Concepts', topicGroup: 'Basic Concepts', unitCode: 'A1.1' };
  
  // Extract CEFR level and unit number from unitCode
  const cefrLevel = unitCode ? unitCode.split('.')[0] : 'A1';
  const unitNumber = unitCode ? parseInt(unitCode.split('.')[1]) : unitId;
  
  const [vocabulary, setVocabulary] = useState<ProcessedVocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'sentence-scramble' | 'word-scramble' | 'completed'>('sentence-scramble');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambledSentence, setScrambledSentence] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      console.log(`✍️ Loading vocabulary for topic: ${topicGroup}, language: ${profile?.native_language}`);
      
      const vocab = await GeneralVocabService.getVocabByTopicGroup(topicGroup, profile?.native_language || 'english');
      console.log(`✍️ Loaded ${vocab.length} vocabulary items for ${topicGroup}`);
      
      if (vocab.length === 0) {
        console.log('⚠️ No vocabulary found, showing error');
        Alert.alert(
          'No Vocabulary Available',
          `No vocabulary found for "${topicGroup}". Please check your database setup.`,
          [
            { text: 'Go Back', onPress: () => navigation.goBack() },
            { text: 'Retry', onPress: loadVocabulary }
          ]
        );
        return;
      }
      
      setVocabulary(vocab);
      setTotalQuestions(vocab.length * 2); // Sentence scramble + Word scramble
      
      // Initialize the first scrambled sentence
      if (vocab.length > 0) {
        generateScrambledSentence(vocab[0]);
      }
    } catch (error) {
      console.error('❌ Error loading vocabulary:', error);
      Alert.alert(
        'Error Loading Vocabulary',
        `Failed to load vocabulary: ${error.message || 'Unknown error'}`,
        [
          { text: 'Go Back', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: loadVocabulary }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const generateScrambledSentence = (vocab: ProcessedVocabItem) => {
    const words = vocab.example_sentence.split(' ').filter(word => word.trim() !== '');
    const scrambled = [...words].sort(() => Math.random() - 0.5);
    setScrambledSentence(scrambled);
    setUserAnswer([]);
    setShowResult(false);
  };

  const handleWordSelect = (word: string) => {
    if (showResult) return;
    
    const newAnswer = [...userAnswer, word];
    setUserAnswer(newAnswer);
    
    const newScrambled = scrambledSentence.filter((_, index) => 
      scrambledSentence.indexOf(word) !== index || newAnswer.filter(w => w === word).length <= scrambledSentence.filter(w => w === word).length
    );
    setScrambledSentence(newScrambled);
  };

  const handleWordRemove = (word: string, index: number) => {
    if (showResult) return;
    
    const newAnswer = userAnswer.filter((_, i) => i !== index);
    setUserAnswer(newAnswer);
    
    const newScrambled = [...scrambledSentence, word];
    setScrambledSentence(newScrambled);
  };

  const checkSentenceAnswer = () => {
    if (userAnswer.length === 0) return;
    
    const currentVocab = vocabulary[currentIndex];
    const correctAnswer = currentVocab.example_sentence.split(' ').filter(word => word.trim() !== '');
    const userAnswerString = userAnswer.join(' ');
    const correctAnswerString = correctAnswer.join(' ');
    
    const isCorrect = userAnswerString.toLowerCase() === correctAnswerString.toLowerCase();
    setShowResult(true);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentIndex < vocabulary.length - 1) {
        setCurrentIndex(currentIndex + 1);
        generateScrambledSentence(vocabulary[currentIndex + 1]);
      } else {
        // Move to word scramble
        setCurrentStep('word-scramble');
        setCurrentIndex(0);
        generateWordScramble(vocabulary[0]);
      }
    }, 2000);
  };

  const generateWordScramble = (vocab: ProcessedVocabItem) => {
    const word = vocab.english_term;
    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    setScrambledSentence([scrambled]);
    setUserAnswer([]);
    setShowResult(false);
  };

  const checkWordAnswer = () => {
    if (userAnswer.length === 0) return;
    
    const currentVocab = vocabulary[currentIndex];
    const userAnswerString = userAnswer.join('');
    const isCorrect = userAnswerString.toLowerCase() === currentVocab.english_term.toLowerCase();
    
    setShowResult(true);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentIndex < vocabulary.length - 1) {
        setCurrentIndex(currentIndex + 1);
        generateWordScramble(vocabulary[currentIndex + 1]);
      } else {
        setCurrentStep('completed');
        recordActivity();
      }
    }, 2000);
  };

  const recordActivity = async () => {
    if (!user) return;
    
    try {
      const accuracyPercentage = Math.round((score / totalQuestions) * 100);
      
      await ProgressTrackingService.recordLessonActivity({
        activityType: 'lesson',
        activityName: `${topicGroup} - Write`,
        durationSeconds: 600, // 10 minutes estimated
        score: score,
        maxScore: totalQuestions,
        accuracyPercentage: accuracyPercentage,
      });
      
      // Record unit progress completion
      if (user?.id) {
        await SimpleUnitProgressService.recordLessonCompletion(user.id, cefrLevel, unitNumber, 'write');
      }
      
      console.log('✅ Unit Write activity recorded');
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  };

  const restartExercise = () => {
    setCurrentStep('sentence-scramble');
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    if (vocabulary.length > 0) {
      generateScrambledSentence(vocabulary[0]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{topicGroup} - Write</Text>
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
          <Text style={styles.headerTitle}>{topicGroup} - Write</Text>
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

  if (currentStep === 'completed') {
    const accuracyPercentage = Math.round((score / totalQuestions) * 100);
    
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
            
            <Text style={styles.completionTitle}>Great Writing!</Text>
            <Text style={styles.completionSubtitle}>You completed the Write exercise</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score: {score}/{totalQuestions}</Text>
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

  const currentVocab = vocabulary[currentIndex];
  const isSentenceScramble = currentStep === 'sentence-scramble';
  const currentQuestionNumber = currentIndex + 1;
  const totalCurrentStep = vocabulary.length;
  const overallProgress = isSentenceScramble ? currentQuestionNumber : totalCurrentStep + currentQuestionNumber;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {unitTitle} - {isSentenceScramble ? 'Sentence Scramble' : 'Word Scramble'}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestionNumber} of {totalCurrentStep} ({isSentenceScramble ? 'Sentences' : 'Words'})
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(overallProgress / totalQuestions) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={styles.instructionText}>
            {isSentenceScramble 
              ? 'Arrange the words to form a correct sentence:' 
              : 'Unscramble the letters to form the correct word:'
            }
          </Text>
          
          <View style={styles.answerContainer}>
            {userAnswer.map((word, index) => (
              <TouchableOpacity
                key={`${word}-${index}`}
                style={styles.answerWord}
                onPress={() => handleWordRemove(word, index)}
              >
                <Text style={styles.answerWordText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.scrambledContainer}>
            {scrambledSentence.map((word, index) => (
              <TouchableOpacity
                key={`${word}-${index}`}
                style={styles.scrambledWord}
                onPress={() => handleWordSelect(word)}
              >
                <Text style={styles.scrambledWordText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {showResult && (
            <View style={styles.resultContainer}>
              <View style={styles.resultRow}>
                <Ionicons 
                  name={isSentenceScramble ? 
                    (userAnswer.join(' ').toLowerCase() === currentVocab.example_sentence.toLowerCase() ? "checkmark-circle" : "close-circle") :
                    (userAnswer.join('').toLowerCase() === currentVocab.english_term.toLowerCase() ? "checkmark-circle" : "close-circle")
                  } 
                  size={24} 
                  color={isSentenceScramble ? 
                    (userAnswer.join(' ').toLowerCase() === currentVocab.example_sentence.toLowerCase() ? "#10b981" : "#ef4444") :
                    (userAnswer.join('').toLowerCase() === currentVocab.english_term.toLowerCase() ? "#10b981" : "#ef4444")
                  } 
                />
                <Text style={[
                  styles.resultText,
                  isSentenceScramble ? 
                    (userAnswer.join(' ').toLowerCase() === currentVocab.example_sentence.toLowerCase() ? styles.resultTextCorrect : styles.resultTextIncorrect) :
                    (userAnswer.join('').toLowerCase() === currentVocab.english_term.toLowerCase() ? styles.resultTextCorrect : styles.resultTextIncorrect)
                ]}>
                  {isSentenceScramble ? 
                    (userAnswer.join(' ').toLowerCase() === currentVocab.example_sentence.toLowerCase() ? 'Correct!' : 'Incorrect') :
                    (userAnswer.join('').toLowerCase() === currentVocab.english_term.toLowerCase() ? 'Correct!' : 'Incorrect')
                  }
                </Text>
              </View>
              
              <Text style={styles.correctAnswerText}>
                {isSentenceScramble ? 
                  `Correct: ${currentVocab.example_sentence}` :
                  `Correct: ${currentVocab.english_term}`
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.submitButton, userAnswer.length === 0 && styles.submitButtonDisabled]}
          onPress={isSentenceScramble ? checkSentenceAnswer : checkWordAnswer}
          disabled={userAnswer.length === 0 || showResult}
        >
          <Text style={styles.submitButtonText}>
            {showResult ? 'Next' : 'Check Answer'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
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
  questionContainer: {
    marginTop: 40,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
  },
  answerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 60,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  answerWord: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  answerWordText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrambledContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  scrambledWord: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  scrambledWordText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultTextCorrect: {
    color: '#10b981',
  },
  resultTextIncorrect: {
    color: '#ef4444',
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#6b7280',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
