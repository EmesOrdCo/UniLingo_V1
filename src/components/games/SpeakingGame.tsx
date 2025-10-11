import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PronunciationCheck from '../PronunciationCheck';

interface SpeakingGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number, timeSpent?: number, totalAnswered?: number) => void;
  onPlayAgain: () => void;
}

interface WordResult {
  word: string;
  score: number;
  attempts: number;
  passed: boolean;
}

const SpeakingGame: React.FC<SpeakingGameProps> = ({ 
  gameData, 
  onClose, 
  onGameComplete, 
  onPlayAgain 
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [totalScore, setTotalScore] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [currentWordPassed, setCurrentWordPassed] = useState(false);

  // Use ref to capture final score and prevent multiple calls
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  useEffect(() => {
    if (gameData.questions && gameData.questions.length > 0) {
      initializeGame();
    }
  }, [gameData.questions]);

  const initializeGame = () => {
    setGameStartTime(Date.now());
    setCurrentWordIndex(0);
    setWordResults([]);
    setTotalScore(0);
    setGameComplete(false);
    setCurrentWordPassed(false);
    
    if (gameData.questions[0]) {
      setCurrentWord(gameData.questions[0].correctAnswer);
    }
  };

  const handlePronunciationResult = (result: any) => {
    const score = result.assessment?.pronunciationScore || 0;
    const passed = score >= 60; // 60% threshold for passing
    
    if (passed) {
      // Haptic feedback for passing pronunciation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setCurrentWordPassed(true);
      setTotalScore(prev => prev + score);
      
      // Add to results
      const newResult: WordResult = {
        word: currentWord,
        score: score,
        attempts: 1,
        passed: true
      };
      
      setWordResults(prev => [...prev, newResult]);
      
      // Don't auto-advance, wait for user to click "Next Question"
    } else {
      // Haptic feedback for failing pronunciation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Failed attempt - show result and wait for user to click Next Question
      setCurrentWordPassed(true); // Allow user to proceed
      setTotalScore(prev => prev + score);
      
      const newResult: WordResult = {
        word: currentWord,
        score: score,
        attempts: 1,
        passed: false
      };
      
      setWordResults(prev => [...prev, newResult]);
      
      // Don't auto-advance, wait for user to click "Next Question"
    }
  };

  const moveToNextWord = () => {
    // Light haptic for moving to next question
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const nextIndex = currentWordIndex + 1;
    
    if (nextIndex >= gameData.questions.length) {
      // Game complete - use average score as final score
      const averageScore = wordResults.length > 0 ? Math.round(totalScore / wordResults.length) : 0;
      finalScoreRef.current = averageScore;
      setGameComplete(true);
      
      // Don't call handleGameComplete here - let user action buttons handle it
    } else {
      // Move to next word
      setCurrentWordIndex(nextIndex);
      setCurrentWord(gameData.questions[nextIndex].correctAnswer);
      setCurrentWordPassed(false);
      
      // Reset pronunciation result to show fresh question
      // This will be handled by the PronunciationCheck component's internal state
    }
  };


  const handlePlayAgain = async () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      console.log('🎯 SpeakingGame calling onGameComplete with score:', finalScoreRef.current);
      completionCalledRef.current = true;
      const timeSpent = Math.round((Date.now() - gameStartTime) / 1000);
      const totalAnswered = wordResults.length;
      await onGameComplete(finalScoreRef.current, timeSpent, totalAnswered);
      // Wait a moment for database operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    onPlayAgain();
  };

  const handleExit = async () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      console.log('🎯 SpeakingGame calling onGameComplete with score:', finalScoreRef.current);
      completionCalledRef.current = true;
      const timeSpent = Math.round((Date.now() - gameStartTime) / 1000);
      const totalAnswered = wordResults.length;
      await onGameComplete(finalScoreRef.current, timeSpent, totalAnswered);
      // Wait a moment for database operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    onClose();
  };

  if (gameComplete) {
    const passedWords = wordResults.filter(r => r.passed).length;
    const totalWords = wordResults.length;
    const averageScore = totalWords > 0 ? Math.round(totalScore / totalWords) : 0;

    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>Speaking Game Complete! 🎉</Text>
          <Text style={styles.completionSubtitle}>
            Great job practicing your pronunciation!
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Words Passed</Text>
              <Text style={styles.statValue}>{passedWords}/{totalWords}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg Score</Text>
              <Text style={styles.statValue}>{averageScore}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Score</Text>
              <Text style={styles.statValue}>{Math.round(totalScore)}</Text>
            </View>
          </View>

          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>{averageScore}</Text>
            <Text style={styles.scoreLabel}>Avg Score</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={handlePlayAgain}>
              <Text style={styles.resetButtonText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Word {currentWordIndex + 1} of {gameData.questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentWordIndex + 1) / gameData.questions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {Math.round(totalScore)}</Text>
        </View>
      </View>



      {/* Pronunciation Check Component */}
      <View style={styles.pronunciationContainer}>
        <PronunciationCheck
          key={`pronunciation-${currentWordIndex}`}
          word={currentWord}
          onComplete={handlePronunciationResult}
          disabled={currentWordPassed}
        />
      </View>

      {/* Next Question Button */}
      {currentWordPassed && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={moveToNextWord}>
            <Text style={styles.nextButtonText}>Next Question</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  pronunciationContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  nextButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  scoreLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6466E9',
    paddingHorizontal: 24,
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
    paddingHorizontal: 24,
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

export default SpeakingGame;
