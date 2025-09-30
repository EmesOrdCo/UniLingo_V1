import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [retriesLeft, setRetriesLeft] = useState(1);
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
    setRetriesLeft(1);
    
    if (gameData.questions[0]) {
      setCurrentWord(gameData.questions[0].correctAnswer);
    }
  };

  const handlePronunciationResult = (result: any) => {
    const score = result.assessment?.pronunciationScore || 0;
    const passed = score >= 60; // 60% threshold for passing
    
    if (passed) {
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
      
      // Move to next word after a short delay
      setTimeout(() => {
        moveToNextWord();
      }, 2000);
    } else {
      // Failed attempt
      const newRetriesLeft = retriesLeft - 1;
      setRetriesLeft(newRetriesLeft);
      
      if (newRetriesLeft <= 0) {
        // No retries left, mark as failed and move on
        const newResult: WordResult = {
          word: currentWord,
          score: score,
          attempts: 1,
          passed: false
        };
        
        setWordResults(prev => [...prev, newResult]);
        
        setTimeout(() => {
          moveToNextWord();
        }, 2000);
      }
    }
  };

  const moveToNextWord = () => {
    const nextIndex = currentWordIndex + 1;
    
    if (nextIndex >= gameData.questions.length) {
      // Game complete
      finalScoreRef.current = wordResults.length;
      setGameComplete(true);
    } else {
      // Move to next word
      setCurrentWordIndex(nextIndex);
      setCurrentWord(gameData.questions[nextIndex].correctAnswer);
      setRetriesLeft(1);
      setCurrentWordPassed(false);
    }
  };

  const handleGameComplete = () => {
    if (completionCalledRef.current) return;
    completionCalledRef.current = true;
    
    const timeSpent = Math.round((Date.now() - gameStartTime) / 1000);
    const totalAnswered = wordResults.length;
    
    onGameComplete(finalScoreRef.current, timeSpent, totalAnswered);
  };

  const handlePlayAgain = () => {
    onPlayAgain();
  };

  const handleExit = () => {
    onClose();
  };

  if (gameComplete) {
    const passedWords = wordResults.filter(r => r.passed).length;
    const totalWords = wordResults.length;
    const accuracy = totalWords > 0 ? Math.round((passedWords / totalWords) * 100) : 0;
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
              <Text style={styles.statLabel}>Accuracy</Text>
              <Text style={styles.statValue}>{accuracy}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg Score</Text>
              <Text style={styles.statValue}>{averageScore}</Text>
            </View>
          </View>

          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>{accuracy}%</Text>
            <Text style={styles.scoreLabel}>Accuracy</Text>
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
    <View style={styles.container}>
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
          <Text style={styles.scoreText}>Score: {totalScore}</Text>
        </View>
      </View>

      {/* Current Word Display */}
      <View style={styles.wordContainer}>
        <Text style={styles.wordLabel}>Pronounce this word:</Text>
        <Text style={styles.currentWord}>{currentWord}</Text>
        
        {currentWordPassed && (
          <View style={styles.successIndicator}>
            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            <Text style={styles.successText}>Great job!</Text>
          </View>
        )}
      </View>

      {/* Retries Indicator */}
      <View style={styles.retriesContainer}>
        <Text style={styles.retriesLabel}>Retries left: {retriesLeft}</Text>
        <View style={styles.retriesDots}>
          <View
            style={[
              styles.retryDot,
              retriesLeft > 0 ? styles.retryDotActive : styles.retryDotInactive
            ]}
          />
        </View>
      </View>

      {/* Pronunciation Check Component */}
      <View style={styles.pronunciationContainer}>
        <PronunciationCheck
          word={currentWord}
          onComplete={handlePronunciationResult}
          disabled={currentWordPassed}
        />
      </View>

      {/* Word Results Summary */}
      {wordResults.length > 0 && (
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsTitle}>Recent Results:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.resultsScroll}>
            {wordResults.slice(-5).map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultWord}>{result.word}</Text>
                <View style={[
                  styles.resultScore,
                  result.passed ? styles.resultScorePassed : styles.resultScoreFailed
                ]}>
                  <Text style={styles.resultScoreText}>{result.score}</Text>
                </View>
                <Ionicons 
                  name={result.passed ? "checkmark" : "close"} 
                  size={16} 
                  color={result.passed ? "#10b981" : "#ef4444"} 
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
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
  wordContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  wordLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  currentWord: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  retriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  retriesLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  retriesDots: {
    flexDirection: 'row',
    gap: 8,
  },
  retryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  retryDotActive: {
    backgroundColor: '#6366f1',
  },
  retryDotInactive: {
    backgroundColor: '#e2e8f0',
  },
  pronunciationContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultsSummary: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  resultsScroll: {
    flexDirection: 'row',
  },
  resultItem: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    minWidth: 80,
  },
  resultWord: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  resultScore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  resultScorePassed: {
    backgroundColor: '#f0fdf4',
  },
  resultScoreFailed: {
    backgroundColor: '#fef2f2',
  },
  resultScoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
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
