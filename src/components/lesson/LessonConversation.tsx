import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PronunciationCheck from '../PronunciationCheck';
import { PronunciationResult } from '../../lib/pronunciationService';
import { VoiceService } from '../../lib/voiceService';
import { AWSPollyService } from '../../lib/awsPollyService';
import * as Speech from 'expo-speech';
import LeaveConfirmationModal from './LeaveConfirmationModal';

interface LessonConversationProps {
  vocabulary: any[];
  conversationData: {
    conversation: Array<{
      speaker: string;
      message: string;
    }>;
  } | null;
  onComplete: (score: number) => void;
  onClose: () => void;
  userProfile?: any; // Add user profile for language detection
}

export default function LessonConversation({
  vocabulary,
  conversationData,
  onComplete,
  onClose,
  userProfile,
}: LessonConversationProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      type: 'app' | 'user';
      message: string;
    }>
  >([]);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  
  // 5-button functionality state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [hiddenMessages, setHiddenMessages] = useState<Set<number>>(new Set());

  // Initialize with first Assistant message
  useEffect(() => {
    if (conversationData && conversationData.conversation && conversationData.conversation.length > 0) {
      const firstAssistantMsg = conversationData.conversation.find(
        (msg) => msg.speaker === 'Assistant' || msg.speaker === 'Person A'
      );
      if (firstAssistantMsg) {
        setConversationHistory([
          {
            type: 'app',
            message: firstAssistantMsg.message,
          },
        ]);
      }
    }
  }, [conversationData]);

  // Auto-scroll to bottom when conversation history updates
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationHistory]);

  const getCurrentExchange = () => {
    if (!conversationData || !conversationData.conversation) {
      return null;
    }

    const userMessages = conversationData.conversation.filter((msg) => msg.speaker === 'User');
    const assistantMessages = conversationData.conversation.filter(
      (msg) => msg.speaker === 'Assistant' || msg.speaker === 'Person A'
    );

    if (currentExchangeIndex < userMessages.length) {
      const userMsg = userMessages[currentExchangeIndex];
      const assistantMsg = assistantMessages[currentExchangeIndex] || assistantMessages[0];

      return {
        appMessage: assistantMsg.message,
        userMessage: userMsg.message,
      };
    }

    return null;
  };

  const handlePronunciationComplete = (result: PronunciationResult) => {
    const pronunciationScore = result.assessment?.pronunciationScore || 0;
    const passed = pronunciationScore >= 60;

    setIsCorrect(passed);
    setShowResult(true);

    if (passed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore((prev) => prev + 1);

      // Auto-advance after correct answer
      setTimeout(() => {
        handleNextExchange();
      }, 1500);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // 5-button functionality handlers
  const handleAudioPlay = async (text: string, languageCode: string, speed: number) => {
    if (isPlayingAudio) return;
    
    console.log('🎤 Starting AWS Polly speech for personal lesson:', { text, languageCode, speed });
    
    setIsPlayingAudio(true);
    try {
      // Get user's target language from profile and convert to proper language code
      const userLanguageName = userProfile?.target_language;
      if (!userLanguageName) {
        throw new Error('User target language not found in profile');
      }
      
      const awsLanguageCode = AWSPollyService.getLanguageCodeFromName(userLanguageName);
      const voiceId = AWSPollyService.getVoiceForLanguage(awsLanguageCode);
      
      console.log('🎤 Using AWS Polly with voice:', voiceId, 'for language:', awsLanguageCode, '(from user target language:', userLanguageName, ')');
      
      // Use AWS Polly directly for personal lessons (higher quality TTS)
      await AWSPollyService.playSpeech(text, {
        voiceId,
        languageCode: awsLanguageCode,
        engine: 'standard', // Use standard engine for cost efficiency
        rate: speed,
        pitch: 1.0,
        volume: 0.8
      });
      
      console.log('✅ AWS Polly TTS completed for personal lesson conversation');
      setIsPlayingAudio(false);
      
    } catch (error) {
      console.error('❌ AWS Polly TTS error for personal lesson conversation:', error);
      console.log('🔄 Falling back to Expo Speech for personal lesson conversation');
      
      // Fallback to Expo Speech if Polly fails
      try {
        await VoiceService.textToSpeechExpo(text, {
          language: languageCode,
          rate: speed,
          pitch: 1.0,
          volume: 0.8,
        });
        console.log('✅ Expo Speech fallback completed for personal lesson conversation');
        setIsPlayingAudio(false);
      } catch (fallbackError) {
        console.error('❌ Expo Speech fallback also failed:', fallbackError);
        setIsPlayingAudio(false);
        Alert.alert(
          'Audio Unavailable',
          'Audio playback is currently unavailable. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleNormalSpeedPlay = (text: string, languageCode: string) => {
    handleAudioPlay(text, languageCode, 1.0);
  };

  const handleSlowSpeedPlay = (text: string, languageCode: string) => {
    handleAudioPlay(text, languageCode, 0.7);
  };

  const handleToggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  const handleToggleHideMessage = (messageIndex: number) => {
    const newHiddenMessages = new Set(hiddenMessages);
    if (newHiddenMessages.has(messageIndex)) {
      newHiddenMessages.delete(messageIndex);
    } else {
      newHiddenMessages.add(messageIndex);
    }
    setHiddenMessages(newHiddenMessages);
  };

  const handleShowLearningResources = (text: string) => {
    // Show modal with learning resources
    Alert.alert(
      'Learning Resources',
      `Grammar and vocabulary help for: "${text}"`,
      [
        { text: 'Grammar Help', onPress: () => console.log('Show grammar') },
        { text: 'Vocabulary', onPress: () => console.log('Show vocabulary') },
        { text: 'Practice', onPress: () => console.log('Show practice') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Helper function to get speech language code
  const getSpeechLanguageCode = (language: string): string => {
    const languageMap: { [key: string]: string } = {
      'en': 'en-US',
      'en-US': 'en-US',
      'en-GB': 'en-GB',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'de': 'de-DE',
      'zh': 'zh-CN',
      'hi': 'hi-IN',
    };
    return languageMap[language] || 'en-US';
  };

  const handleNextExchange = () => {
    const currentExchange = getCurrentExchange();
    if (!currentExchange) return;

    // Add user message to history
    setConversationHistory((prev) => [
      ...prev,
      {
        type: 'user',
        message: currentExchange.userMessage,
      },
    ]);

    const nextIndex = currentExchangeIndex + 1;
    const totalExchanges =
      conversationData?.conversation.filter((msg) => msg.speaker === 'User').length || 0;

    if (nextIndex < totalExchanges) {
      setCurrentExchangeIndex(nextIndex);
      setShowResult(false);
      setIsCorrect(false);
      setAttemptKey((prev) => prev + 1);

      // Add next assistant message
      const nextAssistantMsg = conversationData?.conversation.filter(
        (msg) => msg.speaker === 'Assistant' || msg.speaker === 'Person A'
      )[nextIndex];

      if (nextAssistantMsg) {
        setTimeout(() => {
          setConversationHistory((prev) => [
            ...prev,
            {
              type: 'app',
              message: nextAssistantMsg.message,
            },
          ]);
        }, 500);
      }
    } else {
      setCompleted(true);
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setAttemptKey((prev) => prev + 1);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleNextExchange();
  };

  const handleRetryLesson = () => {
    setConversationHistory([]);
    setCurrentExchangeIndex(0);
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setCompleted(false);
    setAttemptKey(0);

    if (conversationData && conversationData.conversation && conversationData.conversation.length > 0) {
      const firstAssistantMsg = conversationData.conversation.find(
        (msg) => msg.speaker === 'Assistant' || msg.speaker === 'Person A'
      );
      if (firstAssistantMsg) {
        setConversationHistory([
          {
            type: 'app',
            message: firstAssistantMsg.message,
          },
        ]);
      }
    }
  };

  const handleContinue = () => {
    onComplete(score);
    onClose();
  };

  const handleClose = () => {
    setShowLeaveModal(true);
  };

  const totalExchanges =
    conversationData?.conversation.filter((msg) => msg.speaker === 'User').length || 0;
  const currentExchange = getCurrentExchange();

  if (!conversationData || conversationData.conversation.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
        <LeaveConfirmationModal visible={showLeaveModal} onLeave={onClose} onCancel={() => setShowLeaveModal(false)} />
      </SafeAreaView>
    );
  }

  if (completed) {
    const accuracyPercentage = totalExchanges > 0 ? Math.round((score / totalExchanges) * 100) : 0;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation Complete!</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.completionScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>

            <Text style={styles.completionTitle}>🎉 Outstanding Work!</Text>
            <Text style={styles.completionSubtitle}>Great job practicing your conversation skills</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Passed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalExchanges}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{accuracyPercentage}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>

            <View style={styles.performanceContainer}>
              <Text style={styles.performanceText}>
                {score === totalExchanges
                  ? "Perfect! You nailed every exchange! 🌟"
                  : score >= totalExchanges * 0.8
                  ? "Excellent! You're mastering conversations! 🎯"
                  : score >= totalExchanges * 0.6
                  ? "Great job! Keep practicing to improve! 💪"
                  : "Nice try! Practice makes perfect! 🚀"}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetryLesson}>
                <Ionicons name="refresh" size={20} color="#6366f1" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <LeaveConfirmationModal visible={showLeaveModal} onLeave={onClose} onCancel={() => setShowLeaveModal(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversation</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSegments}>
          {Array.from({ length: totalExchanges }).map((_, idx) => (
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

      {/* Scrollable Chat History */}
      <ScrollView ref={scrollViewRef} style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
        {conversationHistory.map((message, index) => (
          <View key={index}>
            {message.type === 'app' && (
              <View style={styles.chatMessageLeft}>
                <Text style={styles.chatSenderName}>Thomas</Text>
                <View style={styles.chatBubbleThomas}>
                  <Text style={styles.chatBubblePrimary}>{message.message}</Text>
                  <View style={styles.chatBubbleActions}>
                    <TouchableOpacity 
                      style={[styles.chatActionIcon, isPlayingAudio && styles.chatActionIconActive]}
                      onPress={() => {
                        // For target language text, use target language voice (English)
                        handleNormalSpeedPlay(message.message, getSpeechLanguageCode('en-GB'));
                      }}
                    >
                      <Ionicons 
                        name="volume-high" 
                        size={16} 
                        color={isPlayingAudio ? "#ffffff" : "rgba(255,255,255,0.8)"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.chatActionIcon, isPlayingAudio && styles.chatActionIconActive]}
                      onPress={() => {
                        // For target language text, use target language voice (English)
                        handleSlowSpeedPlay(message.message, getSpeechLanguageCode('en-GB'));
                      }}
                    >
                      <Ionicons 
                        name="time" 
                        size={16} 
                        color={isPlayingAudio ? "#ffffff" : "rgba(255,255,255,0.8)"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.chatActionIcon}
                      onPress={() => handleToggleTranslation()}
                    >
                      <Ionicons 
                        name="swap-horizontal" 
                        size={16} 
                        color="rgba(255,255,255,0.8)" 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.chatActionIcon}
                      onPress={() => handleToggleHideMessage(index)}
                    >
                      <Ionicons 
                        name={hiddenMessages.has(index) ? "eye-off" : "eye"} 
                        size={16} 
                        color="rgba(255,255,255,0.8)" 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.chatActionIcon}
                      onPress={() => handleShowLearningResources(message.message)}
                    >
                      <Ionicons name="school" size={16} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            {message.type === 'user' && (
              <View style={styles.chatMessageRight}>
                <View style={styles.chatBubbleUser}>
                  <Text style={styles.chatBubbleUserPrimary}>{message.message}</Text>
                  <View style={styles.chatBubbleActions}>
                    <TouchableOpacity style={styles.chatActionIcon}>
                      <Ionicons name="volume-high" size={16} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatActionIcon}>
                      <Ionicons name="wifi" size={16} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatActionIcon}>
                      <Ionicons name="swap-horizontal" size={16} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatActionIcon}>
                      <Ionicons name="stats-chart" size={16} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatActionIcon}>
                      <Ionicons name="school" size={16} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Pinned Bottom Section: Current Question + Answer Interface */}
      {currentExchange && currentExchangeIndex < totalExchanges && (
        <View style={styles.bottomPinnedSection}>
          <Text style={styles.questionLabel}>SAY THIS PHRASE</Text>

          <Text style={styles.currentPrompt}>{currentExchange.userMessage}</Text>

          {!showResult && (
            <PronunciationCheck
              key={`${currentExchangeIndex}-${attemptKey}`}
              word={currentExchange.userMessage}
              onResult={handlePronunciationComplete}
              maxRecordingDuration={8000}
              showAlerts={false}
              hideScoreRing={true}
              hideWordDisplay={true}
            />
          )}

          {showResult && !isCorrect && (
            <View style={styles.feedbackIncorrectSection}>
              <Text style={styles.feedbackIncorrect}>❌ Incorrect - Try again!</Text>
              <View style={styles.retrySkipButtons}>
                <TouchableOpacity style={styles.retryExerciseButton} onPress={handleRetry}>
                  <Text style={styles.retryExerciseButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {showResult && isCorrect && <Text style={styles.feedbackCorrect}>✓ Correct!</Text>}
        </View>
      )}

      <LeaveConfirmationModal visible={showLeaveModal} onLeave={onClose} onCancel={() => setShowLeaveModal(false)} />
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
  chatScroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  chatContent: {
    padding: 16,
    paddingBottom: 8,
  },
  chatMessageLeft: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginBottom: 16,
  },
  chatMessageRight: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: 16,
  },
  chatSenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    marginLeft: 4,
  },
  chatBubbleThomas: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  chatBubbleUser: {
    backgroundColor: '#a78bfa',
    padding: 16,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  chatBubblePrimary: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 22,
  },
  chatBubbleUserPrimary: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 22,
  },
  chatBubbleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatActionIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomPinnedSection: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textAlign: 'center',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  currentPrompt: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackIncorrectSection: {
    marginTop: 12,
  },
  feedbackIncorrect: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackCorrect: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
    marginTop: 12,
  },
  retrySkipButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retryExerciseButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryExerciseButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
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
  completionScrollView: {
    flex: 1,
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
    width: '100%',
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
  performanceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  performanceText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
