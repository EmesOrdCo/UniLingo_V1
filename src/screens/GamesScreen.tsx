import React, { useState, useEffect, useMemo, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import FlashcardQuizSetup from '../components/FlashcardQuizSetup';
import MemoryMatchSetup from '../components/MemoryMatchSetup';
import { FlashcardQuizSetupOptions } from '../components/FlashcardQuizSetup';
import { MemoryMatchSetupOptions } from '../components/MemoryMatchSetup';
import SentenceScrambleSetup from '../components/SentenceScrambleSetup';
import HangmanSetup from '../components/HangmanSetup';
import SpeedChallengeSetup from '../components/SpeedChallengeSetup';
import TypeWhatYouHearSetup from '../components/TypeWhatYouHearSetup';
import GravityGameSetup from '../components/GravityGameSetup';
import { SentenceScrambleSetupOptions } from '../components/SentenceScrambleSetup';
import { HangmanSetupOptions } from '../components/HangmanSetup';
import { SpeedChallengeSetupOptions } from '../components/SpeedChallengeSetup';
import { TypeWhatYouHearSetupOptions } from '../components/TypeWhatYouHearSetup';
import { GravityGameSetupOptions } from '../components/GravityGameSetup';
import WordScrambleSetup from '../components/WordScrambleSetup';
import { WordScrambleSetupOptions } from '../components/WordScrambleSetup';
import { GameDataService } from '../lib/gameDataService';
import { ProgressTrackingService } from '../lib/progressTrackingService';
import { XPService } from '../lib/xpService';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import { FavouriteGamesService, FavouriteGame } from '../lib/favouriteGamesService';
import { GameStatisticsService } from '../lib/gameStatisticsService';
import { supabase } from '../lib/supabase';
import ConsistentHeader from '../components/ConsistentHeader';
import DailyChallengeSection from '../components/DailyChallengeSection';
import FavouritesSection from '../components/FavouritesSection';
import AllGamesSection from '../components/AllGamesSection';
import GameStatsSection from '../components/GameStatsSection';
import FlashcardQuizGame from '../components/games/FlashcardQuizGame';
import MemoryMatchGame from '../components/games/MemoryMatchGame';
import WordScrambleGame from '../components/games/WordScrambleGame';
import HangmanGame from '../components/games/HangmanGame';
import GravityGame from '../components/games/GravityGame';
import TypeWhatYouHearGame from '../components/games/TypeWhatYouHearGame';
import SentenceScrambleGame from '../components/games/SentenceScrambleGame';
import SpeedChallengeGame from '../components/games/SpeedChallengeGame';

const { width } = Dimensions.get('window');

export default function GamesScreen() {
  const screenId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  // console.log(`🎮 [${screenId}] GamesScreen component rendered`); // Debug logging disabled
  
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  
  // State for games and data
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    averageScore: 0,
    timeSpent: 0,
  });
  
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
  
  // Favourite games state
  const [favouriteGames, setFavouriteGames] = useState<FavouriteGame[]>([]);
  const [gameFavouriteStatus, setGameFavouriteStatus] = useState<{ [key: string]: boolean }>({});

  // Fetch flashcards and topics
  useEffect(() => {
    const fetchGameData = async () => {
      if (!user || !profile?.subjects?.[0]) return;
      
      try {
        const userSubject = profile.subjects[0];
        console.log('🎮 Fetching game data for subject:', userSubject);
        
        // Get user's flashcards filtered by subject
        const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
        const userCards = userFlashcards;
        
        // Only use user flashcards - general flashcards table no longer exists
        const allCards = userCards.filter(card => 
          card.front && card.back && card.topic
        );
        
        setFlashcards(allCards);
        
        // Get unique topics from user cards only
        const uniqueTopics = Array.from(new Set(allCards.map(card => card.topic)));
        setTopics(uniqueTopics);
        
        // Load favourite games
        await loadFavouriteGames();
        
        console.log('✅ Game data loaded:', {
          totalCards: allCards.length,
          topics: uniqueTopics.length,
          userCards: userCards.length
        });
        
        // Log sample cards
        if (userCards.length > 0) {
          console.log('📝 Sample user card:', userCards[0]);
        }
        
      } catch (error) {
        console.error('❌ Error fetching game data:', error);
        Alert.alert('Error', 'Failed to load game data. Please try again.');
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

  // Load favourite games
  const loadFavouriteGames = async () => {
    try {
      if (!user?.id) return;
      
      const { data: favourites, error } = await FavouriteGamesService.getUserFavouriteGames(user.id);
      if (error) throw error;
      
      if (favourites) {
        setFavouriteGames(favourites);
        
        // Update game favourite status
        const statusMap: { [key: string]: boolean } = {};
        favourites.forEach((game: FavouriteGame) => {
          statusMap[game.game_name] = true;
        });
        setGameFavouriteStatus(statusMap);
        
        console.log('✅ Favourite games loaded:', favourites.length);
      }
    } catch (error) {
      console.error('❌ Error loading favourite games:', error);
    }
  };

  // Load real game statistics
  const loadGameStatistics = async () => {
    try {
      if (!user?.id) return;
      
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
    }
  };

  // Refresh game statistics (call this after completing a game)
  const refreshGameStatistics = async () => {
    await loadGameStatistics();
  };

  // Toggle game favourite status
  const toggleGameFavourite = async (gameName: string, gameCategory: string) => {
    try {
      const isCurrentlyFavourite = gameFavouriteStatus[gameName];
      
      if (isCurrentlyFavourite) {
        // Remove from favourites
        if (!user?.id) return;
        await FavouriteGamesService.removeFavouriteGame(user.id, gameName, gameCategory);
        setGameFavouriteStatus(prev => ({ ...prev, [gameName]: false }));
        setFavouriteGames(prev => prev.filter(game => game.game_name !== gameName));
        console.log('❌ Removed from favourites:', gameName);
      } else {
        // Add to favourites
        if (!user?.id) return;
        const { data: newFavourite, error } = await FavouriteGamesService.createFavouriteGame(user.id, gameName, gameCategory);
        if (error) throw error;
        if (newFavourite) {
          setGameFavouriteStatus(prev => ({ ...prev, [gameName]: true }));
          setFavouriteGames(prev => [...prev, newFavourite]);
          console.log('❤️ Added to favourites:', gameName);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling favourite:', error);
      Alert.alert('Error', 'Failed to update favourites. Please try again.');
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
      case 'Type What You Hear': return 'ear';
      case 'Sentence Scramble': return 'document-text';
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
      case 'Type What You Hear': return 'Listening';
      case 'Sentence Scramble': return 'Grammar';
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
      case 'Type What You Hear': return startTypeWhatYouHear;
      case 'Sentence Scramble': return startSentenceScramble;
      default: return startFlashcardQuiz;
    }
  };

  // Game start functions
  const startFlashcardQuiz = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowFlashcardQuizSetup(true);
  };

  const startMemoryMatch = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowMemoryMatchSetup(true);
  };

  const startWordScramble = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowWordScrambleSetup(true);
  };

  const startHangman = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowHangmanSetup(true);
  };

  const startSpeedChallenge = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowSpeedChallengeSetup(true);
  };

  const startGravityGame = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowGravityGameSetup(true);
  };

  const startTypeWhatYouHear = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowTypeWhatYouHearSetup(true);
  };

  const startSentenceScramble = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowSentenceScrambleSetup(true);
  };

  // Setup completion handlers
  const handleFlashcardQuizSetupComplete = (options: FlashcardQuizSetupOptions) => {
    setShowFlashcardQuizSetup(false);
    setCurrentGame('Flashcard Quiz');
    setGameCompleted(false); // Reset completion flag
    completedGameIdsRef.current.clear(); // Clear completion tracking
    
    // Map language mode to GameDataService format
    const mappedLanguageMode = options.languageMode === 'native-to-target' ? 'question' : 
                              options.languageMode === 'target-to-native' ? 'answer' : 'question';
    
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
        Alert.alert('Cannot Start Game', validation.error || 'Invalid flashcard data');
        return;
      }
      
      setCurrentGame('Memory Match');
      const gameData = GameDataService.generateMemoryMatchQuestions(filteredFlashcards, options.cardCount / 2);
      setGameData(gameData);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error starting Memory Match:', error);
      Alert.alert('Error', 'Failed to start Memory Match game. Please try again.');
    }
  };

  const handleWordScrambleSetupComplete = (options: WordScrambleSetupOptions) => {
    try {
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
        Alert.alert('Cannot Start Game', validation.error || 'Invalid flashcard data');
        return;
      }
      
      setCurrentGame('Word Scramble');
      const gameData = GameDataService.generateScrambleQuestions(filteredFlashcards, options.wordCount);
      setGameData(gameData);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error starting Word Scramble:', error);
      Alert.alert('Error', 'Failed to start Word Scramble game. Please try again.');
    }
  };

  const handleSentenceScrambleSetupComplete = (options: SentenceScrambleSetupOptions) => {
    try {
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
        Alert.alert('Cannot Start Game', validation.error || 'Invalid flashcard data');
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
        Alert.alert('Cannot Start Game', validation.error || 'Invalid flashcard data');
        return;
      }
      
      setCurrentGame('Hangman');
      
      // Map difficulty from database format to game format
      let gameDifficulty: 'easy' | 'medium' | 'hard' | undefined;
      if (options.difficulty === 'beginner') gameDifficulty = 'easy';
      else if (options.difficulty === 'intermediate') gameDifficulty = 'medium';
      else if (options.difficulty === 'expert') gameDifficulty = 'hard';
      else gameDifficulty = undefined;
      
      const gameData = GameDataService.generateHangmanQuestions(filteredFlashcards, options.wordCount, gameDifficulty, options.maxGuesses);
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
        Alert.alert('Cannot Start Game', validation.error || 'Invalid flashcard data');
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
      
      console.log('🔍 Type What You Hear filtered flashcards:', {
        original: flashcards.length,
        filtered: filteredFlashcards.length,
        topic: options.selectedTopic,
        difficulty: options.difficulty
      });
      
      // Validate filtered flashcards
      const validation = GameDataService.validateFlashcards(filteredFlashcards, 'Type What You Hear');
      if (!validation.isValid) {
        Alert.alert('Cannot Start Game', validation.error || 'Invalid flashcard data');
        return;
      }
      
      setCurrentGame('Type What You Hear');
      
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
      console.error('Error starting Type What You Hear:', error);
      Alert.alert('Error', 'Failed to start Type What You Hear game. Please try again.');
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
        Alert.alert('Cannot Start Game', validation.error || 'Invalid flashcard data');
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

  // Handle game completion with aggressive debouncing
  const handleGameComplete = async (finalScore: number, timeSpent?: number, totalAnswered?: number) => {
    const completionId = Math.random().toString(36).substr(2, 9);
    const now = Date.now();
    
    try {
      console.log(`🎮 [${screenId}] [${completionId}] Game completed with finalScore:`, finalScore, 'timeSpent:', timeSpent, 'totalAnswered:', totalAnswered, 'currentGame:', currentGame, 'gameCompleted:', gameCompleted, 'timeSinceLastCompletion:', now - lastCompletionTimeRef.current);
      
      // NUCLEAR OPTION: Debounce all completions within 5 seconds
      if (now - lastCompletionTimeRef.current < 5000) {
        console.log(`🚫 [${screenId}] [${completionId}] NUCLEAR GUARD: Completion within 5 seconds, REJECTING`);
        return;
      }
      
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
        totalQuestions = totalAnswered || finalScore; // Use totalAnswered if provided, fallback to finalScore
        accuracyPercentage = totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0;
        maxScore = totalQuestions * 100; // 100 points per question answered
        
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

      await ProgressTrackingService.recordGameActivity({
        activityType: 'game',
        activityName: gameName,
        durationSeconds,
        score: Math.round((finalScore / totalQuestions) * maxScore),
        maxScore,
        accuracyPercentage,
        gameData,
      });

      console.log('✅ Game progress tracked successfully');

      // Award XP for completing the game
      if (user?.id) {
        try {
          const xpResult = await XPService.awardXP(
            user.id,
            'game',
            Math.round((finalScore / totalQuestions) * maxScore),
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

      // Update game stats (existing functionality)
    setGameStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      totalScore: prev.totalScore + finalScore,
      bestScore: Math.max(prev.bestScore, finalScore),
      averageScore: Math.round((prev.totalScore + finalScore) / (prev.gamesPlayed + 1)),
    }));
    } catch (error) {
      console.error('❌ Error tracking game progress:', error);
    }

    // Close game modal and show completion message
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    
    console.log(`✅ [${screenId}] [${completionId}] Game completion handling finished`);
    
    Alert.alert(
      'Game Complete! 🎉',
      `Final Score: ${finalScore}`,
      [{ text: 'OK' }]
    );
  };

  // Close game modal
  const closeGameModal = () => {
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
        return <FlashcardQuizGame {...gameProps} />;
      case 'Memory Match':
        return <MemoryMatchGame {...gameProps} />;
      case 'Word Scramble':
        return <WordScrambleGame {...gameProps} />;
      case 'Hangman':
        return <HangmanGame {...gameProps} />;
      case 'Speed Challenge':
        return <SpeedChallengeGame {...gameProps} />;
      case 'Planet Defense':
        return <GravityGame {...gameProps} />;
      case 'Type What You Hear':
        console.log(`🎧 [${screenId}] Creating TypeWhatYouHearGame component`);
        return <TypeWhatYouHearGame {...gameProps} />;
      case 'Sentence Scramble':
        return <SentenceScrambleGame {...gameProps} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConsistentHeader 
        pageName="Games"
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Challenge */}
        <DailyChallengeSection onPlay={() => startFlashcardQuiz()} />
        
        {/* Favourites */}
        <FavouritesSection 
          favorites={favouriteGames.map((game) => ({
            id: game.id,
            title: game.game_name,
            tag: getGameTag(game.game_name),
            cards: flashcards.length,
            progress: 0.4,
            icon: getGameIcon(game.game_name),
            isFavorite: true,
            onPlay: getGameOnPress(game.game_name)
          }))}
          onToggleFavorite={(id) => {
            const game = favouriteGames.find(g => g.id === id);
            if (game) {
              toggleGameFavourite(game.game_name, game.game_category);
            }
          }}
        />
        
        {/* All Games - 2x4 Grid */}
        <AllGamesSection 
          games={[
            { name: 'Flashcard Quiz', tag: 'Quiz', icon: 'help-circle', color: '#6366f1', bgColor: '#f0f4ff', onPress: startFlashcardQuiz },
            { name: 'Memory Match', tag: 'Memory', icon: 'grid', color: '#10b981', bgColor: '#f0fdf4', onPress: startMemoryMatch },
            { name: 'Word Scramble', tag: 'Puzzle', icon: 'text', color: '#16a34a', bgColor: '#f0fdf4', onPress: startWordScramble },
            { name: 'Hangman', tag: 'Word Game', icon: 'game-controller', color: '#8b5cf6', bgColor: '#f8fafc', onPress: startHangman },
            { name: 'Speed Challenge', tag: 'Speed', icon: 'timer', color: '#dc2626', bgColor: '#fef2f2', onPress: startSpeedChallenge },
            { name: 'Planet Defense', tag: 'Arcade', icon: 'planet', color: '#3b82f6', bgColor: '#dbeafe', onPress: startGravityGame },
            { name: 'Type What You Hear', tag: 'Listening', icon: 'ear', color: '#8b5cf6', bgColor: '#f3e8ff', onPress: startTypeWhatYouHear },
            { name: 'Sentence Scramble', tag: 'Grammar', icon: 'document-text', color: '#ec4899', bgColor: '#fdf2f8', onPress: startSentenceScramble },
          ].map((game) => ({
            id: game.name,
            title: game.name,
            tag: game.tag,
            cards: flashcards.length,
            progress: 0.2,
            icon: game.icon,
            isFavorite: gameFavouriteStatus[game.name] || false,
            onPlay: game.onPress
          }))}
          onToggleFavorite={(id) => {
            const game = [
              { name: 'Flashcard Quiz', tag: 'Quiz' },
              { name: 'Memory Match', tag: 'Memory' },
              { name: 'Word Scramble', tag: 'Puzzle' },
              { name: 'Hangman', tag: 'Word Game' },
              { name: 'Speed Challenge', tag: 'Speed' },
              { name: 'Planet Defense', tag: 'Arcade' },
              { name: 'Type What You Hear', tag: 'Listening' },
              { name: 'Sentence Scramble', tag: 'Grammar' },
            ].find(g => g.name === id);
            if (game) {
              toggleGameFavourite(game.name, game.tag);
            }
          }}
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

      {/* Game Modal */}
      <Modal
        visible={showGameModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeGameModal}
      >
        <SafeAreaView style={styles.gameModalContainer}>
          <View style={styles.gameModalHeader}>
            <TouchableOpacity onPress={closeGameModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.gameModalTitle}>{currentGame}</Text>
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
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#f8fafc',
  },
  gameModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  gameModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  gameModalContent: {
    flex: 1,
  },
});
