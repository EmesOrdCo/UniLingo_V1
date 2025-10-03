import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

// Hardcoded conversation dialogue
const CONVERSATION = [
  {
    appMessage: { french: 'Bonjour !', english: 'Hello / Good morning!' },
    userMessage: { french: 'Salut, ça va ?', english: 'Hi, how are you?' },
    type: 'choice' as const,
    wrongOption: 'tout'
  },
  {
    appMessage: { french: 'Ça va, merci. Et toi ?', english: "I'm fine, thanks. And you?" },
    userMessage: { french: 'Bien, merci. Bonjour !', english: 'Good, thanks. Hello!' },
    type: 'choice' as const,
    wrongOption: 'revoir'
  },
  {
    appMessage: { french: 'Bon après-midi !', english: 'Good afternoon!' },
    userMessage: { french: 'Merci, bon après-midi à toi aussi.', english: 'Thanks, good afternoon to you too.' },
    type: 'choice' as const,
    wrongOption: 'Au revoir !'
  },
  {
    appMessage: { french: 'Bonsoir !', english: 'Good evening!' },
    userMessage: { french: 'Bonsoir !', english: 'Good evening!' },
    type: 'scramble' as const,
  },
  {
    appMessage: { french: "S'il vous plaît, comment allez-vous ?", english: 'Please, how are you?' },
    userMessage: { french: 'Très bien, merci. Et vous ?', english: 'Very well, thank you. And you?' },
    type: 'scramble' as const,
  },
  {
    appMessage: { french: 'Bien, merci beaucoup.', english: 'Fine, thank you very much.' },
    userMessage: { french: 'Bonne soirée !', english: 'Have a good evening!' },
    type: 'scramble' as const,
  },
  {
    appMessage: { french: 'Au revoir !', english: 'Goodbye!' },
    userMessage: { french: 'Au revoir !', english: 'Goodbye!' },
    type: 'scramble' as const,
  },
];

