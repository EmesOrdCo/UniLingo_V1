import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { logger } from '../lib/logger';
import GameCompletionTracker from '../lib/gameCompletionTracker';
import GlobalCompletionLock from '../lib/globalCompletionLock';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import FlashcardQuizSetup from '../components/FlashcardQuizSetup';
import MemoryMatchSetup from '../components/MemoryMatchSetup';
import { FlashcardQuizSetupOptions } from '../components/FlashcardQuizSetup';
import { MemoryMatchSetupOptions } from '../components/MemoryMatchSetup';
import SentenceScrambleSetup from '../components/SentenceScrambleSetup';
import HangmanSetup from '../components/HangmanSetup';
import SpeedChallengeSetup from '../components/SpeedChallengeSetup';
import TypeWhatYouHearSetup from '../components/TypeWhatYouHearSetup';
import GravityGameSetup from '../components/GravityGameSetup';
import SpeakingGameSetup from '../components/SpeakingGameSetup';
import { SentenceScrambleSetupOptions } from '../components/SentenceScrambleSetup';
import { HangmanSetupOptions } from '../components/HangmanSetup';
import { SpeedChallengeSetupOptions } from '../components/SpeedChallengeSetup';
import { TypeWhatYouHearSetupOptions } from '../components/TypeWhatYouHearSetup';
import { GravityGameSetupOptions } from '../components/GravityGameSetup';
import { SpeakingGameSetupOptions } from '../components/SpeakingGameSetup';
import WordScrambleSetup from '../components/WordScrambleSetup';
import { WordScrambleSetupOptions } from '../components/WordScrambleSetup';
import { GameDataService } from '../lib/gameDataService';
import { ProgressTrackingService } from '../lib/progressTrackingService';
import { XPService } from '../lib/xpService';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import { GameStatisticsService } from '../lib/gameStatisticsService';
import { supabase } from '../lib/supabase';
import ConsistentHeader from '../components/ConsistentHeader';
import DailyChallengeSection from '../components/DailyChallengeSection';
import FavouritesSection from '../components/FavouritesSection';
import HorizontalGamesSection from '../components/HorizontalGamesSection';
import GameStatsSection from '../components/GameStatsSection';
import { DailyChallengeService } from '../lib/dailyChallengeService';
import FlashcardQuizGame from '../components/games/FlashcardQuizGame';
import LessonSentenceScramble from '../components/lesson/LessonSentenceScramble';
import WordScrambleGame from '../components/games/WordScrambleGame';
import MemoryMatchGame from '../components/games/MemoryMatchGame';
import HangmanGame from '../components/games/HangmanGame';
import GravityGame from '../components/games/GravityGame';
import TypeWhatYouHearGame from '../components/games/TypeWhatYouHearGame';
import SpeedChallengeGame from '../components/games/SpeedChallengeGame';
import SentenceScrambleGame from '../components/games/SentenceScrambleGame';
import SpeakingGame from '../components/games/SpeakingGame';
import { getSpeechLanguageCode } from '../lib/languageService';
import { useTranslation } from '../lib/i18n';

const { width } = Dimensions.get('window');

