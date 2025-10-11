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
    if (writeExercises.length > 0) {
      console.log('🔄 Resetting lesson state for new write exercises');
      setCurrentExchangeIndex(0);
      setScore(0);
      setCompleted(false);
      setShowResult(false);
      setIsCorrect(false);
      setSelectedAnswer(null);
      setUserAnswer([]);
      setAvailableWords([]);
      setConversationHistory([]);
    }
  }, [writeExercises]);

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

  const currentExchange = writeExercises.length > 0 && currentExchangeIndex < writeExercises.length 
    ? { 
        userMessage: { 
          french: writeExercises[currentExchangeIndex].french, // This is actually English text now
          english: writeExercises[currentExchangeIndex].english 
        },
        type: 'scramble' as const
      }
    : CONVERSATION[currentExchangeIndex] || CONVERSATION[0];

  // Debug: Log which data source is being used
  console.log('🔍 UnitWriteScreen currentExchange debug:', {
    usingDatabaseData: writeExercises.length > 0,
    writeExercisesLength: writeExercises.length,
    currentExchangeIndex,
    currentText: currentExchange.userMessage.french,
    textPreview: currentExchange.userMessage.french?.substring(0, 50)
  });
  const isLastExchange = currentExchangeIndex === (writeExercises.length > 0 ? writeExercises.length - 1 : CONVERSATION.length - 1);

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
    const accuracyPercentage = Math.round((score / CONVERSATION.length) * 100);
    
    return (
      <SafeAreaView style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Write Complete!</Text>
          <Text style={styles.completionSubtitle}>Great conversation practice!</Text>
          
          <View style={styles.completionStats}>
            <View style={styles.completionStatCard}>
              <Text style={styles.completionStatValue}>{score}/{CONVERSATION.length}</Text>
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

  // Show conversation interface if we have conversation data
  if (conversationData && conversationData.conversation.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{unitTitle} - Write</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Conversation Interface */}
        <KeyboardAvoidingView 
          style={styles.conversationContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.conversationScrollView}
            contentContainerStyle={styles.conversationContent}
            ref={scrollViewRef}
          >
            {/* Conversation Messages */}
            {conversationData.conversation.slice(0, currentMessageIndex + (isTypingAnimation ? 0 : 1)).map((message, index) => (
              <View key={index} style={[
                styles.messageContainer,
                message.speaker === 'Assistant' ? styles.assistantMessage : styles.userMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  message.speaker === 'Assistant' ? styles.assistantText : styles.userText
                ]}>
                  {message.speaker === 'Assistant' && index === currentMessageIndex && isTypingAnimation 
                    ? typingText 
                    : message.message}
                </Text>
              </View>
            ))}
            
            {/* Show current message with typing animation */}
            {isTypingAnimation && currentMessageIndex < conversationData.conversation.length && (
              <View style={[
                styles.messageContainer,
                styles.assistantMessage
              ]}>
                <Text style={[styles.messageText, styles.assistantText]}>
                  {typingText}
                </Text>
              </View>
            )}

            {/* Exercise Section */}
            {exerciseState.isActive && exerciseState.exercise && (
              <View style={styles.exerciseContainer}>
                <Text style={styles.exerciseTitle}>
                  Practice: {exerciseState.exercise.type === 'sentence-scramble' ? 'Sentence Scramble' : 'Fill in the Blank'}
                </Text>
                
                {exerciseState.exercise.type === 'sentence-scramble' && (
                  <View style={styles.scrambleContainer}>
                    <Text style={styles.scrambleInstructions}>
                      Put the words in the correct order:
                    </Text>
                    <View style={styles.scrambleWordsContainer}>
                      {scrambleOrder.map((word, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.scrambleWord}
                          onPress={() => {
                            const newOrder = [...scrambleOrder];
                            const wordIndex = newOrder.indexOf(word);
                            if (wordIndex > -1) {
                              newOrder.splice(wordIndex, 1);
                              setScrambleOrder(newOrder);
                            }
                          }}
                        >
                          <Text style={styles.scrambleWordText}>{word}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.scrambleAnswerContainer}>
                      {scrambleOrder.map((word, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.scrambleAnswerWord}
                          onPress={() => {
                            const newOrder = [...scrambleOrder];
                            newOrder.splice(index, 1);
                            setScrambleOrder(newOrder);
                          }}
                        >
                          <Text style={styles.scrambleAnswerText}>{word}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {exerciseState.exercise.type === 'fill-in-blank' && (
                  <View style={styles.fillBlankContainer}>
                    <Text style={styles.fillBlankInstructions}>
                      Complete the sentence:
                    </Text>
                    <Text style={styles.fillBlankSentence}>
                      {exerciseState.exercise.sentence.replace(
                        new RegExp(exerciseState.exercise.keyword, 'gi'), 
                        '_____'
                      )}
                    </Text>
                    <TextInput
                      style={styles.fillBlankInput}
                      value={fillBlankAnswer}
                      onChangeText={setFillBlankAnswer}
                      placeholder={`Type "${exerciseState.exercise.keyword}" here...`}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.checkExerciseButton}
                  onPress={() => {
                    let isCorrect = false;
                    
                    if (exerciseState.exercise?.type === 'sentence-scramble') {
                      isCorrect = JSON.stringify(scrambleOrder) === JSON.stringify(scrambleCorrectOrder);
                    } else if (exerciseState.exercise?.type === 'fill-in-blank') {
                      isCorrect = fillBlankAnswer.toLowerCase().trim() === exerciseState.exercise.keyword.toLowerCase();
                    }
                    
                    if (isCorrect) {
                      setExerciseState(prev => ({ ...prev, isCompleted: true, score: prev.score + 1 }));
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setTimeout(() => {
                        setExerciseState({ isActive: false, exercise: null, isCompleted: false, score: 0 });
                        handleNextMessage();
                      }, 1500);
                    } else {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    }
                  }}
                >
                  <Text style={styles.checkExerciseButtonText}>Check</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

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
      </SafeAreaView>
    );
  }

  // Fallback to original interface
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{unitTitle} - Write</Text>
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
});