export default function UnitWriteScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'app' | 'user';
    french: string;
    english: string;
  }>>([]);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [checkButtonText, setCheckButtonText] = useState('Check');

  const currentExchange = CONVERSATION[currentExchangeIndex] || CONVERSATION[0];
  const isLastExchange = currentExchangeIndex === CONVERSATION.length - 1;

  // Initialize first app message
  useEffect(() => {
    if (conversationHistory.length === 0 && !completed) {
      setConversationHistory([{
        type: 'app',
        french: CONVERSATION[0].appMessage.french,
        english: CONVERSATION[0].appMessage.english,
      }]);
    }
  }, []);

  // Initialize scramble words when needed
  useEffect(() => {
    if (!completed && currentExchangeIndex < CONVERSATION.length) {
      const exchange = CONVERSATION[currentExchangeIndex];
      if (exchange && exchange.type === 'scramble' && conversationHistory.length > 0) {
        const words = exchange.userMessage.french.split(' ');
        setAvailableWords([...words].sort(() => Math.random() - 0.5));
        setUserAnswer([]);
      }
    }
  }, [currentExchangeIndex, conversationHistory.length, completed]);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationHistory]);

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleWordPress = (word: string, fromAnswer: boolean) => {
    if (showResult) return;
    
    if (fromAnswer) {
      setUserAnswer(userAnswer.filter(w => w !== word));
      setAvailableWords([...availableWords, word]);
    } else {
      setUserAnswer([...userAnswer, word]);
      setAvailableWords(availableWords.filter(w => w !== word));
    }
  };

  const handleCheck = () => {
    if (currentExchange.type === 'choice' && !selectedAnswer) return;
    if (currentExchange.type === 'scramble' && userAnswer.length === 0) return;

    let correct = false;
    if (currentExchange.type === 'choice') {
      correct = selectedAnswer === currentExchange.userMessage.french;
    } else {
      const userSentence = userAnswer.join(' ');
      correct = userSentence === currentExchange.userMessage.french;
    }

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(score + 1);
      setCheckButtonText('Correct! ✓');
      
      // After 1 second, add user message to chat and move to next
      setTimeout(() => {
        const newHistory = [
          ...conversationHistory,
          {
            type: 'user' as const,
            french: currentExchange.userMessage.french,
            english: currentExchange.userMessage.english,
          }
        ];

        if (!isLastExchange) {
          // Add next app message
          newHistory.push({
            type: 'app' as const,
            french: CONVERSATION[currentExchangeIndex + 1].appMessage.french,
            english: CONVERSATION[currentExchangeIndex + 1].appMessage.english,
          });
        }

        setConversationHistory(newHistory);
        setCurrentExchangeIndex(currentExchangeIndex + 1);
        setSelectedAnswer(null);
        setUserAnswer([]);
        setAvailableWords([]);
        setShowResult(false);
        setCheckButtonText('Check');

        if (isLastExchange) {
          // Show completion after brief delay
          setTimeout(() => {
            setCompleted(true);
          }, 500);
        }
      }, 1000);
    }
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setUserAnswer([]);
    if (currentExchange.type === 'scramble') {
      const words = currentExchange.userMessage.french.split(' ');
      setAvailableWords([...words].sort(() => Math.random() - 0.5));
    }
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleSkip = () => {
    const newHistory = [
      ...conversationHistory,
      {
        type: 'user' as const,
        french: currentExchange.userMessage.french,
        english: currentExchange.userMessage.english,
      }
    ];

    if (!isLastExchange) {
      newHistory.push({
        type: 'app' as const,
        french: CONVERSATION[currentExchangeIndex + 1].appMessage.french,
        english: CONVERSATION[currentExchangeIndex + 1].appMessage.english,
      });
    }

    setConversationHistory(newHistory);
    setCurrentExchangeIndex(currentExchangeIndex + 1);
    setSelectedAnswer(null);
    setUserAnswer([]);
    setAvailableWords([]);
    setShowResult(false);
    setIsCorrect(false);

    if (isLastExchange) {
      setTimeout(() => {
        setCompleted(true);
      }, 500);
    }
  };

  const handleContinue = () => {
    navigation.goBack();
  };

  const handleBackPress = () => {
    if (completed) {
      navigation.goBack();
    } else {
      setShowExitModal(true);
    }
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    navigation.goBack();
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  if (completed) {
    const accuracyPercentage = Math.round((score / CONVERSATION.length) * 100);
    
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.completionTitle}>🎉 Write Complete!</Text>
        <Text style={styles.completionSubtitle}>Great job!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}/{CONVERSATION.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Percentage</Text>
            <Text style={styles.statValue}>{accuracyPercentage}%</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={() => {
            setConversationHistory([{
              type: 'app',
              french: CONVERSATION[0].appMessage.french,
              english: CONVERSATION[0].appMessage.english,
            }]);
            setCurrentExchangeIndex(0);
            setScore(0);
            setCompleted(false);
            setSelectedAnswer(null);
            setShowResult(false);
            setUserAnswer([]);
            setAvailableWords([]);
            setCheckButtonText('Check');
          }}>
            <Text style={styles.resetButtonText}>Retry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exitButton} onPress={handleContinue}>
            <Text style={styles.exitButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saying Hello</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure you want to leave?</Text>
            <Text style={styles.modalSubtitle}>
              Your progress won't be saved for this lesson, and you'll have to start again when you return.
            </Text>
            
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmExit}>
              <Text style={styles.modalConfirmButtonText}>Yes, I want to leave</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelExit}>
              <Text style={styles.modalCancelButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSegments}>
          {CONVERSATION.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressSegment,
                idx < currentExchangeIndex && styles.progressSegmentCompleted,
                idx === currentExchangeIndex && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Conversation History */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.conversationScroll}
        contentContainerStyle={styles.conversationContent}
      >
        {conversationHistory.map((message, index) => (
          <View key={index} style={[
            styles.messageWrapper,
            message.type === 'user' && styles.messageWrapperUser
          ]}>
            {message.type === 'app' && (
              <Text style={styles.messageName}>Thomas</Text>
            )}
            <View
              style={[
                styles.messageBubble,
                message.type === 'app' ? styles.appMessageBubble : styles.userMessageBubble
              ]}
            >
              <Text style={[
                styles.messageFrench,
                message.type === 'user' && styles.userMessageFrench
              ]}>
                {message.french}
              </Text>
              <Text style={[
                styles.messageEnglish,
                message.type === 'user' && styles.userMessageEnglish
              ]}>
                {message.english}
              </Text>
              
              {/* Action Buttons */}
              <View style={styles.messageActions}>
                <TouchableOpacity style={styles.messageActionButton}>
                  <Ionicons name="volume-high" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageActionButton}>
                  <Ionicons name="wifi" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageActionButton}>
                  <Ionicons name="swap-horizontal" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageActionButton}>
                  <Ionicons name="bar-chart" size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageActionButton}>
                  <Ionicons name="school" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      {currentExchangeIndex < CONVERSATION.length && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputTitle}>
            {currentExchange.type === 'choice' ? 'TAP THE CORRECT ANSWER' : 'CORRECT THE ORDERING'}
          </Text>

          {currentExchange.type === 'choice' ? (
            // Multiple Choice
            <View style={styles.choiceContainer}>
              <Text style={styles.choicePrompt}>{currentExchange.userMessage.english}</Text>
              
              <TouchableOpacity
                style={[
                  styles.choiceButton,
                  selectedAnswer === currentExchange.userMessage.french && !showResult && styles.choiceButtonSelected,
                  showResult && selectedAnswer === currentExchange.userMessage.french && isCorrect && styles.choiceButtonCorrect,
                  showResult && selectedAnswer === currentExchange.userMessage.french && !isCorrect && styles.choiceButtonIncorrect,
                ]}
                onPress={() => handleAnswerSelect(currentExchange.userMessage.french)}
                disabled={showResult}
              >
                <Text style={[
                  styles.choiceButtonText,
                  selectedAnswer === currentExchange.userMessage.french && !showResult && styles.choiceButtonTextSelected,
                  showResult && selectedAnswer === currentExchange.userMessage.french && isCorrect && styles.choiceButtonTextCorrect,
                  showResult && selectedAnswer === currentExchange.userMessage.french && !isCorrect && styles.choiceButtonTextIncorrect,
                ]}>
                  {currentExchange.userMessage.french}
                </Text>
                {showResult && selectedAnswer === currentExchange.userMessage.french && isCorrect && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
                {showResult && selectedAnswer === currentExchange.userMessage.french && !isCorrect && (
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.choiceButton,
                  selectedAnswer === currentExchange.wrongOption && !showResult && styles.choiceButtonSelected,
                  showResult && selectedAnswer === currentExchange.wrongOption && styles.choiceButtonIncorrect,
                ]}
                onPress={() => handleAnswerSelect(currentExchange.wrongOption)}
                disabled={showResult}
              >
                <Text style={[
                  styles.choiceButtonText,
                  selectedAnswer === currentExchange.wrongOption && !showResult && styles.choiceButtonTextSelected,
                  showResult && selectedAnswer === currentExchange.wrongOption && styles.choiceButtonTextIncorrect,
                ]}>
                  {currentExchange.wrongOption}
                </Text>
                {showResult && selectedAnswer === currentExchange.wrongOption && (
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // Sentence Scramble
            <View style={styles.scrambleContainer}>
              <Text style={styles.scramblePrompt}>{currentExchange.userMessage.english}</Text>
              
              {/* User Answer Area */}
              <View style={styles.answerArea}>
                {userAnswer.map((word, index) => (
                  <TouchableOpacity
                    key={`answer-${index}`}
                    style={styles.wordChip}
                    onPress={() => handleWordPress(word, true)}
                    disabled={showResult}
                  >
                    <Text style={styles.wordChipText}>{word}</Text>
                  </TouchableOpacity>
                ))}
                {userAnswer.length === 0 && (
                  <Text style={styles.placeholderText}>Tap the words below</Text>
                )}
              </View>

              {/* Available Words */}
              <View style={styles.wordsContainer}>
                {availableWords.map((word, index) => (
                  <TouchableOpacity
                    key={`available-${index}`}
                    style={styles.wordChip}
                    onPress={() => handleWordPress(word, false)}
                    disabled={showResult}
                  >
                    <Text style={styles.wordChipText}>{word}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Result Message */}
          {showResult && !isCorrect && (
            <View style={styles.resultMessage}>
              <Text style={styles.resultTitle}>Incorrect! 😔</Text>
              <Text style={styles.resultSubtitle}>
                The correct answer is: {currentExchange.userMessage.french}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {!showResult || isCorrect ? (
          <TouchableOpacity
            style={[
              styles.checkButton,
              (currentExchange.type === 'choice' && !selectedAnswer) || 
              (currentExchange.type === 'scramble' && userAnswer.length === 0) 
                ? styles.checkButtonDisabled 
                : isCorrect 
                ? styles.checkButtonCorrect 
                : null
            ]}
            onPress={handleCheck}
            disabled={
              (currentExchange.type === 'choice' && !selectedAnswer) || 
              (currentExchange.type === 'scramble' && userAnswer.length === 0)
            }
          >
            <Text style={styles.checkButtonText}>{checkButtonText}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.incorrectActions}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
              <Ionicons name="arrow-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  progressSegments: {
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressSegmentCompleted: {
    backgroundColor: '#6366f1',
  },
  progressSegmentActive: {
    backgroundColor: '#6366f1',
  },
  conversationScroll: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  conversationContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
  },
  messageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 16,
  },
  appMessageBubble: {
    backgroundColor: '#6b7fd7',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: '#a78bfa',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageFrench: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  messageEnglish: {
    fontSize: 14,
    color: '#e8e5ff',
  },
  userMessageFrench: {
    color: '#ffffff',
  },
  userMessageEnglish: {
    color: '#f3f0ff',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  choiceContainer: {
    gap: 12,
  },
  choicePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  choiceButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceButtonSelected: {
    borderColor: '#a5d88f',
    backgroundColor: '#f0fdf4',
  },
  choiceButtonCorrect: {
    borderColor: '#10b981',
    backgroundColor: '#dcfce7',
  },
  choiceButtonIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  choiceButtonText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  choiceButtonTextSelected: {
    color: '#166534',
    fontWeight: '600',
  },
  choiceButtonTextCorrect: {
    color: '#166534',
    fontWeight: '600',
  },
  choiceButtonTextIncorrect: {
    color: '#991b1b',
    fontWeight: '600',
  },
  scrambleContainer: {
    gap: 16,
  },
  scramblePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  answerArea: {
    minHeight: 60,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  wordChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  wordChipText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    color: '#94a3af',
    fontSize: 16,
    fontStyle: 'italic',
  },
  resultMessage: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  checkButton: {
    backgroundColor: '#cbd5e1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
  },
  checkButtonCorrect: {
    backgroundColor: '#10b981',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  incorrectActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
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
  actionButtons: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalConfirmButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalConfirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  modalCancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
});