export default function GamesScreen({ route }: { route?: any }) {
  const screenId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  // console.log(`🎮 [${screenId}] GamesScreen component rendered`); // Debug logging disabled
  
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const { refreshTrigger } = useRefresh();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if we need to launch a specific game from navigation params
  const launchGame = route?.params?.launchGame;
  
  // State for games and data
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [topics, setTopics] = useState<Array<{ id: string; name: string; icon: string; color: string; count: number }>>([]);
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    averageScore: 0,
    timeSpent: 0,
  });

  // Flashcard-specific state
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [difficulties] = useState([
    { id: 'all', name: t('difficulty.all'), color: '#6366f1', description: t('difficulty.allDescription') },
    { id: 'beginner', name: t('difficulty.beginner'), color: '#059669', description: t('difficulty.beginnerDescription') },
    { id: 'intermediate', name: t('difficulty.intermediate'), color: '#f59e0b', description: t('difficulty.intermediateDescription') },
    { id: 'expert', name: t('difficulty.expert'), color: '#ef4444', description: t('difficulty.expertDescription') },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    flashcards: false,
    topics: false,
    gameStats: false,
    flashcardStats: false
    // Note: dailyChallenge is NOT tracked here because it's rendered AFTER loading completes
  });

  // Check if all loading states are complete
  useEffect(() => {
    console.log('🔍 Loading states:', loadingStates);
    const allLoaded = Object.values(loadingStates).every(state => state === true);
    console.log('🔍 All loaded?', allLoaded);
    if (allLoaded) {
      console.log('✅ All data loaded, hiding loading screen');
      setIsLoading(false);
    }
  }, [loadingStates]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({
    topic: '',
    front: '',
    back: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'expert',
    example: '',
    pronunciation: '',
    native_language: 'english'
  });
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [realFlashcardStats, setRealFlashcardStats] = useState({
    totalCards: 0,
    averageAccuracy: 0,
    bestTopic: ''
  });
  const [filteredCardCount, setFilteredCardCount] = useState<number>(0);
  const [topicFilteredCounts, setTopicFilteredCounts] = useState<{[key: string]: number}>({});
  
  // Real game statistics state
  const [realGameStats, setRealGameStats] = useState({
    gamesPlayedToday: 0,
    totalGamesPlayed: 0,
    averageAccuracy: 0,
    totalGamingTime: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    bestScore: 0,
    averageScore: 0,
  });
  
  // Game state
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [filteredFlashcards, setFilteredFlashcards] = useState<any[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const completedGameIdsRef = useRef<Set<string>>(new Set()); // Add guard for completion
  const lastCompletionTimeRef = useRef<number>(0);
  const completionDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Setup modals
  const [showFlashcardQuizSetup, setShowFlashcardQuizSetup] = useState(false);
  const [showMemoryMatchSetup, setShowMemoryMatchSetup] = useState(false);
  const [showWordScrambleSetup, setShowWordScrambleSetup] = useState(false);
  const [showSentenceScrambleSetup, setShowSentenceScrambleSetup] = useState(false);
  const [showHangmanSetup, setShowHangmanSetup] = useState(false);
  const [showSpeedChallengeSetup, setShowSpeedChallengeSetup] = useState(false);
  const [showTypeWhatYouHearSetup, setShowTypeWhatYouHearSetup] = useState(false);
  const [showGravityGameSetup, setShowGravityGameSetup] = useState(false);
  const [showSpeakingGameSetup, setShowSpeakingGameSetup] = useState(false);
  

  // Fetch flashcards and topics
  useEffect(() => {
    const fetchGameData = async () => {
      console.log(`🎮 fetchGameData called - user: ${!!user}, profile: ${!!profile}, subjects: ${profile?.subjects}`);
      
      if (!user) {
        console.log(`🎮 No user, skipping flashcard load`);
        setLoadingStates(prev => ({ ...prev, flashcards: true }));
        return;
      }
      
      if (!profile?.subjects?.[0]) {
        console.log(`🎮 No subjects in profile, loading flashcards without subject filter`);
        // Load flashcards without subject filter if no subjects
        try {
          const userFlashcards = await UserFlashcardService.getUserFlashcards();
          const allCards = userFlashcards.filter(card => 
            card.front && card.back && card.topic
          );
          
          console.log(`🎮 Loaded ${allCards.length} flashcards for user (no subject filter)`);
          setFlashcards(allCards);
          
          // Get unique topics
          const uniqueTopics = Array.from(new Set(allCards.map(card => card.topic)));
          const topicObjects = uniqueTopics.map(topic => ({
            id: topic.toLowerCase().replace(/\s+/g, '-'),
            name: topic,
            icon: 'book-outline',
            color: '#ef4444',
            count: 0
          }));
          setTopics(topicObjects);
          
        } catch (error) {
          console.error('❌ Error loading flashcards without subject:', error);
          setFlashcards([]);
        } finally {
          setLoadingStates(prev => ({ ...prev, flashcards: true }));
        }
        return;
      }
      
      try {
        const userSubject = profile.subjects[0];
        logger.debug('Fetching game data for subject:', userSubject);
        
        // Get user's flashcards filtered by subject
        const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
        const userCards = userFlashcards;
        
        // Only use user flashcards - general flashcards table no longer exists
        const allCards = userCards.filter(card => 
          card.front && card.back && card.topic
        );
        
        console.log(`🎮 Loaded ${allCards.length} flashcards for user`);
        setFlashcards(allCards);
        
        // Get unique topics from user cards only
        const uniqueTopics = Array.from(new Set(allCards.map(card => card.topic)));
        // Convert string array to topic objects
        const topicObjects = uniqueTopics.map(topic => ({
          id: topic.toLowerCase().replace(/\s+/g, '-'),
          name: topic,
          icon: 'book-outline',
          color: '#ef4444',
          count: 0
        }));
        setTopics(topicObjects);
        
        
        logger.debug('Game data loaded:', {
          totalCards: allCards.length,
          topics: uniqueTopics.length
        });
        
      } catch (error) {
        console.error('❌ Error fetching game data:', error);
        Alert.alert('Error', 'Failed to load game data. Please try again.');
      } finally {
        setLoadingStates(prev => ({ ...prev, flashcards: true }));
      }
    };

    fetchGameData();
  }, [user, profile]);

  // Load game statistics when user changes
  useEffect(() => {
    if (user?.id) {
      loadGameStatistics();
    }
  }, [user?.id]);

  // Load flashcard data when user changes
  useEffect(() => {
    if (user && profile) {
      loadTopics();
      fetchRealFlashcardStats();
    }
  }, [user, profile]);

  // Refresh data when refreshTrigger changes (from global refresh context)
  useEffect(() => {
    if (refreshTrigger > 0 && user && profile) {
      loadTopics();
      fetchRealFlashcardStats();
    }
  }, [refreshTrigger]);

  // Pull-to-refresh callback
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user && profile) {
        // Refresh all game data including flashcards
        const userSubject = profile.subjects[0];
        const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
        const userCards = userFlashcards.filter(card => 
          card.front && card.back && card.topic
        );
        setFlashcards(userCards);
        
        // Refresh topics
        const uniqueTopics = Array.from(new Set(userCards.map(card => card.topic)));
        const topicObjects = uniqueTopics.map(topic => ({
          id: topic.toLowerCase().replace(/\s+/g, '-'),
          name: topic,
          icon: 'book-outline',
          color: '#ef4444',
          count: 0
        }));
        setTopics(topicObjects);
        
        // Refresh stats
        await fetchRealFlashcardStats();
      }
    } finally {
      setRefreshing(false);
    }
  }, [user, profile]);

  // Update filtered card count when topic or difficulty changes
  useEffect(() => {
    const updateCardCount = async () => {
      if (selectedTopic && selectedDifficulty) {
        const count = await getFilteredCardCount();
        setFilteredCardCount(count);
      } else {
        setFilteredCardCount(0);
      }
    };

    updateCardCount();
  }, [selectedTopic, selectedDifficulty, user, profile]);

  // Update topic filtered counts when difficulty changes
  useEffect(() => {
    const updateTopicCounts = async () => {
      if (selectedDifficulty && topics.length > 0) {
        const counts: {[key: string]: number} = {};
        
        // Get counts for all topics
        for (const topic of topics) {
          counts[topic.name] = await getTopicFilteredCount(topic.name);
        }
        
        // Get count for "all topics"
        if (selectedDifficulty === 'all') {
          counts['all-topics'] = topics.reduce((total, topic) => total + topic.count, 0);
        } else {
          const allTopicsCount = await getFilteredCardCount();
          counts['all-topics'] = allTopicsCount;
        }
        
        setTopicFilteredCounts(counts);
      }
    };

    updateTopicCounts();
  }, [selectedDifficulty, topics, user, profile]);

  // Handle automatic game launch from navigation params
  useEffect(() => {
    if (launchGame && flashcards.length > 0 && !isLoading) {
      console.log('🚀 Auto-launching game from daily challenge:', launchGame);
      console.log('🎯 Route params:', route?.params);
      
      // Get default options from route params or use defaults
      const gameOptions = route?.params?.gameOptions || {};
      console.log('🎮 Game options received:', gameOptions);
      
      // Auto-launch the game with default settings
      setTimeout(() => {
        switch (launchGame) {
          case 'Flashcard Quiz':
            console.log('🎯 Launching Flashcard Quiz with options:', gameOptions);
            handleFlashcardQuizSetupComplete(gameOptions);
            break;
          case 'Memory Match':
            console.log('🎯 Launching Memory Match with options:', gameOptions);
            handleMemoryMatchSetupComplete(gameOptions);
            break;
          case 'Word Scramble':
            console.log('🎯 Launching Word Scramble with options:', gameOptions);
            handleWordScrambleSetupComplete(gameOptions);
            break;
          case 'Hangman':
            console.log('🎯 Launching Hangman with options:', gameOptions);
            handleHangmanSetupComplete(gameOptions);
            break;
          case 'Speed Challenge':
            console.log('🎯 Launching Speed Challenge with options:', gameOptions);
            handleSpeedChallengeSetupComplete(gameOptions);
            break;
          case 'Planet Defense':
            console.log('🎯 Launching Planet Defense with options:', gameOptions);
            handleGravityGameSetupComplete(gameOptions);
            break;
          case 'Listen & Type':
            console.log('🎯 Launching Listen & Type with options:', gameOptions);
            handleTypeWhatYouHearSetupComplete(gameOptions);
            break;
          case 'Sentence Scramble':
            console.log('🎯 Launching Sentence Scramble with options:', gameOptions);
            handleSentenceScrambleSetupComplete(gameOptions);
            break;
          case 'Speaking Game':
            console.log('🎯 Launching Speaking Game with options:', gameOptions);
            handleSpeakingGameSetupComplete(gameOptions);
            break;
          default:
            console.warn('Unknown game type for auto-launch:', launchGame);
        }
        
        // Clear the launch parameters to prevent re-triggering on subsequent visits
        console.log('🧹 Clearing launch parameters to prevent re-triggering');
        navigation.setParams({
          launchGame: undefined,
          gameOptions: undefined,
          isDailyChallenge: undefined
        });
      }, 500); // Small delay to ensure everything is loaded
    }
  }, [launchGame, flashcards.length, isLoading]);

  // Load real game statistics
  const loadGameStatistics = async () => {
    try {
      if (!user?.id) {
        setLoadingStates(prev => ({ ...prev, gameStats: true }));
        return;
      }
      
      console.log('🎮 Loading real game statistics...');
      const stats = await GameStatisticsService.getGameStatistics(user.id);
      
      setRealGameStats({
        gamesPlayedToday: stats.gamesPlayedToday,
        totalGamesPlayed: stats.totalGamesPlayed,
        averageAccuracy: stats.averageAccuracy,
        totalGamingTime: stats.totalGamingTime,
        level: stats.level,
        xp: stats.xp,
        nextLevelXp: stats.nextLevelXp,
        bestScore: stats.bestScore,
        averageScore: stats.averageScore,
      });
      
      console.log('✅ Real game statistics loaded:', stats);
    } catch (error) {
      console.error('❌ Error loading game statistics:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, gameStats: true }));
    }
  };

  // Refresh game statistics (call this after completing a game)
  const refreshGameStatistics = async () => {
    await loadGameStatistics();
  };


  // Flashcard functions
  const getTopicIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'medical-outline': 'medical',
      'book-outline': 'book',
      'school-outline': 'school',
      'business-outline': 'business',
      'home-outline': 'home',
      'car-outline': 'car',
      'restaurant-outline': 'restaurant',
      'fitness-outline': 'fitness',
      'musical-notes-outline': 'musical-notes',
      'game-controller-outline': 'game-controller',
      'camera-outline': 'camera',
      'heart-outline': 'heart',
      'star-outline': 'star',
      'flash-outline': 'flash',
      'bulb-outline': 'bulb',
      'code-outline': 'code',
      'globe-outline': 'globe',
      'people-outline': 'people',
      'time-outline': 'time',
      'location-outline': 'location',
    };
    return iconMap[iconName] || 'book-outline';
  };

  // Calculate filtered card count based on topic and difficulty using actual database queries
  const getFilteredCardCount = async (): Promise<number> => {
    if (!selectedTopic || !selectedDifficulty || !user || !profile?.subjects || profile.subjects.length === 0) {
      return 0;
    }

    try {
      const userSubject = profile.subjects[0];
      let totalCount = 0;

      if (selectedTopic === 'all-topics') {
        // For all topics, get user flashcards filtered by subject and difficulty
        const userFlashcards = await UserFlashcardService.getUserFlashcards({
          subject: userSubject,
          difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty
        });

        totalCount = userFlashcards.length;
      } else {
        // For specific topic, get user flashcards filtered by subject, topic, and difficulty
        const selectedTopicName = topics.find(t => t.id === selectedTopic)?.name;
        if (!selectedTopicName) return 0;

        const userFlashcards = await UserFlashcardService.getUserFlashcards({
          subject: userSubject,
          topic: selectedTopicName,
          difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty
        });

        totalCount = userFlashcards.length;
      }

      return totalCount;
    } catch (error) {
      console.error('Error calculating filtered card count:', error);
      return 0;
    }
  };

  // Get filtered count for a specific topic and difficulty
  const getTopicFilteredCount = async (topicName: string): Promise<number> => {
    if (!selectedDifficulty || !user || !profile?.subjects || profile.subjects.length === 0) {
      return 0;
    }

    try {
      const userSubject = profile.subjects[0];
      
      // Get user flashcards filtered by subject, topic, and difficulty
      const userFlashcards = await UserFlashcardService.getUserFlashcards({
        subject: userSubject,
        topic: topicName,
        difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty
      });

      return userFlashcards.length;
    } catch (error) {
      console.error('Error calculating topic filtered count:', error);
      return 0;
    }
  };

  // Load topics and flashcard data
  const loadTopics = async () => {
    if (!user || !profile?.subjects || profile.subjects.length === 0) {
      setTopics([]);
      setLoadingStates(prev => ({ ...prev, topics: true }));
      return;
    }

    try {
      const userSubject = profile.subjects[0];
      
      // Get user flashcards for the subject
      const userFlashcards = await UserFlashcardService.getUserFlashcards({
        subject: userSubject
      });

      // Group flashcards by topic
      const topicGroups: { [key: string]: any[] } = {};
      userFlashcards.forEach(card => {
        const topic = card.topic || 'Uncategorized';
        if (!topicGroups[topic]) {
          topicGroups[topic] = [];
        }
        topicGroups[topic].push(card);
      });

      // Create topic objects
      const topicObjects = Object.entries(topicGroups).map(([topicName, cards]) => ({
        id: topicName.toLowerCase().replace(/\s+/g, '-'),
        name: topicName,
        icon: 'book-outline',
        color: '#ef4444',
        count: cards.length
      }));

      setTopics(topicObjects);
      console.log('✅ Topics loaded:', topicObjects);
    } catch (error) {
      console.error('❌ Error loading topics:', error);
      setTopics([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, topics: true }));
    }
  };

  // Fetch real flashcard statistics
  const fetchRealFlashcardStats = async () => {
    if (!user || !profile?.subjects || profile.subjects.length === 0) {
      setRealFlashcardStats({
        totalCards: 0,
        averageAccuracy: 0,
        bestTopic: ''
      });
      setLoadingStates(prev => ({ ...prev, flashcardStats: true }));
      return;
    }

    try {
      const userSubject = profile.subjects[0];
      const userFlashcards = await UserFlashcardService.getUserFlashcards({
        subject: userSubject
      });

      // Calculate statistics
      const totalCards = userFlashcards.length;
      
      // Calculate average accuracy (simplified - you might want to track this in your database)
      const averageAccuracy = userFlashcards.length > 0 ? Math.floor(Math.random() * 30) + 70 : 0; // Mock data
      
      // Find best topic (topic with most cards)
      const topicGroups: { [key: string]: number } = {};
      userFlashcards.forEach(card => {
        const topic = card.topic || 'Uncategorized';
        topicGroups[topic] = (topicGroups[topic] || 0) + 1;
      });
      
      const bestTopic = Object.entries(topicGroups).reduce((best, [topic, count]) => 
        count > (topicGroups[best] || 0) ? topic : best, 'No topics yet'
      );

      setRealFlashcardStats({
        totalCards,
        averageAccuracy,
        bestTopic
      });
    } catch (error) {
      console.error('❌ Error fetching flashcard stats:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, flashcardStats: true }));
    }
  };

  // Create flashcard function
  const createFlashcard = async () => {
    if (!newFlashcard.front.trim() || !newFlashcard.back.trim() || !newFlashcard.example.trim() || !newFlashcard.topic.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Front, Back, Example, and Topic).');
      return;
    }

    if (!user || !profile?.subjects || profile.subjects.length === 0) {
      Alert.alert('Error', 'User profile not found. Please try again.');
      return;
    }

    try {
      const userSubject = profile.subjects[0];
      
      const flashcardData = {
        front: newFlashcard.front.trim(),
        back: newFlashcard.back.trim(),
        example: newFlashcard.example.trim(),
        pronunciation: newFlashcard.pronunciation.trim(),
        difficulty: newFlashcard.difficulty,
        topic: newFlashcard.topic.trim(),
        subject: userSubject,
        native_language: newFlashcard.native_language,
        user_id: user.id
      };

      await UserFlashcardService.createUserFlashcard(flashcardData);
      
      Alert.alert('Success', 'Flashcard created successfully!');
      
      // Reset form
      setNewFlashcard({
        topic: '',
        front: '',
        back: '',
        difficulty: 'beginner',
        example: '',
        pronunciation: '',
        native_language: 'english'
      });
      setShowCreateForm(false);
      setShowTopicInput(false);
      setNewTopicInput('');
      setShowTopicPicker(false);
      
      // Refresh topics and stats
      await loadTopics();
      await fetchRealFlashcardStats();
      
    } catch (error) {
      console.error('❌ Error creating flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard. Please try again.');
    }
  };


  // Load browse flashcards
  const loadBrowseFlashcards = async () => {
    if (!user || !profile?.subjects || profile.subjects.length === 0) {
      return;
    }

    try {
      // Navigate to BrowseFlashcardsScreen
      navigation.navigate('BrowseFlashcards', {
        topic: 'all',
        difficulty: 'all'
      });
    } catch (error) {
      console.error('❌ Error navigating to browse flashcards:', error);
      Alert.alert('Error', 'Failed to open browse flashcards. Please try again.');
    }
  };

  // Play pronunciation
  const playPronunciation = async (text: string) => {
    if (isAudioPlaying) return;
    
    try {
      setIsAudioPlaying(true);
      
      // Determine correct language based on user's target language
      const userTargetLanguage = profile?.target_language || 'English';
      const languageCode = getSpeechLanguageCode(userTargetLanguage);
      
      await Speech.speak(text, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
      });
      
      logger.info(`🔊 Speaking: ${text} in ${languageCode} (target language: ${userTargetLanguage})`);
    } catch (error) {
      console.error('❌ Error playing pronunciation:', error);
    } finally {
      setTimeout(() => setIsAudioPlaying(false), 1000);
    }
  };


  // Helper functions for new UI
  const getGameIcon = (gameName: string) => {
    switch (gameName) {
      case 'Memory Match': return 'grid';
      case 'Word Scramble': return 'text';
      case 'Hangman': return 'game-controller';
      case 'Speed Challenge': return 'timer';
      case 'Planet Defense': return 'planet';
      case 'Listen & Type': return 'ear';
      case 'Sentence Scramble': return 'document-text';
      case 'Speaking Game': return 'mic';
      default: return 'help-circle';
    }
  };

  const getGameTag = (gameName: string) => {
    switch (gameName) {
      case 'Memory Match': return 'Memory';
      case 'Word Scramble': return 'Puzzle';
      case 'Hangman': return 'Word Game';
      case 'Speed Challenge': return 'Speed';
      case 'Planet Defense': return 'Arcade';
      case 'Listen & Type': return 'Listening';
      case 'Sentence Scramble': return 'Grammar';
      case 'Speaking Game': return 'Pronunciation';
      default: return 'Quiz';
    }
  };

  const getGameOnPress = (gameName: string) => {
    switch (gameName) {
      case 'Memory Match': return startMemoryMatch;
      case 'Word Scramble': return startWordScramble;
      case 'Hangman': return startHangman;
      case 'Speed Challenge': return startSpeedChallenge;
      case 'Planet Defense': return startGravityGame;
      case 'Listen & Type': return startTypeWhatYouHear;
      case 'Sentence Scramble': return startSentenceScramble;
      case 'Speaking Game': return startSpeakingGame;
      default: return startFlashcardQuiz;
    }
  };

  // Helper function to show popup error when no flashcards
  const showNoFlashcardsError = () => {
    Alert.alert(
      t('games.noFlashcardsModal.title'),
      t('games.noFlashcardsModal.message'),
      [
        {
          text: t('games.noFlashcardsModal.goToFlashcards'),
          onPress: () => navigation.navigate('Flashcards' as never)
        },
        {
          text: t('games.noFlashcardsModal.ok'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle daily challenge completion

  // Game start functions
  const startFlashcardQuiz = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowFlashcardQuizSetup(true);
  };

  const handleFlashcardQuizPlayAgain = () => {
    // Close the game modal and reopen the setup screen
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setShowFlashcardQuizSetup(true);
  };

  const handleMemoryMatchPlayAgain = () => {
    // Close the game modal and reopen the setup screen
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setShowMemoryMatchSetup(true);
  };

  const handleWordScramblePlayAgain = () => {
    // Close the game modal and reopen the setup screen
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setShowWordScrambleSetup(true);
  };

  const handleHangmanPlayAgain = () => {
    // Close the game modal and reopen the setup screen
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setShowHangmanSetup(true);
  };

  const handleSpeedChallengePlayAgain = () => {
    // Close the game modal and reopen the setup screen
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setShowSpeedChallengeSetup(true);
  };

  const handleTypeWhatYouHearPlayAgain = () => {
    // Close the game modal and reopen the setup screen
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setShowTypeWhatYouHearSetup(true);
  };

  const handleSentenceScramblePlayAgain = () => {
    // Close the game modal and reopen the setup screen
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setShowSentenceScrambleSetup(true);
  };

  const handleSpeakingGamePlayAgain = () => {
    // Close the game modal and reopen the setup screen
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setShowSpeakingGameSetup(true);
  };

  const startMemoryMatch = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowMemoryMatchSetup(true);
  };

  const startWordScramble = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowWordScrambleSetup(true);
  };

  const startHangman = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowHangmanSetup(true);
  };

  const startSpeedChallenge = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowSpeedChallengeSetup(true);
  };

  const startGravityGame = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowGravityGameSetup(true);
  };

  const startTypeWhatYouHear = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowTypeWhatYouHearSetup(true);
  };

  const startSentenceScramble = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowSentenceScrambleSetup(true);
  };

  const startSpeakingGame = () => {
    if (flashcards.length === 0) {
      showNoFlashcardsError();
      return;
    }
    setShowSpeakingGameSetup(true);
  };

  // Setup completion handlers
  const handleFlashcardQuizSetupComplete = (options: FlashcardQuizSetupOptions) => {
    setShowFlashcardQuizSetup(false);
    setCurrentGame('Flashcard Quiz');
    setGameCompleted(false); // Reset completion flag
    completedGameIdsRef.current.clear(); // Clear completion tracking
    
    // Map language mode to GameDataService format
    const mappedLanguageMode = options.languageMode === 'native-to-target' ? 'question' : 
                              options.languageMode === 'target-to-native' ? 'answer' : 'mixed';
    
    // Filter flashcards by topic and difficulty
    let filteredFlashcards = flashcards;
    
    // Filter by topic if specific topic is selected
    if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
      filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
    }
    
    // Filter by difficulty if specific difficulty is selected
    if (options.difficulty && options.difficulty !== 'all') {
      filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
    }
    
    const gameData = GameDataService.generateQuizQuestions(filteredFlashcards, options.questionCount, mappedLanguageMode);
    setGameData(gameData);
    setFilteredFlashcards(filteredFlashcards); // Store the filtered flashcards
    setShowGameModal(true);
  };

  const handleMemoryMatchSetupComplete = (options: MemoryMatchSetupOptions) => {
    try {
      setShowMemoryMatchSetup(false);
      setGameCompleted(false); // Reset completion flag
      
      // Filter flashcards by selected topic
      let filteredFlashcards = flashcards;
      if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
        filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
      }
      
      // Filter flashcards by difficulty (only if not 'all')
      if (options.difficulty && options.difficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
      }
      
      // Validate flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Memory Match');
      if (!validation.isValid) {
        Alert.alert(t('games.cannotStartGame'), validation.error ? t(validation.error) : t('games.invalidFlashcardData'));
        return;
      }
      
      setCurrentGame('Memory Match');
      
      // Ensure cardCount is valid, default to 6 pairs (12 cards) if not provided
      const cardCount = options.cardCount || 12;
      const pairCount = Math.floor(cardCount / 2);
      
      console.log('🎮 Memory Match - Card count:', cardCount, 'Pair count:', pairCount);
      
      const gameData = GameDataService.generateMemoryMatchQuestions(filteredFlashcards, pairCount);
      setGameData(gameData);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error starting Memory Match:', error);
      Alert.alert('Error', 'Failed to start Memory Match game. Please try again.');
    }
  };

  const handleWordScrambleSetupComplete = (options: WordScrambleSetupOptions) => {
    try {
      console.log('🔤 Starting Word Scramble setup');
      setShowWordScrambleSetup(false);
      setGameCompleted(false); // Reset completion flag
      
      // Filter flashcards based on selected topic and difficulty
      let filteredFlashcards = flashcards;
      
      // Filter by topic if specific topic is selected
      if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
        filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
      }
      
      // Filter by difficulty if specific difficulty is selected
      if (options.difficulty && options.difficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
      }
      
      console.log('🔍 Word Scramble filtered flashcards:', {
        original: flashcards.length,
        filtered: filteredFlashcards.length,
        topic: options.selectedTopic,
        difficulty: options.difficulty
      });
      
      // Validate filtered flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Word Scramble');
      if (!validation.isValid) {
        Alert.alert(t('games.cannotStartGame'), validation.error ? t(validation.error) : t('games.invalidFlashcardData'));
        return;
      }
      
      setCurrentGame('Word Scramble');
      const gameData = GameDataService.generateScrambleQuestions(filteredFlashcards, options.wordCount);
      setGameData(gameData);
      setShowGameModal(true);
      console.log('✅ Word Scramble game started successfully');
    } catch (error) {
      console.error('Error starting Word Scramble:', error);
      Alert.alert('Error', 'Failed to start Word Scramble game. Please try again.');
    }
  };

  const handleSentenceScrambleSetupComplete = (options: SentenceScrambleSetupOptions) => {
    try {
      console.log('🔀 Starting Sentence Scramble setup');
      setShowSentenceScrambleSetup(false);
      setGameCompleted(false); // Reset completion flag
      
      // Filter flashcards based on selected topic and difficulty
      let filteredFlashcards = flashcards;
      
      // Filter by topic if specific topic is selected
      if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
        filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
      }
      
      // Filter by difficulty if specific difficulty is selected
      if (options.difficulty && options.difficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
      }
      
      console.log('🔍 Sentence Scramble filtered flashcards:', {
        original: flashcards.length,
        filtered: filteredFlashcards.length,
        topic: options.selectedTopic,
        difficulty: options.difficulty
      });
      
      // Validate filtered flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Sentence Scramble');
      if (!validation.isValid) {
        Alert.alert(t('games.cannotStartGame'), validation.error ? t(validation.error) : t('games.invalidFlashcardData'));
        return;
      }
      
    setCurrentGame('Sentence Scramble');
      
      // Map difficulty from database format to game format
      let gameDifficulty: 'easy' | 'medium' | 'hard' | undefined;
      if (options.difficulty === 'beginner') gameDifficulty = 'easy';
      else if (options.difficulty === 'intermediate') gameDifficulty = 'medium';
      else if (options.difficulty === 'expert') gameDifficulty = 'hard';
      else gameDifficulty = undefined;
      
      const gameData = GameDataService.generateSentenceScrambleQuestions(filteredFlashcards, options.sentenceCount, gameDifficulty);
      setGameData(gameData);
    setShowGameModal(true);
    console.log('✅ Sentence Scramble game started successfully');
    } catch (error) {
      console.error('Error starting Sentence Scramble:', error);
      Alert.alert('Error', 'Failed to start Sentence Scramble game. Please try again.');
    }
  };

  const handleHangmanSetupComplete = (options: HangmanSetupOptions) => {
    try {
      setShowHangmanSetup(false);
      setGameCompleted(false); // Reset completion flag
      
      // Filter flashcards based on selected topic and difficulty
      let filteredFlashcards = flashcards;
      
      // Filter by topic if specific topic is selected
      if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
        filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
      }
      
      // Filter by difficulty if specific difficulty is selected
      if (options.difficulty && options.difficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
      }
      
      console.log('🔍 Hangman filtered flashcards:', {
        original: flashcards.length,
        filtered: filteredFlashcards.length,
        topic: options.selectedTopic,
        difficulty: options.difficulty
      });
      
      // Validate filtered flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Hangman');
      if (!validation.isValid) {
        Alert.alert(t('games.cannotStartGame'), validation.error ? t(validation.error) : t('games.invalidFlashcardData'));
        return;
      }
      
      setCurrentGame('Hangman');
      
      // Map difficulty from database format to game format
      let gameDifficulty: 'easy' | 'medium' | 'hard' | undefined;
      if (options.difficulty === 'beginner') gameDifficulty = 'easy';
      else if (options.difficulty === 'intermediate') gameDifficulty = 'medium';
      else if (options.difficulty === 'expert') gameDifficulty = 'hard';
      else gameDifficulty = undefined;
      
      const gameData = GameDataService.generateHangmanQuestions(filteredFlashcards, options.wordCount, gameDifficulty);
      setGameData(gameData);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error starting Hangman:', error);
      Alert.alert('Error', 'Failed to start Hangman game. Please try again.');
    }
  };

  const handleSpeedChallengeSetupComplete = (options: SpeedChallengeSetupOptions) => {
    try {
      setShowSpeedChallengeSetup(false);
      setGameCompleted(false); // Reset completion flag
      
      // Filter flashcards based on selected topic and difficulty
      let filteredFlashcards = flashcards;
      
      // Filter by topic if specific topic is selected
      if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
        filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
      }
      
      // Filter by difficulty if specific difficulty is selected
      if (options.difficulty && options.difficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
      }
      
      console.log('🔍 Speed Challenge filtered flashcards:', {
        original: flashcards.length,
        filtered: filteredFlashcards.length,
        topic: options.selectedTopic,
        difficulty: options.difficulty
      });
      
      // Validate filtered flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Speed Challenge');
      if (!validation.isValid) {
        Alert.alert(t('games.cannotStartGame'), validation.error ? t(validation.error) : t('games.invalidFlashcardData'));
        return;
      }
      
      setCurrentGame('Speed Challenge');
      
      // Map difficulty from database format to game format
      let gameDifficulty: 'easy' | 'medium' | 'hard' | undefined;
      if (options.difficulty === 'beginner') gameDifficulty = 'easy';
      else if (options.difficulty === 'intermediate') gameDifficulty = 'medium';
      else if (options.difficulty === 'expert') gameDifficulty = 'hard';
      else gameDifficulty = undefined;
      
      const gameData = GameDataService.generateSpeedChallengeQuestions(filteredFlashcards, gameDifficulty, options.timeLimit);
      setGameData(gameData);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error starting Speed Challenge:', error);
      Alert.alert('Error', 'Failed to start Speed Challenge game. Please try again.');
    }
  };

  const handleTypeWhatYouHearSetupComplete = (options: TypeWhatYouHearSetupOptions) => {
    try {
      setShowTypeWhatYouHearSetup(false);
      setGameCompleted(false); // Reset completion flag
      completedGameIdsRef.current.clear(); // Clear completion tracking
      GameCompletionTracker.getInstance().clear(); // Clear global completion tracking
      GlobalCompletionLock.getInstance().clear(); // Clear global completion lock
      
      // Clear debounce timeout
      if (completionDebounceTimeoutRef.current) {
        clearTimeout(completionDebounceTimeoutRef.current);
        completionDebounceTimeoutRef.current = null;
      }
      lastCompletionTimeRef.current = 0; // Reset completion time
      
      // Filter flashcards based on selected topic and difficulty
      let filteredFlashcards = flashcards;
      
      // Filter by topic if specific topic is selected
      if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
        filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
      }
      
      // Filter by difficulty if specific difficulty is selected
      if (options.difficulty && options.difficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
      }
      
      console.log('🔍 Listen & Type filtered flashcards:', {
        original: flashcards.length,
        filtered: filteredFlashcards.length,
        topic: options.selectedTopic,
        difficulty: options.difficulty
      });
      
      // Validate filtered flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Listen & Type');
      if (!validation.isValid) {
        Alert.alert(t('games.cannotStartGame'), validation.error ? t(validation.error) : t('games.invalidFlashcardData'));
        return;
      }
      
      setCurrentGame('Listen & Type');
      
      // Map difficulty from database format to game format
      let gameDifficulty: 'easy' | 'medium' | 'hard' | undefined;
      if (options.difficulty === 'beginner') gameDifficulty = 'easy';
      else if (options.difficulty === 'intermediate') gameDifficulty = 'medium';
      else if (options.difficulty === 'expert') gameDifficulty = 'hard';
      else gameDifficulty = undefined;
      
        const gameData = GameDataService.generateTypeWhatYouHearQuestions(filteredFlashcards, options.wordCount, gameDifficulty);
      setGameData(gameData);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error starting Listen & Type:', error);
      Alert.alert('Error', 'Failed to start Listen & Type game. Please try again.');
    }
  };

  const handleGravityGameSetupComplete = (options: GravityGameSetupOptions) => {
    try {
      setShowGravityGameSetup(false);
      setGameCompleted(false); // Reset completion flag
      
      // Filter flashcards based on selected topic and difficulty
      let filteredFlashcards = flashcards;
      
      // Filter by topic if specific topic is selected
      if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
        filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
      }
      
      // Filter by difficulty if specific difficulty is selected
      if (options.difficulty && options.difficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
      }
      
      console.log('🔍 Planet Defense filtered flashcards:', {
        original: flashcards.length,
        filtered: filteredFlashcards.length,
        topic: options.selectedTopic,
        difficulty: options.difficulty
      });
      
      // Validate filtered flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Planet Defense');
      if (!validation.isValid) {
        Alert.alert(t('games.cannotStartGame'), validation.error ? t(validation.error) : t('games.invalidFlashcardData'));
        return;
      }
      
      setCurrentGame('Planet Defense');
      
      // Map difficulty from database format to game format
      let gameDifficulty: 'easy' | 'medium' | 'hard' = 'medium'; // Default to medium
      if (options.difficulty === 'beginner') gameDifficulty = 'easy';
      else if (options.difficulty === 'intermediate') gameDifficulty = 'medium';
      else if (options.difficulty === 'expert') gameDifficulty = 'hard';
      // 'all' difficulty uses medium as default
      
        const gameData = GameDataService.generateGravityGameQuestions(filteredFlashcards, gameDifficulty, options.gravitySpeed);
      setGameData(gameData);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error starting Planet Defense:', error);
      Alert.alert('Error', 'Failed to start Planet Defense game. Please try again.');
    }
  };

  const handleSpeakingGameSetupComplete = (options: SpeakingGameSetupOptions) => {
    try {
      setShowSpeakingGameSetup(false);
      setGameCompleted(false); // Reset completion flag
      
      // Filter flashcards based on selected topic and difficulty
      let filteredFlashcards = flashcards;
      
      // Filter by topic if specific topic is selected
      if (options.selectedTopic && options.selectedTopic !== 'All Topics') {
        filteredFlashcards = filteredFlashcards.filter(card => card.topic === options.selectedTopic);
      }
      
      // Filter by difficulty if specific difficulty is selected
      if (options.difficulty && options.difficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => card.difficulty === options.difficulty);
      }
      
      console.log('🔍 Speaking Game filtered flashcards:', {
        original: flashcards.length,
        filtered: filteredFlashcards.length,
        topic: options.selectedTopic,
        difficulty: options.difficulty
      });
      
      // Validate filtered flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Speaking Game');
      if (!validation.isValid) {
        Alert.alert(t('games.cannotStartGame'), validation.error ? t(validation.error) : t('games.invalidFlashcardData'));
        return;
      }
      
      setCurrentGame('Speaking Game');
      const gameData = GameDataService.generateSpeakingGameQuestions(filteredFlashcards, options.wordCount);
      setGameData(gameData);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error starting Speaking Game:', error);
      Alert.alert('Error', 'Failed to start Speaking Game. Please try again.');
    }
  };

  // Handle game completion with aggressive debouncing
  const handleGameComplete = async (finalScore: number, timeSpent?: number, totalAnswered?: number) => {
    const completionId = Math.random().toString(36).substr(2, 9);
    const now = Date.now();
    
    try {
      console.log(`🎮 [${screenId}] [${completionId}] Game completed with finalScore:`, finalScore, 'timeSpent:', timeSpent, 'totalAnswered:', totalAnswered, 'currentGame:', currentGame, 'gameCompleted:', gameCompleted, 'timeSinceLastCompletion:', now - lastCompletionTimeRef.current);
      
      
      
      // TEMPORARILY DISABLED: Debounce all completions within 5 seconds
      // if (now - lastCompletionTimeRef.current < 5000) {
      //   console.log(`🚫 [${screenId}] [${completionId}] NUCLEAR GUARD: Completion within 5 seconds, REJECTING`);
      //   return;
      // }
      
      // Clear any existing debounce timeout
      if (completionDebounceTimeoutRef.current) {
        clearTimeout(completionDebounceTimeoutRef.current);
        completionDebounceTimeoutRef.current = null;
      }
      
      // Set debounce timeout to prevent rapid successive calls
      completionDebounceTimeoutRef.current = setTimeout(() => {
        console.log(`⏰ [${screenId}] [${completionId}] Debounce timeout expired, processing completion`);
        processGameCompletion(finalScore, completionId, timeSpent, totalAnswered);
      }, 100); // 100ms debounce
      
      // Update last completion time immediately
      lastCompletionTimeRef.current = now;
      
    } catch (error) {
      console.error(`❌ [${screenId}] [${completionId}] Error in handleGameComplete:`, error);
    }
  };

  // Separate function to actually process the completion
  const processGameCompletion = async (finalScore: number, completionId: string, timeSpent?: number, totalAnswered?: number) => {
    try {
      console.log(`🎯 [${screenId}] [${completionId}] ===== PROCESSING GAME COMPLETION STARTED =====`);
      console.log(`🎯 [${screenId}] [${completionId}] Processing game completion`);
      
      // Add a guard to prevent multiple calls - use a more robust check
      if (!currentGame || !gameData) {
        console.log(`⚠️ [${screenId}] [${completionId}] Guard: No currentGame or gameData, skipping`);
        return;
      }
      
      // Check if already completed using a more immediate approach
      if (gameCompleted) {
        console.log(`⚠️ [${screenId}] [${completionId}] Guard: Already completed, skipping`);
        return;
      }

      // Create a unique completion key based on game data and timestamp
      const completionKey = `${currentGame}-${gameData.id || 'unknown'}-${Date.now()}`;
      if (completedGameIdsRef.current.has(completionKey)) {
        console.log(`⚠️ [${screenId}] [${completionId}] Guard: Completion key already exists, skipping`);
        return;
      }
      
      // Set completion flag immediately to prevent duplicate calls
      console.log(`🔒 [${screenId}] [${completionId}] Setting gameCompleted to true and adding completion key: ${completionKey}`);
      setGameCompleted(true);
      completedGameIdsRef.current.add(completionKey);
      
      // Record game activity in progress tracking
      const gameName = currentGame;
      const durationSeconds = timeSpent || 60; // Default 1 minute if not provided
      
      let totalQuestions: number;
      let accuracyPercentage: number;
      let maxScore: number;
      
      // Special handling for Speed Challenge game
      if (currentGame === 'Speed Challenge') {
        // For Speed Challenge: finalScore = correct answers, totalQuestions = questions answered (including skips)
        totalQuestions = totalAnswered || 1; // Use totalAnswered if provided, fallback to 1 to avoid division by zero
        accuracyPercentage = totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0;
        maxScore = Math.max(totalQuestions * 100, 100); // Minimum 100 points, 100 points per question answered
        
        console.log('⚡ Speed Challenge scoring:', {
          correctAnswers: finalScore,
          totalAnswered: totalQuestions,
          accuracyPercentage,
          maxScore
        });
      } else if (currentGame === 'Memory Match') {
        // For Memory Match: finalScore = matched pairs, totalQuestions = total pairs
        totalQuestions = gameData.questions.length / 2; // Each pair creates 2 cards
        accuracyPercentage = Math.round((finalScore / totalQuestions) * 100);
        maxScore = totalQuestions * 100; // 100 points per pair
        
        console.log('🧠 Memory Match scoring:', {
          matchedPairs: finalScore,
          totalPairs: totalQuestions,
          accuracyPercentage,
          maxScore
        });
      } else if (currentGame === 'Speaking Game') {
        // For Speaking Game: finalScore = average pronunciation score, totalQuestions = words attempted
        totalQuestions = totalAnswered || gameData.questions?.length || 1;
        accuracyPercentage = finalScore; // finalScore is already the average score
        maxScore = 100; // Maximum pronunciation score is 100
        
        console.log('🎤 Speaking Game scoring:', {
          averageScore: finalScore,
          totalWords: totalQuestions,
          accuracyPercentage,
          maxScore
        });
      } else {
        // For other games: finalScore = correct answers, totalQuestions = total questions
        totalQuestions = gameData.questions?.length || 1;
        accuracyPercentage = Math.round((finalScore / totalQuestions) * 100);
        maxScore = totalQuestions * 100; // 100 points per question
        
        console.log('📊 Standard game scoring:', {
          correctAnswers: finalScore,
          totalQuestions,
          accuracyPercentage,
          maxScore
        });
      }

      console.log('📊 Calculated accuracy:', accuracyPercentage, '% from', finalScore, 'correct out of', totalQuestions, 'questions');

      // Calculate score safely to avoid NaN
      const calculatedScore = totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * maxScore) : 0;
      console.log('📊 Calculated score:', calculatedScore, 'from', finalScore, '/', totalQuestions, '*', maxScore);

      console.log(`🎯 [${screenId}] [${completionId}] ===== CALLING DATABASE OPERATIONS =====`);
      
      await ProgressTrackingService.recordGameActivity({
        activityType: 'game',
        activityName: gameName,
        durationSeconds,
        score: calculatedScore,
        maxScore,
        accuracyPercentage,
        gameData,
      });

      console.log(`✅ [${screenId}] [${completionId}] ===== GAME PROGRESS TRACKED SUCCESSFULLY =====`);

      // Award XP for completing the game
      if (user?.id) {
        try {
          const xpResult = await XPService.awardXP(
            user.id,
            'game',
            calculatedScore,
            maxScore,
            accuracyPercentage,
            gameName,
            durationSeconds
          );
          
          if (xpResult) {
            console.log('🎯 XP awarded:', xpResult.totalXP, 'XP');
          }
        } catch (xpError) {
          console.error('❌ Error awarding XP:', xpError);
        }
      }

      // Handle daily challenge completion
      const isDailyChallenge = route?.params?.isDailyChallenge;
      if (isDailyChallenge && user?.id) {
        try {
          console.log('🎯 Daily challenge completed! Marking as complete...');
          const challengeCompleted = await DailyChallengeService.completeChallenge(user.id, gameName);
          if (challengeCompleted) {
            console.log('✅ Daily challenge marked as completed!');
          } else {
            console.log('⚠️ Daily challenge completion failed or already completed');
          }
        } catch (challengeError) {
          console.error('❌ Error completing daily challenge:', challengeError);
        }
      }

      // Update game stats (existing functionality)
      setGameStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        totalScore: prev.totalScore + finalScore,
        bestScore: Math.max(prev.bestScore, finalScore),
        averageScore: Math.round((prev.totalScore + finalScore) / (prev.gamesPlayed + 1)),
      }));

      console.log(`🎯 [${screenId}] [${completionId}] ALL DATABASE OPERATIONS COMPLETED SUCCESSFULLY`);
      
      // Refresh game statistics
      await refreshGameStatistics();
      
    } catch (error) {
      console.error('❌ Error tracking game progress:', error);
    }

    // Wait a moment to ensure database operations complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Close game modal and show completion message - MOVED AFTER DATABASE OPERATIONS
    console.log('🔄 Closing game modal and resetting all state');
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setGameCompleted(false); // Reset completion flag
    completedGameIdsRef.current.clear(); // Clear completion tracking
    GameCompletionTracker.getInstance().clear(); // Clear global completion tracking
    GlobalCompletionLock.getInstance().clear(); // Clear global completion lock
    
    // Clear debounce timeout
    if (completionDebounceTimeoutRef.current) {
      clearTimeout(completionDebounceTimeoutRef.current);
      completionDebounceTimeoutRef.current = null;
    }
    lastCompletionTimeRef.current = 0; // Reset completion time
    
    console.log(`✅ [${screenId}] [${completionId}] Game completion handling finished`);
    
    Alert.alert(
      'Game Complete! 🎉',
      `Final Score: ${finalScore}`,
      [{ text: 'OK' }]
    );
  };

  // Close game modal
  const closeGameModal = () => {
    console.log('🔄 Closing game modal and resetting all state');
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    setGameCompleted(false); // Reset completion flag
    completedGameIdsRef.current.clear(); // Clear completion tracking
    GameCompletionTracker.getInstance().clear(); // Clear global completion tracking
    GlobalCompletionLock.getInstance().clear(); // Clear global completion lock
    
    // Clear debounce timeout
    if (completionDebounceTimeoutRef.current) {
      clearTimeout(completionDebounceTimeoutRef.current);
      completionDebounceTimeoutRef.current = null;
    }
    lastCompletionTimeRef.current = 0; // Reset completion time
    console.log('✅ Game modal state reset complete');
  };

  // Render game component based on current game
  const renderGameComponent = () => {
    // console.log(`🎮 [${screenId}] renderGameComponent called for game: ${currentGame}`); // Debug logging disabled
    
    if (!currentGame || !gameData) return null;

    const gameProps = {
      gameData,
      onClose: closeGameModal,
      onGameComplete: handleGameComplete,
      userProfile: profile,
      ...(currentGame === 'Speed Challenge' && { timeLimit: gameData.timeLimit }),
    };

    switch (currentGame) {
      case 'Flashcard Quiz':
        return <FlashcardQuizGame 
          {...gameProps} 
          onStartNextGame={(gameType) => {
            console.log(`🎯 Starting next game: ${gameType}`);
            setCurrentGame(gameType);
            // No need to generate game data - LessonSentenceScramble uses vocabulary directly
            setShowGameModal(true);
          }}
          onPlayAgain={handleFlashcardQuizPlayAgain}
        />;
      case 'Memory Match':
        return <MemoryMatchGame {...gameProps} onPlayAgain={handleMemoryMatchPlayAgain} />;
      case 'Word Scramble':
        return <WordScrambleGame {...gameProps} onPlayAgain={handleWordScramblePlayAgain} />;
      case 'Hangman':
        return <HangmanGame {...gameProps} onPlayAgain={handleHangmanPlayAgain} />;
      case 'Speed Challenge':
        return <SpeedChallengeGame {...gameProps} onPlayAgain={handleSpeedChallengePlayAgain} />;
      case 'Planet Defense':
        return <GravityGame {...gameProps} />;
      case 'Listen & Type':
        console.log(`🎧 [${screenId}] Creating TypeWhatYouHearGame component`);
        return <TypeWhatYouHearGame {...gameProps} onPlayAgain={handleTypeWhatYouHearPlayAgain} />;
      case 'Sentence Scramble':
        return <SentenceScrambleGame 
          gameData={gameData} 
          onClose={closeGameModal} 
          onGameComplete={handleGameComplete}
          onPlayAgain={handleSentenceScramblePlayAgain}
        />;
      case 'Speaking Game':
        return <SpeakingGame 
          gameData={gameData} 
          onClose={closeGameModal} 
          onGameComplete={handleGameComplete}
          onPlayAgain={handleSpeakingGamePlayAgain}
        />;
      default:
        return null;
    }
  };

  // Show loading screen while data is being fetched
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ConsistentHeader 
          pageName={t('nav.games')}
        />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <View style={styles.loadingSpinner}>
              <Ionicons name="game-controller" size={48} color="#6366f1" />
            </View>
            <Text style={styles.loadingTitle}>{t('games.loadingGames')}</Text>
            <Text style={styles.loadingSubtitle}>{t('games.preparingExperience')}</Text>
            <View style={styles.loadingProgress}>
              <View style={styles.loadingProgressBar}>
                <View style={styles.loadingProgressFill} />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConsistentHeader 
        pageName={t('nav.games')}
      />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Daily Challenge Section */}
        <DailyChallengeSection 
          refreshTrigger={refreshTrigger}
        />
        
        {/* Your Game Stats */}
        <GameStatsSection 
          stats={{
            today: realGameStats.gamesPlayedToday,
            total: realGameStats.totalGamesPlayed,
            accuracyPct: realGameStats.averageAccuracy,
            totalMinutes: realGameStats.totalGamingTime,
          }}
        />
        
        {/* All Games - Horizontal Scroll */}
        <HorizontalGamesSection 
          games={[
            { name: t('games.flashcardQuiz'), tag: t('games.tag.quiz'), icon: 'help-circle', color: '#6366f1', bgColor: '#f0f4ff', onPress: startFlashcardQuiz },
            { name: t('games.memoryMatch'), tag: t('games.tag.memory'), icon: 'grid', color: '#059669', bgColor: '#f0fdf4', onPress: startMemoryMatch },
            { name: t('games.wordScramble'), tag: t('games.tag.puzzle'), icon: 'text', color: '#059669', bgColor: '#f0fdf4', onPress: startWordScramble },
            { name: t('games.hangman'), tag: t('games.tag.wordGame'), icon: 'game-controller', color: '#8b5cf6', bgColor: '#f8fafc', onPress: startHangman },
            { name: t('games.speedChallenge'), tag: t('games.tag.speed'), icon: 'timer', color: '#dc2626', bgColor: '#fef2f2', onPress: startSpeedChallenge },
            { name: t('games.gravityGame'), tag: t('games.tag.arcade'), icon: 'planet', color: '#3b82f6', bgColor: '#dbeafe', onPress: startGravityGame },
            { name: t('games.typeWhatYouHear'), tag: t('games.tag.listening'), icon: 'ear', color: '#8b5cf6', bgColor: '#f3e8ff', onPress: startTypeWhatYouHear },
            { name: t('games.sentenceScramble'), tag: t('games.tag.grammar'), icon: 'document-text', color: '#ec4899', bgColor: '#fdf2f8', onPress: startSentenceScramble },
            // { name: t('games.speakingGame'), tag: t('games.tag.pronunciation'), icon: 'mic', color: '#f59e0b', bgColor: '#fffbeb', onPress: startSpeakingGame }, // Hidden to assess API usage costs
          ].map((game) => ({
            id: game.name,
            title: game.name,
            tag: game.tag,
            cards: flashcards.length,
            progress: 0.2,
            icon: game.icon,
            onPlay: game.onPress
          }))}
        />

        {/* Review Flashcards Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="library" size={24} color="#6366f1" />
            <Text style={styles.standardSectionTitle}>{t('flashcards.reviewYourFlashcards')}</Text>
          </View>
          <Text style={styles.sectionDescription}>
            {t('flashcards.reviewDescription')}
          </Text>
          
          <View style={styles.reviewFlashcardsCard}>
            <View style={styles.reviewStatsRow}>
              <View style={styles.reviewStatItem}>
                <Ionicons name="book" size={20} color="#6366f1" />
                <View style={styles.reviewStatTextContainer}>
                  <Text style={styles.reviewStatNumber}>{realFlashcardStats.totalCards}</Text>
                  <Text style={styles.reviewStatLabel}>{t('flashcards.totalCards')}</Text>
                </View>
              </View>
              <View style={styles.reviewStatItem}>
                <Ionicons name="bookmark" size={20} color="#6366f1" />
                <View style={styles.reviewStatTextContainer}>
                  <Text style={styles.reviewStatNumber}>{topics.length}</Text>
                  <Text style={styles.reviewStatLabel}>{t('flashcards.topics')}</Text>
                </View>
              </View>
            </View>
            
            {realFlashcardStats.totalCards > 0 && (
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={loadBrowseFlashcards}
              >
                <Ionicons name="play-circle" size={24} color="#6366f1" />
                <Text style={styles.browseButtonText}>{t('games.flashcardForm.startFlashcards')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Create Flashcard Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowCreateForm(!showCreateForm)}
            >
              <Ionicons name="add-circle" size={24} color="#6366f1" />
              <Text style={[styles.sectionTitle, { textAlign: 'center', flex: 1 }]}>{t('flashcards.createNew')}</Text>
              <Ionicons 
                name={showCreateForm ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
          </View>
          
          {!showCreateForm ? (
            <>
              <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateForm(true)}>
                <Ionicons name="add" size={24} color="#6366f1" />
                <Text style={styles.createButtonText}>{t('flashcards.createYourOwn')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadNotesButton} onPress={() => navigation.navigate('Upload' as never)}>
                <Ionicons name="document-text" size={24} color="#059669" />
                <Text style={styles.uploadNotesButtonText}>{t('flashcards.makeAI')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.createForm}>
              {/* Topic selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('games.flashcardForm.topic')}</Text>
                {!showTopicInput ? (
                  <View style={styles.createFormTopicSelectionContainer}>
                    <TouchableOpacity
                      style={styles.createFormTopicDropdown}
                      onPress={() => setShowTopicPicker(!showTopicPicker)}
                    >
                      <Text style={styles.topicDropdownText}>
                        {newFlashcard.topic || t('games.flashcardForm.selectTopic')}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.newTopicButton}
                      onPress={() => setShowTopicInput(true)}
                    >
                      <Ionicons name="add" size={16} color="#6366f1" />
                      <Text style={styles.newTopicButtonText}>{t('games.flashcardForm.newTopic')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.newTopicInputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder={t('games.flashcardForm.enterNewTopicName')}
                      value={newTopicInput}
                      onChangeText={setNewTopicInput}
                    />
                    <View style={styles.newTopicActions}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => {
                        setShowTopicInput(false);
                        setNewTopicInput('');
                      }}>
                        <Text style={styles.cancelButtonText}>{t('games.flashcardForm.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.confirmButton} onPress={() => {
                        if (newTopicInput.trim()) {
                          setNewFlashcard(prev => ({ ...prev, topic: newTopicInput.trim() }));
                          setShowTopicInput(false);
                          setNewTopicInput('');
                        }
                      }}>
                        <Text style={styles.confirmButtonText}>{t('games.flashcardForm.useNewTopic')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {/* Topic dropdown options */}
                {!showTopicInput && showTopicPicker && (
                  <ScrollView style={styles.topicOptionsContainer}>
                    {(topics || []).map((topic) => (
                      <TouchableOpacity
                        key={topic.id}
                        style={styles.topicOption}
                        onPress={() => {
                          setNewFlashcard(prev => ({ ...prev, topic: topic.name }));
                          setShowTopicPicker(false);
                        }}
                      >
                        <Text style={styles.topicOptionText}>{topic.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Front Text Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('games.flashcardForm.front')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.front}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, front: text }))}
                  placeholder={t('games.flashcardForm.frontPlaceholder')}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Back Text Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('games.flashcardForm.back')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.back}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, back: text }))}
                  placeholder={t('games.flashcardForm.backPlaceholder')}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Example Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('games.flashcardForm.example')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.example}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, example: text }))}
                  placeholder={t('games.flashcardForm.examplePlaceholder')}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Pronunciation Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('games.flashcardForm.pronunciation')}</Text>
                <TextInput
                  style={styles.input}
                  value={newFlashcard.pronunciation}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, pronunciation: text }))}
                  placeholder={t('games.flashcardForm.pronunciationPlaceholder')}
                />
              </View>

              {/* Difficulty Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('games.flashcardForm.difficultyLevel')}</Text>
                <View style={styles.difficultyContainer}>
                  {['beginner', 'intermediate', 'expert'].map((level) => {
                    const levelConfig = {
                      beginner: { color: '#059669', bgColor: '#f0fdf4', icon: 'leaf-outline' },
                      intermediate: { color: '#f59e0b', bgColor: '#fffbeb', icon: 'flame-outline' },
                      expert: { color: '#ef4444', bgColor: '#fef2f2', icon: 'flash-outline' }
                    };
                    const config = levelConfig[level as keyof typeof levelConfig];
                    
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.difficultyButton,
                          newFlashcard.difficulty === level && styles.selectedDifficulty,
                          { 
                            backgroundColor: level === 'beginner' ? config.bgColor : (newFlashcard.difficulty === level ? config.color : config.bgColor),
                            borderColor: config.color,
                            shadowColor: config.color,
                          }
                        ]}
                        onPress={() => setNewFlashcard(prev => ({ ...prev, difficulty: level as 'beginner' | 'intermediate' | 'expert' }))}
                      >
                        <Text style={[
                          styles.difficultyText,
                          { color: level === 'beginner' ? config.color : (newFlashcard.difficulty === level ? '#ffffff' : config.color) }
                        ]}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelFormButton} onPress={() => {
                  setShowCreateForm(false);
                  setNewFlashcard({
                    topic: '',
                    front: '',
                    back: '',
                    difficulty: 'beginner',
                    example: '',
                    pronunciation: '',
                    native_language: 'english'
                  });
                  setShowTopicInput(false);
                  setNewTopicInput('');
                  setShowTopicPicker(false);
                }}>
                  <Ionicons name="close-circle-outline" size={20} color="#6b7280" style={styles.buttonIcon} />
                  <Text style={styles.cancelFormButtonText}>{t('games.flashcardForm.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={createFlashcard}>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.saveButtonText}>{t('games.flashcardForm.saveFlashcard')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

      </ScrollView>
      

      {/* Setup Modals */}
      <FlashcardQuizSetup
        visible={showFlashcardQuizSetup}
        onClose={() => setShowFlashcardQuizSetup(false)}
        onStartGame={handleFlashcardQuizSetupComplete}
        availableCards={flashcards.length}
      />

      <MemoryMatchSetup
        visible={showMemoryMatchSetup}
        onClose={() => setShowMemoryMatchSetup(false)}
        onStartGame={handleMemoryMatchSetupComplete}
        availableCards={flashcards.length}
      />

      <WordScrambleSetup
        visible={showWordScrambleSetup}
        onClose={() => setShowWordScrambleSetup(false)}
        onStartGame={handleWordScrambleSetupComplete}
        availableCards={flashcards.length}
      />

      <SentenceScrambleSetup
        visible={showSentenceScrambleSetup}
        onClose={() => setShowSentenceScrambleSetup(false)}
        onStartGame={handleSentenceScrambleSetupComplete}
        availableCards={flashcards.length}
      />

      <HangmanSetup
        visible={showHangmanSetup}
        onClose={() => setShowHangmanSetup(false)}
        onStartGame={handleHangmanSetupComplete}
        availableCards={flashcards.length}
      />

      <SpeedChallengeSetup
        visible={showSpeedChallengeSetup}
        onClose={() => setShowSpeedChallengeSetup(false)}
        onStartGame={handleSpeedChallengeSetupComplete}
        availableCards={flashcards.length}
      />

      <TypeWhatYouHearSetup
        visible={showTypeWhatYouHearSetup}
        onClose={() => setShowTypeWhatYouHearSetup(false)}
        onStartGame={handleTypeWhatYouHearSetupComplete}
        availableCards={flashcards.length}
      />

      <GravityGameSetup
        visible={showGravityGameSetup}
        onClose={() => setShowGravityGameSetup(false)}
        onStartGame={handleGravityGameSetupComplete}
        availableCards={flashcards.length}
      />

      <SpeakingGameSetup
        visible={showSpeakingGameSetup}
        onClose={() => setShowSpeakingGameSetup(false)}
        onStartGame={handleSpeakingGameSetupComplete}
        availableCards={flashcards.length}
      />

      {/* Game Modal */}
      <Modal
        visible={showGameModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeGameModal}
      >
        <SafeAreaView style={styles.gameModalContainer} edges={['top']}>
          <View style={styles.gameModalHeader}>
            <TouchableOpacity onPress={closeGameModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.gameTitleContainer}>
              <View style={styles.gameIconWrapper}>
                <Ionicons name={getGameIcon(currentGame || '')} size={28} color="#6366f1" />
              </View>
              <Text style={styles.gameModalTitle}>{currentGame}</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.gameModalContent}>
            {renderGameComponent()}
          </View>
        </SafeAreaView>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  setupSection: {
    marginBottom: 24,
  },
  setupSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1e293b',
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1e293b',
  },
  questionCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  countButton: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  questionCountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 40,
    textAlign: 'center',
  },
  languageModeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  languageModeButtonActive: {
    backgroundColor: '#6466E9',
    borderColor: '#6466E9',
  },
  languageModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  languageModeButtonTextActive: {
    color: '#ffffff',
  },
  startButton: {
    backgroundColor: '#6466E9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  gameModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gameModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  gameIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gameModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(30, 41, 59, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gameStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameStatsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  gameModalContent: {
    flex: 1,
  },
  // Flashcard styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  standardSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  dottedOutlineContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dottedOutline: {
    width: '100%',
    height: 60,
    borderWidth: 2,
    borderColor: '#166534',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    marginBottom: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  uploadNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#059669',
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadNotesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  createForm: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createFormTopicSelectionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  createFormTopicDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    minHeight: 48,
  },
  topicDropdownText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 8,
  },
  newTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    gap: 6,
  },
  newTopicButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  newTopicInputContainer: {
    gap: 12,
  },
  newTopicActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  topicOptionsContainer: {
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginTop: 4,
  },
  topicOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topicOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  difficultyButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 52,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
    textAlign: 'center',
    flexShrink: 1,
  },
  selectedDifficulty: {
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  formActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  cancelFormButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cancelFormButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: -0.2,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    shadowColor: '#6366f1',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  statsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  reviewFlashcardsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewStatsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  reviewStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewStatTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  reviewStatLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  unifiedSelectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectionRow: {
    marginBottom: 20,
  },
  selectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  selectionLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectionContent: {
    position: 'relative',
  },
  compactDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  selectedCompactDropdown: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  compactDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDropdownText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  compactPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  compactLanguageOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  compactLanguageOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  selectedCompactLanguageOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  compactLanguageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  compactDropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  compactDropdownScroll: {
    maxHeight: 200,
  },
  compactDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  selectedCompactDropdownOption: {
    backgroundColor: '#f0f4ff',
  },
  compactDropdownOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDropdownOptionContent: {
    flex: 1,
  },
  compactDropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  compactDropdownOptionCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  compactDropdownDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  browseModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loadingProgress: {
    width: '100%',
    maxWidth: 200,
  },
  loadingProgressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  browseContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topicSection: {
    marginBottom: 24,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  topicCount: {
    fontSize: 14,
    color: '#64748b',
  },
  browseCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  browseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  browseCardDifficulty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  browseAudioButton: {
    padding: 6,
    backgroundColor: '#f0f4ff',
    borderRadius: 6,
  },
  browseCardContent: {
    gap: 8,
  },
  browseCardSide: {
    gap: 4,
  },
  browseCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  browseCardText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  browseExample: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 4,
  },
});
