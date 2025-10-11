import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import PronunciationCheck from '../components/PronunciationCheck';
import { PronunciationResult } from '../lib/pronunciationService';
import { UnitDataAdapter, UnitConversationExchange } from '../lib/unitDataAdapter';
import { logger } from '../lib/logger';

// Hardcoded conversation dialogue (same as Write)
const CONVERSATION = [
  {
    appMessage: { french: 'Bonjour !', english: 'Hello / Good morning!' },
    userMessage: { french: 'Salut, ça va ?', english: 'Hi, how are you?' },
  },
  {
    appMessage: { french: 'Ça va, merci. Et toi ?', english: "I'm fine, thanks. And you?" },
    userMessage: { french: 'Bien, merci. Bonjour !', english: 'Good, thanks. Hello!' },
  },
  {
    appMessage: { french: 'Bon après-midi !', english: 'Good afternoon!' },
    userMessage: { french: 'Merci, bon après-midi à toi aussi.', english: 'Thanks, good afternoon to you too.' },
  },
  {
    appMessage: { french: 'Bonsoir !', english: 'Good evening!' },
    userMessage: { french: 'Bonsoir !', english: 'Good evening!' },
  },
  {
    appMessage: { french: "S'il vous plaît, comment allez-vous ?", english: 'Please, how are you?' },
    userMessage: { french: 'Très bien, merci. Et vous ?', english: 'Very well, thank you. And you?' },
  },
  {
    appMessage: { french: 'Bien, merci beaucoup.', english: 'Fine, thank you very much.' },
    userMessage: { french: 'Bonne soirée !', english: 'Have a good evening!' },
  },
  {
    appMessage: { french: 'Au revoir !', english: 'Goodbye!' },
    userMessage: { french: 'Au revoir !', english: 'Goodbye!' },
  },
];

