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
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n';
import { VoiceService } from '../../lib/voiceService';
import { AWSPollyService } from '../../lib/awsPollyService';
import { VocabularyInterpretationService } from '../../lib/vocabularyInterpretationService';
import LeaveConfirmationModal from './LeaveConfirmationModal';
import AnimatedAvatar from '../avatar/AnimatedAvatar';
import { useAvatarAnimation } from '../../hooks/useAvatarAnimation';

interface LessonListenProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
  onProgressUpdate?: (questionIndex: number) => void;
  initialQuestionIndex?: number;
  userProfile?: any; // Add user profile for language detection
}

interface ListenQuestion {
  vocab: any;
  options: string[];
}

export default function LessonListen({ 
  vocabulary, 
  onComplete, 
  onClose, 
  onProgressUpdate, 
  initialQuestionIndex = 0,
  userProfile
}: LessonListenProps) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<ListenQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [userInput, setUserInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1); // 1 = multiple choice, 2 = typing
  const [round1Score, setRound1Score] = useState(0);
  const [round2Score, setRound2Score] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { currentAnimation, triggerCelebration, triggerDisappointed } = useAvatarAnimation();

  // Get user's language pair - memoized to prevent unnecessary re-renders
  const languagePair = React.useMemo(() => ({
    native: userProfile?.native_language || 'en-GB',
    target: userProfile?.target_language || 'en-GB'
  }), [userProfile?.native_language, userProfile?.target_language]);

  // Interpret vocabulary for listen exercise - memoized to prevent unnecessary re-renders
  const interpretedVocabulary = React.useMemo(() => 
    VocabularyInterpretationService.interpretVocabularyListForListen(vocabulary, languagePair),
    [vocabulary, languagePair]
  );

  // Generate questions with multiple choice options
  useEffect(() => {
    const generatedQuestions: ListenQuestion[] = interpretedVocabulary.map((item, index, array) => {
      // Generate 3 wrong options from other vocabulary items
      const wrongOptions = array
        .filter((v, i) => i !== index && v.frontTerm)
        .map(v => v.frontTerm)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      // Combine with correct answer and shuffle
      const correctAnswer = item.frontTerm;
      const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
      
      return {
        vocab: item,
        options: options
      };
    });
    
    setQuestions(generatedQuestions);
  }, [interpretedVocabulary]);

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentIndex);
    }
  }, [currentIndex]);

  const handleClose = () => {
    setShowLeaveModal(true);
  };

  const currentQuestion = questions[currentIndex];
  const currentVocab = currentQuestion?.vocab;

  const playAudio = async () => {
    if (isPlaying || !currentVocab) return;
    
    // Use frontTerm from interpreted vocabulary (target language term)
    const textToSpeak = currentVocab.frontTerm;
    
    if (!textToSpeak || textToSpeak === 'undefined') {
      console.error('🔊 No valid text to speak! Vocab:', currentVocab);
      return;
    }
    
    try {
      setIsPlaying(true);
      console.log('🔊 Playing audio for personal lesson:', textToSpeak);
      
      // Get user's target language from profile and convert to proper language code
      const userLanguageName = userProfile?.target_language;
      if (!userLanguageName) {
        throw new Error('User target language not found in profile');
      }
      
      const languageCode = AWSPollyService.getLanguageCodeFromName(userLanguageName);
      const voiceId = AWSPollyService.getVoiceForLanguage(languageCode);
      
      console.log('🎤 Using AWS Polly with voice:', voiceId, 'for language:', languageCode, '(from user target language:', userLanguageName, ')');
      
      // Use AWS Polly directly for personal lessons (higher quality TTS)
      await AWSPollyService.playSpeech(textToSpeak, {
        voiceId,
        languageCode: languageCode,
        engine: 'standard', // Use standard engine for cost efficiency
        rate: 0.6, // Slower for better comprehension
        pitch: 1.0,
        volume: 1.0
      });
      
      console.log('✅ AWS Polly TTS completed for personal lesson');
      setIsPlaying(false);
      
    } catch (error) {
      console.error('❌ AWS Polly TTS error for personal lesson:', error);
      console.log('🔄 Falling back to Expo Speech for personal lesson');
      
      // Fallback to Expo Speech if Polly fails
      try {
        await VoiceService.textToSpeechExpo(textToSpeak, {
          language: 'en-US',
          rate: 0.6,
          pitch: 1.0,
          volume: 1.0,
        });
        console.log('✅ Expo Speech fallback completed for personal lesson');
      } catch (fallbackError) {
        console.error('❌ Expo Speech fallback also failed:', fallbackError);
      }
      
      setIsPlaying(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    const correctAnswer = currentVocab.frontTerm;
    const correct = option === correctAnswer;
    
    setSelectedOption(option);
    setIsCorrect(correct);
    setShowResult(true);
    
    // Trigger avatar animation based on answer
    if (correct) {
      triggerCelebration();
    } else {
      triggerDisappointed();
    }
    
    // Haptic feedback based on answer
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (currentRound === 1) {
        setRound1Score(round1Score + 1);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    
    const correctAnswer = currentVocab.frontTerm.toLowerCase().trim();
    const userAnswer = userInput.toLowerCase().trim();
    
    const correct = userAnswer === correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Trigger avatar animation based on answer
    if (correct) {
      triggerCelebration();
    } else {
      triggerDisappointed();
    }
    
    // Haptic feedback based on answer
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRound2Score(round2Score + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNextQuestion = () => {
    // Light haptic for moving to next question
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < vocabulary.length - 1) {
      // Move to next question in current round
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setSelectedOption(null);
      setShowResult(false);
    } else {
      // End of round
      if (currentRound === 1) {
        // Start round 2
        setCurrentRound(2);
        setCurrentIndex(0);
        setUserInput('');
        setSelectedOption(null);
        setShowResult(false);
      } else {
        // Both rounds complete
        const totalScore = round1Score + round2Score;
        setScore(totalScore);
        setGameComplete(true);
        // Don't auto-navigate, let user choose Retry or Continue
      }
    }
  };

  const handleRetry = () => {
    // Reset all state to restart the exercise
    setCurrentIndex(0);
    setUserInput('');
    setSelectedOption(null);
    setCurrentRound(1);
    setRound1Score(0);
    setRound2Score(0);
    setScore(0);
    setShowResult(false);
    setIsCorrect(false);
    setGameComplete(false);
    
    // Regenerate questions with new shuffled options using interpreted vocabulary
    const generatedQuestions: ListenQuestion[] = interpretedVocabulary.map((item, index, array) => {
      const wrongOptions = array
        .filter((v, i) => i !== index && v.frontTerm)
        .map(v => v.frontTerm)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const correctAnswer = item.frontTerm;
      const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
      
      return {
        vocab: item,
        options: options
      };
    });
    
    setQuestions(generatedQuestions);
  };

  const handleContinue = () => {
    const totalScore = round1Score + round2Score;
    onComplete(totalScore);
    onClose();
  };

  const skipQuestion = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setSelectedOption(null);
      setShowResult(false);
    } else {
      // End of round
      if (currentRound === 1) {
        // Start round 2
        setCurrentRound(2);
        setCurrentIndex(0);
        setUserInput('');
        setSelectedOption(null);
        setShowResult(false);
      } else {
        // Both rounds complete
        const totalScore = round1Score + round2Score;
        setScore(totalScore);
        setGameComplete(true);
        // Don't auto-navigate, let user choose Retry or Continue
      }
    }
  };

  if (gameComplete) {
    const accuracyPercentage = Math.round((score / (vocabulary.length * 2)) * 100);
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('lessons.exercises.listen')} {t('lessons.exercise')} {t('lessons.exercises.completed')}!</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.completionScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>
            
            <Text style={styles.completionTitle}>🎉 Outstanding Work!</Text>
            <Text style={styles.completionSubtitle}>
              Great job practicing your listening skills
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Total Correct</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{vocabulary.length * 2}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{accuracyPercentage}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>

            {/* Round Breakdown */}
            <View style={styles.roundBreakdown}>
              <Text style={styles.roundBreakdownTitle}>Round Breakdown:</Text>
              <View style={styles.roundStats}>
                <View style={styles.roundStat}>
                  <Text style={styles.roundStatLabel}>Round 1 (Multiple Choice)</Text>
                  <Text style={styles.roundStatValue}>{round1Score} / {vocabulary.length}</Text>
                </View>
                <View style={styles.roundStat}>
                  <Text style={styles.roundStatLabel}>Round 2 (Type Answer)</Text>
                  <Text style={styles.roundStatValue}>{round2Score} / {vocabulary.length}</Text>
                </View>
              </View>
            </View>

            {/* Performance Message */}
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceText}>
                {score === vocabulary.length * 2
                  ? "Perfect! You aced both rounds! 🌟"
                  : score >= vocabulary.length * 2 * 0.8
                  ? "Excellent! You're mastering listening comprehension! 🎯"
                  : score >= vocabulary.length * 2 * 0.6
                  ? "Great job! Keep practicing to improve! 💪"
                  : "Nice try! Practice makes perfect! 🚀"
                }
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Ionicons name="refresh" size={20} color="#6366f1" />
                <Text style={styles.retryButtonText}>{t('lessons.common.retry')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>{t('lessons.common.continue')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Leave Confirmation Modal */}
        <LeaveConfirmationModal
          visible={showLeaveModal}
          onLeave={onClose}
          onCancel={() => setShowLeaveModal(false)}
        />
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
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('lessons.exercises.listen')} {t('lessons.exercise')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {t('lessons.fillBlank.round1')} {currentRound} - {t('lessons.common.word')} {currentIndex + 1} {t('lessons.common.of')} {vocabulary.length}
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

        {/* Audio Player Card */}
        <View style={styles.audioCard}>
          <View style={styles.questionHeader}>
            <AnimatedAvatar size={80} style={styles.questionAvatar} animationType={currentAnimation} showCircle={false} />
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                {currentRound === 1 ? t('lessons.listen.instructions') : t('lessons.listen.typeInstructions')}
              </Text>
            </View>
          </View>
          
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
              {isPlaying ? t('lessons.listen.playing') : t('lessons.listen.playAudio')}
            </Text>
          </TouchableOpacity>

          {/* Round 1: Multiple Choice */}
          {currentRound === 1 ? (
            <View style={styles.optionsContainer}>
              {currentQuestion?.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedOption === option && styles.selectedOption,
                    showResult && option === currentVocab.frontTerm && styles.correctOption,
                    showResult && selectedOption === option && option !== currentVocab.frontTerm && styles.incorrectOption
                  ]}
                  onPress={() => !showResult && handleOptionSelect(option)}
                  disabled={showResult}
                >
                  <Text style={[
                    styles.optionText,
                    selectedOption === option && styles.selectedOptionText,
                    showResult && option === currentVocab.frontTerm && styles.correctOptionText,
                    showResult && selectedOption === option && option !== currentVocab.frontTerm && styles.incorrectOptionText
                  ]}>
                    {option}
                  </Text>
                  {showResult && option === currentVocab.frontTerm && (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  )}
                  {showResult && selectedOption === option && option !== currentVocab.frontTerm && (
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* Round 2: Type Answer */
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
          )}

          {/* Result */}
          {showResult && (
            <View style={styles.resultContainer}>
              <Text style={[styles.resultText, { color: isCorrect ? '#10b981' : '#ef4444' }]}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
              {!isCorrect && (
                <Text style={styles.correctAnswer}>
                  The correct answer is: {currentVocab.keywords || currentVocab.english_term || currentVocab.term}
                </Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {!showResult ? (
            currentRound === 1 ? null : (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.skipButton}
                  onPress={skipQuestion}
                >
                  <Text style={styles.skipButtonText}>{t('lessons.common.skip')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.submitButton, !userInput.trim() && styles.submitButtonDisabled]}
                  onPress={checkAnswer}
                  disabled={!userInput.trim()}
                >
                  <Text style={styles.submitButtonText}>{t('lessons.common.submit')}</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentIndex < vocabulary.length - 1 ? t('lessons.common.next') + ' ' + t('lessons.common.question') : currentRound === 1 ? t('lessons.common.start') + ' ' + t('lessons.fillBlank.round2') : t('lessons.common.finish')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Hint */}
          {!showResult && currentRound === 2 && (
            <View style={styles.hintContainer}>
              <Ionicons name="information-circle" size={16} color="#64748b" />
              <Text style={styles.hintText}>
                Play the audio and type exactly what you hear
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Leave Confirmation Modal */}
      <LeaveConfirmationModal
        visible={showLeaveModal}
        onLeave={onClose}
        onCancel={() => setShowLeaveModal(false)}
      />
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
    padding: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
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
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  questionAvatar: {
    marginRight: 8,
  },
  instructionContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    marginBottom: 12,
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
    marginBottom: 8,
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
  optionsContainer: {
    gap: 12,
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  incorrectOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#10b981',
    fontWeight: '600',
  },
  incorrectOptionText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  correctAnswer: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 0,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  completionScrollView: {
    flex: 1,
  },
  roundBreakdown: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  roundBreakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  roundStats: {
    gap: 12,
  },
  roundStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  roundStatLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  roundStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
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

