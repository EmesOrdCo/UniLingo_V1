import React, { useState, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import PronunciationCheck from '../components/PronunciationCheck';
import { PronunciationResult } from '../lib/pronunciationService';
import { UnitDataAdapter, UnitVocabularyItem, UnitSentence } from '../lib/unitDataAdapter';
import { logger } from '../lib/logger';
import { useTranslation } from '../lib/i18n';
import { GeneralLessonProgressService } from '../lib/generalLessonProgressService';
import AnimatedAvatar from '../components/avatar/AnimatedAvatar';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';

// TODO: Move to database or configuration file
// Hardcoded vocabulary for "Saying Hello" - should be loaded from database
const VOCABULARY = [
  { french: 'salut', english: 'hi' },
  { french: 'bonjour', english: 'hello' },
  { french: 'bon après-midi', english: 'good afternoon' },
  { french: 'bonsoir', english: 'good evening' },
  { french: 'au revoir', english: 'goodbye' },
  { french: "s'il vous plaît", english: 'please' },
  { french: 'bonjour', english: 'good morning' }, // Using bonjour again for good morning
];

// TODO: Move to database or configuration file
// Hardcoded sentences - should be loaded from database
const SENTENCES = [
  { french: 'Salut, comment ça va ?', english: 'Hi, how are you?' },
  { french: "Bonjour, je m'appelle Marie.", english: 'Hello, my name is Marie.' },
  { french: 'Bonjour, ce matin il fait beau.', english: 'Good morning, the weather is nice today.' },
  { french: "Bon après-midi, amuse-toi bien à l'école.", english: 'Good afternoon, have fun at school.' },
  { french: 'Bonsoir, nous allons au cinéma.', english: 'Good evening, we are going to the cinema.' },
  { french: 'Au revoir, à demain !', english: 'Goodbye, see you tomorrow!' },
  { french: "Un café, s'il vous plaît.", english: 'A coffee, please.' },
];

type Question = {
  type: 'word' | 'sentence';
  french: string;
  english: string;
};

export default function UnitSpeakScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { currentAnimation, triggerCelebration, triggerDisappointed } = useAvatarAnimation();
  
  const { unitTitle, subjectName, cefrLevel } = (route.params as any) || { 
    unitTitle: 'Saying Hello', 
    subjectName: 'Asking About Location',
    cefrLevel: 'A1'
  };

  const [vocabulary, setVocabulary] = useState<UnitVocabularyItem[]>([]);
  const [sentences, setSentences] = useState<UnitSentence[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load data from database
  useEffect(() => {
    loadData();
  }, [subjectName, cefrLevel]);

  const loadData = async () => {
    try {
      setLoading(true);
      logger.info(`🎤 Loading speak data for subject: ${subjectName} (${cefrLevel})`);
      
      const nativeLanguage = profile?.native_language || 'en-GB';
      const targetLanguage = profile?.target_language || 'en-GB';
      
      // Load vocabulary and sentences
      const [vocabData, sentenceData] = await Promise.all([
        UnitDataAdapter.getUnitVocabulary(subjectName, nativeLanguage, targetLanguage),
        UnitDataAdapter.getUnitSentences(subjectName, nativeLanguage, targetLanguage)
      ]);
      
      if (vocabData.length === 0) {
        logger.warn(`⚠️ No vocabulary found for subject: ${subjectName}`);
        // Fallback to original hardcoded data
        setVocabulary([
          { english: 'hi', french: 'salut' },
          { english: 'hello', french: 'bonjour' },
          { english: 'good afternoon', french: 'bon après-midi' },
          { english: 'good evening', french: 'bonsoir' },
          { english: 'goodbye', french: 'au revoir' },
          { english: 'please', french: "s'il vous plaît" },
          { english: 'good morning', french: 'bonjour' },
        ]);
      } else {
        setVocabulary(vocabData);
        logger.info(`✅ Loaded ${vocabData.length} vocabulary items from database`);
      }

      if (sentenceData.length === 0) {
        logger.warn(`⚠️ No sentences found for subject: ${subjectName}`);
        // Fallback to original hardcoded data
        setSentences([
          { english: 'Hi, how are you?', french: 'Salut, comment ça va ?' },
          { english: 'Hello, my name is Marie.', french: "Bonjour, je m'appelle Marie." },
          { english: 'Good morning, the weather is nice today.', french: 'Bonjour, ce matin il fait beau.' },
          { english: 'Good afternoon, have fun at school.', french: "Bon après-midi, amuse-toi bien à l'école." },
          { english: 'Good evening, we are going to the cinema.', french: 'Bonsoir, nous allons au cinéma.' },
          { english: 'Goodbye, see you tomorrow!', french: 'Au revoir, à demain !' },
          { english: 'A coffee, please.', french: "Un café, s'il vous plaît." },
        ]);
      } else {
        setSentences(sentenceData);
        logger.info(`✅ Loaded ${sentenceData.length} sentences from database`);
      }
    } catch (error) {
      logger.error('Error loading speak data:', error);
      // Fallback to original hardcoded data
      setVocabulary([
        { english: 'hi', french: 'salut' },
        { english: 'hello', french: 'bonjour' },
        { english: 'good afternoon', french: 'bon après-midi' },
        { english: 'good evening', french: 'bonsoir' },
        { english: 'goodbye', french: 'au revoir' },
        { english: 'please', french: "s'il vous plaît" },
        { english: 'good morning', french: 'bonjour' },
      ]);
      setSentences([
        { english: 'Hi, how are you?', french: 'Salut, comment ça va ?' },
        { english: 'Hello, my name is Marie.', french: "Bonjour, je m'appelle Marie." },
        { english: 'Good morning, the weather is nice today.', french: 'Bonjour, ce matin il fait beau.' },
        { english: 'Good afternoon, have fun at school.', french: "Bon après-midi, amuse-toi bien à l'école." },
        { english: 'Good evening, we are going to the cinema.', french: 'Bonsoir, nous allons au cinéma.' },
        { english: 'Goodbye, see you tomorrow!', french: 'Au revoir, à demain !' },
        { english: 'A coffee, please.', french: "Un café, s'il vous plaît." },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate questions from loaded data
  const generateQuestions = (): Question[] => {
    if (vocabulary.length === 0 || sentences.length === 0) return [];
    return [
      ...vocabulary.map(v => ({ type: 'word' as const, french: v.french, english: v.english })),
      ...sentences.map(s => ({ type: 'sentence' as const, french: s.french, english: s.english })),
    ];
  };

  const [questions, setQuestions] = useState<Question[]>([]);

  // Regenerate questions when data changes
  useEffect(() => {
    if (vocabulary.length > 0 && sentences.length > 0) {
      const newQuestions = generateQuestions();
      setQuestions(newQuestions);
      // Reset lesson state when new questions are generated
      setCurrentQuestionIndex(0);
      setScore(0);
      setCompleted(false);
      setShowResult(false);
      setIsCorrect(false);
    }
  }, [vocabulary, sentences]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [lastResult, setLastResult] = useState<PronunciationResult | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);

  const totalQuestions = questions.length;

  const handlePronunciationComplete = async (result: PronunciationResult) => {
    if (!result.success || !result.assessment) return;

    const pronunciationScore = result.assessment.pronunciationScore;
    setLastResult(result);
    
    // Consider score >= 60 as passing
    const passed = pronunciationScore >= 60;
    setIsCorrect(passed);
    setShowResult(true);
    
    // Haptic feedback based on pronunciation result
    if (passed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    // Trigger avatar animation based on pronunciation result
    if (passed) {
      triggerCelebration();
    } else {
      triggerDisappointed();
    }
    
    if (passed) {
      setScore(score + 1);
      // Auto-advance after 1 second if correct
      setTimeout(() => {
        handleNext();
      }, 1000);
    }
  };

  const recordExerciseCompletion = async () => {
    if (!user || !subjectName || !cefrLevel) return;
    
    try {
      const accuracy = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      const timeSpentSeconds = 60; // Default time, could be improved with actual timing
      
      await GeneralLessonProgressService.recordExerciseCompletion(
        user.id,
        subjectName,
        cefrLevel,
        {
          exerciseName: 'Speak',
          score: score,
          maxScore: totalQuestions,
          accuracy: accuracy,
          timeSpentSeconds: timeSpentSeconds
        }
      );
      
      logger.info(`✅ Exercise completion recorded: ${subjectName} - Speak (${score}/${totalQuestions})`);
    } catch (error) {
      logger.error('Error recording exercise completion:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResult(false);
      setIsCorrect(false);
      setLastResult(null);
    } else {
      setCompleted(true);
      // Record exercise completion when finished
      recordExerciseCompletion();
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setIsCorrect(false);
    setLastResult(null);
    setAttemptKey(prev => prev + 1); // Force remount of PronunciationCheck
  };

  const handleSkip = () => {
    handleNext();
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

  const handleContinue = () => {
    navigation.goBack();
  };

  if (completed) {
    const accuracyPercentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <SafeAreaView style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>{t('lessons.speak.complete')}</Text>
          <Text style={styles.completionSubtitle}>{t('lessons.speak.greatWork')}</Text>
          
          <View style={styles.completionStats}>
            <View style={styles.completionStatCard}>
              <Text style={styles.completionStatValue}>{score}/{totalQuestions}</Text>
              <Text style={styles.completionStatLabel}>{t('lessons.speak.correct')}</Text>
            </View>
            <View style={styles.completionStatCard}>
              <Text style={styles.completionStatValue}>{accuracyPercentage}%</Text>
              <Text style={styles.completionStatLabel}>{t('lessons.speak.accuracy')}</Text>
            </View>
          </View>
          
          <View style={styles.completionButtons}>
            <TouchableOpacity 
              style={styles.completionRetryButton} 
              onPress={() => {
                setCurrentQuestionIndex(0);
                setScore(0);
                setCompleted(false);
                setShowResult(false);
                setAttemptKey(0);
              }}
            >
              <Text style={styles.completionRetryButtonText}>{t('lessons.common.retry')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.completionContinueButton} onPress={handleContinue}>
              <Text style={styles.completionContinueButtonText}>{t('lessons.common.continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - {t('lessons.speak.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>{t('lessons.common.loadingExercises')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Safety check - don't render if no questions loaded
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - {t('lessons.speak.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>{t('lessons.common.preparingExercises')}</Text>
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
        <Text style={styles.headerTitle}>{unitTitle} - {t('lessons.speak.title')}</Text>
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
            <Text style={styles.modalTitle}>{t('lessons.exitModal.title')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('lessons.exitModal.description')}
            </Text>
            
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmExit}>
              <Text style={styles.modalConfirmButtonText}>{t('lessons.exitModal.confirm')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelExit}>
              <Text style={styles.modalCancelButtonText}>{t('lessons.exitModal.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Progress Bar with Segments */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSegments}>
          {questions.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressSegment,
                idx < currentQuestionIndex && styles.progressSegmentCompleted,
                idx === currentQuestionIndex && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Question Type Indicator */}
        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <AnimatedAvatar size={80} style={styles.questionAvatar} animationType={currentAnimation} showCircle={false} />
            <Text style={styles.questionTypeLabel}>
              {currentQuestion.type === 'word' ? t('lessons.speak.sayTheWordInstruction') : t('lessons.speak.sayTheSentenceInstruction')}
            </Text>
          </View>
        </View>

        {/* Pronunciation Check Component */}
        {currentQuestion && (
        <PronunciationCheck
          key={`${currentQuestionIndex}-${attemptKey}`}
          word={currentQuestion.french}
          onComplete={handlePronunciationComplete}
          maxRecordingDuration={currentQuestion.type === 'word' ? 3000 : 8000}
          showAlerts={false}
          translation={currentQuestion.english}
          hideScoreRing={true}
        />
        )}

        {/* Result Message - appears below PronunciationCheck */}
        {showResult && (
          <View style={styles.resultMessage}>
            <Text style={[
              styles.resultTitle,
              isCorrect ? styles.resultTitleCorrect : styles.resultTitleIncorrect
            ]}>
              {isCorrect ? t('lessons.common.youGotThis') : t('lessons.common.incorrectMessage')}
            </Text>
            
            {!isCorrect && lastResult?.assessment && (
              <>
                <Text style={styles.resultSubtitle}>
                  {t('lessons.common.itSoundedAsIf')}
                </Text>
                <Text style={styles.recognizedSpeech}>
                  {lastResult.assessment.recognizedText || t('lessons.common.noSpeechDetected')}
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {showResult && !isCorrect && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>{t('lessons.common.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>{t('lessons.common.skip')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#64748b" />
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionSection: {
    marginBottom: 24,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  questionAvatar: {
    marginRight: 8,
  },
  questionTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  translationCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  translationText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
  },
  resultMessage: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultTitleCorrect: {
    color: '#10b981',
  },
  resultTitleIncorrect: {
    color: '#ef4444',
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  recognizedSpeech: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    backgroundColor: '#7c6ee0',
  },
  completionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completionEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#e0e7ff',
    textAlign: 'center',
    marginBottom: 48,
  },
  completionStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 48,
  },
  completionStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  completionStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  completionStatLabel: {
    fontSize: 14,
    color: '#e0e7ff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completionButtons: {
    width: '100%',
    gap: 12,
  },
  completionRetryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completionRetryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7c6ee0',
  },
  completionContinueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completionContinueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
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