export default function UnitRoleplayScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { unitTitle, subjectName, cefrLevel } = (route.params as any) || { 
    unitTitle: 'Saying Hello', 
    subjectName: 'Asking About Location',
    cefrLevel: 'A1'
  };
  
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'app' | 'user';
    french: string;
    english: string;
  }>>([]);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const [lastResult, setLastResult] = useState<PronunciationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationExchanges, setConversationExchanges] = useState<UnitConversationExchange[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversation from lesson scripts
  useEffect(() => {
    loadConversation();
  }, [subjectName, cefrLevel]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      logger.info(`🎭 Loading conversation for subject: ${subjectName} (${cefrLevel})`);
      
      const nativeLanguage = profile?.native_language || 'French';
      const exchanges = await UnitDataAdapter.getUnitConversationFromScript(subjectName, cefrLevel, nativeLanguage);
      
      if (exchanges.length === 0) {
        logger.warn(`⚠️ No conversation found for subject: ${subjectName}`);
        // Fallback to original hardcoded data
        setConversationExchanges(CONVERSATION.map((item, index) => ({
          id: `exchange_${index + 1}`,
          speaker: index % 2 === 0 ? 'user' : 'assistant',
          text: item.userMessage.french,
          translation: item.userMessage.english,
          type: index === 0 ? 'greeting' : index === CONVERSATION.length - 1 ? 'farewell' : 'response'
        })));
      } else {
        setConversationExchanges(exchanges);
        logger.info(`✅ Loaded ${exchanges.length} conversation exchanges from lesson scripts`);
      }
    } catch (error) {
      logger.error('Error loading conversation:', error);
      // Fallback to original hardcoded data
      setConversationExchanges(CONVERSATION.map((item, index) => ({
        id: `exchange_${index + 1}`,
        speaker: index % 2 === 0 ? 'user' : 'assistant',
        text: item.userMessage.french,
        translation: item.userMessage.english,
        type: index === 0 ? 'greeting' : index === CONVERSATION.length - 1 ? 'farewell' : 'response'
      })));
    } finally {
      setLoading(false);
    }
  };

  const currentExchange = conversationExchanges.length > 0 && currentExchangeIndex < conversationExchanges.length
    ? {
        userMessage: {
          french: conversationExchanges[currentExchangeIndex].text,
          english: conversationExchanges[currentExchangeIndex].translation
        },
        appMessage: currentExchangeIndex > 0 ? {
          french: conversationExchanges[currentExchangeIndex - 1].text,
          english: conversationExchanges[currentExchangeIndex - 1].translation
        } : { french: '', english: '' }
      }
    : CONVERSATION[currentExchangeIndex] || CONVERSATION[0];
  const isLastExchange = currentExchangeIndex === (conversationExchanges.length > 0 ? conversationExchanges.length - 1 : CONVERSATION.length - 1);

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

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationHistory]);

  const handlePronunciationComplete = async (result: PronunciationResult) => {
    if (!result.success || !result.assessment) return;

    const pronunciationScore = result.assessment.pronunciationScore;
    setLastResult(result);
    
    // Consider score >= 60 as passing
    const passed = pronunciationScore >= 60;
    setIsCorrect(passed);
    setShowResult(true);
    
    if (passed) {
      setScore(score + 1);
      
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
        setShowResult(false);
        setAttemptKey(attemptKey + 1);

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
    setShowResult(false);
    setIsCorrect(false);
    setAttemptKey(attemptKey + 1);
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
    setShowResult(false);
    setIsCorrect(false);
    setAttemptKey(attemptKey + 1);

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
        <Text style={styles.completionTitle}>🎉 Roleplay Complete!</Text>
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
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={() => {
              setConversationHistory([{
                type: 'app',
                french: CONVERSATION[0].appMessage.french,
                english: CONVERSATION[0].appMessage.english,
              }]);
              setCurrentExchangeIndex(0);
              setScore(0);
              setCompleted(false);
              setShowResult(false);
              setAttemptKey(0);
            }}
          >
            <Text style={styles.resetButtonText}>Retry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exitButton} onPress={handleContinue}>
            <Text style={styles.exitButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - Roleplay</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{unitTitle} - Roleplay</Text>
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

      {/* Speech Input Area */}
      {currentExchangeIndex < CONVERSATION.length && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputTitle}>SAY YOUR RESPONSE</Text>
          <Text style={styles.responsePrompt}>{currentExchange.userMessage.english}</Text>

          {/* Pronunciation Check Component - Hide the text, show only record button */}
          {!showResult && (
            <PronunciationCheck
              key={`${currentExchangeIndex}-${attemptKey}`}
              word={currentExchange.userMessage.french}
              onComplete={handlePronunciationComplete}
              maxRecordingDuration={8000}
              showAlerts={false}
              hideScoreRing={true}
              hideWordDisplay={true}
            />
          )}

          {/* Result Message */}
          {showResult && (
            <View style={styles.resultMessage}>
              <Text style={[
                styles.resultTitle,
                isCorrect ? styles.resultTitleCorrect : styles.resultTitleIncorrect
              ]}>
                {isCorrect ? 'You got this 🙌' : 'Incorrect! 😔'}
              </Text>
              
              {!isCorrect && lastResult?.assessment && (
                <>
                  <Text style={styles.resultSubtitle}>
                    It sounded as if you said:
                  </Text>
                  <Text style={styles.recognizedSpeech}>
                    {lastResult.assessment.recognizedText || 'No speech detected'}
                  </Text>
                  
                  <View style={styles.metrics}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Accuracy:</Text>
                      <Text style={styles.metricValue}>
                        {Math.round(lastResult.assessment.accuracyScore)}/100
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Fluency:</Text>
                      <Text style={styles.metricValue}>
                        {Math.round(lastResult.assessment.fluencyScore)}/100
                      </Text>
                    </View>
                  </View>

                  <View style={styles.incorrectActions}>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                      <Text style={styles.skipButtonText}>Skip</Text>
                      <Ionicons name="arrow-forward" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      )}
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
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  responsePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultMessage: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultTitleCorrect: {
    color: '#10b981',
  },
  resultTitleIncorrect: {
    color: '#ef4444',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  recognizedSpeech: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  metrics: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  incorrectActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
});

