import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { ProgressTrackingService } from '../lib/progressTrackingService';
import { XPService } from '../lib/xpService';
import { VideoBackground } from '../components/VideoBackground';
import { VideoCategory } from '../components/VideoControls';
import { FlashcardSettingsModal } from '../components/FlashcardSettingsModal';
import { AWSPollyService } from '../lib/awsPollyService';
import { useTranslation } from '../lib/i18n';

const { width } = Dimensions.get('window');

interface FlashcardStudyScreenProps {
  route: {
    params: {
      flashcards: any[];
      topic?: string;
      difficulty?: string;
    };
  };
}

export default function FlashcardStudyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  
  const { flashcards: initialFlashcards, topic, difficulty } = (route.params as any) || { flashcards: [] };
  
  const [studySession, setStudySession] = useState<{
    isActive: boolean;
    isComplete: boolean;
    flashcards: any[];
    currentIndex: number;
    showAnswer: boolean;
    answers: Array<'correct' | 'incorrect'>;
    showNativeLanguage: boolean;
    startTime: Date | null;
  }>({
    isActive: true,
    isComplete: false,
    flashcards: initialFlashcards,
    currentIndex: 0,
    showAnswer: false,
    answers: [],
    showNativeLanguage: false,
    startTime: new Date()
  });
  
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');
  
  // Video background state
  const [videoCategory, setVideoCategory] = useState<VideoCategory>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  
  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Start background animations on component mount
  useEffect(() => {
    startBackgroundAnimations();
  }, []);
  
  // Animation and gesture refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const lastTap = useRef<number | null>(null);
  const isAnimating = useRef(false);
  
  // Card flash animation for correct answers
  const cardFlashAnim = useRef(new Animated.Value(0)).current;

  // Animated values for floating background elements
  const animatedValue1 = useRef(new Animated.Value(0)).current;
  const animatedValue2 = useRef(new Animated.Value(0)).current;
  const animatedValue3 = useRef(new Animated.Value(0)).current;
  const animatedValue4 = useRef(new Animated.Value(0)).current;
  const animatedValue5 = useRef(new Animated.Value(0)).current;
  const animatedValue6 = useRef(new Animated.Value(0)).current;
  const animatedValue7 = useRef(new Animated.Value(0)).current;
  const animatedValue8 = useRef(new Animated.Value(0)).current;
  const animatedValue9 = useRef(new Animated.Value(0)).current;
  const animatedValue10 = useRef(new Animated.Value(0)).current;
  const animatedValue11 = useRef(new Animated.Value(0)).current;
  const animatedValue12 = useRef(new Animated.Value(0)).current;
  const animatedValue13 = useRef(new Animated.Value(0)).current;
  const animatedValue14 = useRef(new Animated.Value(0)).current;
  const animatedValue15 = useRef(new Animated.Value(0)).current;
  const animatedValue16 = useRef(new Animated.Value(0)).current;
  const animatedValue17 = useRef(new Animated.Value(0)).current;
  const animatedValue18 = useRef(new Animated.Value(0)).current;
  const animatedValue19 = useRef(new Animated.Value(0)).current;
  const animatedValue20 = useRef(new Animated.Value(0)).current;
  const animatedValue21 = useRef(new Animated.Value(0)).current;
  const animatedValue22 = useRef(new Animated.Value(0)).current;
  const animatedValue23 = useRef(new Animated.Value(0)).current;
  const animatedValue24 = useRef(new Animated.Value(0)).current;
  const animatedValue25 = useRef(new Animated.Value(0)).current;

  // Start background animations
  const startBackgroundAnimations = () => {
    // Create floating animations for different elements
    const createFloatingAnimation = (animatedValue: Animated.Value, duration: number, delay: number = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            delay: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 } // Infinite loop
      );
    };

    // Start all animations with different timings
    setTimeout(() => {
      createFloatingAnimation(animatedValue1, 3000, 0).start();
    }, 100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue2, 4000, 0).start();
    }, 600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue3, 3500, 0).start();
    }, 1100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue4, 4500, 0).start();
    }, 1600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue5, 3200, 0).start();
    }, 2100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue6, 3800, 0).start();
    }, 2600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue7, 4200, 0).start();
    }, 3100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue8, 3600, 0).start();
    }, 3600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue9, 4800, 0).start();
    }, 4100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue10, 3400, 0).start();
    }, 4600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue11, 4100, 0).start();
    }, 5100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue12, 3700, 0).start();
    }, 5600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue13, 4300, 0).start();
    }, 6100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue14, 3900, 0).start();
    }, 6600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue15, 4600, 0).start();
    }, 7100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue16, 3500, 0).start();
    }, 7600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue17, 4400, 0).start();
    }, 8100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue18, 3800, 0).start();
    }, 8600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue19, 4200, 0).start();
    }, 9100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue20, 3600, 0).start();
    }, 9600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue21, 4000, 0).start();
    }, 10100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue22, 4500, 0).start();
    }, 10600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue23, 3800, 0).start();
    }, 11100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue24, 4100, 0).start();
    }, 11600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue25, 3700, 0).start();
    }, 12100);
  };

  // Reset card flash animation
  const resetCardFlash = () => {
    cardFlashAnim.setValue(0);
  };

  // Trigger card flash animation
  const triggerCardFlash = () => {
    cardFlashAnim.setValue(0);
    
    Animated.sequence([
      // Flash on
      Animated.timing(cardFlashAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false, // We need this for borderColor
      }),
      // Flash off
      Animated.timing(cardFlashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      // Second flash
      Animated.timing(cardFlashAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      // Final fade
      Animated.timing(cardFlashAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  };


  // Handle tap (single or double)
  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // milliseconds
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      // Double tap detected - mark as correct and move to next
      lastTap.current = null;
      handleAnswer('correct');
    } else {
      // Single tap - just flip the card
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) {
          // It was just a single tap - flip card with light haptic
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setStudySession(prev => ({ ...prev, showAnswer: !prev.showAnswer }));
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  // Animate card transition with smooth fade effect
  const animateCard = (direction: 'up' | 'down', callback: () => void) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    // Light haptic feedback for card transition
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Smooth transition: fade out, change content, fade back in
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Execute callback (change card content) while invisible
      callback();
      
      // Fade back in smoothly
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  };

  // Navigate to next card
  const goToNextCard = () => {
    if (studySession.currentIndex < studySession.flashcards.length - 1) {
      animateCard('up', () => {
        resetCardFlash(); // Reset flash animation for new card
        setStudySession(prev => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          showAnswer: false,
        }));
      });
    } else {
      // Last card - go to review
      const newAnswers = [...studySession.answers];
      // If user hasn't answered the last card, mark as incorrect by default
      if (!newAnswers[studySession.currentIndex]) {
        newAnswers[studySession.currentIndex] = 'incorrect';
      }
      completeStudySession(newAnswers);
    }
  };

  // Navigate to previous card
  const goToPreviousCard = () => {
    if (studySession.currentIndex > 0) {
      animateCard('down', () => {
        setStudySession(prev => ({
          ...prev,
          currentIndex: prev.currentIndex - 1,
          showAnswer: false,
        }));
      });
    }
    // If on first card, do nothing
  };

  // Create PanResponder for swipe gestures and taps
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false, // Allow child components to handle touches first
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Respond to any movement (for both swipes and taps)
        return true;
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 50;
        const tapThreshold = 10; // Max movement for a tap
        
        // Check if it was a tap (minimal movement)
        if (Math.abs(gestureState.dx) < tapThreshold && Math.abs(gestureState.dy) < tapThreshold) {
          handleTap();
        } else if (gestureState.dy < -swipeThreshold) {
          // Swipe up - next card
          goToNextCard();
        } else if (gestureState.dy > swipeThreshold) {
          // Swipe down - previous card
          goToPreviousCard();
        }
      },
    })
  ).current;

  // Handle flashcard answer selection
  const handleAnswer = async (answer: 'correct' | 'incorrect') => {
    const newAnswers = [...studySession.answers];
    newAnswers[studySession.currentIndex] = answer;
    
    // Haptic feedback based on answer
    if (answer === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      triggerCardFlash();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    // Track individual flashcard progress
    if (user) {
      const currentFlashcard = studySession.flashcards[studySession.currentIndex];
      try {
        await ProgressTrackingService.updateFlashcardProgress({
          flashcardId: currentFlashcard.id,
          isCorrect: answer === 'correct',
          responseTime: 5, // Average 5 seconds per card
        });
        console.log(`✅ Tracked individual flashcard progress: ${answer}`);
      } catch (error) {
        console.error('❌ Error tracking individual flashcard progress:', error);
      }
    }
    
    // Update answers in state
    setStudySession(prev => ({
      ...prev,
      answers: newAnswers
    }));
    
    if (studySession.currentIndex < studySession.flashcards.length - 1) {
      // Move to next card with animation
      animateCard('up', () => {
        resetCardFlash(); // Reset flash animation for new card
        setStudySession(prev => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          showAnswer: false,
        }));
      });
    } else {
      // Session complete
      await completeStudySession(newAnswers);
    }
  };

  // Complete study session
  const completeStudySession = async (answers: Array<'correct' | 'incorrect'>) => {
    setStudySession(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      answers
    }));
    
    // Calculate study time and update progress tracking
    if (studySession.startTime && user) {
      const endTime = new Date();
      const timeSpentSeconds = Math.floor((endTime.getTime() - studySession.startTime.getTime()) / 1000);
      const timeSpentMinutes = Math.floor(timeSpentSeconds / 60);
      
      console.log(`📚 Study session completed: ${timeSpentMinutes} minutes (${timeSpentSeconds} seconds)`);
      
      try {
        // Calculate session statistics
        const correct = answers.filter(a => a === 'correct').length;
        const total = answers.length;
        const accuracyPercentage = Math.round((correct / total) * 100);
        const score = Math.round((correct / total) * 100);

        // Record flashcard review activity
        await ProgressTrackingService.recordFlashcardActivity({
          activityType: 'flashcard_review',
          activityName: `Flashcard Review - ${topic || 'All Topics'}`,
          durationSeconds: timeSpentSeconds,
          score: score,
          maxScore: 100,
          accuracyPercentage: accuracyPercentage,
          flashcardsReviewed: total,
        });

        console.log('✅ Flashcard review activity tracked successfully');

        // Award XP for completing flashcard review
        try {
          const xpResult = await XPService.awardXP(
            user.id,
            'flashcard',
            score,
            100,
            accuracyPercentage,
            `Flashcard Review - ${topic || 'All Topics'}`,
            timeSpentSeconds
          );
          
          if (xpResult) {
            console.log('🎯 XP awarded for flashcard review:', xpResult.totalXP, 'XP');
          }
        } catch (xpError) {
          console.error('❌ Error awarding XP for flashcard review:', xpError);
        }
      } catch (error) {
        console.error('❌ Error tracking flashcard review activity:', error);
      }
    }
  };

  // Toggle language display
  const toggleLanguage = () => {
    setStudySession(prev => ({
      ...prev,
      showNativeLanguage: !prev.showNativeLanguage
    }));
  };

  // Play audio pronunciation using AWS Polly
  const playPronunciation = async (text: string) => {
    console.log('🔊 Playing pronunciation for:', text);
    
    if (isAudioPlaying) {
      console.log('🔊 Already playing audio, skipping');
      return;
    }
    
    setIsAudioPlaying(true);
    console.log('🎵 Set audio playing to true');
    
    try {
      // Get user's target language from profile and convert to proper language code
      const userLanguageName = profile?.target_language;
      if (!userLanguageName) {
        throw new Error('User target language not found in profile');
      }
      
      const languageCode = AWSPollyService.getLanguageCodeFromName(userLanguageName);
      const voiceId = AWSPollyService.getVoiceForLanguage(languageCode);
      
      console.log('🎤 Using AWS Polly with voice:', voiceId, 'for language:', languageCode, '(from user target language:', userLanguageName, ')');
      
      await AWSPollyService.playSpeech(text, {
        voiceId,
        languageCode: languageCode,
        engine: 'standard', // Use standard engine for cost efficiency
        rate: 0.9, // Slightly slower for clarity
        pitch: 1.0,
        volume: 1.0
      });
      
      console.log('✅ AWS Polly speech completed');
      setIsAudioPlaying(false);
      
    } catch (error) {
      console.error('❌ AWS Polly speech error:', error);
      Alert.alert('Audio Error', 'Failed to play pronunciation audio. Please check your internet connection.');
      setIsAudioPlaying(false);
    }
  };

  // Show study session if active
  if (studySession.isActive) {
    const currentCard = studySession.flashcards[studySession.currentIndex];
    const progress = ((studySession.currentIndex + 1) / studySession.flashcards.length) * 100;

    return (
      <LinearGradient
        colors={['#f0f4ff', '#e0e7ff', '#ddd6fe']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header Overlay - Always present for solid white header */}
        <View style={styles.headerOverlay} />
        
        {/* Video Background */}
        <VideoBackground 
          category={videoCategory} 
          isMuted={isVideoMuted} 
        />
        
        {/* Animated Background Elements - behind video */}
        <View style={styles.backgroundPattern}>
          <Animated.View 
            style={[
              styles.decorativeCircle1,
              {
                transform: [
                  { translateY: animatedValue1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  })},
                  { translateX: animatedValue1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.decorativeCircle2,
              {
                transform: [
                  { translateY: animatedValue2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                  })},
                  { translateX: animatedValue2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.decorativeCircle3,
              {
                transform: [
                  { translateY: animatedValue3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12],
                  })},
                  { translateX: animatedValue3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 6],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.decorativeCircle4,
              {
                transform: [
                  { translateY: animatedValue4.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 18],
                  })},
                  { translateX: animatedValue4.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingDiamond1,
              {
                transform: [
                  { translateY: animatedValue5.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  })},
                  { translateX: animatedValue5.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 7],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingDiamond2,
              {
                transform: [
                  { translateY: animatedValue6.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 14],
                  })},
                  { translateX: animatedValue6.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -9],
                  })}
                ]
              }
            ]} 
          />
          
          {/* Additional background elements */}
          <Animated.View 
            style={[
              styles.decorativeCircle5,
              {
                transform: [
                  { translateY: animatedValue7.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -16],
                  })},
                  { translateX: animatedValue7.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 12],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingTriangle1,
              {
                transform: [
                  { translateY: animatedValue8.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 11],
                  })},
                  { translateX: animatedValue8.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -7],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.decorativeCircle6,
              {
                transform: [
                  { translateY: animatedValue9.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -13],
                  })},
                  { translateX: animatedValue9.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingHexagon1,
              {
                transform: [
                  { translateY: animatedValue10.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 17],
                  })},
                  { translateX: animatedValue10.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -11],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.decorativeCircle7,
              {
                transform: [
                  { translateY: animatedValue11.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -9],
                  })},
                  { translateX: animatedValue11.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingStar1,
              {
                transform: [
                  { translateY: animatedValue12.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 12],
                  })},
                  { translateX: animatedValue12.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  })}
                ]
              }
            ]} 
          />
          
          {/* Additional elements to fill sparse areas */}
          <Animated.View 
            style={[
              styles.decorativeCircle8,
              {
                transform: [
                  { translateY: animatedValue13.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -14],
                  })},
                  { translateX: animatedValue13.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 9],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingSquare1,
              {
                transform: [
                  { translateY: animatedValue14.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 13],
                  })},
                  { translateX: animatedValue14.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.decorativeCircle9,
              {
                transform: [
                  { translateY: animatedValue15.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -11],
                  })},
                  { translateX: animatedValue15.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 7],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingTriangle2,
              {
                transform: [
                  { translateY: animatedValue16.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                  })},
                  { translateX: animatedValue16.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.decorativeCircle10,
              {
                transform: [
                  { translateY: animatedValue17.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  })},
                  { translateX: animatedValue17.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 11],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingDiamond3,
              {
                transform: [
                  { translateY: animatedValue18.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10],
                  })},
                  { translateX: animatedValue18.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  })}
                ]
              }
            ]} 
          />
          
          {/* Additional elements for top-left and bottom-left areas */}
          <Animated.View 
            style={[
              styles.decorativeCircle11,
              {
                transform: [
                  { translateY: animatedValue19.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12],
                  })},
                  { translateX: animatedValue19.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 6],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingSquare2,
              {
                transform: [
                  { translateY: animatedValue20.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 14],
                  })},
                  { translateX: animatedValue20.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -7],
                  })}
                ]
              }
            ]} 
          />
          
          {/* More elements for the sparse top-left area */}
          <Animated.View 
            style={[
              styles.decorativeCircle12,
              {
                transform: [
                  { translateY: animatedValue21.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  })},
                  { translateX: animatedValue21.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingTriangle3,
              {
                transform: [
                  { translateY: animatedValue22.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 12],
                  })},
                  { translateX: animatedValue22.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  })}
                ]
              }
            ]} 
          />
          
          {/* Elements to the right of the large white circle on the left */}
          <Animated.View 
            style={[
              styles.decorativeCircle13,
              {
                transform: [
                  { translateY: animatedValue23.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -9],
                  })},
                  { translateX: animatedValue23.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 5],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingSquare3,
              {
                transform: [
                  { translateY: animatedValue24.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 11],
                  })},
                  { translateX: animatedValue24.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  })}
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.decorativeCircle14,
              {
                transform: [
                  { translateY: animatedValue25.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -13],
                  })},
                  { translateX: animatedValue25.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 7],
                  })}
                ]
              }
            ]} 
          />
        </View>
        
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.studyHeader}>
          <View style={styles.studyHeaderTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#6366f1" />
            </TouchableOpacity>
            <Text style={styles.studyTitle}>{t('studySession.title')}</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {studySession.currentIndex + 1} / {studySession.flashcards.length}
              </Text>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowSettingsModal(true)}
              >
                <Ionicons name="settings" size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          {/* Gesture Hints */}
          <View style={styles.gestureHintsContainer}>
            <View style={styles.gestureHintItem}>
              <Ionicons name="refresh" size={16} color="#6366f1" />
              <Text style={styles.gestureHintText}>{t('studySession.tapToFlip')}</Text>
            </View>
            <View style={styles.gestureHintItem}>
              <Ionicons name="swap-vertical" size={16} color="#6366f1" />
              <Text style={styles.gestureHintText}>{t('studySession.swipe')}</Text>
            </View>
            <View style={styles.gestureHintItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.gestureHintText}>2x = ✓</Text>
            </View>
          </View>
        </View>

        <Animated.View 
          style={[
            styles.studyContent,
            {
              opacity: cardOpacity,
              transform: [{ translateY: slideAnim }]
            }
          ]}
          {...panResponder.panHandlers}
        >
          
          <Animated.View style={[
            styles.flashcard,
            {
              borderColor: cardFlashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255, 255, 255, 0.95)', '#10b981'],
              }),
              borderWidth: cardFlashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
            }
          ]}>
            <View style={styles.flashcardContent}>
              <Text style={styles.flashcardText}>
                {studySession.showAnswer 
                  ? (studySession.showNativeLanguage ? currentCard.front : currentCard.back)
                  : (studySession.showNativeLanguage ? currentCard.back : currentCard.front)
                }
              </Text>
              <View style={styles.pronunciationContainer}>
                {currentCard.pronunciation && !studySession.showAnswer && (
                  <Text style={styles.pronunciation}>{currentCard.pronunciation}</Text>
                )}
                {!studySession.showAnswer && (
                  <TouchableOpacity 
                    style={[styles.audioButton, isAudioPlaying && styles.audioButtonPlaying]} 
                    onPress={() => {
                      // Play the word that's currently being shown (target language only)
                      const textToSpeak = studySession.showAnswer 
                        ? (studySession.showNativeLanguage ? currentCard.front : currentCard.back)
                        : (studySession.showNativeLanguage ? currentCard.back : currentCard.front);
                      playPronunciation(textToSpeak);
                    }}
                  >
                    <Ionicons 
                      name="volume-high" 
                      size={20} 
                      color={isAudioPlaying ? "#64748b" : "#6366f1"} 
                    />
                  </TouchableOpacity>
                )}
              </View>
              {currentCard.example && studySession.showAnswer && (
                <Text style={styles.example}>{t('browseFlashcards.example')} {currentCard.example}</Text>
              )}
            </View>
            
          </Animated.View>
          
          {studySession.showAnswer && (
            <View style={styles.answerButtons}>
              <TouchableOpacity 
                style={[styles.answerButton, styles.correctButton]}
                onPress={() => handleAnswer('correct')}
              >
                <Ionicons name="checkmark" size={24} color="#10b981" />
                <Text style={[styles.answerButtonText, styles.correctButtonText]}>{t('studySession.correct')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.answerButton, styles.incorrectButton]}
                onPress={() => handleAnswer('incorrect')}
              >
                <Ionicons name="close" size={24} color="#ef4444" />
                <Text style={[styles.answerButtonText, styles.incorrectButtonText]}>{t('studySession.incorrect')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
        
        
        {/* Settings Modal */}
        <FlashcardSettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          showNativeLanguage={studySession.showNativeLanguage}
          onToggleLanguage={toggleLanguage}
          nativeLanguage={profile?.native_language}
          targetLanguage={profile?.target_language}
          videoCategory={videoCategory}
          onCategoryChange={setVideoCategory}
          isVideoMuted={isVideoMuted}
          onMuteToggle={() => setIsVideoMuted(!isVideoMuted)}
        />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Show review session if complete
  if (studySession.isComplete) {
    const correct = studySession.answers.filter(a => a === 'correct').length;
    const total = studySession.answers.length;
    const percentage = Math.round((correct / total) * 100);
    
    // Filter flashcards based on performance
    const filteredFlashcards = studySession.flashcards.filter((card, index) => {
      const answer = studySession.answers[index];
      const isCorrect = answer === 'correct';
      
      if (filterType === 'all') return true;
      if (filterType === 'correct') return isCorrect;
      if (filterType === 'incorrect') return !isCorrect;
      return true;
    });
    
    const filteredCount = filteredFlashcards.length;
    
    return (
      <LinearGradient
        colors={['#f0f4ff', '#e0e7ff', '#ddd6fe']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>Session Complete!</Text>
          <Text style={styles.reviewSubtitle}>Review your performance</Text>
          
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercentage}>{percentage}%</Text>
              <Text style={styles.scoreText}>{correct}/{total} correct</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark" size={24} color="#10b981" />
              <Text style={styles.reviewStatNumber}>{studySession.answers.filter(a => a === 'correct').length}</Text>
              <Text style={styles.reviewStatLabel}>{t('studySession.correct')}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="close" size={24} color="#ef4444" />
              <Text style={styles.reviewStatNumber}>{studySession.answers.filter(a => a === 'incorrect').length}</Text>
              <Text style={styles.reviewStatLabel}>{t('studySession.incorrect')}</Text>
            </View>
          </View>
        </View>
        
        {/* Filter Controls */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter Cards:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'all' && styles.activeFilterButton]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterButtonText, filterType === 'all' && styles.activeFilterButtonText]}>
                All ({total})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'correct' && styles.activeFilterButton]}
              onPress={() => setFilterType('correct')}
            >
              <Text style={[styles.filterButtonText, filterType === 'correct' && styles.activeFilterButtonText]}>
                {t('studySession.correct')} ({correct})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'incorrect' && styles.activeFilterButton]}
              onPress={() => setFilterType('incorrect')}
            >
              <Text style={[styles.filterButtonText, filterType === 'incorrect' && styles.activeFilterButtonText]}>
                {t('studySession.incorrect')} ({total - correct})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.reviewSectionTitle}>
            {filterType === 'all' ? t('studySession.allCards') : 
             filterType === 'correct' ? t('studySession.correctAnswers') : t('studySession.incorrectAnswers')} 
            ({filteredCount})
          </Text>
          
          {filteredFlashcards.map((card, index) => {
            const originalIndex = studySession.flashcards.indexOf(card);
            const answer = studySession.answers[originalIndex];
            const isCorrect = answer === 'correct';
            
            return (
              <View key={originalIndex} style={[styles.reviewCard, isCorrect ? styles.correctReviewCard : styles.incorrectReviewCard]}>
                <View style={styles.reviewCardHeader}>
                  <Text style={styles.reviewCardNumber}>{t('studySession.card')} {originalIndex + 1}</Text>
                  <View style={[styles.answerBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
                    <Ionicons 
                      name={isCorrect ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={isCorrect ? "#10b981" : "#ef4444"} 
                    />
                    <Text style={[styles.answerBadgeText, isCorrect ? styles.correctBadgeText : styles.incorrectBadgeText]}>
                      {answer}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.reviewCardContent}>
                  <View style={styles.reviewCardSide}>
                    <Text style={styles.reviewCardLabel}>
                      {studySession.showNativeLanguage 
                        ? profile?.native_language || 'Native'
                        : 'English'
                      }:
                    </Text>
                    <Text style={styles.reviewCardText}>
                      {studySession.showNativeLanguage ? card.back : card.front}
                    </Text>
                  </View>
                  
                  <View style={styles.reviewCardSide}>
                    <Text style={styles.reviewCardLabel}>
                      {studySession.showNativeLanguage 
                        ? 'English'
                        : profile?.native_language || 'Native'
                      }:
                    </Text>
                    <Text style={styles.reviewCardText}>
                      {studySession.showNativeLanguage ? card.front : card.back}
                    </Text>
                  </View>
                 
                  {card.pronunciation && (
                    <View style={styles.reviewPronunciation}>
                      <Text style={styles.reviewCardLabel}>{t('browseFlashcards.pronunciation')}</Text>
                      <Text style={styles.reviewCardText}>{card.pronunciation}</Text>
                      <TouchableOpacity 
                        style={styles.reviewAudioButton} 
                        onPress={() => playPronunciation(card.front)}
                      >
                        <Ionicons name="volume-high" size={16} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {card.example && (
                    <View style={styles.reviewExample}>
                      <Text style={styles.reviewCardLabel}>{t('browseFlashcards.example')}</Text>
                      <Text style={styles.reviewCardText}>{card.example}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
        
        <View style={styles.reviewActions}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.repeatAllButton}
              onPress={() => {
                // Start a new session with all cards
                setStudySession({
                  isActive: true,
                  isComplete: false,
                  flashcards: studySession.flashcards.sort(() => Math.random() - 0.5), // Shuffle all cards
                  currentIndex: 0,
                  showAnswer: false,
                  answers: [],
                  showNativeLanguage: studySession.showNativeLanguage,
                  startTime: new Date()
                });
              }}
            >
              <Ionicons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.repeatAllButtonText}>Repeat All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.repeatIncorrectButton}
              onPress={() => {
                // Start a new session with only incorrect cards
                const incorrectCards = studySession.flashcards.filter((card, index) => {
                  const answer = studySession.answers[index];
                  return answer === 'incorrect';
                });
                
                if (incorrectCards.length === 0) {
                  Alert.alert('No Cards to Repeat', 'Great job! You got all cards correct.');
                  return;
                }
                
                setStudySession({
                  isActive: true,
                  isComplete: false,
                  flashcards: incorrectCards.sort(() => Math.random() - 0.5), // Shuffle incorrect cards
                  currentIndex: 0,
                  showAnswer: false,
                  answers: [],
                  showNativeLanguage: studySession.showNativeLanguage,
                  startTime: new Date()
                });
              }}
            >
              <Ionicons name="close-circle" size={20} color="#ffffff" />
              <Text style={styles.repeatIncorrectButtonText}>{t('studySession.repeatWrong')}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.backToSetupButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.backToSetupButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Fallback - should not reach here
  return (
    <LinearGradient
      colors={['#f0f4ff', '#e0e7ff', '#ddd6fe']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('lessons.flashcards.noFlashcardsAvailable')}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{t('lessons.flashcards.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80, // Cover just the main header area
    backgroundColor: '#ffffff', // Solid white
    zIndex: 999,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: -2,
  },
  // Large decorative circles for visual interest
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 0,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 0,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '30%',
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 0,
  },
  decorativeCircle4: {
    position: 'absolute',
    bottom: '20%',
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 0,
  },
  // Floating diamond shapes
  floatingDiamond1: {
    position: 'absolute',
    top: '35%',
    right: '30%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(99, 102, 241, 0.15)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 0,
  },
  floatingDiamond2: {
    position: 'absolute',
    bottom: '35%',
    left: '30%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 0,
  },
  // Additional background elements
  decorativeCircle5: {
    position: 'absolute',
    top: '15%',
    right: '20%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 0,
  },
  floatingTriangle1: {
    position: 'absolute',
    top: '60%',
    left: '15%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(16, 185, 129, 0.18)',
    transform: [{ rotate: '0deg' }],
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 0,
  },
  decorativeCircle6: {
    position: 'absolute',
    bottom: '20%',
    right: '15%',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 0,
  },
  floatingHexagon1: {
    position: 'absolute',
    top: '25%',
    left: '70%',
    width: 30,
    height: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 11,
    elevation: 0,
  },
  decorativeCircle7: {
    position: 'absolute',
    bottom: '45%',
    left: '80%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.13)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 13,
    elevation: 0,
  },
  floatingStar1: {
    position: 'absolute',
    top: '70%',
    right: '35%',
    width: 25,
    height: 25,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 0,
  },
  // Additional elements to fill sparse areas
  decorativeCircle8: {
    position: 'absolute',
    top: '8%',
    left: '25%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 0,
  },
  floatingSquare1: {
    position: 'absolute',
    top: '45%',
    left: '8%',
    width: 22,
    height: 22,
    backgroundColor: 'rgba(236, 72, 153, 0.16)',
    transform: [{ rotate: '15deg' }],
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 0,
  },
  decorativeCircle9: {
    position: 'absolute',
    top: '40%',
    right: '25%',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(251, 191, 36, 0.13)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 9,
    elevation: 0,
  },
  floatingTriangle2: {
    position: 'absolute',
    bottom: '30%',
    left: '25%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(99, 102, 241, 0.17)',
    transform: [{ rotate: '30deg' }],
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 11,
    elevation: 0,
  },
  decorativeCircle10: {
    position: 'absolute',
    bottom: '15%',
    right: '45%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.33,
    shadowRadius: 12,
    elevation: 0,
  },
  floatingDiamond3: {
    position: 'absolute',
    top: '55%',
    right: '10%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(168, 85, 247, 0.18)',
    transform: [{ rotate: '60deg' }],
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 0,
  },
  // Additional elements for top-left and bottom-left areas
  decorativeCircle11: {
    position: 'absolute',
    top: '12%',
    left: '15%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 9,
    elevation: 0,
  },
  floatingSquare2: {
    position: 'absolute',
    bottom: '25%',
    left: '12%',
    width: 20,
    height: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    transform: [{ rotate: '25deg' }],
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 0,
  },
  // More elements for the sparse top-left area
  decorativeCircle12: {
    position: 'absolute',
    top: '5%',
    left: '35%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0,
  },
  floatingTriangle3: {
    position: 'absolute',
    top: '20%',
    left: '5%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(34, 197, 94, 0.17)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 0,
  },
  // Elements to the right of the large white circle on the left
  decorativeCircle13: {
    position: 'absolute',
    top: '35%',
    left: '45%',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0,
  },
  floatingSquare3: {
    position: 'absolute',
    top: '50%',
    left: '40%',
    width: 18,
    height: 18,
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    transform: [{ rotate: '20deg' }],
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 0,
  },
  decorativeCircle14: {
    position: 'absolute',
    top: '65%',
    left: '38%',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 7,
    elevation: 0,
  },
  // Flashcard Study Session Styles
  studyHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    zIndex: 1000,
    elevation: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  studyHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  studyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  gestureHintsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginTop: 0,
    marginBottom: 0,
  },
  gestureHintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    minWidth: 75,
    justifyContent: 'center',
  },
  studyContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    width: '100%',
    maxWidth: 500,
    zIndex: 10,
  },
  flashcardContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  flashcardText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 16,
  },
  pronunciationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pronunciation: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  audioButton: {
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  audioButtonPlaying: {
    backgroundColor: '#e2e8f0',
  },
  example: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  gestureHintText: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 500,
    zIndex: 10,
  },
  answerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  correctButton: {
    backgroundColor: '#dcfce7',
  },
  incorrectButton: {
    backgroundColor: '#fef2f2',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  correctButtonText: {
    color: '#10b981',
  },
  incorrectButtonText: {
    color: '#ef4444',
  },
  // Flashcard Review Session Styles
  reviewHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.3)',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  scoreContainer: {
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#6366f1',
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
  },
  scoreText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  reviewStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  reviewStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  filterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.3)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  reviewContent: {
    flex: 1,
    padding: 20,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  correctReviewCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  incorrectReviewCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCardNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  correctBadge: {
    backgroundColor: '#dcfce7',
  },
  incorrectBadge: {
    backgroundColor: '#fef2f2',
  },
  answerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  correctBadgeText: {
    color: '#10b981',
  },
  incorrectBadgeText: {
    color: '#ef4444',
  },
  reviewCardContent: {
    gap: 12,
  },
  reviewCardSide: {
    gap: 4,
  },
  reviewCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  reviewCardText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  reviewPronunciation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  reviewAudioButton: {
    padding: 4,
    backgroundColor: '#f0f4ff',
    borderRadius: 4,
  },
  reviewExample: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 4,
  },
  reviewActions: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.3)',
    gap: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  repeatAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  repeatAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  repeatIncorrectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  repeatIncorrectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  backToSetupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#6b7280',
    borderRadius: 12,
    shadowColor: '#6b7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backToSetupButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
});
