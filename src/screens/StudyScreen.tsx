import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ConsistentHeader from '../components/ConsistentHeader';


interface StudyRouteParams {
  topic?: string;
  difficulty?: string;
}

export default function StudyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { topic, difficulty } = route.params as StudyRouteParams || {};
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyCards, setStudyCards] = useState([
    {
      id: 1,
      question: 'What is the capital of France?',
      answer: 'Paris',
      topic: 'Geography',
      difficulty: 'Easy'
    },
    {
      id: 2,
      question: 'What is 2 + 2?',
      answer: '4',
      topic: 'Math',
      difficulty: 'Easy'
    },
    {
      id: 3,
      question: 'What is the chemical symbol for gold?',
      answer: 'Au',
      topic: 'Chemistry',
      difficulty: 'Medium'
    }
  ]);


  const currentCard = studyCards[currentCardIndex];

  const handleNextCard = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      Alert.alert(
        'Study Session Complete!',
        'Great job! You\'ve completed all the cards.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Consistent Header */}
      <ConsistentHeader 
        pageName="Study Session"
      />
      
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Card {currentCardIndex + 1} of {studyCards.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentCardIndex + 1) / studyCards.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Study Card */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTopic}>{currentCard.topic}</Text>
          <Text style={styles.cardDifficulty}>{currentCard.difficulty}</Text>
          
          <View style={styles.questionSection}>
            <Text style={styles.questionLabel}>Question:</Text>
            <Text style={styles.questionText}>{currentCard.question}</Text>
          </View>

          <TouchableOpacity 
            style={styles.answerButton} 
            onPress={toggleAnswer}
          >
            <Text style={styles.answerButtonText}>
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </Text>
          </TouchableOpacity>

          {showAnswer && (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Answer:</Text>
              <Text style={styles.answerText}>{currentCard.answer}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[
            styles.navButton, 
            currentCardIndex === 0 && styles.navButtonDisabled
          ]} 
          onPress={handlePreviousCard}
          disabled={currentCardIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={handleNextCard}
        >
          <Text style={styles.navButtonText}>
            {currentCardIndex === studyCards.length - 1 ? 'Finish' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
      
      {/* Profile Modal */}
      
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTopic: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDifficulty: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20,
  },
  questionSection: {
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 18,
    color: '#1e293b',
    lineHeight: 26,
    fontWeight: '500',
  },
  answerButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  answerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  answerSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  answerLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  answerText: {
    fontSize: 18,
    color: '#10b981',
    lineHeight: 26,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
});
