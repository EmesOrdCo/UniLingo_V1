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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UnitDataAdapter, UnitWriteExercise, UnitConversationExchange } from '../lib/unitDataAdapter';
import { logger } from '../lib/logger';
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

interface WriteExercise {
  type: 'flashcard' | 'speak' | 'fill-in-blank' | 'sentence-scramble';
  keyword: string;
  sentence: string;
  vocabulary: any; // We'll adapt this for our vocabulary structure
}

interface ExerciseState {
  isActive: boolean;
  exercise: WriteExercise | null;
  isCompleted: boolean;
  score: number;
}

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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [checkButtonText, setCheckButtonText] = useState('Check');
  const [writeExercises, setWriteExercises] = useState<UnitWriteExercise[]>([]);
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
  
  // Sentence scramble state
  const [scrambleWords, setScrambleWords] = useState<string[]>([]);
  const [scrambleOrder, setScrambleOrder] = useState<string[]>([]);
  const [scrambleCorrectOrder, setScrambleCorrectOrder] = useState<string[]>([]);
  
  // Fill-in-blank state
  const [fillBlankAnswer, setFillBlankAnswer] = useState<string>('');
  
  // Track if exercise has been created for current message
  const [exerciseCreatedForMessage, setExerciseCreatedForMessage] = useState<number>(-1);
  
  // Vocabulary for exercise creation
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  
  // Use refs to prevent stale closures
  const currentMessageIndexRef = useRef(0);
  const conversationDataRef = useRef<ConversationData | null>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimationRunningRef = useRef(false);

  // Load write exercises from lesson scripts
  useEffect(() => {
    loadWriteExercises();
  }, [subjectName, cefrLevel]);

  // Reset lesson state when write exercises are loaded
  useEffect(() => {
    if (conversationData && conversationData.conversation && conversationData.conversation.length > 0) {
      console.log('🔄 Resetting lesson state for new conversation data');
      setCurrentExchangeIndex(0);
      setScore(0);
      setCompleted(false);
      setShowResult(false);
      setIsCorrect(false);
      setSelectedAnswer(null);
      setUserAnswer([]);
      setAvailableWords([]);
      // Initialize with first Thomas message (first Assistant message)
      const firstAssistantMsg = conversationData.conversation.find(msg => msg.speaker === 'Assistant');
      if (firstAssistantMsg) {
        setConversationHistory([{
          type: 'app',
          french: firstAssistantMsg.message,
          english: firstAssistantMsg.message,
        }]);
      }
    }
  }, [conversationData]);

  const loadWriteExercises = async () => {
    try {
      setLoading(true);
      logger.info(`📝 Loading write exercises and conversation data for subject: ${subjectName} (${cefrLevel})`);
      
      const nativeLanguage = profile?.native_language || 'French';
      
      // Load write exercises
      const exercises = await UnitDataAdapter.getUnitWriteExercises(subjectName, cefrLevel, nativeLanguage);
      
      // Load vocabulary for exercise creation
      const vocabData = await UnitDataAdapter.getUnitVocabulary(subjectName, nativeLanguage);
      setVocabulary(vocabData);
      
      // Load conversation data
      const conversationExchanges = await UnitDataAdapter.getUnitConversationFromScript(subjectName, cefrLevel, nativeLanguage);
      
      if (exercises.length === 0 || conversationExchanges.length === 0) {
        logger.warn(`⚠️ No write exercises or conversation found for subject: ${subjectName}`);
        // Fallback to original hardcoded data
        setWriteExercises(CONVERSATION.map((item, index) => ({
          id: `exercise_${index + 1}`,
          french: item.userMessage.french,
          english: item.userMessage.english,
          type: 'scramble' as const
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
        setWriteExercises(exercises);
        logger.info(`✅ Loaded ${exercises.length} write exercises from lesson scripts`);
        
        // Create conversation data from lesson script exchanges
        const conversation: ConversationData = {
          conversation: conversationExchanges.map((exchange, index) => ({
            speaker: exchange.speaker === 'user' ? 'User' : 'Assistant',
            message: exchange.text
          }))
        };
        setConversationData(conversation);
        logger.info(`✅ Loaded conversation with ${conversation.conversation.length} messages`);
      }
    } catch (error) {
      logger.error('Error loading write exercises:', error);
      // Fallback to original hardcoded data
      setWriteExercises(CONVERSATION.map((item, index) => ({
        id: `exercise_${index + 1}`,
        french: item.userMessage.french,
        english: item.userMessage.english,
        type: 'scramble' as const
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
      
      return {
        appMessage: {
          french: assistantMsg.message,
          english: assistantMsg.message
        },
        userMessage: {
          french: userMsg.message,
          english: userMsg.message
        },
        type: currentExchangeIndex < 2 ? 'choice' as const : 'scramble' as const,
        wrongOption: currentExchangeIndex < 2 ? (currentExchangeIndex === 0 ? 'No' : 'Goodbye') : undefined
      };
    }
    
    return CONVERSATION[currentExchangeIndex] || CONVERSATION[0];
  };

  const currentExchange = getCurrentExchange();

  // Debug: Log which data source is being used
  console.log('🔍 UnitWriteScreen currentExchange debug:', {
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

  // Initialize with Thomas's first message in chat history
  useEffect(() => {
    if (conversationHistory.length === 0 && !completed) {
      const firstExchange = getCurrentExchange();
      if (firstExchange && firstExchange.appMessage) {
        setConversationHistory([{
          type: 'app',
          french: firstExchange.appMessage.french,
          english: firstExchange.appMessage.english,
        }]);
      }
    }
  }, [conversationData, completed]);

  // Initialize scramble words when needed
  useEffect(() => {
    if (!completed) {
      const exchange = getCurrentExchange();
      if (exchange && exchange.type === 'scramble' && conversationHistory.length > 0) {
        const words = exchange.userMessage.french.split(' ');
        setAvailableWords([...words].sort(() => Math.random() - 0.5));
        setUserAnswer([]);
      }
    }
  }, [currentExchangeIndex, conversationHistory.length, completed, conversationData]);

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
      
      // After 1 second, add user's answer and next Thomas message to chat history
      setTimeout(() => {
        const newHistory = [
          ...conversationHistory,
          // Add user's correct answer to history
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
            newHistory.push({
              type: 'app' as const,
              french: nextAssistantMsg.message,
              english: nextAssistantMsg.message,
            });
          }
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
      // Add user's answer to history (even if skipped)
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
        newHistory.push({
          type: 'app' as const,
          french: nextAssistantMsg.message,
          english: nextAssistantMsg.message,
        });
      }
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

  // Conversation system functions
  const detectKeywordsAndCreateExercise = useCallback((message: string): WriteExercise | null => {
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

    // Pick random exercise type
    const exerciseTypes: WriteExercise['type'][] = ['sentence-scramble', 'fill-in-blank'];
    const selectedType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

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

    console.log('🎯 Final exercise:', { matchedWord, selectedKeyword: selectedKeyword.english });

    return {
      type: selectedType,
      keyword: matchedWord,
      sentence: message,
      vocabulary: selectedKeyword
    };
  }, [vocabulary]);

  const initializeScramble = (sentence: string) => {
    const words = sentence.split(' ').filter(word => word.trim().length > 0);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    
    setScrambleWords(words);
    setScrambleOrder(shuffled);
    setScrambleCorrectOrder([...words]);
  };

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
          
          // Initialize scramble if it's a sentence scramble exercise
          if (exercise.type === 'sentence-scramble') {
            initializeScramble(exercise.sentence);
          }
          
          // Reset fill-blank answer
          setFillBlankAnswer('');
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
      <SafeAreaView style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Write Complete!</Text>
          <Text style={styles.completionSubtitle}>Great conversation practice!</Text>
          
          <View style={styles.completionStats}>
            <View style={styles.completionStatCard}>
              <Text style={styles.completionStatValue}>{score}/{totalExchanges}</Text>
              <Text style={styles.completionStatLabel}>Correct</Text>
            </View>
            <View style={styles.completionStatCard}>
              <Text style={styles.completionStatValue}>{accuracyPercentage}%</Text>
              <Text style={styles.completionStatLabel}>Accuracy</Text>
            </View>
          </View>
          
          <View style={styles.completionButtons}>
            <TouchableOpacity 
              style={styles.completionRetryButton} 
              onPress={() => {
                // Reset to initial state with first Thomas message
                const firstExchange = getCurrentExchange();
                setConversationHistory([{
                  type: 'app',
                  french: firstExchange.appMessage.french,
                  english: firstExchange.appMessage.english,
                }]);
                setCurrentExchangeIndex(0);
                setScore(0);
                setCompleted(false);
                setSelectedAnswer(null);
                setShowResult(false);
                setUserAnswer([]);
                setAvailableWords([]);
                setCheckButtonText('Check');
              }}
            >
              <Text style={styles.completionRetryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.completionContinueButton} onPress={handleContinue}>
              <Text style={styles.completionContinueButtonText}>Continue</Text>
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
          <Text style={styles.headerTitle}>{unitTitle} - Write</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading write exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // This is for the old conversation data system - redirect to fallback chat interface
  if (conversationData && conversationData.conversation.length > 0) {
    // Just fall through to the chat-style interface below
  }

  // Chat-style interface (like messaging app)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{unitTitle}</Text>
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
                  <Text style={styles.chatBubblePrimary}>{message.french}</Text>
                  <Text style={styles.chatBubbleSecondary}>{message.english}</Text>
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
            {message.type === 'user' && (
              <View style={styles.chatMessageRight}>
                <View style={styles.chatBubbleUser}>
                  <Text style={styles.chatBubbleUserPrimary}>{message.french}</Text>
                  <Text style={styles.chatBubbleUserSecondary}>{message.english}</Text>
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
      {currentExchangeIndex < getTotalExchanges() && (
        <View style={styles.bottomPinnedSection}>
          <Text style={styles.questionLabel}>
            {currentExchange.type === 'choice' ? 'TAP THE CORRECT ANSWER' : 'CORRECT THE ORDERING'}
          </Text>
          
          {/* Current Question Bubble */}
          <Text style={styles.currentPrompt}>{currentExchange.userMessage.english}</Text>

          {/* Answer Interface */}
          {currentExchange.type === 'choice' ? (
            // Multiple Choice (First 2 questions)
            <View style={styles.multiChoiceContainer}>
              <TouchableOpacity
                style={[
                  styles.multiChoiceButton,
                  selectedAnswer === currentExchange.userMessage.french && styles.multiChoiceSelected,
                ]}
                onPress={() => handleAnswerSelect(currentExchange.userMessage.french)}
                disabled={showResult}
              >
                <Text style={styles.multiChoiceButtonText}>
                  {currentExchange.userMessage.french}
                </Text>
                <Text style={styles.multiChoiceButtonEnglish}>
                  {currentExchange.userMessage.english}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.multiChoiceButton,
                  selectedAnswer === currentExchange.wrongOption && styles.multiChoiceSelected,
                ]}
                onPress={() => handleAnswerSelect(currentExchange.wrongOption)}
                disabled={showResult}
              >
                <Text style={styles.multiChoiceButtonText}>
                  {currentExchange.wrongOption}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Word Scramble (Remaining questions)
            <View style={styles.wordScrambleContainer}>
              {/* Answer input bar */}
              <View style={styles.scrambleInputBar}>
                {userAnswer.length > 0 ? (
                  userAnswer.map((word, index) => (
                    <TouchableOpacity
                      key={`answer-${index}`}
                      style={styles.scrambleWordInBar}
                      onPress={() => handleWordPress(word, true)}
                      disabled={showResult}
                    >
                      <Text style={styles.scrambleWordInBarText}>{word}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.scramblePlaceholder}>Tap words to arrange them</Text>
                )}
                {userAnswer.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => {
                      if (!showResult) {
                        setAvailableWords([...availableWords, ...userAnswer]);
                        setUserAnswer([]);
                      }
                    }}
                  >
                    <Ionicons name="close" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Available words */}
              <View style={styles.scrambleWordsGrid}>
                {availableWords.map((word, index) => (
                  <TouchableOpacity
                    key={`available-${index}`}
                    style={styles.scrambleWordButton}
                    onPress={() => handleWordPress(word, false)}
                    disabled={showResult}
                  >
                    <Text style={styles.scrambleWordButtonText}>{word}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Feedback */}
          {showResult && !isCorrect && (
            <Text style={styles.feedbackIncorrect}>❌ Incorrect - Try again!</Text>
          )}
          {showResult && isCorrect && (
            <Text style={styles.feedbackCorrect}>✓ Correct!</Text>
          )}

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActionBar}>
            <TouchableOpacity style={styles.roundSpeakerButton}>
              <Ionicons name="volume-high" size={28} color="#ffffff" />
            </TouchableOpacity>

            {!showResult || isCorrect ? (
              <TouchableOpacity
                style={[
                  styles.checkButton,
                  ((currentExchange.type === 'choice' && !selectedAnswer) || 
                  (currentExchange.type === 'scramble' && userAnswer.length === 0)) && styles.checkButtonDisabled
                ]}
                onPress={handleCheck}
                disabled={
                  (currentExchange.type === 'choice' && !selectedAnswer) || 
                  (currentExchange.type === 'scramble' && userAnswer.length === 0)
                }
              >
                <Text style={styles.checkButtonText}>Check</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.retrySkipButtons}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.roundClockButton}>
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
  // New conversation styles
  conversationContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  conversationScrollView: {
    flex: 1,
  },
  conversationContent: {
    padding: 20,
    paddingBottom: 100,
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
  scrambleContainer: {
    marginBottom: 20,
  },
  scrambleInstructions: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrambleWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  scrambleWord: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  scrambleWordText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  scrambleAnswerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    minHeight: 40,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
  },
  scrambleAnswerWord: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scrambleAnswerText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  fillBlankContainer: {
    marginBottom: 20,
  },
  fillBlankInstructions: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  fillBlankSentence: {
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  fillBlankInput: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#374151',
  },
  checkExerciseButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
  // New chat-style interface styles
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
  bottomPinnedSection: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textAlign: 'center',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  currentPrompt: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  multiChoiceContainer: {
    gap: 12,
    marginBottom: 16,
  },
  multiChoiceButton: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  multiChoiceSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f5f3ff',
  },
  multiChoiceButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  multiChoiceButtonEnglish: {
    fontSize: 16,
    color: '#6b7280',
  },
  wordScrambleContainer: {
    gap: 16,
    marginBottom: 16,
  },
  scrambleInputBar: {
    backgroundColor: '#f3f4f6',
    minHeight: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  scrambleWordInBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  scrambleWordInBarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  scramblePlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  clearButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  scrambleWordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  scrambleWordButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  scrambleWordButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  feedbackIncorrect: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  feedbackCorrect: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
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
  retrySkipButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6366f1',
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
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
