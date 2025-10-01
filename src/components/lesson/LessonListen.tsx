import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

interface LessonListenProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
  onProgressUpdate?: (questionIndex: number) => void;
  initialQuestionIndex?: number;
}

export default function LessonListen({ 
  vocabulary, 
  onComplete, 
  onClose, 
  onProgressUpdate, 
  initialQuestionIndex = 0 
}: LessonListenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentIndex);
    }
  }, [currentIndex]);

  const currentVocab = vocabulary[currentIndex];

  const playAudio = async () => {
    if (isPlaying || !currentVocab) return;
    
    try {
      setIsPlaying(true);
      // Use keywords (AI-generated lessons) or english_term (general vocab)
      const textToSpeak = currentVocab.keywords || currentVocab.english_term || currentVocab.term;
      
      console.log('🔊 Playing audio for:', textToSpeak);
      
      if (!textToSpeak || textToSpeak === 'undefined') {
        console.error('🔊 No valid text to speak! Vocab:', currentVocab);
        setIsPlaying(false);
        return;
      }
      
      // Stop any currently playing speech
      Speech.stop();
      
      await Speech.speak(textToSpeak, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        volume: 1.0,
        onDone: () => {
          console.log('🔊 Audio playback completed');
          setIsPlaying(false);
        },
        onStopped: () => {
          console.log('🔊 Audio playback stopped');
          setIsPlaying(false);
        },
        onError: (error) => {
          console.error('🔊 Audio playback error:', error);
          setIsPlaying(false);
        },
      });
      
      // Fallback: Reset playing state after 5 seconds max
      setTimeout(() => {
        if (isPlaying) {
          console.log('🔊 Audio playback timeout - resetting state');
          setIsPlaying(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    
    const correctAnswer = (currentVocab.keywords || currentVocab.english_term || currentVocab.term).toLowerCase().trim();
    const userAnswer = userInput.toLowerCase().trim();
    
    const correct = userAnswer === correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentIndex < vocabulary.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput('');
        setShowResult(false);
      } else {
        // Exercise complete
        const finalScore = score + (correct ? 1 : 0);
        setGameComplete(true);
        onComplete(finalScore);
      }
    }, 2000);
  };

  const skipQuestion = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setShowResult(false);
    } else {
      setGameComplete(true);
      onComplete(score);
    }
  };

  if (gameComplete) {
    const accuracyPercentage = Math.round((score / vocabulary.length) * 100);
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.completionContainer}>
          <View style={styles.completionIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          
          <Text style={styles.completionTitle}>Listen Exercise Complete!</Text>
          <Text style={styles.completionSubtitle}>
            Great job practicing your listening skills
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vocabulary.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{accuracyPercentage}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentVocab) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading exercise...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listen Exercise</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Word {currentIndex + 1} of {vocabulary.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.scoreText}>Score: {score}/{vocabulary.length}</Text>
        </View>

        {/* Audio Player Card */}
        <View style={styles.audioCard}>
          <Text style={styles.instructionText}>Listen and type what you hear</Text>
          
          <TouchableOpacity 
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={playAudio}
            disabled={isPlaying}
          >
            <Ionicons 
              name={isPlaying ? "volume-high" : "play-circle"} 
              size={64} 
              color={isPlaying ? "#10b981" : "#6366f1"} 
            />
            <Text style={styles.playButtonText}>
              {isPlaying ? 'Playing...' : 'Tap to play audio'}
            </Text>
          </TouchableOpacity>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type what you heard..."
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!showResult}
              onSubmitEditing={checkAnswer}
            />
          </View>

          {/* Result */}
          {showResult && (
            <View style={[styles.resultContainer, isCorrect ? styles.resultCorrect : styles.resultIncorrect]}>
              <Ionicons 
                name={isCorrect ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={isCorrect ? "#10b981" : "#ef4444"} 
              />
              <Text style={[styles.resultText, isCorrect ? styles.resultTextCorrect : styles.resultTextIncorrect]}>
                {isCorrect ? 'Correct!' : `Correct answer: ${currentVocab.keywords || currentVocab.english_term || currentVocab.term}`}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {!showResult && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={skipQuestion}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, !userInput.trim() && styles.submitButtonDisabled]}
                onPress={checkAnswer}
                disabled={!userInput.trim()}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Hint */}
          {!showResult && (
            <View style={styles.hintContainer}>
              <Ionicons name="information-circle" size={16} color="#64748b" />
              <Text style={styles.hintText}>
                Play the audio and type exactly what you hear
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  audioCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    marginBottom: 24,
  },
  playButtonActive: {
    backgroundColor: '#d1fae5',
  },
  playButtonText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultCorrect: {
    backgroundColor: '#d1fae5',
  },
  resultIncorrect: {
    backgroundColor: '#fee2e2',
  },
  resultText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  resultTextCorrect: {
    color: '#059669',
  },
  resultTextIncorrect: {
    color: '#dc2626',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  hintText: {
    fontSize: 14,
    color: '#64748b',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completionIcon: {
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
});

