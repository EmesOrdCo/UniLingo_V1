import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function WordScrambleScreen() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const navigation = useNavigation();

  const words = [
    { term: 'Myocardial Infarction', hint: 'Medical emergency involving the heart', subject: 'Medicine' },
    { term: 'Entropy', hint: 'Measure of disorder in thermodynamics', subject: 'Engineering' },
    { term: 'Wave Function', hint: 'Describes quantum state of particles', subject: 'Physics' },
    { term: 'Photosynthesis', hint: 'Process plants use to make food', subject: 'Biology' },
    { term: 'Catalyst', hint: 'Substance that speeds up reactions', subject: 'Chemistry' },
  ];

  const currentWord = words[currentWordIndex];

  const checkAnswer = () => {
    if (userAnswer.trim().toLowerCase() === currentWord.term.toLowerCase()) {
      setScore(score + 1);
      Alert.alert('Correct!', 'Well done!');
      nextWord();
    } else {
      Alert.alert('Incorrect', `The correct answer is: ${currentWord.term}`);
      nextWord();
    }
  };

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserAnswer('');
    } else {
      Alert.alert('Game Complete!', `Final Score: ${score + 1}/${words.length}`);
      resetGame();
    }
  };

  const resetGame = () => {
    setCurrentWordIndex(0);
    setUserAnswer('');
    setScore(0);
  };

  const skipWord = () => {
    Alert.alert('Skipped', `The answer was: ${currentWord.term}`);
    nextWord();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Word Scramble</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentWordIndex + 1} of {words.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentWordIndex + 1) / words.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        <View style={styles.gameCard}>
          <View style={styles.subjectTag}>
            <Text style={styles.subjectText}>{currentWord.subject}</Text>
          </View>
          
          <Text style={styles.hintText}>{currentWord.hint}</Text>
          
          <TextInput
            style={styles.answerInput}
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder="Type your answer here..."
            multiline
            numberOfLines={2}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Check Answer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.skipButton} onPress={skipWord}>
              <Ionicons name="arrow-forward" size={20} color="#6366f1" />
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.resetButtonText}>Reset Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
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
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  gameCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subjectTag: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  subjectText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 18,
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  answerInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    width: '100%',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  checkButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    borderWidth: 2,
    borderColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
