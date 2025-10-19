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
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UnitDataAdapter, UnitWriteExercise, UnitConversationExchange } from '../lib/unitDataAdapter';
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

// Fallback conversation dialogue (used when no database data is available)
const CONVERSATION = [
  {
    appMessage: { french: 'Bonjour !', english: 'Hello / Good morning!' },
    userMessage: { french: 'Salut, ça va ?', english: 'Hi, how are you?' },
    type: 'choice' as const,
    wrongOption: 'Goodbye' // Will be overridden by dynamic generation
  },
  {
    appMessage: { french: 'Ça va, merci. Et toi ?', english: "I'm fine, thanks. And you?" },
    userMessage: { french: 'Bien, merci. Bonjour !', english: 'Good, thanks. Hello!' },
    type: 'choice' as const,
    wrongOption: 'No' // Will be overridden by dynamic generation
  },
  {
    appMessage: { french: 'Bon après-midi !', english: 'Good afternoon!' },
    userMessage: { french: 'Merci, bon après-midi à toi aussi.', english: 'Thanks, good afternoon to you too.' },
    type: 'scramble' as const,
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
  const [conversationExchanges, setConversationExchanges] = useState<UnitConversationExchange[]>([]);
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
      // Clear memoized wrong options when starting new lesson
      setMemoizedWrongOptions({});
      // Initialize with first Thomas message (first Assistant message)
      const firstAssistantMsg = conversationData.conversation.find(msg => msg.speaker === 'Assistant');
      if (firstAssistantMsg) {
        // Find the corresponding exchange data to get native language translations
        const firstAssistantExchangeData = conversationExchanges.find(exchange => 
          exchange.speaker === 'assistant' && exchange.text === firstAssistantMsg.message
        );
        
        setConversationHistory([{
          type: 'app',
          french: firstAssistantMsg.message,
          english: firstAssistantExchangeData?.translation || firstAssistantMsg.message,
        }]);
      }
    }
  }, [conversationData]);

  const loadWriteExercises = async () => {
    try {
      setLoading(true);
      logger.info(`📝 Loading write exercises and conversation data for subject: ${subjectName} (${cefrLevel})`);
      
      const targetLanguage = profile?.target_language || 'English';
      const nativeLanguage = profile?.native_language || 'English';
      
      // Load write exercises
      const exercises = await UnitDataAdapter.getUnitWriteExercises(subjectName, cefrLevel, targetLanguage, nativeLanguage);
      
      // Load vocabulary for exercise creation
      const vocabData = await UnitDataAdapter.getUnitVocabulary(subjectName, targetLanguage);
      setVocabulary(vocabData);
      
      // Load conversation data
      const conversationExchanges = await UnitDataAdapter.getUnitConversationFromScript(subjectName, cefrLevel, targetLanguage, nativeLanguage);
      
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
        
        // Set fallback conversation exchanges
        setConversationExchanges(CONVERSATION.map((item, index) => ({
          id: `exchange_${index + 1}`,
          speaker: index % 2 === 0 ? 'user' : 'assistant',
          text: item.userMessage.french,
          translation: item.userMessage.english,
          type: index === 0 ? 'greeting' : index === CONVERSATION.length - 1 ? 'farewell' : 'response'
        })));
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
        setConversationExchanges(conversationExchanges);
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
      
      // Set fallback conversation exchanges
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

  // Memoized wrong options to prevent cycling during re-renders
  const [memoizedWrongOptions, setMemoizedWrongOptions] = useState<{[key: string]: {text: string, translation: string}}>({});

  // Function to translate target language text to native language
  const getUserMessageTranslation = (targetLanguageText: string, targetLanguage: string): string => {
    // This translates FROM target language TO native language (English)
    const targetLang = targetLanguage.toLowerCase();
    
    if (targetLang.includes('chinese') || targetLang.includes('zh') || targetLang.includes('mandarin')) {
      // Chinese to English translations
      const chineseToEnglish: {[key: string]: string} = {
        '你好，我很好，谢谢': 'Hello, I\'m good, thank you',
        '是的，今天很适合散步': 'Yes, it\'s a good day to walk',
        '我很好': 'I am fine',
        '还不错': 'Not bad',
        '一般般': 'So-so',
        '很棒': 'Great',
        '很糟糕': 'Terrible',
        '不客气': 'You are welcome',
        '没问题': 'No problem',
        '很乐意': 'My pleasure',
        '别客气': 'Don\'t mention it',
        '你好': 'Hello',
        '早上好': 'Good morning',
        '很快再见': 'See you soon',
        '保重': 'Take care',
        '我不知道': 'I don\'t know',
        '也许': 'Maybe',
        '我想是的': 'I think so',
        '不是真的': 'Not really',
        '绝对': 'Absolutely',
        '你好! 你今天怎么样?': 'Hi! How are you today?',
        '很高兴见到你': 'Nice to meet you',
        '回头见': 'See you later',
        '你好吗？': 'How are you?'
      };
      return chineseToEnglish[targetLanguageText] || targetLanguageText;
    } else if (targetLang.includes('french') || targetLang.includes('fr')) {
      // French to English translations
      const frenchToEnglish: {[key: string]: string} = {
        'Je vais bien': 'I am fine',
        'Pas mal': 'Not bad',
        'Comme ci, comme ça': 'So-so',
        'Génial': 'Great',
        'Terrible': 'Terrible',
        'De rien': 'You are welcome',
        'Pas de problème': 'No problem',
        'Avec plaisir': 'My pleasure',
        'Il n\'y a pas de quoi': 'Don\'t mention it',
        'Bonjour': 'Hello',
        'Bon matin': 'Good morning',
        'À bientôt': 'See you soon',
        'Prenez soin': 'Take care',
        'Je ne sais pas': 'I don\'t know',
        'Peut-être': 'Maybe',
        'Je pense que oui': 'I think so',
        'Pas vraiment': 'Not really',
        'Absolument': 'Absolutely',
        'Salut, ça va ?': 'Hi, how are you?',
        'Bien, merci': 'Good, thanks',
        'Au revoir': 'Goodbye'
      };
      return frenchToEnglish[targetLanguageText] || targetLanguageText;
    } else if (targetLang.includes('spanish') || targetLang.includes('es')) {
      // Spanish to English translations
      const spanishToEnglish: {[key: string]: string} = {
        'Estoy bien': 'I am fine',
        'No está mal': 'Not bad',
        'Más o menos': 'So-so',
        'Genial': 'Great',
        'Terrible': 'Terrible',
        'De nada': 'You are welcome',
        'No hay problema': 'No problem',
        'Con gusto': 'My pleasure',
        'No te preocupes': 'Don\'t worry about it',
        'Hola': 'Hello',
        'Buenos días': 'Good morning',
        'Hasta pronto': 'See you soon',
        'Cuídate': 'Take care',
        'No sé': 'I don\'t know',
        'Tal vez': 'Maybe',
        'Creo que sí': 'I think so',
        'No realmente': 'Not really',
        'Absolutamente': 'Absolutely',
        '¿Cómo estás?': 'How are you?',
        'Mucho gusto': 'Nice to meet you',
        'Hasta luego': 'See you later'
      };
      return spanishToEnglish[targetLanguageText] || targetLanguageText;
    }
    
    // Default: assume it's already in English (native language)
    return targetLanguageText;
  };

  // Function to convert English text to target language for wrong options
  const convertToTargetLanguage = (englishText: string, targetLanguage: string): string => {
    const targetLang = targetLanguage.toLowerCase();
    
    if (targetLang.includes('chinese') || targetLang.includes('zh') || targetLang.includes('mandarin')) {
      // English to Chinese translations
      const englishToChinese: {[key: string]: string} = {
        'Hello, I\'m good, thank you': '你好，我很好，谢谢',
        'Yes, it\'s a good day to walk': '是的，今天很适合散步',
        'I am fine': '我很好',
        'Not bad': '还不错',
        'So-so': '一般般',
        'Great': '很棒',
        'Terrible': '很糟糕',
        'You are welcome': '不客气',
        'No problem': '没问题',
        'My pleasure': '很乐意',
        'Don\'t mention it': '别客气',
        'Hello': '你好',
        'Good morning': '早上好',
        'See you soon': '很快再见',
        'Take care': '保重',
        'I don\'t know': '我不知道',
        'Maybe': '也许',
        'I think so': '我想是的',
        'Not really': '不是真的',
        'Absolutely': '绝对'
      };
      return englishToChinese[englishText] || englishText;
    } else if (targetLang.includes('french') || targetLang.includes('fr')) {
      // English to French translations
      const englishToFrench: {[key: string]: string} = {
        'I am fine': 'Je vais bien',
        'Not bad': 'Pas mal',
        'So-so': 'Comme ci, comme ça',
        'Great': 'Génial',
        'Terrible': 'Terrible',
        'You are welcome': 'De rien',
        'No problem': 'Pas de problème',
        'My pleasure': 'Avec plaisir',
        'Don\'t mention it': 'Il n\'y a pas de quoi',
        'Hello': 'Bonjour',
        'Good morning': 'Bon matin',
        'See you soon': 'À bientôt',
        'Take care': 'Prenez soin',
        'I don\'t know': 'Je ne sais pas',
        'Maybe': 'Peut-être',
        'I think so': 'Je pense que oui',
        'Not really': 'Pas vraiment',
        'Absolutely': 'Absolument'
      };
      return englishToFrench[englishText] || englishText;
    } else if (targetLang.includes('spanish') || targetLang.includes('es')) {
      // English to Spanish translations
      const englishToSpanish: {[key: string]: string} = {
        'I am fine': 'Estoy bien',
        'Not bad': 'No está mal',
        'So-so': 'Más o menos',
        'Great': 'Genial',
        'Terrible': 'Terrible',
        'You are welcome': 'De nada',
        'No problem': 'No hay problema',
        'My pleasure': 'Con gusto',
        'Don\'t worry about it': 'No te preocupes',
        'Hello': 'Hola',
        'Good morning': 'Buenos días',
        'See you soon': 'Hasta pronto',
        'Take care': 'Cuídate',
        'I don\'t know': 'No sé',
        'Maybe': 'Tal vez',
        'I think so': 'Creo que sí',
        'Not really': 'No realmente',
        'Absolutely': 'Absolutamente'
      };
      return englishToSpanish[englishText] || englishText;
    }
    
    // Default: return as is
    return englishText;
  };

  // Get current exchange data from conversation
  // Generate contextually relevant wrong options for multiple choice questions
  const generateWrongOptions = (correctAnswer: string, currentIndex: number): {text: string, translation: string} => {
    // Create a unique key for this combination
    const key = `${correctAnswer}-${currentIndex}`;
    
    // Return memoized option if it exists
    if (memoizedWrongOptions[key]) {
      return memoizedWrongOptions[key];
    }
    
    try {
      // Get user's language preferences
      const nativeLanguage = profile?.native_language || 'English';
      const targetLanguage = profile?.target_language || 'English';
      
      // Get all user messages from the conversation for context
      const userMessages = conversationData?.conversation?.filter(msg => msg.speaker === 'User') || [];
      const assistantMessages = conversationData?.conversation?.filter(msg => msg.speaker === 'Assistant') || [];
      const exchangeData = conversationExchanges[currentIndex];
      
      // Create a pool of potential wrong options with translations
      const wrongOptionsPool: {text: string, translation: string}[] = [];
      
      // Priority 1: Get contextually relevant responses from other parts of the conversation
      // Use conversationExchanges to get proper target-to-native language mapping
      conversationExchanges.forEach((exchange, index) => {
        if (index !== currentIndex && exchange.speaker === 'user' && exchange.text) {
          // For conversation responses, use the full response as a wrong option
          // This creates more realistic alternatives
          const response = exchange.text.trim();
          if (response.length > 0 && response !== correctAnswer) {
            // Use the translation field from the exchange data for proper mapping
            const nativeTranslation = exchange.translation || response;
            wrongOptionsPool.push({text: response, translation: nativeTranslation});
          }
        }
      });
      
      // Priority 2: Add vocabulary words that are contextually similar
      if (vocabulary.length > 0) {
        const vocabWords = vocabulary
          .map(v => ({
            text: v.keywords || v.english_term || v.term, // Target language text
            translation: v.native_translation || v.english || v.keywords // Native language translation
          }))
          .filter(item => item.text && item.text !== correctAnswer && item.text.length > 2);
        
        // Prioritize words that are similar in length or context to the correct answer
        const similarWords = vocabWords.filter(item => 
          Math.abs(item.text.length - correctAnswer.length) <= 3 || // Similar length
          item.text.toLowerCase().includes(correctAnswer.toLowerCase().substring(0, 3)) || // Similar start
          correctAnswer.toLowerCase().includes(item.text.toLowerCase().substring(0, 3))
        );
        
        wrongOptionsPool.push(...similarWords.slice(0, 3));
        
        // Add other vocabulary words if we don't have enough
        if (wrongOptionsPool.length < 2) {
          const remainingWords = vocabWords.filter(item => !similarWords.includes(item));
          wrongOptionsPool.push(...remainingWords.slice(0, 2));
        }
      }
      
      // Priority 3: Add contextually appropriate common responses based on conversation type
      const conversationContext = assistantMessages[currentIndex]?.message?.toLowerCase() || '';
      let contextuallyRelevantOptions: {text: string, translation: string}[] = [];
      
      // Generate contextually appropriate options based on the actual target language
      // The text should be in the target language, translation in native language
      if (targetLanguage.toLowerCase().includes('french') || targetLanguage.toLowerCase().includes('fr')) {
        // French target language options
        if (conversationContext.includes('bonjour') || conversationContext.includes('hello') || conversationContext.includes('salut')) {
          contextuallyRelevantOptions = [
            {text: 'Au revoir', translation: 'Goodbye'},
            {text: 'À bientôt', translation: 'See you later'},
            {text: 'Comment allez-vous ?', translation: 'How are you?'},
            {text: 'Enchanté', translation: 'Nice to meet you'}
          ];
        } else if (conversationContext.includes('ça va') || conversationContext.includes('how are you')) {
          contextuallyRelevantOptions = [
            {text: 'Je vais bien', translation: 'I am fine'},
            {text: 'Pas mal', translation: 'Not bad'},
            {text: 'Comme ci, comme ça', translation: 'So-so'},
            {text: 'Génial', translation: 'Great'},
            {text: 'Terrible', translation: 'Terrible'}
          ];
        } else if (conversationContext.includes('merci') || conversationContext.includes('thank')) {
          contextuallyRelevantOptions = [
            {text: 'De rien', translation: 'You are welcome'},
            {text: 'Pas de problème', translation: 'No problem'},
            {text: 'Avec plaisir', translation: 'My pleasure'},
            {text: 'Il n\'y a pas de quoi', translation: 'Don\'t mention it'}
          ];
        } else if (conversationContext.includes('au revoir') || conversationContext.includes('goodbye')) {
          contextuallyRelevantOptions = [
            {text: 'Bonjour', translation: 'Hello'},
            {text: 'Bon matin', translation: 'Good morning'},
            {text: 'À bientôt', translation: 'See you soon'},
            {text: 'Prenez soin', translation: 'Take care'}
          ];
        } else {
          contextuallyRelevantOptions = [
            {text: 'Je ne sais pas', translation: 'I don\'t know'},
            {text: 'Peut-être', translation: 'Maybe'},
            {text: 'Je pense que oui', translation: 'I think so'},
            {text: 'Pas vraiment', translation: 'Not really'},
            {text: 'Absolument', translation: 'Absolutely'}
          ];
        }
      } else if (targetLanguage.toLowerCase().includes('spanish') || targetLanguage.toLowerCase().includes('es')) {
        // Spanish target language options
        if (conversationContext.includes('hola') || conversationContext.includes('hello')) {
          contextuallyRelevantOptions = [
            {text: 'Adiós', translation: 'Goodbye'},
            {text: 'Hasta luego', translation: 'See you later'},
            {text: '¿Cómo estás?', translation: 'How are you?'},
            {text: 'Mucho gusto', translation: 'Nice to meet you'}
          ];
        } else if (conversationContext.includes('cómo') || conversationContext.includes('how are you')) {
          contextuallyRelevantOptions = [
            {text: 'Estoy bien', translation: 'I am fine'},
            {text: 'No está mal', translation: 'Not bad'},
            {text: 'Más o menos', translation: 'So-so'},
            {text: 'Genial', translation: 'Great'},
            {text: 'Terrible', translation: 'Terrible'}
          ];
        } else if (conversationContext.includes('gracias') || conversationContext.includes('thank')) {
          contextuallyRelevantOptions = [
            {text: 'De nada', translation: 'You are welcome'},
            {text: 'No hay problema', translation: 'No problem'},
            {text: 'Con gusto', translation: 'My pleasure'},
            {text: 'No te preocupes', translation: 'Don\'t worry about it'}
          ];
        } else if (conversationContext.includes('adiós') || conversationContext.includes('goodbye')) {
          contextuallyRelevantOptions = [
            {text: 'Hola', translation: 'Hello'},
            {text: 'Buenos días', translation: 'Good morning'},
            {text: 'Hasta pronto', translation: 'See you soon'},
            {text: 'Cuídate', translation: 'Take care'}
          ];
        } else {
          contextuallyRelevantOptions = [
            {text: 'No sé', translation: 'I don\'t know'},
            {text: 'Tal vez', translation: 'Maybe'},
            {text: 'Creo que sí', translation: 'I think so'},
            {text: 'No realmente', translation: 'Not really'},
            {text: 'Absolutamente', translation: 'Absolutely'}
          ];
        }
      } else if (targetLanguage.toLowerCase().includes('chinese') || targetLanguage.toLowerCase().includes('zh') || targetLanguage.toLowerCase().includes('mandarin')) {
        // Chinese target language options
        if (conversationContext.includes('你好') || conversationContext.includes('hello') || conversationContext.includes('hi')) {
          contextuallyRelevantOptions = [
            {text: '再见', translation: 'Goodbye'},
            {text: '回头见', translation: 'See you later'},
            {text: '你好吗？', translation: 'How are you?'},
            {text: '很高兴认识你', translation: 'Nice to meet you'}
          ];
        } else if (conversationContext.includes('怎么样') || conversationContext.includes('how are you')) {
          contextuallyRelevantOptions = [
            {text: '我很好，谢谢', translation: 'I am fine, thank you'},
            {text: '还不错', translation: 'Not bad'},
            {text: '一般般', translation: 'So-so'},
            {text: '很棒', translation: 'Great'},
            {text: '很糟糕', translation: 'Terrible'}
          ];
        } else if (conversationContext.includes('谢谢') || conversationContext.includes('thank')) {
          contextuallyRelevantOptions = [
            {text: '不客气', translation: 'You are welcome'},
            {text: '没问题', translation: 'No problem'},
            {text: '很乐意', translation: 'My pleasure'},
            {text: '别客气', translation: 'Don\'t mention it'}
          ];
        } else if (conversationContext.includes('再见') || conversationContext.includes('goodbye')) {
          contextuallyRelevantOptions = [
            {text: '你好', translation: 'Hello'},
            {text: '早上好', translation: 'Good morning'},
            {text: '很快再见', translation: 'See you soon'},
            {text: '保重', translation: 'Take care'}
          ];
        } else {
          contextuallyRelevantOptions = [
            {text: '我不知道', translation: 'I don\'t know'},
            {text: '也许', translation: 'Maybe'},
            {text: '我想是的', translation: 'I think so'},
            {text: '不是真的', translation: 'Not really'},
            {text: '绝对', translation: 'Absolutely'},
            {text: '是的，今天很适合散步', translation: 'Yes, it\'s a good day to walk'},
            {text: '你好，我很好，谢谢', translation: 'Hello, I\'m good, thank you'},
            {text: '我很好，谢谢', translation: 'I am fine, thank you'},
            {text: '还不错', translation: 'Not bad'},
            {text: '一般般', translation: 'So-so'},
            {text: '很棒', translation: 'Great'},
            {text: '很糟糕', translation: 'Terrible'}
          ];
        }
      } else {
        // Generic/English target language options
        contextuallyRelevantOptions = [
          {text: 'I don\'t know', translation: 'I don\'t know'},
          {text: 'Maybe', translation: 'Maybe'},
          {text: 'I think so', translation: 'I think so'},
          {text: 'Not really', translation: 'Not really'},
          {text: 'Absolutely', translation: 'Absolutely'}
        ];
      }
      
      wrongOptionsPool.push(...contextuallyRelevantOptions);
      
      // Filter out the correct answer and get unique options
      const uniqueOptions = wrongOptionsPool.filter(option => option.text !== correctAnswer);
      
      // Shuffle and return a random wrong option
      const shuffled = uniqueOptions.sort(() => Math.random() - 0.5);
      const selectedOption = shuffled[0] || {text: 'I don\'t know', translation: 'I don\'t know'}; // More natural fallback
      
      // Memoize the selected option
      setMemoizedWrongOptions(prev => ({
        ...prev,
        [key]: selectedOption
      }));
      
      return selectedOption;
      
    } catch (error) {
      console.error('Error generating wrong options:', error);
      const targetLanguage = profile?.target_language || 'English';
      
      // Language-agnostic fallback
      let fallbackText = 'I don\'t know';
      if (targetLanguage.toLowerCase().includes('french') || targetLanguage.toLowerCase().includes('fr')) {
        fallbackText = 'Je ne sais pas';
      } else if (targetLanguage.toLowerCase().includes('spanish') || targetLanguage.toLowerCase().includes('es')) {
        fallbackText = 'No sé';
      } else if (targetLanguage.toLowerCase().includes('chinese') || targetLanguage.toLowerCase().includes('zh') || targetLanguage.toLowerCase().includes('mandarin')) {
        fallbackText = '我不知道';
      }
      
      const fallbackOption = {text: fallbackText, translation: 'I don\'t know'};
      
      // Memoize the fallback option too
      setMemoizedWrongOptions(prev => ({
        ...prev,
        [key]: fallbackOption
      }));
      
      return fallbackOption;
    }
  };

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
      
      // Find the corresponding exchange data to get native language translations
      const userExchangeData = conversationExchanges.find(exchange => 
        exchange.speaker === 'user' && exchange.text === userMsg.message
      );
      const assistantExchangeData = conversationExchanges.find(exchange => 
        exchange.speaker === 'assistant' && exchange.text === assistantMsg.message
      );
      
      // Generate dynamic wrong option for multiple choice questions
      const correctAnswer = userMsg.message;
      const dynamicWrongOption = currentExchangeIndex < 2 ? generateWrongOptions(correctAnswer, currentExchangeIndex) : undefined;
      
      return {
        appMessage: {
          french: assistantMsg.message, // Target language text
          english: assistantExchangeData?.translation || assistantMsg.message // Native language translation
        },
        userMessage: {
          french: userMsg.message, // Target language text
          english: userExchangeData?.translation || userMsg.message // Native language translation
        },
        type: currentExchangeIndex < 2 ? 'choice' as const : 'scramble' as const,
        wrongOption: dynamicWrongOption
      };
    }
    
    // For fallback conversation, also generate dynamic wrong options
    const fallbackExchange = CONVERSATION[currentExchangeIndex] || CONVERSATION[0];
    if (fallbackExchange.type === 'choice' && currentExchangeIndex < 2) {
      const correctAnswer = fallbackExchange.userMessage.french; // Use French as the correct answer
      const dynamicWrongOption = generateWrongOptions(correctAnswer, currentExchangeIndex);
      return {
        ...fallbackExchange,
        wrongOption: dynamicWrongOption
      };
    }
    // For non-choice exchanges, ensure wrongOption is undefined
    return {
      ...fallbackExchange,
      wrongOption: undefined
    };
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
            // Find the corresponding exchange data to get native language translations
            const nextAssistantExchangeData = conversationExchanges.find(exchange => 
              exchange.speaker === 'assistant' && exchange.text === nextAssistantMsg.message
            );
            
            newHistory.push({
              type: 'app' as const,
              french: nextAssistantMsg.message,
              english: nextAssistantExchangeData?.translation || nextAssistantMsg.message,
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
    // Clear memoized wrong options for current exchange to get fresh options
    const key = `${currentExchange.userMessage.french}-${currentExchangeIndex}`;
    setMemoizedWrongOptions(prev => {
      const newOptions = { ...prev };
      delete newOptions[key];
      return newOptions;
    });
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
        // Find the corresponding exchange data to get native language translations
        const nextAssistantExchangeData = conversationExchanges.find(exchange => 
          exchange.speaker === 'assistant' && exchange.text === nextAssistantMsg.message
        );
        
        newHistory.push({
          type: 'app' as const,
          french: nextAssistantMsg.message,
          english: nextAssistantExchangeData?.translation || nextAssistantMsg.message,
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
          <Text style={styles.questionLabel}>
            {currentExchange.type === 'choice' ? 'TAP THE CORRECT ANSWER' : 'CORRECT THE ORDERING'}
          </Text>

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
                  selectedAnswer === (typeof currentExchange.wrongOption === 'object' ? currentExchange.wrongOption?.text : currentExchange.wrongOption) && styles.multiChoiceSelected,
                ]}
                onPress={() => handleAnswerSelect(typeof currentExchange.wrongOption === 'object' ? currentExchange.wrongOption?.text || '' : currentExchange.wrongOption || '')}
                disabled={showResult}
              >
                <Text style={styles.multiChoiceButtonText}>
                  {typeof currentExchange.wrongOption === 'object' ? currentExchange.wrongOption?.text : currentExchange.wrongOption}
                </Text>
                <Text style={styles.multiChoiceButtonEnglish}>
                  {typeof currentExchange.wrongOption === 'object' ? currentExchange.wrongOption?.translation : currentExchange.wrongOption}
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
            <TouchableOpacity 
              style={[styles.roundSpeakerButton, isPlayingAudio && styles.roundSpeakerButtonActive]}
              onPress={() => {
                const textToSpeak = currentExchange.type === 'choice' 
                  ? (selectedAnswer || currentExchange.userMessage.french)
                  : (userAnswer.length > 0 ? userAnswer.join(' ') : currentExchange.userMessage.french);
                // For user's arranged/selected answer (target language), use English speech
                handleNormalSpeedPlay(textToSpeak, getSpeechLanguageCode('en-GB'));
              }}
            >
              <Ionicons name="volume-high" size={28} color="#ffffff" />
            </TouchableOpacity>

            {!showResult || isCorrect ? (
              <TouchableOpacity
                style={[
                  styles.checkButtonBottom,
                  ((currentExchange.type === 'choice' && !selectedAnswer) || 
                  (currentExchange.type === 'scramble' && userAnswer.length === 0)) && styles.checkButtonDisabledBottom
                ]}
                onPress={handleCheck}
                disabled={
                  (currentExchange.type === 'choice' && !selectedAnswer) || 
                  (currentExchange.type === 'scramble' && userAnswer.length === 0)
                }
              >
                <Text style={styles.checkButtonTextBottom}>Check</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.retrySkipButtons}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonTextBottom}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonTextBottom}>Skip</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.roundClockButton, isPlayingAudio && styles.roundClockButtonActive]}
              onPress={() => {
                const textToSpeak = currentExchange.type === 'choice' 
                  ? (selectedAnswer || currentExchange.userMessage.french)
                  : (userAnswer.length > 0 ? userAnswer.join(' ') : currentExchange.userMessage.french);
                // For user's arranged/selected answer (target language), use English speech
                handleSlowSpeedPlay(textToSpeak, getSpeechLanguageCode('en-GB'));
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
  conversationContentNew: {
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
  scrambleContainerBottom: {
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
  retryButtonTop: {
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
  skipButtonTop: {
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
  checkButtonBottom: {
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
  checkButtonDisabledBottom: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
  },
  checkButtonTextBottom: {
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
  retryButtonTextBottom: {
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
  skipButtonTextBottom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
