import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import PronunciationCheck from '../components/PronunciationCheck';
import { PronunciationResult } from '../lib/pronunciationService';
import { UnitDataAdapter, UnitConversationExchange } from '../lib/unitDataAdapter';
import { logger } from '../lib/logger';
import { useTranslation } from '../lib/i18n';
import { getAppropriateSpeechLanguage, getTargetLanguageSpeechCode, getNativeLanguageSpeechCode } from '../lib/languageService';
import { VoiceService } from '../lib/voiceService';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Conversation interfaces
interface ConversationMessage {
  speaker: string;  // "User" or "Assistant" 
  message: string;
}

interface ConversationData {
  conversation: ConversationMessage[];
}

interface RoleplayExercise {
  type: 'speak';
  keyword: string;
  sentence: string;
  vocabulary: any;
}

interface ExerciseState {
  isActive: boolean;
  exercise: RoleplayExercise | null;
  isCompleted: boolean;
  score: number;
}

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
  const { t } = useTranslation();
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

  // New conversation system state
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [userMessageCompleted, setUserMessageCompleted] = useState(false);
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    isActive: false,
    exercise: null,
    isCompleted: false,
    score: 0
  });
  
  // Track if exercise has been created for current message
  const [exerciseCreatedForMessage, setExerciseCreatedForMessage] = useState<number>(-1);
  
  // Vocabulary for exercise creation
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  
  // Button functionality states
  const [showTranslation, setShowTranslation] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hiddenMessages, setHiddenMessages] = useState<Set<number>>(new Set());
  
  // Use refs to prevent stale closures
  const currentMessageIndexRef = useRef(0);
  const conversationDataRef = useRef<ConversationData | null>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimationRunningRef = useRef(false);

  // Load conversation from lesson scripts
  useEffect(() => {
    loadConversation();
  }, [subjectName, cefrLevel]);

  // Reset lesson state when conversation is loaded
  useEffect(() => {
    if (conversationData && conversationData.conversation && conversationData.conversation.length > 0) {
      console.log('🔄 Resetting lesson state for new conversation data');
      setCurrentExchangeIndex(0);
      setScore(0);
      setCompleted(false);
      setShowResult(false);
      setIsCorrect(false);
      // Initialize with first Thomas message (first Assistant message)
      const firstAssistantMsg = conversationData.conversation.find(msg => msg.speaker === 'Assistant');
      if (firstAssistantMsg) {
        console.log('✅ ROLEPLAY - Setting first message:', firstAssistantMsg.message.substring(0, 50));
        // Get the translation from conversationExchanges
        const firstAssistantExchange = conversationExchanges[0];
        setConversationHistory([{
          type: 'app',
          french: firstAssistantMsg.message,
          english: firstAssistantExchange?.translation || firstAssistantMsg.message,
        }]);
      }
    }
  }, [conversationData]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      logger.info(`🎭 Loading conversation and vocabulary for subject: ${subjectName} (${cefrLevel})`);
      
      const targetLanguage = profile?.target_language || 'English';
      
      // Load vocabulary for exercise creation
      const vocabData = await UnitDataAdapter.getUnitVocabulary(subjectName, targetLanguage);
      setVocabulary(vocabData);
      
      // Load conversation exchanges
      const nativeLanguage = profile?.native_language || 'English';
      const exchanges = await UnitDataAdapter.getUnitConversationFromScript(subjectName, cefrLevel, targetLanguage, nativeLanguage);
      
      console.log('🔍 ROLEPLAY - Loaded exchanges:', {
        count: exchanges.length,
        first: exchanges[0],
        second: exchanges[1]
      });
      
      if (exchanges.length === 0) {
        logger.warn(`⚠️ No conversation found for subject: ${subjectName} - USING FALLBACK`);
        console.log('❌ ROLEPLAY - USING FALLBACK DATA (Bonjour)');
        // Fallback to original hardcoded data
        setConversationExchanges(CONVERSATION.map((item, index) => ({
          id: `exchange_${index + 1}`,
          speaker: index % 2 === 0 ? 'user' : 'assistant',
          text: item.userMessage.french, // Target language text
          translation: item.userMessage.english, // Native language translation
          type: index === 0 ? 'greeting' : index === CONVERSATION.length - 1 ? 'farewell' : 'response'
        })));
        
        // Create conversation data from hardcoded conversation
        const fallbackConversation: ConversationData = {
          conversation: CONVERSATION.map((item, index) => [
            { speaker: 'Assistant', message: item.appMessage.english },
            { speaker: 'User', message: item.userMessage.english }
          ]).flat()
        };
        setConversationData(fallbackConversation);
      } else {
        setConversationExchanges(exchanges);
        logger.info(`✅ Loaded ${exchanges.length} conversation exchanges from lesson scripts`);
        
        // Create conversation data from lesson script exchanges
        const conversation: ConversationData = {
          conversation: exchanges.map((exchange, index) => ({
            speaker: exchange.speaker === 'user' ? 'User' : 'Assistant',
            message: exchange.text
          }))
        };
        
        console.log('✅ ROLEPLAY - Created conversation data:', {
          messageCount: conversation.conversation.length,
          firstMessage: conversation.conversation[0],
          secondMessage: conversation.conversation[1]
        });
        
        setConversationData(conversation);
        logger.info(`✅ Loaded conversation with ${conversation.conversation.length} messages`);
      }
    } catch (error) {
      logger.error('Error loading conversation:', error);
      console.error('❌ ROLEPLAY - ERROR:', error);
      // Fallback to original hardcoded data
      setConversationExchanges(CONVERSATION.map((item, index) => ({
        id: `exchange_${index + 1}`,
        speaker: index % 2 === 0 ? 'user' : 'assistant',
        text: item.userMessage.french,
        translation: item.userMessage.english,
        type: index === 0 ? 'greeting' : index === CONVERSATION.length - 1 ? 'farewell' : 'response'
      })));
      
      // Create fallback conversation
      const fallbackConversation: ConversationData = {
        conversation: CONVERSATION.map((item, index) => [
          { speaker: 'Assistant', message: item.appMessage.english },
          { speaker: 'User', message: item.userMessage.english }
        ]).flat()
      };
      setConversationData(fallbackConversation);
    } finally {
      setLoading(false);
    }
  };

  // Get current exchange data from conversation
  const getCurrentExchange = () => {
    if (!conversationData || !conversationData.conversation) {
      return CONVERSATION[currentExchangeIndex] || CONVERSATION[0];
    }

    // Get the current question/response pair from conversation data
    // We need to find the user message at the current index
    const userMessages = conversationData.conversation.filter(msg => msg.speaker === 'User');
    
    if (currentExchangeIndex < userMessages.length) {
      const userMsg = userMessages[currentExchangeIndex];
      const assistantMessages = conversationData.conversation.filter(msg => msg.speaker === 'Assistant');
      const assistantMsg = assistantMessages[currentExchangeIndex] || assistantMessages[0];
      
      // Get translations from the correct exchange indices
      // currentExchangeIndex points to the assistant's turn, user's response is at currentExchangeIndex + 1
      const assistantExchangeData = conversationExchanges[currentExchangeIndex];
      const userExchangeData = conversationExchanges[currentExchangeIndex + 1];
      
      console.log('🔍 ROLEPLAY - Translation debug:', {
        currentExchangeIndex,
        assistantExchangeData: assistantExchangeData,
        userExchangeData: userExchangeData,
        userMsg: userMsg.message,
        assistantMsg: assistantMsg.message,
        assistantTranslation: assistantExchangeData?.translation,
        userTranslation: userExchangeData?.translation
      });
      
      return {
        appMessage: {
          french: assistantMsg.message,
          english: assistantExchangeData?.translation || assistantMsg.message
        },
        userMessage: {
          french: userMsg.message,
          english: userExchangeData?.translation || userMsg.message
        }
      };
    }
    
    return CONVERSATION[currentExchangeIndex] || CONVERSATION[0];
  };

  const currentExchange = getCurrentExchange();

  // Debug: Log which data source is being used
  console.log('🔍 UnitRoleplayScreen currentExchange debug:', {
    hasConversationData: !!conversationData,
    conversationLength: conversationData?.conversation?.length || 0,
    currentExchangeIndex,
    currentText: currentExchange.userMessage.french,
    textPreview: currentExchange.userMessage.french?.substring(0, 50)
  });
  
  const getTotalExchanges = () => {
    if (conversationData && conversationData.conversation) {
      return conversationData.conversation.filter(msg => msg.speaker === 'User').length;
    }
    return CONVERSATION.length;
  };
  
  const isLastExchange = currentExchangeIndex === getTotalExchanges() - 1;

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(score + 1);
      
      // After 1 second, add user response to chat and then add next Thomas question
      setTimeout(() => {
        const newHistory = [
          ...conversationHistory,
          // Add user's response
          {
            type: 'user' as const,
            french: currentExchange.userMessage.french,
            english: currentExchange.userMessage.english,
          }
        ];

        // If not the last exchange, add the next Thomas message
        if (!isLastExchange && conversationData) {
          const assistantMessages = conversationData.conversation.filter(msg => msg.speaker === 'Assistant');
          const nextAssistantMsg = assistantMessages[currentExchangeIndex + 1];
          if (nextAssistantMsg) {
            // Get the translation from conversationExchanges
            const nextAssistantExchange = conversationExchanges[(currentExchangeIndex + 1) * 2]; // Assistant messages are at even indices
            newHistory.push({
              type: 'app' as const,
              french: nextAssistantMsg.message,
              english: nextAssistantExchange?.translation || nextAssistantMsg.message,
            });
          }
        }

        setConversationHistory(newHistory);
        setCurrentExchangeIndex(currentExchangeIndex + 1);
        setShowResult(false);
        setIsCorrect(false);
        setLastResult(null);
        setAttemptKey(attemptKey + 1);

        if (isLastExchange) {
          // Show completion after brief delay
          setTimeout(() => {
            setCompleted(true);
          }, 500);
        }
      }, 1000);
    } else {
      // Incorrect - show error feedback and wait for user to retry or skip
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setIsCorrect(false);
    setLastResult(null);
    setAttemptKey(attemptKey + 1);
  };

  const handleSkip = () => {
    const newHistory = [
      ...conversationHistory,
      // Add user's (skipped) response
      {
        type: 'user' as const,
        french: currentExchange.userMessage.french,
        english: currentExchange.userMessage.english,
      }
    ];

    // If not the last exchange, add the next Thomas message
    if (!isLastExchange && conversationData) {
      const assistantMessages = conversationData.conversation.filter(msg => msg.speaker === 'Assistant');
      const nextAssistantMsg = assistantMessages[currentExchangeIndex + 1];
      if (nextAssistantMsg) {
        // Get the translation from conversationExchanges
        const nextAssistantExchange = conversationExchanges[(currentExchangeIndex + 1) * 2]; // Assistant messages are at even indices
        newHistory.push({
          type: 'app' as const,
          french: nextAssistantMsg.message,
          english: nextAssistantExchange?.translation || nextAssistantMsg.message,
        });
      }
    }

    setConversationHistory(newHistory);
    setCurrentExchangeIndex(currentExchangeIndex + 1);
    setShowResult(false);
    setIsCorrect(false);
    setLastResult(null);
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
    // Clean up conversation system state
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    isAnimationRunningRef.current = false;
    
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

  // Helper function to get speech language code from database language code
  const getSpeechLanguageCode = (databaseLanguageCode: string | null | undefined): string => {
    if (!databaseLanguageCode) return 'en';
    
    const languageMap: Record<string, string> = {
      'en-GB': 'en',    // English (UK) -> English
      'en': 'en',       // English -> English
      'es': 'es',       // Spanish -> Spanish
      'de': 'de',       // German -> German
      'it': 'it',       // Italian -> Italian
      'fr': 'fr',       // French -> French
      'pt': 'pt',       // Portuguese -> Portuguese
      'sv': 'sv',       // Swedish -> Swedish
      'tr': 'tr',       // Turkish -> Turkish
      'zh': 'zh',       // Chinese (Simplified) -> Chinese
    };
    
    return languageMap[databaseLanguageCode] || 'en';
  };

  // Button functionality handlers
  const handleAudioPlay = async (text: string, languageCode: string, speed: number = 1.0) => {
    if (isPlayingAudio) return;
    
    console.log('🎤 Starting speech:', { text, languageCode, speed });
    
    setIsPlayingAudio(true);
    try {
      // Use Expo Speech directly for dashboard exercises
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
    handleAudioPlay(text, languageCode, 1.0);
  };

  const handleSlowSpeedPlay = (text: string, languageCode: string) => {
    handleAudioPlay(text, languageCode, 0.7);
  };

  const handleToggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  const handleShareMessage = async (frenchText: string, englishText: string) => {
    try {
      const shareText = `${frenchText}\n${englishText}`;
      await Share.share({
        message: shareText,
        title: 'UniLingo Learning',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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

  // Conversation system functions
  const detectKeywordsAndCreateExercise = useCallback((message: string): RoleplayExercise | null => {
    if (!vocabulary.length || !message) return null;

    const words = message.toLowerCase().split(/\s+/);
    const foundKeywords: any[] = [];

    // Check each word against vocabulary
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, ''); // Remove punctuation
      const vocabMatch = vocabulary.find(v => {
        // Check if this vocabulary item matches the word
        return v.english && v.english.toLowerCase().includes(cleanWord);
      });
      if (vocabMatch) {
        foundKeywords.push(vocabMatch);
      }
    }

    if (foundKeywords.length === 0) {
      console.log('❌ No keywords found in message');
      return null;
    }

    // Pick one random keyword
    const selectedKeyword = foundKeywords[Math.floor(Math.random() * foundKeywords.length)];

    // Find the actual word from the message that matches this vocabulary
    let matchedWord = '';
    const messageWords = message.toLowerCase().split(/\s+/);
    
    for (const word of messageWords) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (selectedKeyword.english && selectedKeyword.english.toLowerCase().includes(cleanWord)) {
        matchedWord = cleanWord;
        break;
      }
    }
    
    if (!matchedWord) {
      console.log('❌ Could not find matching word in sentence');
      return null;
    }

    console.log('🎯 Final roleplay exercise:', { matchedWord, selectedKeyword: selectedKeyword.english });

    return {
      type: 'speak',
      keyword: matchedWord,
      sentence: message,
      vocabulary: selectedKeyword
    };
  }, [vocabulary]);

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
        // Animation complete
        requestAnimationFrame(() => {
          isAnimationRunningRef.current = false;
          setIsTypingAnimation(false);
          
          // Handle message advancement based on who just finished typing
          if (conversationDataRef.current && conversationDataRef.current.conversation[currentMessageIndexRef.current]) {
            const currentMessage = conversationDataRef.current.conversation[currentMessageIndexRef.current];
            
            if (currentMessage.speaker === 'Assistant') {
              // Assistant finished typing, advance to next message
              setTimeout(() => {
                handleNextMessage();
              }, 1000); // Wait 1 second after typing completes
            } else if (currentMessage.speaker === 'User') {
              // User finished typing, mark as completed and advance to Assistant message
              setUserMessageCompleted(true);
              setTimeout(() => {
                const nextIndex = currentMessageIndexRef.current + 1;
                if (nextIndex < conversationDataRef.current!.conversation.length) {
                  const nextMessage = conversationDataRef.current!.conversation[nextIndex];
                  
                  if (nextMessage.speaker === 'Assistant') {
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

  const handleNextMessage = useCallback(() => {
    if (!conversationDataRef.current) return;
    
    const currentIndex = currentMessageIndexRef.current;
    const nextIndex = currentIndex + 1;
    
    console.log(`🔄 Advancing from message ${currentIndex} to ${nextIndex}`);
    
    if (nextIndex >= conversationDataRef.current.conversation.length) {
      // Conversation completed
      handleConversationComplete();
      return;
    }

    const nextMessage = conversationDataRef.current.conversation[nextIndex];
    console.log(`📝 Next message: ${nextMessage.speaker} - ${nextMessage.message}`);
    
    setCurrentMessageIndex(nextIndex);
    currentMessageIndexRef.current = nextIndex;
    
    if (nextMessage.speaker === 'Assistant') {
      // Start typing animation for Assistant
      setIsTyping(true);
      isTypingRef.current = true;
      setIsTypingAnimation(true);
    } else {
      // User message - no typing animation needed
      setIsTyping(false);
      isTypingRef.current = false;
      setIsTypingAnimation(false);
    }
  }, []);

  const handleConversationComplete = () => {
    console.log('🎉 Conversation completed!');
    setCompleted(true);
  };

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

  // Auto-detect keywords when user message is displayed
  useEffect(() => {
    if (conversationData && currentMessageIndex < conversationData.conversation.length) {
      const currentMessage = conversationData.conversation[currentMessageIndex];
      
      // Only create exercise if:
      // 1. It's a User message
      // 2. No exercise is currently active
      // 3. No exercise has been created for this message yet
      // 4. No typing animation is active
      if (currentMessage && 
          currentMessage.speaker === 'User' && 
          !exerciseState.isActive && 
          exerciseCreatedForMessage !== currentMessageIndex &&
          !isTypingAnimation && 
          !isTyping) {
        
        console.log('🔍 Exercise creation check for message:', currentMessage.message);
        
        // Check for keywords and create exercise automatically
        const exercise = detectKeywordsAndCreateExercise(currentMessage.message);
        
        if (exercise) {
          console.log('🎯 Exercise created automatically for message', currentMessageIndex, ':', exercise);
          setExerciseCreatedForMessage(currentMessageIndex);
          
          setExerciseState({
            isActive: true,
            exercise,
            isCompleted: false,
            score: 0
          });
        }
      }
    }
  }, [currentMessageIndex, conversationData, exerciseState.isActive, exerciseCreatedForMessage, isTypingAnimation, isTyping, detectKeywordsAndCreateExercise]);

  // Typing animation effect
  useEffect(() => {
    if (isTypingAnimation && conversationDataRef.current && !isAnimationRunningRef.current) {
      const currentMessage = conversationDataRef.current.conversation[currentMessageIndexRef.current];
      console.log('🎬 Starting typing animation for:', currentMessage?.speaker, currentMessage?.message);
      if (currentMessage) {
        requestAnimationFrame(() => {
          startTypingAnimation(currentMessage.message);
        });
      }
    }
  }, [isTypingAnimation]);

  // Initialize conversation when data is loaded
  useEffect(() => {
    if (conversationData && conversationData.conversation.length > 0) {
      setCurrentMessageIndex(0);
      currentMessageIndexRef.current = 0;
      conversationDataRef.current = conversationData;
      
      // Start with Assistant message (index 0)
      const firstMessage = conversationData.conversation[0];
      console.log('🎬 Starting conversation with:', firstMessage.speaker, firstMessage.message);
      if (firstMessage.speaker === 'Assistant') {
        console.log('🎬 Starting Assistant typing animation');
        setIsTyping(true);
        isTypingRef.current = true;
        setIsTypingAnimation(true);
      }
    }
  }, [conversationData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any pending timeouts when component unmounts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      isAnimationRunningRef.current = false;
    };
  }, []);

  if (completed) {
    const totalExchanges = getTotalExchanges();
    const accuracyPercentage = Math.round((score / totalExchanges) * 100);
    
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.completionTitle}>🎉 {t('lessons.roleplay.complete')}</Text>
        <Text style={styles.completionSubtitle}>Great job!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}/{totalExchanges}</Text>
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
              const firstExchange = getCurrentExchange();
              setConversationHistory([{
                type: 'app',
                french: firstExchange.appMessage.french,
                english: firstExchange.appMessage.english,
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
          <Text style={styles.headerTitle}>{unitTitle} - {t('lessons.roleplay.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // This is for the old conversation data system - redirect to fallback chat interface
  if (conversationData && conversationData.conversation.length > 0) {
    // Just fall through to the chat-style interface below
  }

  // Chat-style interface (like messaging app with microphone)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{unitTitle} - {t('lessons.roleplay.title')}</Text>
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

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSegments}>
          {Array.from({ length: getTotalExchanges() }).map((_, idx) => (
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

      {/* Scrollable Chat History (completed exchanges only) */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
      >
        {conversationHistory.map((message, index) => (
          <View key={index}>
            {message.type === 'app' && (
              <View style={styles.chatMessageLeft}>
                <Text style={styles.chatSenderName}>Thomas</Text>
                <View style={styles.chatBubbleThomas}>
                  {!hiddenMessages.has(index) && <Text style={styles.chatBubblePrimary}>{message.french}</Text>}
                  {showTranslation && !hiddenMessages.has(index) && <Text style={styles.chatBubbleSecondary}>{message.english}</Text>}
                  {hiddenMessages.has(index) && <Text style={styles.chatBubbleHidden}>••••••••</Text>}
                  <View style={styles.chatBubbleActions}>
                    <TouchableOpacity 
                      style={[styles.chatActionIcon, isPlayingAudio && styles.chatActionIconActive]}
                      onPress={() => {
                        // For target language text, use target language voice (English)
                        handleNormalSpeedPlay(message.french, getSpeechLanguageCode('en-GB'));
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
                        handleSlowSpeedPlay(message.french, getSpeechLanguageCode('en-GB'));
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
                      onPress={() => handleShowLearningResources(message.french)}
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
                  {!hiddenMessages.has(index) && <Text style={styles.chatBubbleUserPrimary}>{message.french}</Text>}
                  {showTranslation && !hiddenMessages.has(index) && <Text style={styles.chatBubbleUserSecondary}>{message.english}</Text>}
                  {hiddenMessages.has(index) && <Text style={styles.chatBubbleUserHidden}>••••••••</Text>}
                  <View style={styles.chatBubbleActions}>
                    <TouchableOpacity 
                      style={[styles.chatActionIcon, isPlayingAudio && styles.chatActionIconActive]}
                      onPress={() => {
                        // For target language text, use target language voice (English)
                        handleNormalSpeedPlay(message.french, getSpeechLanguageCode('en-GB'));
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
                        handleSlowSpeedPlay(message.french, getSpeechLanguageCode('en-GB'));
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
                      onPress={() => handleShowLearningResources(message.french)}
                    >
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
      {currentExchangeIndex < getTotalExchanges() && (
        <View style={styles.bottomPinnedSection}>
          <Text style={styles.questionLabel}>{t('lessons.roleplay.sayThisPhrase')}</Text>
          
          {/* Current Question Bubble - Target language */}
          <Text style={styles.currentPrompt}>{currentExchange.userMessage.french}</Text>
          
          {/* Native language translation - small print */}
          <Text style={styles.currentPromptTranslation}>{currentExchange.userMessage.english}</Text>

          {/* Answer Interface - Microphone / Pronunciation Check */}
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

          {/* Feedback */}
          {showResult && !isCorrect && (
            <View style={styles.feedbackIncorrectSection}>
              <Text style={styles.feedbackIncorrect}>❌ Incorrect - Try again!</Text>
              <View style={styles.retrySkipButtons}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {showResult && isCorrect && (
            <Text style={styles.feedbackCorrect}>✓ Correct!</Text>
          )}

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActionBar}>
            <TouchableOpacity 
              style={[styles.roundSpeakerButton, isPlayingAudio && styles.roundSpeakerButtonActive]}
              onPress={() => {
                // For user's response (target language), use English speech
                handleNormalSpeedPlay(currentExchange.userMessage.french, getSpeechLanguageCode('en-GB'));
              }}
            >
              <Ionicons name="volume-high" size={28} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.placeholderButton} />

            <TouchableOpacity 
              style={[styles.roundClockButton, isPlayingAudio && styles.roundClockButtonActive]}
              onPress={() => {
                // For user's response (target language), use English speech
                handleSlowSpeedPlay(currentExchange.userMessage.french, getSpeechLanguageCode('en-GB'));
              }}
            >
              <Ionicons name="time-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>
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
  // New chat-style interface styles (same as Write)
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
  chatBubbleSecondary: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  chatBubbleUserPrimary: {
    color: '#ffffff',
  },
  chatBubbleUserSecondary: {
    color: 'rgba(255, 255, 255, 0.85)',
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
    transform: [{ scale: 1.1 }],
  },
  chatBubbleHidden: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  chatBubbleUserHidden: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  // Current question styles (pinned at bottom)
  currentQuestionContainer: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  currentQuestionSenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    marginLeft: 4,
  },
  currentQuestionBubble: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
  },
  currentQuestionPrimary: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 22,
  },
  currentQuestionSecondary: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  conversationScroll: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  conversationContent: {
    padding: 20,
    paddingBottom: 10,
  },
  // New conversation styles
  conversationContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  conversationScrollView: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  assistantText: {
    color: '#1e293b',
  },
  userText: {
    color: '#ffffff',
  },
  exerciseContainer: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  exerciseSentence: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
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
  // New chat-style interface styles
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
    marginBottom: 8,
  },
  currentPromptTranslation: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  roundSpeakerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  roundSpeakerButtonActive: {
    backgroundColor: '#4f46e5',
    transform: [{ scale: 1.1 }],
  },
  roundClockButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  roundClockButtonActive: {
    backgroundColor: '#4f46e5',
    transform: [{ scale: 1.1 }],
  },
  placeholderButton: {
    flex: 1,
  },
  checkButton: {
    flex: 1,
    backgroundColor: '#cbd5e1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  checkButtonDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  feedbackCorrect: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  feedbackIncorrect: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  feedbackIncorrectSection: {
    marginTop: 16,
    width: '100%',
  },
  feedbackIncorrectContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  recognizedText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  scoreMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
  },
  scoreText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  retrySkipButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 8,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6366f1',
    minHeight: 48,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    minHeight: 48,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
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


