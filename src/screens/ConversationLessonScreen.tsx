import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson, LessonVocabulary } from '../lib/lessonService';
import { XPService } from '../lib/xpService';
import { PronunciationService } from '../lib/pronunciationService';
import { VoiceService } from '../lib/voiceService';
import * as Speech from 'expo-speech';
import { logger } from '../lib/logger';

const { width } = Dimensions.get('window');

interface ConversationMessage {
  speaker: string;  // "User" or "Person A" 
  message: string;
}

interface ConversationData {
  conversation: ConversationMessage[];
}

interface RouteParams {
  lessonId: string;
  lessonTitle: string;
}

interface ConversationExercise {
  type: 'flashcard' | 'speak' | 'fill-in-blank' | 'sentence-scramble';
  keyword: string;
  sentence: string;
  vocabulary: LessonVocabulary;
}

interface ExerciseState {
  isActive: boolean;
  exercise: ConversationExercise | null;
  isCompleted: boolean;
  score: number;
}

export default function ConversationLessonScreen() {
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [vocabulary, setVocabulary] = useState<LessonVocabulary[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [userMessageCompleted, setUserMessageCompleted] = useState(false);
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    isActive: false,
    exercise: null,
    isCompleted: false,
    score: 0
  });

  // Sentence scramble state
  const [scrambleWords, setScrambleWords] = useState<string[]>([]);
  const [scrambleOrder, setScrambleOrder] = useState<string[]>([]);
  const [scrambleCorrectOrder, setScrambleCorrectOrder] = useState<string[]>([]);
  
  // Fill-in-blank state
  const [fillBlankAnswer, setFillBlankAnswer] = useState<string>('');
  
  // Track if exercise has been created for current message
  const [exerciseCreatedForMessage, setExerciseCreatedForMessage] = useState<number>(-1);
  
  // Speak exercise state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState<any>(null);
  
  // 5-button functionality state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [hiddenMessages, setHiddenMessages] = useState<Set<number>>(new Set());
  
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId, lessonTitle } = route.params as RouteParams;
  
  // Use refs to prevent stale closures and ensure state consistency
  const currentMessageIndexRef = useRef(0);
  const conversationDataRef = useRef<ConversationData | null>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimationRunningRef = useRef(false);
  
  // Update refs when state changes
  useEffect(() => {
    currentMessageIndexRef.current = currentMessageIndex;
  }, [currentMessageIndex]);
  
  useEffect(() => {
    conversationDataRef.current = conversationData;
  }, [conversationData]);
  
  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    loadConversationData();
  }, []);

  // Typing animation effect
  useEffect(() => {
    // console.log('🎬 Typing animation effect triggered:', { isTypingAnimation, hasData: !!conversationDataRef.current, isRunning: isAnimationRunningRef.current });
    if (isTypingAnimation && conversationDataRef.current && !isAnimationRunningRef.current) {
      const currentMessage = conversationDataRef.current.conversation[currentMessageIndexRef.current];
      console.log('🎬 Starting typing animation for:', currentMessage?.speaker, currentMessage?.message);
      if (currentMessage) {
        // Use requestAnimationFrame to ensure smooth start
        requestAnimationFrame(() => {
          startTypingAnimation(currentMessage.message);
        });
      }
    }
  }, [isTypingAnimation]);

  const startTypingAnimation = (fullText: string) => {
    // Clear any existing timeout to prevent overlapping animations
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Mark animation as running
    isAnimationRunningRef.current = true;
    setTypingText('');
    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setTypingText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, 50); // 50ms per character
      } else {
        // Animation complete - use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
          isAnimationRunningRef.current = false;
          setIsTypingAnimation(false);
          
          // Handle message advancement based on who just finished typing
          if (conversationDataRef.current && conversationDataRef.current.conversation[currentMessageIndexRef.current]) {
            const currentMessage = conversationDataRef.current.conversation[currentMessageIndexRef.current];
            
            if (currentMessage.speaker === 'Person A') {
              // Person A finished typing, advance to next message
              setTimeout(() => {
                handleNextMessage();
              }, 1000); // Wait 1 second after typing completes
            } else if (currentMessage.speaker === 'User') {
              // User finished typing, mark as completed and advance to Person A message
              setUserMessageCompleted(true);
              setTimeout(() => {
                const nextIndex = currentMessageIndexRef.current + 1;
                if (nextIndex < conversationDataRef.current!.conversation.length) {
                  // Batch state updates to prevent jank
                  const nextMessage = conversationDataRef.current!.conversation[nextIndex];
                  
                  if (nextMessage.speaker === 'Person A') {
                    // Update all states together
                    setCurrentMessageIndex(nextIndex);
                    currentMessageIndexRef.current = nextIndex;
                    setIsTyping(true);
                    isTypingRef.current = true;
                    setIsTypingAnimation(true);
                    setUserMessageCompleted(false); // Reset flag
                  } else {
                    setCurrentMessageIndex(nextIndex);
                    currentMessageIndexRef.current = nextIndex;
                    setIsTyping(false);
                    isTypingRef.current = false;
                    setIsTypingAnimation(false);
                    setUserMessageCompleted(false); // Reset flag
                  }
                } else {
                  handleConversationComplete();
                }
              }, 1000); // Wait 1 second after user typing completes
            }
          }
        });
      }
    };
    
    typeNextChar();
  };

  const stopTypingAnimation = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    isAnimationRunningRef.current = false;
    setIsTypingAnimation(false);
  };

  const loadConversationData = async () => {
    try {
      setIsLoading(true);
      
      // Load lesson and vocabulary
      const lessonData = await LessonService.getLesson(lessonId);
      if (!lessonData) {
        Alert.alert('Error', 'Lesson not found');
        navigation.goBack();
        return;
      }

      setLesson(lessonData.lesson);
      
      console.log('🔍 Raw lessonData.vocabulary:', lessonData.vocabulary);
      console.log('🔍 Vocabulary sample:', lessonData.vocabulary?.[0]);
      
      setVocabulary(lessonData.vocabulary || []);

      // Try to get conversation from chat_content
      let conversation: ConversationData | null = null;
      
      if (lessonData.lesson.chat_content) {
        try {
          conversation = JSON.parse(lessonData.lesson.chat_content);
          console.log('✅ Loaded conversation from database');
        } catch (error) {
          console.error('❌ Error parsing conversation data:', error);
        }
      }

      // Fallback to test conversation if no data found
      if (!conversation) {
        console.log('⚠️ No conversation data found, using fallback');
        conversation = {
          conversation: [
            {
              speaker: "Person A",
              message: "Hello! Let's practice some vocabulary."
            },
            {
              speaker: "User",
              message: "Yes, let's practice!"
            }
          ]
        };
      }

      setConversationData(conversation);
      setCurrentMessageIndex(0);
      currentMessageIndexRef.current = 0;
      conversationDataRef.current = conversation;
      
      // Start with Person A message (index 0)
      if (conversation.conversation.length > 0) {
        const firstMessage = conversation.conversation[0];
        console.log('🎬 Starting conversation with:', firstMessage.speaker, firstMessage.message);
        if (firstMessage.speaker === 'Person A') {
          console.log('🎬 Starting Person A typing animation');
          setIsTyping(true);
          isTypingRef.current = true;
          setIsTypingAnimation(true);
        }
      }

    } catch (error) {
      console.error('Error loading conversation data:', error);
      Alert.alert('Error', 'Failed to load conversation data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextMessage = useCallback(() => {
    if (!conversationDataRef.current) return;
    
    const currentIndex = currentMessageIndexRef.current;
    const nextIndex = currentIndex + 1;
    
    console.log(`🔄 Advancing from message ${currentIndex} to ${nextIndex}`);
    console.log(`📝 Current speaker: ${conversationDataRef.current.conversation[currentIndex]?.speaker}`);
    console.log(`📝 Next speaker: ${conversationDataRef.current.conversation[nextIndex]?.speaker}`);
    
    if (nextIndex >= conversationDataRef.current.conversation.length) {
      // Conversation completed
      handleConversationComplete();
      return;
    }
    
    // Clear exercise immediately if advancing to Person A message
    const nextMessage = conversationDataRef.current.conversation[nextIndex];
    if (nextMessage && nextMessage.speaker === 'Person A' && exerciseState.isActive) {
      console.log('🧹 Immediate exercise cleanup - Person A approaching');
      setExerciseState(prev => ({ ...prev, isActive: false, isCompleted: false, score: 0 }));
      setExerciseCreatedForMessage(-1);
    }

    // Update state
    setCurrentMessageIndex(nextIndex);
    currentMessageIndexRef.current = nextIndex;
    
    // Set typing state based on next speaker
    if (nextMessage.speaker === 'Person A') {
      setIsTyping(true);
      isTypingRef.current = true;
      setIsTypingAnimation(true);
    } else {
      setIsTyping(false);
      isTypingRef.current = false;
      setIsTypingAnimation(false);
    }
    
    console.log(`✅ Message advanced. Is typing: ${isTypingRef.current}`);
  }, []);

  // Function to detect keywords in user message and create exercise
  const detectKeywordsAndCreateExercise = useCallback((message: string): ConversationExercise | null => {
    if (!vocabulary.length || !message) return null;

    const words = message.toLowerCase().split(/\s+/);
    const foundKeywords: LessonVocabulary[] = [];

    // console.log('🔍 Detecting keywords in message:', message);
    // console.log('🔍 Available vocabulary:', vocabulary.map(v => ({ 
    //   english_term: v.english_term, 
    //   keywords: v.keywords 
    // })));

    // Check each word against vocabulary keywords
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, ''); // Remove punctuation
      const vocabMatch = vocabulary.find(v => {
        // Check if this vocabulary item has keywords
        if (v.keywords) {
          try {
            let keywordList: string[] = [];
            
            if (typeof v.keywords === 'string') {
              // Try to parse as JSON first, if that fails, treat as single keyword
              try {
                keywordList = JSON.parse(v.keywords);
              } catch {
                // If not JSON, treat the entire string as a single keyword
                keywordList = [v.keywords];
              }
            } else if (Array.isArray(v.keywords)) {
              keywordList = v.keywords;
            }
            
            // console.log('🔍 Checking keywords:', keywordList, 'against word:', cleanWord);
            return keywordList.some((keyword: string) => 
              keyword.toLowerCase() === cleanWord
            );
          } catch (error) {
            console.error('❌ Error parsing keywords:', v.keywords, error);
            return false;
          }
        }
        return false;
      });
      if (vocabMatch) {
        // console.log('✅ Found keyword match:', vocabMatch.english_term, 'for word:', cleanWord);
        foundKeywords.push(vocabMatch);
      }
    }

    if (foundKeywords.length === 0) {
      console.log('❌ No keywords found in message');
      return null;
    }

    // Pick one random keyword
    const selectedKeyword = foundKeywords[Math.floor(Math.random() * foundKeywords.length)];
    // console.log('🎯 Selected keyword for exercise:', selectedKeyword.english_term);

    // Pick random exercise type
    const exerciseTypes: ConversationExercise['type'][] = ['flashcard-quiz', 'speak', 'fill-in-blank', 'sentence-scramble'];
    const selectedType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

    // Find the actual word from the message that matches this vocabulary's keywords
    let matchedWord = '';
    const messageWords = message.toLowerCase().split(/\s+/);
    
    for (const word of messageWords) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (selectedKeyword.keywords) {
        try {
          let keywordList: string[] = [];
          if (typeof selectedKeyword.keywords === 'string') {
            try {
              keywordList = JSON.parse(selectedKeyword.keywords);
            } catch {
              keywordList = [selectedKeyword.keywords];
            }
          } else if (Array.isArray(selectedKeyword.keywords)) {
            keywordList = selectedKeyword.keywords;
          }
          
          const foundMatch = keywordList.some((keyword: string) =>
            keyword.toLowerCase() === cleanWord
          );
          
          if (foundMatch) {
            matchedWord = cleanWord;
            break;
          }
        } catch (error) {
          console.error('❌ Error in word matching:', error);
        }
      }
    }
    
    if (!matchedWord) {
      console.log('❌ Could not find matching word in sentence');
      return null;
    }

    console.log('🎯 Final exercise:', { matchedWord, selectedKeyword: selectedKeyword.english_term });

    return {
      type: selectedType,
      keyword: matchedWord, // Use the actual word from the message
      sentence: message,
      vocabulary: selectedKeyword
    };
  }, [vocabulary]);

  // Auto-detect keywords when user message is displayed (only after Person A finishes typing)
  useEffect(() => {
    if (conversationData && currentMessageIndex < conversationData.conversation.length) {
      const currentMessage = conversationData.conversation[currentMessageIndex];
      
      // Only create exercise if:
      // 1. It's a User message
      // 2. No exercise is currently active
      // 3. No exercise has been created for this message yet
      // 4. Person A has finished typing (no typing animation active)
      if (currentMessage && 
          currentMessage.speaker === 'User' && 
          !exerciseState.isActive && 
          exerciseCreatedForMessage !== currentMessageIndex &&
          !isTypingAnimation && // Wait until ALL typing animations finish
          !isTyping) { // Additional check to ensure no typing is happening
        
        console.log('🔍 Exercise creation check:', {
          currentMessageIndex,
          messageText: currentMessage.message,
          exerciseCreatedForMessage,
          isActive: exerciseState.isActive,
          isTypingAnimation,
          isTyping
        });
        
        console.log('🔍 About to create exercise, will set exerciseCreatedForMessage to:', currentMessageIndex);
        
        // Check for keywords and create exercise automatically
        const exercise = detectKeywordsAndCreateExercise(currentMessage.message);
        
        if (exercise) {
          console.log('🎯 Exercise created automatically for message', currentMessageIndex, ':', exercise);
          setExerciseCreatedForMessage(currentMessageIndex); // Mark this message as processed
          console.log('🔍 JUST SET exerciseCreatedForMessage to:', currentMessageIndex);
          
          console.log('🎯 DEEP DIVE: Creating exercise:', exercise);
          setExerciseState({
            isActive: true,
            exercise,
            isCompleted: false,
            score: 0
          });
          console.log('🎯 DEEP DIVE: Exercise state set to active');
          
          // Initialize scramble if it's a sentence scramble exercise
          if (exercise.type === 'sentence-scramble') {
            initializeScramble(exercise.sentence);
          }
          
          // Reset fill-blank answer
          setFillBlankAnswer('');
        }
      }
    }
  }, [currentMessageIndex, conversationData, exerciseState.isActive, exerciseCreatedForMessage, isTypingAnimation, isTyping, detectKeywordsAndCreateExercise, initializeScramble]);

  // Clear exercise when advancing to ANY new message (User or Person A)
  useEffect(() => {
    if (conversationData && currentMessageIndex < conversationData.conversation.length) {
      const currentMessage = conversationData.conversation[currentMessageIndex];
      
      // Clear exercise when advancing to ANY Person A message (they start typing)
      if (currentMessage && currentMessage.speaker === 'Person A') {
        console.log('🔍 Checking exercise cleanup for Person A message:', {
          currentMessageIndex,
          currentMessageText: currentMessage.message,
          exerciseActive: exerciseState.isActive,
          exerciseCreatedForMessage
        });
        
        // Always clear any existing exercise when Person A starts typing
        if (exerciseState.isActive || exerciseCreatedForMessage >= 0) {
          console.log('🧹 Clearing exercise - Person A starting to type:', {
            currentMessageIndex,
            currentMessageText: currentMessage.message,
            oldExerciseMessageIndex: exerciseCreatedForMessage
          });
          
          setExerciseState(prev => ({
            ...prev,
            isActive: false,
            isCompleted: false,
            score: 0
          }));
          
          // Reset all exercise states
          setScrambleWords([]);
          setScrambleOrder([]);
          setScrambleCorrectOrder([]);
          setFillBlankAnswer('');
          setIsRecording(false);
          setRecordingResult(null);
          setExerciseCreatedForMessage(-1); // Reset to allow new exercise creation
        }
      }
      // Similarly clear when advancing to a User message
      else if (currentMessage && currentMessage.speaker === 'User') {
        // Additional cleanup logic for user messages if needed
        if (exerciseState.isActive && exerciseCreatedForMessage >= 0 && exerciseCreatedForMessage < currentMessageIndex) {
          console.log('🧹 Clearing stale exercise for new user message:', {
            currentMessageIndex,
            currentMessageText: currentMessage.message,
            oldExerciseMessageIndex: exerciseCreatedForMessage
          });
          
          setExerciseState(prev => ({
            ...prev,
            isActive: false,
            isCompleted: false,
            score: 0
          }));
          
          setExerciseCreatedForMessage(-1);
        }
      }
    }
  }, [currentMessageIndex, conversationData, exerciseState.isActive, exerciseCreatedForMessage]);

  const handleSendMessage = useCallback(() => {
    // This function is no longer needed since exercises auto-trigger
    // User messages are automatically processed when exercises complete
    console.log('🚫 handleSendMessage called but auto-exercises handle this now');
  }, []);


  // Exercise completion handler
  const handleExerciseComplete = useCallback((isCorrect: boolean) => {
    const newScore = isCorrect ? 1 : 0;
    
    console.log('🎯 Exercise completed:', { isCorrect, score: newScore });
    
    // Haptic feedback based on answer
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    if (isCorrect) {
      // Correct answer - complete immediately
      setExerciseState(prev => ({
        ...prev,
        isCompleted: true,
        score: newScore,
        isActive: false // Hide exercise
      }));
    } else {
      // Incorrect answer - show feedback and allow retry
      setTimeout(() => {
        Alert.alert(
          '❌ Incorrect Answer',
          'Please try again. Make sure your answer matches the keyword exactly.',
          [
            {
              text: 'Try Again',
              style: 'default'
            }
          ]
        );
      }, 500);
      return; // Don't proceed if incorrect
    }

    // Reset all exercise states immediately
    setScrambleWords([]);
    setScrambleOrder([]);
    setScrambleCorrectOrder([]);
    setFillBlankAnswer('');
    setIsRecording(false);
    setRecordingResult(null);
    // Don't reset exerciseCreatedForMessage here - keep it to prevent duplicate creation
    // setExerciseCreatedForMessage(-1);

    // Proceed with conversation immediately after hiding exercise
    if (conversationData) {
      const currentMessage = conversationData.conversation[currentMessageIndex];
      if (currentMessage && currentMessage.speaker === 'User') {
        setTypingText('');
        setIsTypingAnimation(true);
      }
    }
  }, [conversationData, currentMessageIndex]);

  // Exercise skip handler
  const handleExerciseSkip = useCallback(() => {
    handleExerciseComplete(false); // 0 points for skip
  }, [handleExerciseComplete]);

  // Sentence scramble handlers
  const initializeScramble = useCallback((sentence: string) => {
    const words = sentence.split(' ').filter(word => word.trim().length > 0);
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    setScrambleWords(shuffledWords);
    setScrambleOrder([]);
    setScrambleCorrectOrder(words);
  }, []);

  const handleScrambleWordTap = useCallback((index: number, area: 'available' | 'answer') => {
    if (area === 'available') {
      // Move word from available to answer
      const word = scrambleWords[index];
      setScrambleWords(prev => prev.filter((_, i) => i !== index));
      setScrambleOrder(prev => [...prev, word]);
    } else {
      // Move word from answer back to available
      const word = scrambleOrder[index];
      setScrambleOrder(prev => prev.filter((_, i) => i !== index));
      setScrambleWords(prev => [...prev, word]);
    }
  }, [scrambleWords, scrambleOrder]);

  const handleScrambleReset = useCallback(() => {
    const allWords = [...scrambleOrder, ...scrambleWords];
    const shuffledWords = allWords.sort(() => Math.random() - 0.5);
    setScrambleWords(shuffledWords);
    setScrambleOrder([]);
  }, [scrambleOrder, scrambleWords]);

  const handleScrambleCheck = useCallback(() => {
    const userSentence = scrambleOrder.join(' ');
    const correctSentence = scrambleCorrectOrder.join(' ');
    const isCorrect = userSentence === correctSentence;
    
    console.log('🔍 Scramble check:', {
      userSentence,
      correctSentence,
      isCorrect,
      scrambleOrder,
      scrambleCorrectOrder
    });
    
    // If incorrect, don't complete yet - let user try again
    if (!isCorrect) {
      // Haptic feedback for incorrect answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Try Again', 'The sentence order is not correct. Keep trying!');
      return;
    }
    
    // If correct, complete the exercise immediately without alert
    console.log('✅ Scramble correct! Completing exercise...');
    handleExerciseComplete(true);
  }, [scrambleOrder, scrambleCorrectOrder, handleExerciseComplete]);

  // Fill-in-blank handlers
  const handleFillBlankCheck = useCallback(() => {
    if (!exerciseState.exercise || !exerciseState.exercise.keyword) return;
    
    const correctAnswer = exerciseState.exercise.keyword.toLowerCase().trim();
    const userAnswer = fillBlankAnswer.toLowerCase().trim();
    const isCorrect = userAnswer === correctAnswer;
    
    console.log('🔍 Fill-blank check:', {
      correctAnswer,
      userAnswer,
      isCorrect,
      keyword: exerciseState.exercise.keyword
    });
    
    handleExerciseComplete(isCorrect);
  }, [fillBlankAnswer, exerciseState.exercise, handleExerciseComplete]);

  const handleFillBlankReset = useCallback(() => {
    setFillBlankAnswer('');
  }, []);

  // Speak exercise handlers
  const handleStartRecording = useCallback(async () => {
    if (!exerciseState.exercise?.keyword) {
      console.error('❌ No keyword available for recording');
      return;
    }

    setIsRecording(true);
    setRecordingResult(null);
    
    try {
      console.log('🎤 Starting recording for keyword:', exerciseState.exercise.keyword);
      
      // Start recording with Azure Speech Services
      await PronunciationService.startRecording(10000); // 10 second max recording
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setIsRecording(false);
      // Show user-friendly error
      setRecordingResult({
        assessment: {
          pronunciationScore: 0,
          accuracyScore: 0,
          recognizedText: '',
          error: 'microphone'
        }
      });
    }
  }, [exerciseState.exercise]);

  const handleStopRecording = useCallback(async () => {
    if (!exerciseState.exercise?.sentence) {
      console.error('❌ No sentence available for processing');
      return;
    }

    setIsRecording(false);
    console.log('🎤 Stopping recording, processing with Azure...');
    
    try {
      // Stop recording and get audio URI
      const audioUri = await PronunciationService.stopRecording();
      
      if (!audioUri) {
        throw new Error('No audio recorded');
      }

      console.log('📤 Processing audio with Azure Speech Services...');
      
      // Send to Azure for pronunciation assessment
      const result = await PronunciationService.assessPronunciation(
        audioUri, 
        exerciseState.exercise.sentence
      );

      if (result.success && result.assessment) {
        const assessment = result.assessment;
        console.log('✅ Azure assessment complete:', {
          pronunciationScore: assessment.pronunciationScore,
          recognizedText: assessment.recognizedText
        });

        // Display the results
        setRecordingResult({
          assessment: {
            pronunciationScore: assessment.pronunciationScore,
            accuracyScore: assessment.accuracyScore,
            recognizedText: assessment.recognizedText,
            referenceText: exerciseState.exercise.keyword
          },
          feedback: result.feedback
        });

        // Mark as correct if pronunciation score >= 70
        const score = assessment.pronunciationScore;
        const isCorrect = score >= 70;
        console.log('🎯 Pronunciation assessment complete. Score:', score, 'Passed:', isCorrect);
        
        // Show result for 2 seconds then complete exercise (haptic will be triggered in handleExerciseComplete)
        setTimeout(() => {
          handleExerciseComplete(isCorrect);
        }, 2000);

      } else {
        console.error('❌ Azure assessment failed:', result.error);
        setRecordingResult({
          assessment: {
            pronunciationScore: 0,
            accuracyScore: 0,
            recognizedText: '',
            error: result.error?.includes('No speech recognized') 
              ? 'No speech recognized' 
              : result.error?.includes('network') 
              ? 'network'
              : 'assessment'
          }
        });
        
        // Auto-complete after 3 seconds with failure
        setTimeout(() => {
          handleExerciseComplete(false);
        }, 3000);
      }

    } catch (error) {
      console.error('❌ Recording/assessment error:', error);
      setRecordingResult({
        assessment: {
          pronunciationScore: 0,
          accuracyScore: 0,
          recognizedText: '',
          error: 'recording'
        }
      });
      
      // Auto-complete after 3 seconds with failure  
      setTimeout(() => {
        handleExerciseComplete(false);
      }, 3000);
    }
  }, [exerciseState.exercise, handleExerciseComplete]);

  // 5-button functionality handlers
  const handleAudioPlay = async (text: string, languageCode: string, speed: number) => {
    if (isPlayingAudio) return;
    
    console.log('🎤 Starting speech:', { text, languageCode, speed });
    
    setIsPlayingAudio(true);
    try {
      // Use Expo Speech directly for personal lessons
      await VoiceService.textToSpeechExpo(text, {
        language: languageCode,
        rate: speed,
        pitch: 1.0,
        volume: 0.8,
      });
      
      console.log('✅ Expo Speech TTS completed');
      setIsPlayingAudio(false);
      
    } catch (error) {
      console.error('❌ TTS error:', error);
      setIsPlayingAudio(false);
      Alert.alert(
        'Audio Unavailable',
        'Audio playback is currently unavailable. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNormalSpeedPlay = (text: string, languageCode: string) => {
    console.log('🔊 Normal speed play button pressed:', text);
    handleAudioPlay(text, languageCode, 1.0);
  };

  const handleSlowSpeedPlay = (text: string, languageCode: string) => {
    handleAudioPlay(text, languageCode, 0.7);
  };

  const handleToggleTranslation = () => {
    console.log('🔄 Translation toggle button pressed');
    setShowTranslation(!showTranslation);
  };

  const handleToggleHideMessage = (messageIndex: number) => {
    console.log('👁️ Hide message button pressed for index:', messageIndex);
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

  const handleConversationComplete = async () => {
    if (!user) return;
    
    console.log('🎉 Conversation completed');
    setIsCompleted(true);
    
    // Award XP for completing the conversation
    try {
      const xpResult = await XPService.awardXP(
        user.id,
        'lesson',
        10, // Base XP for conversation completion
        10,
        100, // 100% accuracy for completing conversation
        lessonTitle || 'Conversation Lesson',
        120 // 2 minutes estimated time
      );
      
      if (xpResult) {
        logger.info(`XP awarded for conversation: ${xpResult.totalXP} XP`);
      }
    } catch (xpError) {
      logger.error('Error awarding XP for conversation:', xpError);
    }
    
    // Show completion alert
    Alert.alert(
      '🎉 Conversation Complete!',
      'Great job! You\'ve completed the conversation lesson.',
      [
        {
          text: 'Back to Lessons',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const renderMessage = React.useCallback((message: ConversationMessage, index: number) => {
    console.log('🎨 Rendering message:', index, message.speaker, message.message);
    const isUser = message.speaker === 'User';
    const isCurrentMessage = index === currentMessageIndex;
    const isCurrentlyTyping = isCurrentMessage && isTypingAnimation;
    
    // Show Person A messages up to current index
    // Show User messages if they're past messages OR currently typing OR just completed
    const isVisible = isUser 
      ? index < currentMessageIndex || (index === currentMessageIndex && (isTypingAnimation || userMessageCompleted))  // User messages show after sent OR while typing OR just completed
      : index <= currentMessageIndex; // Person A messages show up to current
    
    console.log('👁️ Message visibility check:', {
      index,
      isUser,
      currentMessageIndex,
      isTypingAnimation,
      userMessageCompleted,
      isVisible
    });
    
    // Don't render messages that haven't been reached yet
    if (!isVisible) {
      console.log('❌ Message not visible, skipping render');
      return null;
    }
    
    console.log('✅ Message is visible, rendering with buttons');
    
    // Determine what text to show
    let displayText = message.message;
    if (isCurrentlyTyping) {
      displayText = typingText;
    }
    
    return (
      <View
        key={`message-${index}`}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.otherMessageContainer,
          isCurrentMessage ? styles.currentMessage : styles.pastMessage
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.otherMessageBubble
          ]}
        >
          {!hiddenMessages.has(index) && (
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.otherMessageText
            ]}>
              {displayText}
              {isCurrentlyTyping && <Text style={styles.cursor}>|</Text>}
            </Text>
          )}
          {hiddenMessages.has(index) && (
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.otherMessageText
            ]}>
              ••••••••
            </Text>
          )}
          
          {/* 5-button functionality */}
          {console.log('🔧 About to render 5 buttons for message:', index)}
          <View style={styles.messageActions}>
            <TouchableOpacity 
              style={[styles.messageActionIcon, { backgroundColor: 'red' }]}
              onPress={() => {
                console.log('🔊 RED TEST BUTTON PRESSED!', displayText);
                Alert.alert('RED BUTTON TEST', 'Red button was pressed!');
              }}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>TEST</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.messageActionIcon, isPlayingAudio && styles.messageActionIconActive]}
              onPress={() => {
                console.log('🔊 TEST BUTTON PRESSED!', displayText);
                Alert.alert('Test', 'Button pressed!');
                // For target language text, use target language voice (English)
                handleNormalSpeedPlay(displayText, getSpeechLanguageCode('en-GB'));
              }}
            >
              <Ionicons 
                name="volume-high" 
                size={16} 
                color={isPlayingAudio ? "#ffffff" : "rgba(255,255,255,0.8)"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.messageActionIcon, isPlayingAudio && styles.messageActionIconActive]}
              onPress={() => {
                // For target language text, use target language voice (English)
                handleSlowSpeedPlay(displayText, getSpeechLanguageCode('en-GB'));
              }}
            >
              <Ionicons 
                name="time" 
                size={16} 
                color={isPlayingAudio ? "#ffffff" : "rgba(255,255,255,0.8)"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageActionIcon}
              onPress={() => handleToggleTranslation()}
            >
              <Ionicons 
                name="swap-horizontal" 
                size={16} 
                color="rgba(255,255,255,0.8)" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageActionIcon}
              onPress={() => handleToggleHideMessage(index)}
            >
              <Ionicons 
                name={hiddenMessages.has(index) ? "eye-off" : "eye"} 
                size={16} 
                color="rgba(255,255,255,0.8)" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageActionIcon}
              onPress={() => handleShowLearningResources(displayText)}
            >
              <Ionicons name="school" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[
          styles.speakerLabel,
          isUser ? styles.userSpeakerLabel : styles.otherSpeakerLabel
        ]}>
          {message.speaker}
        </Text>
      </View>
    );
  }, [currentMessageIndex, isTypingAnimation, typingText, userMessageCompleted, hiddenMessages, showTranslation, isPlayingAudio]);

  // Render conversation exercise component
  const renderConversationExercise = () => {
    if (!exerciseState.isActive || !exerciseState.exercise) {
      return null;
    }

    const { exercise } = exerciseState;

    switch (exercise.type) {
      case 'flashcard-quiz':
        return (
          <View style={styles.integratedExerciseContainer}>
            <Text style={styles.integratedExerciseTitle}>CHOOSE THE CORRECT ANSWER</Text>
            <Text style={styles.integratedExerciseContext}>Complete this to continue the conversation</Text>
            
            <View style={styles.integratedFlashcardContainer}>
              {/* Show sentence with blank where keyword appears */}
              <Text style={styles.integratedFlashcardSentence}>
                {exercise.sentence.split(' ').map((word, index) => {
                  // Clean both the word and keyword for comparison
                  const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
                  const cleanKeyword = exercise.keyword ? exercise.keyword.toLowerCase().replace(/[^\w]/g, '') : '';
                  const isKeyword = cleanKeyword && cleanWord === cleanKeyword;
                  
                  return (
                    <Text key={index}>
                      <Text style={isKeyword ? styles.integratedFlashcardBlank : styles.integratedFlashcardWord}>
                        {isKeyword ? '_____' : word}
                      </Text>
                      {index < exercise.sentence.split(' ').length - 1 && <Text> </Text>}
                    </Text>
                  );
                })}
              </Text>
            
              <Text style={styles.integratedFlashcardHint}>
                Which English word fits in the blank?
              </Text>
            
              <View style={styles.integratedFlashcardOptions}>
                <TouchableOpacity
                  style={styles.integratedFlashcardButton}
                  onPress={() => handleExerciseComplete(true)}
                >
                  <Text style={styles.integratedOptionText}>{exercise.keyword}</Text>
                </TouchableOpacity>
                
                {/* Add 2 random incorrect keywords from lesson vocabulary */}
                {(() => {
                  console.log('🔍 Available vocabulary keywords:', vocabulary.map(v => v.keywords));
                  console.log('🔍 Exercise keyword:', exercise.keyword);
                  
                  // Get all vocabulary keywords that are NOT the correct answer
                  const incorrectOptions = vocabulary
                    .filter(v => v.keywords && v.keywords !== exercise.keyword)
                    .map(v => v.keywords);
                  
                  console.log('🔍 Incorrect options:', incorrectOptions);
                  
                  // Shuffle and take 2 random incorrect options
                  const shuffled = incorrectOptions.sort(() => Math.random() - 0.5);
                  const selectedIncorrect = shuffled.slice(0, 2);
                  
                  console.log('🔍 Selected incorrect:', selectedIncorrect);
                  
                  return selectedIncorrect.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.integratedFlashcardButton}
                      onPress={() => handleExerciseComplete(false)}
                    >
                      <Text style={styles.integratedOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ));
                })()}
              </View>
              
              {/* 5-button functionality for exercise */}
              {console.log('🔧 DEEP DIVE: About to render 5 buttons for flashcard-quiz exercise')}
              <View style={styles.exerciseActions}>
                <TouchableOpacity 
                  style={[styles.exerciseActionIcon, isPlayingAudio && styles.exerciseActionIconActive]}
                  onPress={() => {
                    console.log('🔊 DEEP DIVE: TEST BUTTON PRESSED!', exercise.sentence);
                    Alert.alert('DEEP DIVE TEST', 'Button pressed!');
                    handleNormalSpeedPlay(exercise.sentence, getSpeechLanguageCode('en-GB'));
                  }}
                >
                  <Ionicons 
                    name="volume-high" 
                    size={16} 
                    color={isPlayingAudio ? "#ffffff" : "rgba(255,255,255,0.8)"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.exerciseActionIcon, isPlayingAudio && styles.exerciseActionIconActive]}
                  onPress={() => {
                    console.log('⏰ Exercise slow audio button pressed:', exercise.sentence);
                    handleSlowSpeedPlay(exercise.sentence, getSpeechLanguageCode('en-GB'));
                  }}
                >
                  <Ionicons 
                    name="time" 
                    size={16} 
                    color={isPlayingAudio ? "#ffffff" : "rgba(255,255,255,0.8)"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exerciseActionIcon}
                  onPress={() => {
                    console.log('🔄 Exercise translation toggle pressed');
                    handleToggleTranslation();
                  }}
                >
                  <Ionicons 
                    name="swap-horizontal" 
                    size={16} 
                    color="rgba(255,255,255,0.8)" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exerciseActionIcon}
                  onPress={() => {
                    console.log('👁️ Exercise hide button pressed');
                    // For exercise, we can hide the sentence
                    Alert.alert('Hide Exercise', 'This will hide the exercise sentence');
                  }}
                >
                  <Ionicons 
                    name="eye" 
                    size={16} 
                    color="rgba(255,255,255,0.8)" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exerciseActionIcon}
                  onPress={() => {
                    console.log('🎓 Exercise learning resources pressed');
                    handleShowLearningResources(exercise.sentence);
                  }}
                >
                  <Ionicons name="school" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'fill-in-blank':
        // console.log('🎯 Fill-blank exercise data:', {
        //   sentence: exercise.sentence,
        //   keyword: exercise.keyword,
        //   vocabulary: exercise.vocabulary
        // });
        
        return (
          <View style={styles.integratedExerciseContainer}>
            <Text style={styles.integratedExerciseTitle}>FILL IN THE BLANK</Text>
            <Text style={styles.integratedExerciseContext}>Complete this to continue the conversation</Text>
            
            <View style={styles.integratedFillBlankContainer}>
              <View style={styles.integratedFillBlankSentenceContainer}>
                {exercise.sentence.split(' ').map((word, index) => {
                  // Clean both the word and keyword for comparison
                  const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
                  const cleanKeyword = exercise.keyword ? exercise.keyword.toLowerCase().replace(/[^\w]/g, '') : '';
                  const isKeyword = cleanKeyword && cleanWord === cleanKeyword;
                  
                  
                  return (
                    <View key={index} style={styles.integratedFillBlankWordContainer}>
                      {isKeyword ? (
                        <TextInput
                          style={styles.integratedFillBlankInput}
                          value={fillBlankAnswer}
                          onChangeText={setFillBlankAnswer}
                          placeholder="____"
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      ) : (
                        <Text style={styles.integratedFillBlankWord}>{word}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <Text style={styles.integratedFillBlankHint}>
                Hint: {exercise.vocabulary?.definition || 'No hint available'}
              </Text>
              
              <View style={styles.integratedFillBlankButtons}>
                <TouchableOpacity
                  style={[styles.integratedButton, styles.integratedResetButton]}
                  onPress={handleFillBlankReset}
                >
                  <Text style={styles.integratedButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.integratedButton, 
                    fillBlankAnswer.trim() ? styles.integratedCorrectButton : styles.integratedDisabledButton
                  ]}
                  onPress={handleFillBlankCheck}
                  disabled={!fillBlankAnswer.trim()}
                >
                  <Text style={styles.integratedButtonText}>Check Answer</Text>
                </TouchableOpacity>
              </View>
              
              {/* 5-button functionality for exercise */}
              <View style={styles.exerciseActions}>
                <TouchableOpacity 
                  style={[styles.exerciseActionIcon, isPlayingAudio && styles.exerciseActionIconActive]}
                  onPress={() => {
                    console.log('🔊 Fill-blank exercise audio button pressed:', exercise.sentence);
                    handleNormalSpeedPlay(exercise.sentence, getSpeechLanguageCode('en-GB'));
                  }}
                >
                  <Ionicons 
                    name="volume-high" 
                    size={16} 
                    color={isPlayingAudio ? "#ffffff" : "rgba(255,255,255,0.8)"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.exerciseActionIcon, isPlayingAudio && styles.exerciseActionIconActive]}
                  onPress={() => {
                    console.log('⏰ Fill-blank exercise slow audio button pressed:', exercise.sentence);
                    handleSlowSpeedPlay(exercise.sentence, getSpeechLanguageCode('en-GB'));
                  }}
                >
                  <Ionicons 
                    name="time" 
                    size={16} 
                    color={isPlayingAudio ? "#ffffff" : "rgba(255,255,255,0.8)"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exerciseActionIcon}
                  onPress={() => {
                    console.log('🔄 Fill-blank exercise translation toggle pressed');
                    handleToggleTranslation();
                  }}
                >
                  <Ionicons 
                    name="swap-horizontal" 
                    size={16} 
                    color="rgba(255,255,255,0.8)" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exerciseActionIcon}
                  onPress={() => {
                    console.log('👁️ Fill-blank exercise hide button pressed');
                    Alert.alert('Hide Exercise', 'This will hide the exercise sentence');
                  }}
                >
                  <Ionicons 
                    name="eye" 
                    size={16} 
                    color="rgba(255,255,255,0.8)" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exerciseActionIcon}
                  onPress={() => {
                    console.log('🎓 Fill-blank exercise learning resources pressed');
                    handleShowLearningResources(exercise.sentence);
                  }}
                >
                  <Ionicons name="school" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'speak':
        return (
          <View style={styles.integratedExerciseContainer}>
            <Text style={styles.integratedExerciseTitle}>SAY THE CORRECT RESPONSE</Text>
            
            <View style={styles.integratedSpeakSentenceContainer}>
              <Text style={styles.integratedSpeakSentence}>
                {exercise.sentence}
              </Text>
            </View>
            
            <View style={styles.integratedSpeakInstructions}>
              <Text style={styles.integratedSpeakInstruction}>Say the sentence above</Text>
            </View>
              
            <View style={styles.integratedSpeakRecordingCircle}>
              {!isRecording && !recordingResult ? (
                <TouchableOpacity
                  style={styles.integratedSpeakMicCircle}
                  onPress={handleStartRecording}
                >
                  <Ionicons name="mic" size={32} color="#ffffff" />
                </TouchableOpacity>
              ) : isRecording ? (
                <TouchableOpacity
                  style={[styles.integratedSpeakMicCircle, styles.integratedSpeakStopCircle]}
                  onPress={handleStopRecording}
                >
                  <View style={styles.integratedSpeakStopIcon} />
                </TouchableOpacity>
              ) : recordingResult ? (
                <View style={styles.integratedSpeakMicCircle}>
                  {(recordingResult.assessment?.pronunciationScore || 0) >= 70 ? (
                    <Ionicons name="checkmark" size={32} color="#10b981" />
                  ) : (
                    <Ionicons name="refresh" size={32} color="#ef4444" />
                  )}
                </View>
              ) : null}
            </View>
            
            <Text style={styles.integratedSpeakRecordingHint}>
              {!isRecording && !recordingResult ? "Tap to Record" : 
               isRecording ? "Speak Now - Tap to Cancel" : 
               (recordingResult?.assessment?.pronunciationScore || 0) >= 70 ? "Great pronunciation!" : "Try speaking the sentence again"}
            </Text>
            
            <TouchableOpacity
              style={styles.integratedSpeakSkipButton}
              onPress={() => handleExerciseComplete(false)}
            >
              <Text style={styles.integratedSpeakSkipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        );
      case 'sentence-scramble':
        return (
          <View style={styles.integratedExerciseContainer}>
            <Text style={styles.integratedExerciseTitle}>REORDER THE SENTENCE</Text>
            <Text style={styles.integratedExerciseContext}>Tap words to reorder the sentence</Text>
            
            <View style={styles.integratedScrambleContainer}>
              {/* User's current order */}
              <View style={styles.integratedScrambleAnswerArea}>
                <Text style={styles.integratedScrambleAnswerLabel}>Your sentence:</Text>
                <View style={styles.integratedScrambleAnswerContainer}>
                  {scrambleOrder.map((word, index) => (
                    <TouchableOpacity
                      key={`answer-${index}`}
                      style={[styles.integratedScrambleWord, styles.integratedScrambleAnswerWord]}
                      onPress={() => handleScrambleWordTap(index, 'answer')}
                    >
                      <Text style={styles.integratedScrambleWordText}>{word}</Text>
                    </TouchableOpacity>
                  ))}
                  {scrambleOrder.length === 0 && (
                    <Text style={styles.integratedScramblePlaceholder}>Tap words below to build your sentence</Text>
                  )}
                </View>
              </View>
              
              {/* Available words */}
              <View style={styles.integratedScrambleWordsArea}>
                <Text style={styles.integratedScrambleWordsLabel}>Available words:</Text>
                <View style={styles.integratedScrambleWordsContainer}>
                  {scrambleWords.map((word, index) => (
                    <TouchableOpacity
                      key={`word-${index}`}
                      style={[styles.integratedScrambleWord, styles.integratedScrambleAvailableWord]}
                      onPress={() => handleScrambleWordTap(index, 'available')}
                    >
                      <Text style={styles.integratedScrambleWordText}>{word}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.integratedScrambleButtons}>
                <TouchableOpacity
                  style={[styles.integratedButton, styles.integratedResetButton]}
                  onPress={handleScrambleReset}
                >
                  <Text style={styles.integratedButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.integratedButton, 
                    scrambleOrder.length === scrambleCorrectOrder.length ? styles.integratedCorrectButton : styles.integratedDisabledButton
                  ]}
                  onPress={handleScrambleCheck}
                  disabled={scrambleOrder.length !== scrambleCorrectOrder.length}
                >
                  <Text style={styles.integratedButtonText}>Check Answer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderActionButton = () => {
    if (!conversationData) return null;
    
    const currentMessage = conversationData.conversation[currentMessageIndex];
    const isPersonATyping = currentMessage?.speaker !== 'User' && isTypingAnimation;
    
    if (isPersonATyping) {
      return (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
          <Text style={styles.typingText}>Other person is typing...</Text>
        </View>
      );
    } else {
      // No send button needed - exercises handle progression
      return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversationData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load conversation</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConversationData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              // Navigate back to Your Lessons page
              navigation.navigate('YourLessons');
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation</Text>
          <View style={styles.placeholder} />
        </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentMessageIndex + 1) / conversationData.conversation.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentMessageIndex + 1} of {conversationData.conversation.length}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {conversationData.conversation.map((message, index) => 
          renderMessage(message, index)
        )}
      </ScrollView>

      {/* Exercise overlay - render before action container */}
      {renderConversationExercise()}
      
      {/* Action Button */}
      <View style={styles.actionContainer}>
        {renderActionButton()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 100, // Space for action button
  },
  messageContainer: {
    marginBottom: 16,
    opacity: 1,
  },
  currentMessage: {
    opacity: 1,
  },
  pastMessage: {
    opacity: 1,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#1e293b',
  },
  speakerLabel: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  userSpeakerLabel: {
    color: '#6366f1',
    textAlign: 'right',
  },
  otherSpeakerLabel: {
    color: '#64748b',
    textAlign: 'left',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginHorizontal: 2,
  },
  typingDot1: {
    // animationDelay: '0s', // Not supported in React Native
  },
  typingDot2: {
    // animationDelay: '0.2s', // Not supported in React Native
  },
  typingDot3: {
    // animationDelay: '0.4s', // Not supported in React Native
  },
  typingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cursor: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  // Integrated Exercise styles (like Jumpspeak)
  integratedExerciseContainer: {
    backgroundColor: '#1e293b',
    padding: 20,
    marginTop: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    position: 'relative',
    zIndex: 1000,
  },
  integratedExerciseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  integratedExerciseContext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Flashcard quiz styles
  integratedFlashcardContainer: {
    alignItems: 'center',
  },
  integratedFlashcardSentenceContainer: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  integratedFlashcardSentence: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 15,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  integratedFlashcardWord: {
    fontSize: 16,
    color: '#ffffff',
  },
  integratedFlashcardBlank: {
    fontSize: 16,
    color: '#ffffff',
    textDecorationLine: 'underline',
    textDecorationColor: '#ffffff',
  },
  integratedFlashcardHint: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  integratedFlashcardOptions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 15,
    paddingHorizontal: 10,
  },
  integratedFlashcardButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  // Simple flashcard styles
  simpleFlashcard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    minHeight: 120,
  },
  flashcardFront: {
    marginBottom: 16,
  },
  flashcardBack: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 16,
  },
  flashcardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  flashcardWord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  flashcardTranslation: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 8,
  },
  flashcardDefinition: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // Speak styles
  speakContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  speakInstruction: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 12,
  },
  speakWord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  speakButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  speakButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Fill-in-blank styles
  fillBlankContainer: {
    marginBottom: 24,
  },
  fillBlankInstruction: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 12,
  },
  fillBlankSentence: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  fillBlankHint: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Scramble styles
  scrambleContainer: {
    marginBottom: 24,
  },
  scrambleInstruction: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 12,
  },
  scrambleWords: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 28,
    textAlign: 'center',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
  },
  // Integrated Flashcard Quiz Styles
  integratedFlashcardContainer: {
    marginBottom: 20,
  },
  integratedFlashcardQuestion: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffffff',
  },
  integratedOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  integratedCorrectOption: {
    borderColor: '#10b981',
  },
  integratedIncorrectOption: {
    borderColor: '#ef4444',
  },
  integratedOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  // Integrated Fill-in-the-Blank Styles
  integratedFillBlankContainer: {
    marginBottom: 20,
  },
  integratedFillBlankSentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    gap: 4,
  },
  integratedFillBlankWordContainer: {
    marginHorizontal: 2,
  },
  integratedFillBlankWord: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  integratedFillBlankInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#ffffff',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
    textAlign: 'center',
  },
  integratedFillBlankDebug: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  integratedFillBlankHint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  integratedFillBlankButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  // Integrated Speak Exercise Styles
  integratedSpeakContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  integratedSpeakSentence: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 15,
    color: '#ffffff',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  integratedSpeakNormalWord: {
    fontSize: 18,
    color: '#ffffff',
  },
  integratedSpeakBoldWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#10b981',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  integratedSpeakHint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  integratedSpeakButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  integratedMicButton: {
    backgroundColor: '#3b82f6',
  },
  integratedRecordingButton: {
    backgroundColor: '#ef4444',
  },
  integratedSpeakResult: {
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  integratedSpeakScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  integratedSpeakFeedback: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  integratedSpeakText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 4,
    fontStyle: 'italic',
  },
  integratedSpeakError: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  integratedSpeakErrorContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  integratedSpeakErrorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  integratedSpeakErrorTitle: {
    fontSize: 18,
    color: '#fbbf24',
    fontWeight: '600',
    marginBottom: 4,
  },
  integratedSpeakErrorText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
  },
  integratedSpeakScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  integratedSpeakScoreLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '500',
  },
  integratedSpeakScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  integratedSpeakScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  integratedSpeakScoreGood: {
    color: '#10b981',
  },
  integratedSpeakScorePoor: {
    color: '#f59e0b',
  },
  integratedSpeakRecognitionContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  integratedSpeakRecognitionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  integratedSpeakRecognitionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  integratedSpeakFeedbackContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  integratedSpeakFeedbackGood: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
    textAlign: 'center',
  },
  integratedSpeakFeedbackPoor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
    textAlign: 'center',
  },
  integratedSpeakFeedbackSubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  integratedSpeakFeedbackTips: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  integratedSkipButton: {
    backgroundColor: '#6b7280',
    marginTop: 16,
    opacity: 0.8,
  },
  integratedSkipButtonText: {
    fontSize: 16,
    color: '#d1d5db',
    fontWeight: '500',
  },
  integratedSpeakMinimalResult: {
    alignItems: 'center',
    marginVertical: 12,
  },
  integratedSpeakMinimalSuccess: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 12,
  },
  integratedSpeakMinimalFailure: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: '500',
    marginBottom: 12,
  },
  integratedSpeakRecordButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  integratedSpeakRecordText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  integratedSpeakRetryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  integratedSpeakRetryText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  integratedSpeakSkipButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  integratedSpeakSkipText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  // New clean layout styles
  integratedSpeakSentenceContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
    alignItems: 'center',
  },
  integratedSpeakSentence: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
  },
  integratedSpeakInstructions: {
    alignItems: 'center',
    marginBottom: 20,
  },
  integratedSpeakInstruction: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  integratedSpeakRecordingCircle: {
    alignItems: 'center',
    marginVertical: 20,
  },
  integratedSpeakMicCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#6366f1',
  },
  integratedSpeakStopCircle: {
    backgroundColor: '#ef4444',
  },
  integratedSpeakStopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  integratedSpeakRecordingHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  // Integrated Sentence Scramble Styles
  integratedScrambleContainer: {
    marginBottom: 20,
  },
  integratedScrambleAnswerArea: {
    marginBottom: 20,
  },
  integratedScrambleAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  integratedScrambleAnswerContainer: {
    minHeight: 60,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#475569',
    borderStyle: 'dashed',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  integratedScramblePlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
  },
  integratedScrambleWordsArea: {
    marginBottom: 20,
  },
  integratedScrambleWordsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  integratedScrambleWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  integratedScrambleWord: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  integratedScrambleAnswerWord: {
    backgroundColor: '#1e40af',
    borderColor: '#3b82f6',
  },
  integratedScrambleAvailableWord: {
    backgroundColor: '#475569',
    borderColor: '#64748b',
  },
  integratedScrambleWordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  integratedScrambleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  // Common integrated button styles
  integratedButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  integratedCorrectButton: {
    backgroundColor: '#10b981',
  },
  integratedIncorrectButton: {
    backgroundColor: '#ef4444',
  },
  integratedResetButton: {
    backgroundColor: '#6b7280',
  },
  integratedDisabledButton: {
    backgroundColor: '#475569',
  },
  integratedButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Exercise buttons
  exerciseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  exerciseButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  correctButton: {
    backgroundColor: '#10b981',
  },
  incorrectButton: {
    backgroundColor: '#ef4444',
  },
  skipButton: {
    backgroundColor: '#6b7280',
  },
  exerciseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 5-button functionality styles
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  messageActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageActionIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Exercise 5-button functionality styles
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  exerciseActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseActionIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
