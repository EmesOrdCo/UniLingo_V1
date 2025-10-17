import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import GameCompletionTracker from '../../lib/gameCompletionTracker';
import { getSpeechLanguageCode } from '../../lib/languageService';

interface TypeWhatYouHearGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onPlayAgain: () => void;
}

const TypeWhatYouHearGame: React.FC<TypeWhatYouHearGameProps> = ({ gameData, onClose, onGameComplete, onPlayAgain }) => {
  const componentId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  console.log(`🎧 [${componentId}] TypeWhatYouHearGame component mounted/rendered`);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Use ref to capture final score and prevent multiple calls
  const finalScoreRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completionCalledRef = useRef<boolean>(false);
  const gameCompleteProcessedRef = useRef<boolean>(false);

  // Removed automatic completion call - now handled by user action buttons

  // Removed automatic completion call - now handled by user action

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      console.log(`🎧 [${componentId}] TypeWhatYouHearGame component unmounting`);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentQuestion = gameData.questions[currentQuestionIndex];

  const playAudio = async () => {
    if (!currentQuestion?.correctAnswer) return;
    
    setIsPlaying(true);
    try {
      // Try to determine language from gameData or use English as fallback
      // This component is used in games where the target language should be spoken
      const targetLanguage = gameData?.targetLanguage || 'English';
      const languageCode = getSpeechLanguageCode(targetLanguage);
      
      await Speech.speak(currentQuestion.correctAnswer, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
      
      console.log(`🔊 Speaking: ${currentQuestion.correctAnswer} in ${languageCode} (target: ${targetLanguage})`);
    } catch (error) {
      console.error('Speech error:', error);
      setIsPlaying(false);
    }
  };

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    
    const correct = currentQuestion.correctAnswer.toLowerCase().trim();
    const userInput = userAnswer.toLowerCase().trim();
    
    const correctAnswer = userInput === correct;
    setIsCorrect(correctAnswer);
    
    // Haptic feedback based on answer
    if (correctAnswer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(score + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setShowResult(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      // Light haptic for moving to next question
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (currentQuestionIndex < gameData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setUserAnswer('');
        setShowResult(false);
      } else {
        // Capture final score before completing game
        finalScoreRef.current = score + (correctAnswer ? 1 : 0);
        console.log(`🎧 Setting gameComplete=true in checkAnswer timeout, finalScore: ${finalScoreRef.current}`);
        setGameComplete(true);
      }
      timeoutRef.current = null;
    }, 2000);
  };

  const skipQuestion = () => {
    if (currentQuestionIndex < gameData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setShowResult(false);
    } else {
      // Capture final score before completing game
      finalScoreRef.current = score;
      console.log(`🎧 Setting gameComplete=true in skipQuestion, finalScore: ${finalScoreRef.current}`);
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswer('');
    setShowResult(false);
    setGameComplete(false);
    finalScoreRef.current = 0; // Reset the ref as well
    completionCalledRef.current = false; // Reset completion called flag
    gameCompleteProcessedRef.current = false; // Reset game complete processed flag
    GameCompletionTracker.getInstance().clear(); // Clear global completion tracking
  };

  const handlePlayAgain = () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      console.log('🎯 TypeWhatYouHear calling onGameComplete with score:', finalScoreRef.current);
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current);
    }
    onPlayAgain();
  };

  const handleReturnToMenu = () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      console.log('🎯 TypeWhatYouHear calling onGameComplete with score:', finalScoreRef.current);
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current);
    }
    onClose();
  };

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>🎉 Listen & Type Complete!</Text>
          <Text style={styles.completionSubtitle}>Great job!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{score}/{gameData.questions.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Percentage</Text>
              <Text style={styles.statValue}>{Math.round((score / gameData.questions.length) * 100)}%</Text>
            </View>
          </View>
          
          <View style={styles.completionActionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={handlePlayAgain}>
              <Text style={styles.resetButtonText}>Play Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exitButton} onPress={handleReturnToMenu}>
              <Text style={styles.exitButtonText}>Return to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / gameData.questions.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1} of {gameData.questions.length}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {currentQuestion.question || 'Listen and type what you hear:'}
        </Text>
      </View>

      {/* Audio Play Button */}
      <View style={styles.audioContainer}>
        <TouchableOpacity 
          style={[styles.audioButton, isPlaying && styles.audioButtonPlaying]} 
          onPress={playAudio}
          disabled={isPlaying}
        >
          <Ionicons 
            name={isPlaying ? "volume-high" : "play"} 
            size={32} 
            color={isPlaying ? "#ffffff" : "#6466E9"} 
          />
        </TouchableOpacity>
        <Text style={styles.audioLabel}>
          {isPlaying ? 'Playing...' : 'Tap to hear the word'}
        </Text>
      </View>

      {/* Answer Input */}
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>Type what you heard:</Text>
        <TextInput
          style={styles.answerInput}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Type the word you heard..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!showResult}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.skipButton]} 
          onPress={skipQuestion}
          disabled={showResult}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.submitButton]} 
          onPress={checkAnswer}
          disabled={!userAnswer.trim() || showResult}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Result Message */}
      {showResult && (
        <View style={styles.resultContainer}>
          <View style={[
            styles.resultIcon,
            isCorrect ? styles.resultIconCorrect : styles.resultIconIncorrect
          ]}>
            <Ionicons 
              name={isCorrect ? "checkmark" : "close"} 
              size={32} 
              color="#ffffff" 
            />
          </View>
          
          <Text style={[
            styles.resultText,
            isCorrect ? styles.resultTextCorrect : styles.resultTextIncorrect
          ]}>
            {isCorrect ? 'Correct! 🎉' : 'Incorrect! 😔'}
          </Text>
          
          <Text style={styles.correctAnswerText}>
            The correct answer is: {currentQuestion.correctAnswer}
          </Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progressHeader: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  questionContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 26,
  },
  audioContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  audioButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    borderWidth: 3,
    borderColor: '#6466E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  audioButtonPlaying: {
    backgroundColor: '#6466E9',
    borderColor: '#6466E9',
  },
  audioLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  answerContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  answerLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '500',
  },
  answerInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1e293b',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#6466E9',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultIconCorrect: {
    backgroundColor: '#10b981',
  },
  resultIconIncorrect: {
    backgroundColor: '#ef4444',
  },
  resultText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  resultTextCorrect: {
    color: '#10b981',
  },
  resultTextIncorrect: {
    color: '#ef4444',
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6466E9',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6466E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  completionActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6466E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  exitButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});

export default TypeWhatYouHearGame;
