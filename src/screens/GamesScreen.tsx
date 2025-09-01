import React, { useState, useEffect } from 'react';
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
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import { FavouriteGamesService, FavouriteGame } from '../lib/favouriteGamesService';
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
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  
  // State for games and data
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
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
  });
  
  // Game state
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [selectedLanguageMode, setSelectedLanguageMode] = useState<'question' | 'answer'>('question');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [difficulties, setDifficulties] = useState([
    { id: 'beginner', name: 'Beginner', description: 'Easy', color: '#10b981' },
    { id: 'intermediate', name: 'Intermediate', description: 'Medium', color: '#f59e0b' },
    { id: 'advanced', name: 'Advanced', description: 'Hard', color: '#dc2626' },
  ]);
  
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
        
        // Get user's flashcards
        const userFlashcards = await UserFlashcardService.getUserFlashcards();
        const userCards = userFlashcards.filter((card: any) => 
          card.subject && card.subject.toLowerCase() === userSubject.toLowerCase()
        );
        
        // Get general flashcards
        const generalFlashcards = await FlashcardService.getAllFlashcards();
        const generalCards = generalFlashcards.filter((card: any) => 
          card.subject && card.subject.toLowerCase() === userSubject.toLowerCase()
        );
        
        // Combine and filter valid cards
        const allCards = [...userCards, ...generalCards].filter(card => 
          card.front && card.back && card.topic
        );
        
        setFlashcards(allCards);
        
        // Get unique topics
        const uniqueTopics = Array.from(new Set(allCards.map(card => card.topic)));
        setTopics(uniqueTopics);
        
        // Default to "All Topics" (empty string means all topics)
        setSelectedTopic('');
        
        // Load favourite games
        await loadFavouriteGames();
        
        console.log('✅ Game data loaded:', {
          totalCards: allCards.length,
          topics: uniqueTopics.length,
          userCards: userCards.length,
          generalCards: generalCards.length
        });
        
        // Log sample cards from each source
        if (userCards.length > 0) {
          console.log('📝 Sample user card:', userCards[0]);
        }
        if (generalCards.length > 0) {
          console.log('📝 Sample general card:', generalCards[0]);
        }
        
      } catch (error) {
        console.error('❌ Error fetching game data:', error);
        Alert.alert('Error', 'Failed to load game data. Please try again.');
      }
    };

    fetchGameData();
  }, [user, profile]);

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

  // Get filtered card count based on current selection
  const getFilteredCardCount = () => {
    let topicCards = flashcards;
    
    if (selectedTopic) {
      topicCards = topicCards.filter(card => card.topic === selectedTopic);
    }
    
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }
    
    // If current selection exceeds available cards, adjust to max available
    if (selectedQuestionCount > topicCards.length) {
      const maxAvailable = Math.max(5, Math.floor(topicCards.length / 5) * 5);
      setSelectedQuestionCount(Math.min(maxAvailable, topicCards.length));
    }
    
    return topicCards.length;
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
    setShowQuizSetup(true);
  };

  const startMemoryMatch = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Memory Match');
    setGameData({ flashcards: flashcards.slice(0, 12) });
    setShowGameModal(true);
  };

  const startWordScramble = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Word Scramble');
    setGameData({ flashcards: flashcards.slice(0, 10) });
    setShowGameModal(true);
  };

  const startHangman = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Hangman');
    setGameData({ flashcards: flashcards.slice(0, 10) });
    setShowGameModal(true);
  };

  const startSpeedChallenge = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Speed Challenge');
    setGameData({ flashcards: flashcards.slice(0, 20) });
    setShowGameModal(true);
  };

  const startGravityGame = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Planet Defense');
    setGameData({ flashcards: flashcards.slice(0, 15) });
    setShowGameModal(true);
  };

  const startTypeWhatYouHear = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Type What You Hear');
    setGameData({ flashcards: flashcards.slice(0, 10) });
    setShowGameModal(true);
  };

  const startSentenceScramble = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Sentence Scramble');
    setGameData({ flashcards: flashcards.slice(0, 10) });
    setShowGameModal(true);
  };

  // Handle game completion
  const handleGameComplete = (finalScore: number) => {
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    
    // Update game stats
    setGameStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      totalScore: prev.totalScore + finalScore,
      bestScore: Math.max(prev.bestScore, finalScore),
      averageScore: Math.round((prev.totalScore + finalScore) / (prev.gamesPlayed + 1)),
    }));
    
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
  };

  // Render game component based on current game
  const renderGameComponent = () => {
    if (!currentGame || !gameData) return null;

    const gameProps = {
      gameData,
      onClose: closeGameModal,
      onGameComplete: handleGameComplete,
      userProfile: profile,
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
        return <TypeWhatYouHearGame {...gameProps} />;
      case 'Sentence Scramble':
        return <SentenceScrambleGame {...gameProps} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            cards: getFilteredCardCount(),
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
            cards: getFilteredCardCount(),
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
            level: 1,
            xp: 40,
            nextLevelXp: 100
          }}
        />
      </ScrollView>
      
      {/* Quiz Setup Modal */}
      <Modal
        visible={showQuizSetup}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuizSetup(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuizSetup(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quiz Setup</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            {/* Topic Selection */}
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Select Topic</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowTopicDropdown(!showTopicDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedTopic || 'All Topics'}
                </Text>
                <Ionicons 
                  name={showTopicDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
              
              {showTopicDropdown && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedTopic('');
                      setShowTopicDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All Topics</Text>
                  </TouchableOpacity>
                  {topics.map((topic) => (
                    <TouchableOpacity 
                      key={topic}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedTopic(topic);
                        setShowTopicDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{topic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Difficulty Selection */}
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Select Difficulty</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedDifficulty || 'All Difficulties'}
                </Text>
                <Ionicons 
                  name={showDifficultyDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
              
              {showDifficultyDropdown && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDifficulty('');
                      setShowDifficultyDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All Difficulties</Text>
                  </TouchableOpacity>
                  {difficulties.map((difficulty) => (
                    <TouchableOpacity 
                      key={difficulty.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedDifficulty(difficulty.id);
                        setShowDifficultyDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{difficulty.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Question Count */}
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Number of Questions</Text>
              <View style={styles.questionCountContainer}>
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => setSelectedQuestionCount(Math.max(5, selectedQuestionCount - 5))}
                  disabled={selectedQuestionCount <= 5}
                >
                  <Ionicons name="remove" size={20} color="#64748b" />
                </TouchableOpacity>
                <Text style={styles.questionCountText}>{selectedQuestionCount}</Text>
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => setSelectedQuestionCount(Math.min(50, selectedQuestionCount + 5))}
                  disabled={selectedQuestionCount >= 50}
                >
                  <Ionicons name="add" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Language Mode */}
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Language Mode</Text>
              <View style={styles.languageModeContainer}>
                <TouchableOpacity 
                  style={[
                    styles.languageModeButton,
                    selectedLanguageMode === 'question' && styles.languageModeButtonActive
                  ]}
                  onPress={() => setSelectedLanguageMode('question')}
                >
                  <Text style={[
                    styles.languageModeButtonText,
                    selectedLanguageMode === 'question' && styles.languageModeButtonTextActive
                  ]}>
                    Question → Answer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.languageModeButton,
                    selectedLanguageMode === 'answer' && styles.languageModeButtonActive
                  ]}
                  onPress={() => setSelectedLanguageMode('answer')}
                >
                  <Text style={[
                    styles.languageModeButtonText,
                    selectedLanguageMode === 'answer' && styles.languageModeButtonTextActive
                  ]}>
                    Answer → Question
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Start Button */}
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => {
                setShowQuizSetup(false);
                startFlashcardQuiz();
              }}
            >
              <Text style={styles.startButtonText}>Start Quiz</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    backgroundColor: '#ffffff',
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
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
