import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { GeneralVocabService, ProcessedVocabItem } from '../lib/generalVocabService';
import { ProgressTrackingService } from '../lib/progressTrackingService';
import { SimpleUnitProgressService } from '../lib/simpleUnitProgressService';
import * as Speech from 'expo-speech';

interface UnitListenScreenProps {
  navigation: any;
  route: any;
}

export default function UnitListenScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  
  const { unitId, unitTitle, topicGroup, unitCode } = (route.params as any) || { unitId: 1, unitTitle: 'Basic Concepts', topicGroup: 'Basic Concepts', unitCode: 'A1.1' };
  
  // Extract CEFR level and unit number from unitCode
  const cefrLevel = unitCode ? unitCode.split('.')[0] : 'A1';
  const unitNumber = unitCode ? parseInt(unitCode.split('.')[1]) : unitId;
  
  const [vocabulary, setVocabulary] = useState<ProcessedVocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      console.log(`🎧 Loading vocabulary for topic: ${topicGroup}, language: ${profile?.native_language}`);
      
      const vocab = await GeneralVocabService.getVocabByTopicGroup(topicGroup, profile?.native_language || 'english');
      console.log(`🎧 Loaded ${vocab.length} vocabulary items for ${topicGroup}`);
      
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
    } catch (error) {
      console.error('❌ Error loading vocabulary:', error);
      Alert.alert(
        'Error Loading Vocabulary',
        `Failed to load vocabulary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          { text: 'Go Back', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: loadVocabulary }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    if (isPlaying || vocabulary.length === 0) return;
    
    try {
      setIsPlaying(true);
      const currentVocab = vocabulary[currentIndex];
      
      await Speech.speak(currentVocab.english_term, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
      });
      
      // Reset playing state after speech completes
      setTimeout(() => setIsPlaying(false), 2000);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    
    const currentVocab = vocabulary[currentIndex];
    const isCorrect = userInput.toLowerCase().trim() === currentVocab.english_term.toLowerCase();
    
    setShowResult(true);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentIndex < vocabulary.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput('');
        setShowResult(false);
      } else {
        setCompleted(true);
        recordActivity();
      }
    }, 2000);
  };

  const recordActivity = async () => {
    if (!user) return;
    
    try {
      const accuracyPercentage = Math.round((score / vocabulary.length) * 100);
      
      await ProgressTrackingService.recordLessonActivity({
        activityType: 'lesson',
        lessonId: `unit-${unitCode}-listen`,
        activityName: `${topicGroup} - Listen`,
        durationSeconds: 300, // 5 minutes estimated
        score: score,
        maxScore: vocabulary.length,
        accuracyPercentage: accuracyPercentage,
      });
      
      // Record unit progress completion
      if (user?.id) {
        await SimpleUnitProgressService.recordLessonCompletion(user.id, cefrLevel, unitNumber, 'listen');
      }
      
      console.log('✅ Unit Listen activity recorded');
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  };

  const restartExercise = () => {
    setCurrentIndex(0);
    setUserInput('');
    setShowResult(false);
    setScore(0);
    setCompleted(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{topicGroup} - Listen</Text>
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
          <Text style={styles.headerTitle}>{topicGroup} - Listen</Text>
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

  if (completed) {
    const accuracyPercentage = Math.round((score / vocabulary.length) * 100);
    
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
            
            <Text style={styles.completionTitle}>Excellent Listening!</Text>
            <Text style={styles.completionSubtitle}>You completed the Listen exercise</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score: {score}/{vocabulary.length}</Text>
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
  const isCorrect = userInput.toLowerCase().trim() === currentVocab.english_term.toLowerCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{topicGroup} - Listen</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {vocabulary.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionContainer}>
          <View style={styles.audioContainer}>
            <TouchableOpacity 
              style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
              onPress={playAudio}
              disabled={isPlaying}
            >
              <Ionicons 
                name={isPlaying ? "volume-high" : "play"} 
                size={40} 
                color={isPlaying ? "#9ca3af" : "#6366f1"} 
              />
            </TouchableOpacity>
            <Text style={styles.playText}>
              {isPlaying ? 'Playing...' : 'Tap to hear the word'}
            </Text>
          </View>
          
          <Text style={styles.instructionText}>
            Type what you hear in English:
          </Text>
          
          <TextInput
            style={[
              styles.input,
              showResult && isCorrect && styles.inputCorrect,
              showResult && !isCorrect && styles.inputIncorrect
            ]}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Type the word you heard..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!showResult}
          />
          
          {showResult && (
            <View style={styles.resultContainer}>
              <View style={styles.resultRow}>
                <Ionicons 
                  name={isCorrect ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={isCorrect ? "#10b981" : "#ef4444"} 
                />
                <Text style={[
                  styles.resultText,
                  isCorrect ? styles.resultTextCorrect : styles.resultTextIncorrect
                ]}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Text>
              </View>
              
              {!isCorrect && (
                <Text style={styles.correctAnswerText}>
                  Correct answer: {currentVocab.english_term}
                </Text>
              )}
              
              <Text style={styles.definitionText}>
                {currentVocab.definition}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.submitButton, !userInput.trim() && styles.submitButtonDisabled]}
          onPress={checkAnswer}
          disabled={!userInput.trim() || showResult}
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
    alignItems: 'center',
  },
  audioContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  playButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#9ca3af',
  },
  playText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  inputCorrect: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  inputIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  resultContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
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
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
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
