import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { VocabularyInterpretationService, InterpretedVocabulary } from '../../lib/vocabularyInterpretationService';
import LeaveConfirmationModal from './LeaveConfirmationModal';

interface LessonFlashcardsProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
  onProgressUpdate?: (questionIndex: number) => void;
  initialQuestionIndex?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function LessonFlashcards({ vocabulary, onComplete, onClose, onProgressUpdate, initialQuestionIndex = 0 }: LessonFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set());
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const { profile } = useAuth();

  // Safety check for vocabulary data
  if (!vocabulary || vocabulary.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No vocabulary data available</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get user's language pair
  const languagePair = {
    native: profile?.native_language || 'English',
    target: profile?.target_language || 'English'
  };

  // Interpret vocabulary based on language pair
  const interpretedVocabulary = VocabularyInterpretationService.interpretVocabularyList(vocabulary, languagePair);
  const languageDirection = VocabularyInterpretationService.getLanguageDirection(languagePair);
  
  const currentCard = interpretedVocabulary[currentIndex];

  // Update progress when card index changes
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentIndex);
    }
  }, [currentIndex, onProgressUpdate]);

  const handleClose = () => {
    setShowLeaveModal(true);
  };

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    
    Animated.spring(flipAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 10,
      friction: 8,
    }).start();

    setIsFlipped(!isFlipped);
    
    // Mark card as viewed
    setViewedCards(prev => new Set([...prev, currentIndex]));
  };

  const nextCard = () => {
    if (currentIndex < interpretedVocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    } else {
      // All cards viewed
      onComplete(interpretedVocabulary.length);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const progressPercentage = ((currentIndex + 1) / interpretedVocabulary.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {interpretedVocabulary.length}
        </Text>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={flipCard} activeOpacity={0.9}>
          <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{languageDirection.targetLanguageName} Term</Text>
              <Text style={styles.cardText}>{currentCard?.frontTerm || 'No term available'}</Text>
              <View style={styles.flipHint}>
                <Ionicons name="sync" size={16} color="#64748b" />
                <Text style={styles.flipHintText}>Tap to flip</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{languageDirection.nativeLanguageName} Translation</Text>
              <Text style={styles.cardText}>{currentCard?.backTerm || 'No translation available'}</Text>
              {currentCard?.definition && (
                <Text style={styles.definitionText}>Definition: {currentCard.definition}</Text>
              )}
              {currentCard?.frontExample && (
                <Text style={styles.exampleText}>Example: {currentCard.frontExample}</Text>
              )}
              <View style={styles.flipHint}>
                <Ionicons name="sync" size={16} color="#64748b" />
                <Text style={styles.flipHintText}>Tap to flip back</Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]} 
          onPress={previousCard}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? "#cbd5e1" : "#6366f1"} />
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={nextCard}>
          <Text style={styles.navButtonText}>
            {currentIndex === vocabulary.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Card Indicators */}
      <View style={styles.indicators}>
        {vocabulary.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.indicatorActive,
              viewedCards.has(index) && styles.indicatorViewed
            ]}
          />
        ))}
      </View>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: screenWidth - 80,
    height: 400,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardFace: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 16,
  },
  cardText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
  },
  definitionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
  },
  flipHintText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: '#cbd5e1',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#6366f1',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  indicatorViewed: {
    backgroundColor: '#10b981',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});
