import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { FlashcardService } from '../lib/flashcardService';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { ProgressTrackingService } from '../lib/progressTrackingService';
import { XPService } from '../lib/xpService';
import { AWSPollyService } from '../lib/awsPollyService';
import { supabase } from '../lib/supabase';
import { VoiceService } from '../lib/voiceService';
import ConsistentHeader from '../components/ConsistentHeader';
import { useTranslation } from '../lib/i18n';


const { width } = Dimensions.get('window');

export default function FlashcardsScreen() {
  const { t } = useTranslation();
  const { refreshTrigger } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [topics, setTopics] = useState<Array<{ id: string; name: string; icon: string; color: string; count: number }>>([]);
  const [difficulties] = useState([
    { id: 'all', name: t('difficulty.all'), color: '#6366f1', description: t('difficulty.allDescription') },
    { id: 'beginner', name: t('difficulty.beginner'), color: '#10b981', description: t('difficulty.beginnerDescription') },
    { id: 'intermediate', name: t('difficulty.intermediate'), color: '#f59e0b', description: t('difficulty.intermediateDescription') },
    { id: 'expert', name: t('difficulty.expert'), color: '#ef4444', description: t('difficulty.expertDescription') },
  ]);
  const [isLoading, setIsLoading] = useState(true);
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
    isActive: false,
    isComplete: false,
    flashcards: [],
    currentIndex: 0,
    showAnswer: false,
    answers: [],
    showNativeLanguage: false,
    startTime: null
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');
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
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [browseFlashcards, setBrowseFlashcards] = useState<any[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [realFlashcardStats, setRealFlashcardStats] = useState({
    totalCards: 0,
    averageAccuracy: 0,
    bestTopic: ''
  });


  const { user, profile } = useAuth();
  const navigation = useNavigation();

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

        // REMOVED: General flashcards table no longer exists - only use user flashcards
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

        // REMOVED: General flashcards table no longer exists - only use user flashcards
        totalCount = userFlashcards.length;
      }

      return totalCount;
    } catch (error) {
      console.error('Error calculating filtered card count:', error);
      return 0;
    }
  };

  // State for storing the filtered card count
  const [filteredCardCount, setFilteredCardCount] = useState<number>(0);

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

      // REMOVED: General flashcards table no longer exists - only use user flashcards
      const filteredGeneral: any[] = [];

      return userFlashcards.length + filteredGeneral.length;
    } catch (error) {
      console.error('Error calculating topic filtered count:', error);
      return 0;
    }
  };

  // State for storing topic-specific filtered counts
  const [topicFilteredCounts, setTopicFilteredCounts] = useState<{[key: string]: number}>({});

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

    // Auto-populate subject from user profile
  useEffect(() => {
    if (profile && profile.subjects && profile.subjects.length > 0) {
      setNewFlashcard(prev => ({
        ...prev,
        subject: profile.subjects[0] // Use the first subject from the user's profile
      }));
    }
  }, [profile]);

  // Fetch real topics from both databases, filtered by user's subject
  useEffect(() => {
    const fetchTopics = async () => {
      if (!user || !profile?.subjects || profile.subjects.length === 0) {
        console.log('⚠️ No user or subjects found');
        setTopics([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const userSubject = profile.subjects[0]; // Use the first subject from user's profile
        console.log('🔄 Fetching topics for user:', user.email, 'subject:', userSubject);
        
        // Get user's topics from user_flashcards, filtered by subject
        const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
        const userTopics = Array.from(new Set(userFlashcards.map(card => card.topic)));
        console.log('👤 User topics found:', userTopics);
        
        // REMOVED: General flashcards table no longer exists - only use user topics
        const allTopics = userTopics;
        console.log('🎯 Combined topics:', allTopics);
        
        if (allTopics.length === 0) {
          console.log('⚠️ No topics found for subject:', userSubject);
          setTopics([]);
          return;
        }
        
        // Create topic objects with real data
        const topicObjects = allTopics.map((topic, index) => {
          const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];
          const icons = ['medical-outline', 'construct-outline', 'nuclear-outline', 'leaf-outline', 'flask-outline', 'calculator-outline', 'book-outline', 'bulb-outline'];
          
          return {
            id: topic.toLowerCase().replace(/\s+/g, '-'),
            name: topic,
            icon: icons[index % icons.length],
            color: colors[index % colors.length],
            count: 0 // Will be updated with real counts
          };
        });
        
        console.log('🏷️ Created topic objects:', topicObjects.map(t => ({ id: t.id, name: t.name })));
        
        // Update counts for each topic
        for (const topic of topicObjects) {
          const userCount = await UserFlashcardService.getUserFlashcards({ 
            subject: userSubject,
            topic: topic.name 
          });
          // REMOVED: General flashcards table no longer exists
          topic.count = userCount.length;
          console.log(`📊 ${topic.name}: ${userCount.length} user cards`);
        }
       
        setTopics(topicObjects);
        console.log('✅ Topics set successfully:', topicObjects);
      } catch (error) {
        console.error('❌ Error fetching topics:', error);
        setTopics([]); // No fallback data - show empty state
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopics();
  }, [user, profile]);

  // Fetch real flashcard statistics when component mounts
  useEffect(() => {
    fetchRealFlashcardStats();
  }, [user]);

  // Refresh data when refreshTrigger changes (from global refresh context)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchRealFlashcardStats();
    }
  }, [refreshTrigger]);

  // Pull-to-refresh callback
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRealFlashcardStats();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh data when screen comes into focus (e.g., after saving flashcards)
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        if (user && profile?.subjects && profile.subjects.length > 0) {
          console.log('🔄 Screen focused - refreshing flashcards data...');
          await Promise.all([
            refreshTopics(),
            fetchRealFlashcardStats()
          ]);
        }
      };

      refreshData();
    }, [user, profile?.subjects])
  );

  // Refresh topics function that can be called after creating flashcards
  const refreshTopics = async () => {
    if (!user || !profile?.subjects || profile.subjects.length === 0) {
      console.log('⚠️ No user or subjects found for refresh');
      return;
    }
    
    console.log('🔄 Refreshing topics after flashcard creation...');
    const userSubject = profile.subjects[0];
    
    // Re-fetch topics to update counts, filtered by subject
    const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
    // REMOVED: General flashcards table no longer exists - only use user flashcards
    
    // Update existing topics with new counts
    setTopics(prevTopics => 
      prevTopics.map(topic => {
        const userCount = userFlashcards.filter(card => card.topic === topic.name).length;
        return {
          ...topic,
          count: userCount
        };
      })
    );
    console.log('✅ Topics refreshed with updated counts');
  };

  // Fetch real flashcard statistics
  const fetchRealFlashcardStats = async () => {
    if (!user) return;
    
    try {
      // Get total cards count
      const userFlashcards = await UserFlashcardService.getUserFlashcards({});
      // REMOVED: General flashcards table no longer exists - only use user flashcards
      const totalCards = userFlashcards.length;
      
      // Calculate average accuracy from progress table
      const { data: allProgress } = await supabase
        .from('user_flashcard_progress')
        .select('retention_score')
        .eq('user_id', user.id)
        .not('retention_score', 'is', null);
      
      const averageAccuracy = allProgress && allProgress.length > 0
        ? Math.round(allProgress.reduce((sum, p) => sum + p.retention_score, 0) / allProgress.length)
        : 0;
      
      // Find best topic based on accuracy
      const topicStats = await calculateTopicPerformance(userFlashcards);
      const bestTopic = topicStats.bestTopic || 'None';
      
      setRealFlashcardStats({
        totalCards,
        averageAccuracy,
        bestTopic
      });
    } catch (error) {
      console.error('Error fetching flashcard stats:', error);
      setRealFlashcardStats({
        totalCards: 0,
        averageAccuracy: 0,
        bestTopic: 'None'
      });
    }
  };

  // Calculate topic performance to find best topic
  const calculateTopicPerformance = async (userFlashcards: any[]) => {
    if (!user || userFlashcards.length === 0) {
      return { bestTopic: '' };
    }
    
    try {
      // Get progress data for all user flashcards
      const flashcardIds = userFlashcards.map(card => card.id);
      const { data: progressData } = await supabase
        .from('user_flashcard_progress')
        .select('flashcard_id, retention_score')
        .in('flashcard_id', flashcardIds)
        .not('retention_score', 'is', null);
      
      if (!progressData || progressData.length === 0) {
        return { bestTopic: '', weakestTopic: '' };
      }
      
      // Group by topic and calculate average accuracy
      const topicAccuracies: { [key: string]: { total: number; count: number; avg: number } } = {};
      
      userFlashcards.forEach(card => {
        const progress = progressData.find(p => p.flashcard_id === card.id);
        if (progress) {
          if (!topicAccuracies[card.topic]) {
            topicAccuracies[card.topic] = { total: 0, count: 0, avg: 0 };
          }
          topicAccuracies[card.topic].total += progress.retention_score;
          topicAccuracies[card.topic].count += 1;
        }
      });
      
      // Calculate averages and find best topic
      let bestTopic = '';
      let bestAvg = -1;
      
      Object.entries(topicAccuracies).forEach(([topic, stats]) => {
        const avg = stats.total / stats.count;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestTopic = topic;
        }
      });
      
      return { bestTopic };
    } catch (error) {
      console.error('Error calculating topic performance:', error);
      return { bestTopic: '' };
    }
  };

  // Update flashcard progress when user answers
  const updateFlashcardProgress = async (flashcardId: string, answer: 'correct' | 'incorrect' | 'easy' | 'hard') => {
    if (!user) return;
    
    try {
      // Use the new progress tracking service
      const isCorrect = answer === 'correct' || answer === 'easy';
      await ProgressTrackingService.updateFlashcardProgress({
        flashcardId,
        isCorrect,
        responseTime: 5, // Average 5 seconds per card
      });

      console.log('✅ Flashcard progress updated successfully');
    } catch (error) {
      console.error('❌ Error updating flashcard progress:', error);
    }
  };

     const getTopicIcon = (iconName: string) => {
     const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
       'medical-outline': 'medical-outline',
       'construct-outline': 'construct-outline',
       'nuclear-outline': 'nuclear-outline',
       'leaf-outline': 'leaf-outline',
       'flask-outline': 'flask-outline',
       'calculator-outline': 'calculator-outline',
       'book-outline': 'book-outline',
       'bulb-outline': 'bulb-outline',
     };
     return iconMap[iconName] || 'book-outline';
   };

   // Calculate estimated study time based on card count and difficulty
   const calculateStudyTime = (cardCount: number, difficulty: string): string => {
     if (cardCount === 0) return '0 min';
     
     // More accurate time per card in seconds
     const timePerCard = {
       'beginner': 4,      // 4 seconds per beginner card
       'intermediate': 6,  // 6 seconds per intermediate card
       'expert': 8,        // 8 seconds per expert card
       'all': 6            // Average of 6 seconds for mixed difficulty
     };
     
     // Get the time per card for the selected difficulty
     const secondsPerCard = timePerCard[difficulty as keyof typeof timePerCard] || 6;
     
     // Calculate total time in seconds
     const totalSeconds = cardCount * secondsPerCard;
     
     // Convert to minutes and round to nearest minute
     const totalMinutes = Math.round(totalSeconds / 60);
     
     // Format the output
     if (totalMinutes < 60) {
       return `${totalMinutes} min`;
     } else {
       const hours = Math.floor(totalMinutes / 60);
       const minutes = totalMinutes % 60;
       if (minutes === 0) {
         return `${hours}h`;
       } else {
         return `${hours}h ${minutes}m`;
       }
     }
   };

  // Start study session
  const startStudySession = async () => {
    if (!selectedTopic || !selectedDifficulty || !user || !profile?.subjects || profile.subjects.length === 0) return;
    
    try {
      let flashcards = [];
      const userSubject = profile.subjects[0];
      
      // Handle "all topics" selection
      if (selectedTopic === 'all-topics') {
        console.log('🔍 Starting study session for ALL topics at difficulty:', selectedDifficulty, 'subject:', userSubject);
        
        // Get user flashcards for all topics
        const userFlashcards = await UserFlashcardService.getUserFlashcards({
          subject: userSubject,
          difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty
        });
        
        console.log('👤 User flashcards found:', userFlashcards.length);
        
        // REMOVED: General flashcards table no longer exists - only use user flashcards
        const filteredGeneral: any[] = [];
       
        console.log('📚 General flashcards found:', filteredGeneral.length);
        
        // Combine flashcards
        flashcards = [...userFlashcards, ...filteredGeneral];
      } else {
        // Find the actual topic name from the selected topic ID
        const selectedTopicName = topics.find(t => t.id === selectedTopic)?.name;
        if (!selectedTopicName) {
          Alert.alert('Error', 'Selected topic not found.');
          return;
        }
        
        console.log('🔍 Starting study session for:', selectedTopicName, 'at difficulty:', selectedDifficulty, 'subject:', userSubject);
        
        // Get user flashcards
        const userFlashcards = await UserFlashcardService.getUserFlashcards({
          subject: userSubject,
          topic: selectedTopicName,
          difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty
        });
        
        console.log('👤 User flashcards found:', userFlashcards.length);
        
        // REMOVED: General flashcards table no longer exists - only use user flashcards
        const filteredGeneral: any[] = [];
       
        console.log('📚 General flashcards found:', filteredGeneral.length);
        
        // Combine flashcards
        flashcards = [...userFlashcards, ...filteredGeneral];
      }
      
      console.log('🎯 Total flashcards for study session:', flashcards.length);
      
      if (flashcards.length === 0) {
        Alert.alert('No Cards Available', 'No flashcards found for the selected topic and difficulty.');
        return;
      }
      
      // Shuffle flashcards
      flashcards = flashcards.sort(() => Math.random() - 0.5);
      
      // Use the language preference from the first flashcard, or default to false
      const defaultLanguagePreference = flashcards.length > 0 ? flashcards[0].show_native_language || false : false;
      
      setStudySession({
        isActive: true,
        isComplete: false,
        flashcards,
        currentIndex: 0,
        showAnswer: false,
        answers: [],
        showNativeLanguage: defaultLanguagePreference,
        startTime: new Date()
      });
    } catch (error) {
      console.error('Error starting study session:', error);
      Alert.alert('Error', 'Failed to start study session.');
    }
  };

  // Handle answer selection
  const handleAnswer = async (answer: 'correct' | 'incorrect') => {
    const newAnswers = [...studySession.answers, answer];
    
    // Update flashcard progress
    const currentCard = studySession.flashcards[studySession.currentIndex];
    if (currentCard && user) {
      await updateFlashcardProgress(currentCard.id, answer);
    }
    
    if (studySession.currentIndex + 1 >= studySession.flashcards.length) {
      // Session complete
      await endStudySession(newAnswers);
    } else {
      // Move to next card
      setStudySession(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        showAnswer: false,
        answers: newAnswers
      }));
    }
  };
  const endStudySession = async (answers: Array<'correct' | 'incorrect'>) => {
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
          activityName: `Flashcard Review - ${selectedTopic || 'All Topics'}`,
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
            `Flashcard Review - ${selectedTopic || 'All Topics'}`,
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
    console.log('🌐 Platform:', Platform.OS);
    
    // Stop any currently playing audio first
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        console.log('�� Stopped web speech synthesis');
      }
    } else {
      Speech.stop();
      console.log('🛑 Stopped mobile speech');
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

  // Load all flashcards for browsing
  const loadBrowseFlashcards = async () => {
    if (!user || !profile?.subjects || profile.subjects.length === 0) return;
    
    setBrowseLoading(true);
    try {
      console.log('📚 Loading all flashcards for browsing...');
      
      // Get all user flashcards
      const allUserFlashcards = await UserFlashcardService.getUserFlashcards({
        subject: profile.subjects[0] // Use the user's subject
      });
      
      console.log(`📚 Loaded ${allUserFlashcards.length} flashcards for browsing`);
      setBrowseFlashcards(allUserFlashcards);
      setShowBrowseModal(true);
      
    } catch (error) {
      console.error('❌ Error loading flashcards for browsing:', error);
      Alert.alert(
        'Error',
        'Failed to load flashcards. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setBrowseLoading(false);
    }
  };

  const deleteFlashcard = async (cardId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Flashcard',
      'Are you sure you want to delete this flashcard? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from user_flashcards table (this is the only table that exists)
              const { error: userFlashcardError } = await supabase
                .from('user_flashcards')
                .delete()
                .eq('id', cardId);

              if (userFlashcardError) {
                throw userFlashcardError;
              }

              // Remove from local state
              setBrowseFlashcards(prev => prev.filter(card => card.id !== cardId));
              
              Alert.alert('Success', 'Flashcard deleted successfully');
            } catch (error) {
              console.error('Error deleting flashcard:', error);
              Alert.alert('Error', 'Failed to delete flashcard');
            }
          },
        },
      ]
    );
  };

  // Start review session with all user flashcards
  const startReviewSession = async () => {
    if (!user || !profile?.subjects || profile.subjects.length === 0) return;
    
    try {
      console.log('🔄 Starting review session with all user flashcards...');
      
      // Get all user flashcards regardless of topic or difficulty
      const allUserFlashcards = await UserFlashcardService.getUserFlashcards({
        subject: profile.subjects[0] // Use the user's subject
      });
      
      if (!allUserFlashcards || allUserFlashcards.length === 0) {
        Alert.alert(
          'No Flashcards Found',
          'You don\'t have any flashcards yet. Create some flashcards first or upload notes to generate them with AI.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log(`📚 Found ${allUserFlashcards.length} flashcards for review`);
      
      // Start the study session with all flashcards
      // Use the language preference from the first flashcard, or default to false
      const defaultLanguagePreference = allUserFlashcards.length > 0 ? allUserFlashcards[0].show_native_language || false : false;
      
      setStudySession({
        isActive: true,
        isComplete: false,
        flashcards: allUserFlashcards,
        currentIndex: 0,
        showAnswer: false,
        answers: [],
        showNativeLanguage: defaultLanguagePreference,
        startTime: new Date(),
      });
      
    } catch (error) {
      console.error('❌ Error starting review session:', error);
      Alert.alert(
        'Error',
        'Failed to start review session. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Create new flashcard
  const createFlashcard = async () => {
    if (!user || !newFlashcard.topic || !newFlashcard.front || !newFlashcard.back || !newFlashcard.example) {
      Alert.alert('Error', 'Please fill in all required fields including the example.');
      return;
    }
    
    try {
      // If user is creating a new topic, use the newTopicInput value
      const finalTopic = showTopicInput ? newTopicInput : newFlashcard.topic;
      
      await UserFlashcardService.createUserFlashcard({
        ...newFlashcard,
        user_id: user.id, // Ensure user_id is set
        subject: profile?.subjects?.[0] || '', // Get subject from profile
        topic: finalTopic,
      });
      
      Alert.alert('Success', 'Flashcard created successfully!');
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
      
      // Refresh topics to update counts and incorporate new flashcard
      await refreshTopics();
      
      // Refresh flashcard statistics
      await fetchRealFlashcardStats();
      
      // If user has a topic selected, update the study session preview
      if (selectedTopic) {
        const updatedTopic = topics.find(t => t.id === selectedTopic);
        if (updatedTopic) {
          console.log('🔄 Updated topic count for study session:', updatedTopic.name, updatedTopic.count);
        }
      }
    } catch (error) {
      console.error('Error creating flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard.');
    }
  };

     // Show study session if active
   if (studySession.isActive) {
     const currentCard = studySession.flashcards[studySession.currentIndex];
     const progress = ((studySession.currentIndex + 1) / studySession.flashcards.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.studyHeader}>
           <View style={styles.studyHeaderTop}>
             <TouchableOpacity 
               style={styles.backButton}
               onPress={() => setStudySession(prev => ({ ...prev, isActive: false }))}
             >
               <Ionicons name="arrow-back" size={24} color="#6366f1" />
             </TouchableOpacity>
             <Text style={styles.studyTitle}>Study Session</Text>
             <View style={styles.progressContainer}>
               <Text style={styles.progressText}>
                 {studySession.currentIndex + 1} / {studySession.flashcards.length}
               </Text>
                               <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
                  <Ionicons name="language" size={20} color="#6366f1" />
                                     <Text style={styles.languageToggleText}>
                     {studySession.showNativeLanguage 
                       ? profile?.native_language || 'Native'
                       : 'EN'
                     }
                   </Text>
                </TouchableOpacity>
             </View>
           </View>
           <View style={styles.progressBar}>
             <View style={[styles.progressFill, { width: `${progress}%` }]} />
           </View>
         </View>
         
         <View style={styles.studyContent}>
           <View style={styles.flashcard}>
             <View style={styles.flashcardContent}>
                              <Text style={styles.flashcardText}>
                  {studySession.showAnswer 
                    ? (studySession.showNativeLanguage ? currentCard.front : currentCard.back)
                    : (studySession.showNativeLanguage ? currentCard.back : currentCard.front)
                  }
          </Text>
                              {/* Only show pronunciation and audio on target side */}
                              {currentCard.pronunciation && 
                               ((!studySession.showAnswer && !studySession.showNativeLanguage) || 
                                (studySession.showAnswer && studySession.showNativeLanguage)) && (
                  <View style={styles.pronunciationContainer}>
                    <Text style={styles.pronunciation}>{currentCard.pronunciation}</Text>
                                         <TouchableOpacity 
                        style={[styles.audioButton, isAudioPlaying && styles.audioButtonPlaying]} 
                        onPress={() => {
                          console.log('🎯 Audio button pressed for text:', currentCard.front);
                          console.log('📱 Current card:', currentCard);
                          playPronunciation(currentCard.front);
                        }}
                      >
                        <Ionicons 
                          name="volume-high" 
                          size={20} 
                          color={isAudioPlaying ? "#64748b" : "#6366f1"} 
                        />
                      </TouchableOpacity>
        </View>
                )}
               {/* Only show example on target side */}
               {currentCard.example && 
                ((!studySession.showAnswer && !studySession.showNativeLanguage) || 
                 (studySession.showAnswer && studySession.showNativeLanguage)) && (
                 <Text style={styles.example}>Example: {currentCard.example}</Text>
               )}
             </View>
             
             <TouchableOpacity 
               style={styles.flipButton}
               onPress={() => setStudySession(prev => ({ ...prev, showAnswer: !prev.showAnswer }))}
             >
               <Ionicons 
                 name={studySession.showAnswer ? "eye-off" : "eye"} 
                 size={24} 
                 color="#6366f1" 
               />
               <Text style={styles.flipButtonText}>
                 {studySession.showAnswer ? 'Show Question' : 'Show Answer'}
               </Text>
        </TouchableOpacity>
           </View>
           
           {studySession.showAnswer && (
             <View style={styles.answerButtons}>
               <TouchableOpacity 
                 style={[styles.answerButton, styles.correctButton]}
                 onPress={() => handleAnswer('correct')}
               >
                 <Ionicons name="checkmark" size={24} color="#10b981" />
                 <Text style={[styles.answerButtonText, styles.correctButtonText]}>Correct</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                 style={[styles.answerButton, styles.incorrectButton]}
                 onPress={() => handleAnswer('incorrect')}
               >
                 <Ionicons name="close" size={24} color="#ef4444" />
                 <Text style={[styles.answerButtonText, styles.incorrectButtonText]}>Incorrect</Text>
               </TouchableOpacity>
             </View>
           )}
         </View>
       </SafeAreaView>
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
       <SafeAreaView style={styles.container} edges={['top']}>
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
               <Text style={styles.reviewStatLabel}>Correct</Text>
             </View>
             <View style={styles.statItem}>
               <Ionicons name="close" size={24} color="#ef4444" />
               <Text style={styles.reviewStatNumber}>{studySession.answers.filter(a => a === 'incorrect').length}</Text>
               <Text style={styles.reviewStatLabel}>Incorrect</Text>
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
                 Correct ({correct})
               </Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.filterButton, filterType === 'incorrect' && styles.activeFilterButton]}
               onPress={() => setFilterType('incorrect')}
             >
               <Text style={[styles.filterButtonText, filterType === 'incorrect' && styles.activeFilterButtonText]}>
                 Incorrect ({total - correct})
               </Text>
             </TouchableOpacity>
           </View>
         </View>
         
         <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={false}>
           <Text style={styles.reviewSectionTitle}>
             {filterType === 'all' ? 'All Cards' : 
              filterType === 'correct' ? 'Correct Answers' : 'Incorrect Answers'} 
             ({filteredCount})
           </Text>
           
           {filteredFlashcards.map((card, index) => {
             const originalIndex = studySession.flashcards.indexOf(card);
             const answer = studySession.answers[originalIndex];
             const isCorrect = answer === 'correct';
             
             return (
               <View key={originalIndex} style={[styles.reviewCard, isCorrect ? styles.correctReviewCard : styles.incorrectReviewCard]}>
                 <View style={styles.reviewCardHeader}>
                   <Text style={styles.reviewCardNumber}>Card {originalIndex + 1}</Text>
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
                       <Text style={styles.reviewCardLabel}>Pronunciation:</Text>
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
                       <Text style={styles.reviewCardLabel}>Example:</Text>
                       <Text style={styles.reviewCardText}>{card.example}</Text>
                     </View>
                   )}
                 </View>
               </View>
             );
           })}
         </ScrollView>
         
                   <View style={styles.reviewActions}>
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
              <Ionicons name="refresh" size={24} color="#ffffff" />
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
              <Ionicons name="close-circle" size={24} color="#ffffff" />
              <Text style={styles.repeatIncorrectButtonText}>Repeat Incorrect</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backToSetupButton}
              onPress={async () => {
                setStudySession({
                  isActive: false,
                  isComplete: false,
                  flashcards: [],
                  currentIndex: 0,
                  showAnswer: false,
                  answers: [],
                  showNativeLanguage: false,
                  startTime: null
                });
                setSelectedTopic(null);
                setSelectedDifficulty(null);
                
                // Refresh flashcard statistics after study session
                await fetchRealFlashcardStats();
              }}
            >
              <Ionicons name="home" size={24} color="#6366f1" />
              <Text style={styles.backToSetupButtonText}>Back to Setup</Text>
            </TouchableOpacity>
          </View>
       </SafeAreaView>
     );
   }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConsistentHeader 
        pageName="Flashcards"
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Create Flashcard Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowCreateForm(!showCreateForm)}
            >
              <Ionicons name="add-circle" size={24} color="#6366f1" />
              <Text style={styles.sectionTitle}>{t('flashcards.createYourOwn')}</Text>
              <Ionicons 
                name={showCreateForm ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
          </View>
          
          {!showCreateForm ? (
            <>
              <Text style={styles.sectionDescription}>
                Add new flashcards to your personal collection
              </Text>
              <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateForm(true)}>
                <Ionicons name="add" size={24} color="#6366f1" />
                <Text style={styles.createButtonText}>Create New Flashcard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadNotesButton} onPress={() => navigation.navigate('Upload' as never)}>
                <Ionicons name="document-text" size={24} color="#10b981" />
                <Text style={styles.uploadNotesButtonText}>Upload Notes to Create Flashcards with AI</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.createForm}>
              {/* Topic selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Topic</Text>
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
                <Text style={styles.inputLabel}>{t('flashcardForm.front')} *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.front}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, front: text }))}
                  placeholder={t('flashcardForm.frontPlaceholder')}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Back Text Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('flashcardForm.back')} *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.back}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, back: text }))}
                  placeholder={t('flashcardForm.backPlaceholder')}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Example Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('flashcardForm.example')} *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.example}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, example: text }))}
                  placeholder={t('flashcardForm.examplePlaceholder')}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Pronunciation Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pronunciation (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newFlashcard.pronunciation}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, pronunciation: text }))}
                  placeholder="e.g., /kɑːrˈdiːə/ for 'cardiac'"
                />
              </View>

              {/* Difficulty Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Difficulty Level *</Text>
                <View style={styles.difficultyContainer}>
                  {['beginner', 'intermediate', 'expert'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyButton,
                        newFlashcard.difficulty === level && styles.selectedDifficulty,
                        { borderColor: level === 'beginner' ? '#10b981' : level === 'intermediate' ? '#f59e0b' : '#ef4444' }
                      ]}
                      onPress={() => setNewFlashcard(prev => ({ ...prev, difficulty: level as 'beginner' | 'intermediate' | 'expert' }))}
                    >
                      <Text style={[
                        styles.difficultyText,
                        newFlashcard.difficulty === level && styles.selectedDifficultyText,
                        { color: newFlashcard.difficulty === level ? '#ffffff' : level === 'beginner' ? '#10b981' : level === 'intermediate' ? '#f59e0b' : '#ef4444' }
                      ]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                  <Text style={styles.cancelFormButtonText}>{t('games.flashcardForm.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={createFlashcard}>
                  <Text style={styles.saveButtonText}>Create Flashcard</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Your Learning Journey Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Your Learning Journey</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="book" size={20} color="#6366f1" />
              </View>
              <Text style={styles.statNumber}>{realFlashcardStats.totalCards}</Text>
              <Text style={styles.statLabel}>Total Cards</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="trending-up" size={20} color="#06b6d4" />
              </View>
              <Text style={styles.statNumber}>{realFlashcardStats.averageAccuracy}%</Text>
              <Text style={styles.statLabel}>Avg Accuracy</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="trophy" size={20} color="#f59e0b" />
              </View>
              <Text 
                style={[
                  styles.statNumber,
                  {
                    fontSize: realFlashcardStats.bestTopic.length > 15 ? 16 : 
                             realFlashcardStats.bestTopic.length > 10 ? 18 : 20,
                    lineHeight: realFlashcardStats.bestTopic.length > 15 ? 20 : 
                               realFlashcardStats.bestTopic.length > 10 ? 22 : 24,
                  }
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {realFlashcardStats.bestTopic}
              </Text>
              <Text style={styles.statLabel}>Best Topic</Text>
            </View>
          </View>
        </View>

        {/* Review Flashcards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="library" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>{t('flashcards.reviewYourFlashcards')}</Text>
          </View>
          <Text style={styles.sectionDescription}>
            {t('flashcards.reviewDescription')}
          </Text>
          
          <View style={styles.reviewFlashcardsCard}>
            <View style={styles.reviewStatsRow}>
              <View style={styles.reviewStatItem}>
                <Ionicons name="book" size={20} color="#10b981" />
              <Text style={styles.reviewStatNumber}>{realFlashcardStats.totalCards}</Text>
              <Text style={styles.reviewStatLabel}>{t('flashcards.totalCards')}</Text>
            </View>
            <View style={styles.reviewStatItem}>
              <Ionicons name="bookmark" size={20} color="#6366f1" />
              <Text style={styles.reviewStatNumber}>{topics.length}</Text>
              <Text style={styles.reviewStatLabel}>{t('flashcards.topics')}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={() => {
                if (realFlashcardStats.totalCards > 0) {
                  // Start a review session with all user flashcards
                  startReviewSession();
                } else {
                  Alert.alert(
                    'No Flashcards Yet',
                    'You haven\'t created any flashcards yet. Create some flashcards first or upload notes to generate them with AI.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <Ionicons name="play-circle" size={24} color="#ffffff" />
              <Text style={styles.reviewButtonText}>
                {realFlashcardStats.totalCards > 0 ? 'Start Review Session' : 'No Cards to Review'}
              </Text>
            </TouchableOpacity>
            
            {realFlashcardStats.totalCards > 0 && (
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={loadBrowseFlashcards}
                disabled={browseLoading}
              >
                <Ionicons name="list" size={20} color="#6366f1" />
                <Text style={styles.browseButtonText}>Browse All Cards</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Unified Selection Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={24} color="#6366f1" />
            <Text style={styles.sectionTitle}>Study Configuration</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Configure your study session in one place
          </Text>
          
          <View style={styles.unifiedSelectionCard}>
            {/* Topic Selection Row */}
            <View style={styles.selectionRow}>
              <View style={styles.selectionLabel}>
                <Ionicons name="bookmark" size={20} color="#6366f1" />
                <Text style={styles.selectionLabelText}>Topic</Text>
              </View>
              <View style={styles.selectionContent}>
                {isLoading ? (
                  <Text style={styles.loadingText}>Loading...</Text>
                ) : topics.length === 0 ? (
                  <Text style={styles.emptyText}>No topics available</Text>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.compactDropdown,
                      selectedTopic && styles.selectedCompactDropdown
                    ]}
                    onPress={() => setShowTopicDropdown(!showTopicDropdown)}
                  >
                    <View style={styles.compactDropdownContent}>
                      {selectedTopic ? (
                        <>
                          {selectedTopic === 'all-topics' ? (
                            <>
                              <View style={[styles.compactIcon, { backgroundColor: '#8b5cf6' }]}>
                                <Ionicons name="layers" size={16} color="#ffffff" />
                              </View>
                              <Text style={styles.compactDropdownText}>{t('flashcardForm.allTopics')}</Text>
                            </>
                          ) : (
                            <>
                              <View style={[styles.compactIcon, { backgroundColor: topics.find(t => t.id === selectedTopic)?.color || '#6366f1' }]}>
                                <Ionicons 
                                  name={getTopicIcon(topics.find(t => t.id === selectedTopic)?.icon || 'book-outline')} 
                                  size={16} 
                                  color="#ffffff" 
                                />
                              </View>
                              <Text style={styles.compactDropdownText}>
                                {topics.find(t => t.id === selectedTopic)?.name}
                              </Text>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Ionicons name="chevron-down" size={16} color="#64748b" />
                          <Text style={styles.compactPlaceholder}>Select topic</Text>
                        </>
                      )}
                    </View>
                    <Ionicons 
                      name={showTopicDropdown ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Language Preference Row */}
            <View style={styles.selectionRow}>
              <View style={styles.selectionLabel}>
                <Ionicons name="language" size={20} color="#10b981" />
                <Text style={styles.selectionLabelText}>Language</Text>
              </View>
              <View style={styles.selectionContent}>
                <View style={styles.compactLanguageOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.compactLanguageOption, 
                      !studySession.showNativeLanguage && styles.selectedCompactLanguageOption
                    ]}
                    onPress={() => setStudySession(prev => ({ ...prev, showNativeLanguage: false }))}
                  >
                    <Ionicons name="flag" size={16} color="#3b82f6" />
                    <Text style={styles.compactLanguageText}>English Front</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.compactLanguageOption, 
                      studySession.showNativeLanguage && styles.selectedCompactLanguageOption
                    ]}
                    onPress={() => setStudySession(prev => ({ ...prev, showNativeLanguage: true }))}
                  >
                    <Ionicons name="globe" size={16} color="#10b981" />
                    <Text style={styles.compactLanguageText}>
                      {profile?.native_language || 'Native'} Front
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Difficulty Selection Row */}
            <View style={styles.selectionRow}>
              <View style={styles.selectionLabel}>
                <Ionicons name="trending-up" size={20} color="#f59e0b" />
                <Text style={styles.selectionLabelText}>Difficulty</Text>
              </View>
              <View style={styles.selectionContent}>
                <TouchableOpacity
                  style={[
                    styles.compactDropdown,
                    selectedDifficulty && styles.selectedCompactDropdown
                  ]}
                  onPress={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                >
                  <View style={styles.compactDropdownContent}>
                    {selectedDifficulty ? (
                      <>
                        <View style={[styles.compactIcon, { backgroundColor: difficulties.find(d => d.id === selectedDifficulty)?.color || '#6366f1' }]}>
                          <Ionicons name="trending-up" size={16} color="#ffffff" />
                        </View>
                        <Text style={styles.compactDropdownText}>
                          {difficulties.find(d => d.id === selectedDifficulty)?.name}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="chevron-down" size={16} color="#64748b" />
                        <Text style={styles.compactPlaceholder}>Select difficulty</Text>
                      </>
                    )}
                  </View>
                  <Ionicons 
                    name={showDifficultyDropdown ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#64748b" 
                  />
                </TouchableOpacity>

                {/* Difficulty Dropdown Options */}
                {showDifficultyDropdown && (
                  <View style={styles.compactDropdownOptions}>
                    {difficulties.map((difficulty) => (
                      <TouchableOpacity
                        key={difficulty.id}
                        style={[
                          styles.compactDropdownOption,
                          selectedDifficulty === difficulty.id && styles.selectedCompactDropdownOption
                        ]}
                        onPress={() => {
                          setSelectedDifficulty(difficulty.id);
                          setShowDifficultyDropdown(false);
                        }}
                      >
                        <View style={[styles.compactDropdownOptionIcon, { backgroundColor: difficulty.color }]}>
                          <Ionicons name="trending-up" size={18} color="#ffffff" />
                        </View>
                        <View style={styles.compactDropdownOptionContent}>
                          <Text style={styles.compactDropdownOptionText}>{difficulty.name}</Text>
                          <Text style={styles.compactDropdownOptionCount}>{difficulty.description}</Text>
                        </View>
                        {selectedDifficulty === difficulty.id && (
                          <Ionicons name="checkmark-circle" size={20} color={difficulty.color} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>



            {/* Topic Dropdown Options */}
            {showTopicDropdown && (
              <View style={styles.compactDropdownOptions}>
                <ScrollView 
                  style={styles.compactDropdownScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {/* All Topics Option */}
                  <TouchableOpacity
                    style={[
                      styles.compactDropdownOption,
                      selectedTopic === 'all-topics' && styles.selectedCompactDropdownOption
                    ]}
                    onPress={() => {
                      setSelectedTopic('all-topics');
                      setShowTopicDropdown(false);
                    }}
                  >
                    <View style={[styles.compactDropdownOptionIcon, { backgroundColor: '#8b5cf6' }]}>
                      <Ionicons name="layers" size={16} color="#ffffff" />
                    </View>
                    <View style={styles.compactDropdownOptionContent}>
                      <Text style={styles.compactDropdownOptionText}>{t('flashcardForm.allTopics')}</Text>
                      <Text style={styles.compactDropdownOptionCount}>
                        {selectedDifficulty && topicFilteredCounts['all-topics'] !== undefined
                          ? `${topicFilteredCounts['all-topics']} cards (${selectedDifficulty})`
                          : `${topics.reduce((total, topic) => total + topic.count, 0)} total cards`
                        }
                      </Text>
                    </View>
                    {selectedTopic === 'all-topics' && (
                      <Ionicons name="checkmark-circle" size={18} color="#8b5cf6" />
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.compactDropdownDivider} />

                  {/* Individual Topic Options */}
                  {topics.map((topic) => (
                    <TouchableOpacity
                      key={topic.id}
                      style={[
                        styles.compactDropdownOption,
                        selectedTopic === topic.id && styles.selectedCompactDropdownOption
                      ]}
                      onPress={() => {
                        setSelectedTopic(topic.id);
                        setShowTopicDropdown(false);
                      }}
                    >
                      <View style={[styles.compactDropdownOptionIcon, { backgroundColor: topic.color }]}>
                        <Ionicons 
                          name={getTopicIcon(topic.icon)} 
                          size={16} 
                          color="#ffffff" 
                        />
                      </View>
                      <View style={styles.compactDropdownOptionContent}>
                        <Text style={styles.compactDropdownOptionText}>{topic.name}</Text>
                        <Text style={styles.compactDropdownOptionCount}>
                          {selectedDifficulty && topicFilteredCounts[topic.name] !== undefined
                            ? `${topicFilteredCounts[topic.name]} cards (${selectedDifficulty})`
                            : `${topic.count} cards`
                          }
                        </Text>
                      </View>
                      {selectedTopic === topic.id && (
                        <Ionicons name="checkmark-circle" size={20} color={topic.color} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>



      </ScrollView>
      
      {/* Browse Flashcards Modal */}
      {showBrowseModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.browseModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Your Flashcards</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowBrowseModal(false)}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {browseLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading flashcards...</Text>
              </View>
            ) : browseFlashcards.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No flashcards found</Text>
                <Text style={styles.emptySubtext}>Create some flashcards or upload notes to generate them with AI</Text>
              </View>
            ) : (
              <ScrollView style={styles.browseContent} showsVerticalScrollIndicator={false}>
                {/* Group flashcards by topic */}
                {Object.entries(
                  browseFlashcards.reduce((acc, card) => {
                    const topic = card.topic || 'Uncategorized';
                    if (!acc[topic]) acc[topic] = [];
                    acc[topic].push(card);
                    return acc;
                  }, {} as Record<string, any[]>)
                ).map(([topic, cards]) => (
                  <View key={topic} style={styles.topicSection}>
                    <View style={styles.topicHeader}>
                      <Ionicons name="bookmark" size={20} color="#6366f1" />
                      <Text style={styles.topicTitle}>{topic}</Text>
                      <Text style={styles.topicCount}>({(cards as any[]).length} cards)</Text>
                    </View>
                    
                    {(cards as any[]).map((card: any, index: number) => (
                      <View key={card.id || index} style={styles.browseCard}>
                        <View style={styles.browseCardHeader}>
                          <Text style={styles.browseCardDifficulty}>
                            {card.difficulty?.charAt(0).toUpperCase() + card.difficulty?.slice(1) || 'Intermediate'}
                          </Text>
                          <View style={styles.browseCardActions}>
                            {card.pronunciation && (
                              <TouchableOpacity 
                                style={styles.browseAudioButton}
                                onPress={() => playPronunciation(card.front)}
                              >
                                <Ionicons name="volume-high" size={16} color="#6366f1" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                              style={styles.browseDeleteButton}
                              onPress={() => deleteFlashcard(card.id)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        <View style={styles.browseCardContent}>
                          <View style={styles.browseCardSide}>
                            <Text style={styles.browseCardLabel}>Front:</Text>
                            <Text style={styles.browseCardText}>{card.front}</Text>
                          </View>
                          <View style={styles.browseCardSide}>
                            <Text style={styles.browseCardLabel}>Back:</Text>
                            <Text style={styles.browseCardText}>{card.back}</Text>
                          </View>
                        </View>
                        
                        {card.example && (
                          <View style={styles.browseExample}>
                            <Text style={styles.browseCardLabel}>Example:</Text>
                            <Text style={styles.browseCardText}>{card.example}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
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
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
     sectionHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   collapsibleHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 22,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  topicCard: {
    width: (width - 52) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    minHeight: 180,
  },
  selectedTopicCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  topicIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  topicName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  topicCount: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  difficultyContainer: {
    gap: 12,
  },
  difficultyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedDifficultyCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  difficultyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 24,
  },
  previewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  previewHeader: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '500',
  },
  statsSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
    textAlign: 'center',
    flexShrink: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  // Study Session Styles
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Create Flashcard Styles
  createButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadNotesButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  uploadNotesButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createForm: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectedDifficultyButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyButtonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  difficultyButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDifficultyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Additional form styles
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  cancelFormButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cancelFormButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDifficulty: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  selectedDifficultyText: {
    color: '#ffffff',
  },
  // Study Session View Styles
  studyHeader: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  studyHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  studyContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  flashcard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 32,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 300,
  },
  flashcardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  flashcardText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 16,
  },
  pronunciation: {
    fontSize: 18,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  example: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  flipButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  answerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  answerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  easyButton: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  easyButtonText: {
    color: '#10b981',
  },
  correctButton: {
    backgroundColor: '#e0e7ff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  correctButtonText: {
    color: '#6366f1',
  },
  hardButton: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  hardButtonText: {
    color: '#f59e0b',
  },
  incorrectButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  incorrectButtonText: {
    color: '#ef4444',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1e293b',
  },
  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
  },
  

  // Language Toggle and Audio Styles
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  languageToggleText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pronunciationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  audioButton: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 20,
    marginLeft: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  audioButtonPlaying: {
    backgroundColor: '#e2e8f0',
    borderColor: '#64748b',
  },
  // Language Options Styles
  languageContainer: {
    gap: 12,
  },
  languageOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  selectedLanguageOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  languageOptionSubtext: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
     inputHelp: {
     fontSize: 14,
     color: '#64748b',
     fontStyle: 'italic',
     marginBottom: 16,
     textAlign: 'center',
   },
   
   // Review Session Styles
   reviewHeader: {
     backgroundColor: '#f8fafc',
     paddingHorizontal: 20,
     paddingVertical: 24,
     alignItems: 'center',
   },
   reviewTitle: {
     fontSize: 28,
     fontWeight: 'bold',
     color: '#1e293b',
     marginBottom: 8,
   },
   reviewSubtitle: {
    fontSize: 16,
    color: '#64748b',
     marginBottom: 24,
   },
   scoreContainer: {
     marginBottom: 24,
   },
   scoreCircle: {
     width: 120,
     height: 120,
     borderRadius: 60,
     backgroundColor: '#f0f9ff',
     borderWidth: 4,
     borderColor: '#6366f1',
     justifyContent: 'center',
     alignItems: 'center',
   },
   scorePercentage: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#6366f1',
     marginBottom: 4,
   },
   scoreText: {
     fontSize: 14,
     color: '#64748b',
     fontWeight: '500',
   },
   statsRow: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     width: '100%',
   },
   statItem: {
     alignItems: 'center',
     flex: 1,
   },
   reviewStatNumber: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#1e293b',
     marginTop: 8,
     marginBottom: 4,
   },
   reviewStatLabel: {
     fontSize: 12,
     color: '#64748b',
    textAlign: 'center',
  },
   reviewContent: {
     flex: 1,
     padding: 20,
   },
   reviewSectionTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#1e293b',
     marginBottom: 20,
   },
   reviewCard: {
     backgroundColor: '#f8fafc',
     borderRadius: 16,
     padding: 20,
     marginBottom: 16,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 8,
     elevation: 2,
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
     marginBottom: 16,
   },
   reviewCardNumber: {
     fontSize: 16,
     fontWeight: '600',
     color: '#64748b',
   },
   answerBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 12,
     backgroundColor: '#f1f5f9',
   },
   correctBadge: {
     backgroundColor: '#dcfce7',
   },
   incorrectBadge: {
     backgroundColor: '#fee2e2',
   },
   answerBadgeText: {
     fontSize: 12,
     fontWeight: '600',
     marginLeft: 4,
   },
   correctBadgeText: {
     color: '#10b981',
   },
   incorrectBadgeText: {
     color: '#ef4444',
   },
   reviewCardContent: {
     gap: 16,
   },
   reviewCardSide: {
     gap: 8,
   },
   reviewCardLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: '#64748b',
     textTransform: 'uppercase',
     letterSpacing: 0.5,
   },
   reviewCardText: {
     fontSize: 16,
     color: '#1e293b',
     lineHeight: 22,
   },
   reviewPronunciation: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 8,
   },
   reviewAudioButton: {
     backgroundColor: '#f1f5f9',
     padding: 8,
     borderRadius: 16,
     borderWidth: 2,
     borderColor: '#6366f1',
   },
   reviewExample: {
     gap: 8,
   },
       reviewActions: {
      flexDirection: 'row',
      padding: 20,
      gap: 8,
    },
   newSessionButton: {
     flex: 1,
     backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
     paddingVertical: 16,
     paddingHorizontal: 24,
     borderRadius: 12,
     shadowColor: '#6366f1',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 4,
   },
   newSessionButtonText: {
     color: '#ffffff',
     fontSize: 16,
     fontWeight: '600',
     marginLeft: 8,
   },
   backToSetupButton: {
     flex: 1,
     backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#6366f1',
     alignItems: 'center',
     justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
     borderRadius: 12,
  },
   backToSetupButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
     marginLeft: 8,
   },
   
   // Filter Controls Styles
   filterContainer: {
     backgroundColor: '#f8fafc',
     paddingHorizontal: 20,
     paddingVertical: 16,
   },
   filterTitle: {
     fontSize: 16,
     fontWeight: '600',
    color: '#1e293b',
     marginBottom: 12,
    textAlign: 'center',
  },
   filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
     gap: 8,
  },
   filterButton: {
    flex: 1,
     paddingVertical: 10,
     paddingHorizontal: 16,
     borderRadius: 8,
     backgroundColor: '#f1f5f9',
     borderWidth: 2,
     borderColor: '#e2e8f0',
    alignItems: 'center',
   },
   activeFilterButton: {
     backgroundColor: '#6366f1',
     borderColor: '#6366f1',
   },
   filterButtonText: {
     fontSize: 14,
     fontWeight: '500',
     color: '#64748b',
   },
   activeFilterButtonText: {
     color: '#ffffff',
   },
   
       // Repeat Button Styles
    repeatAllButton: {
      flex: 1,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
    repeatAllButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    repeatIncorrectButton: {
      flex: 1,
      backgroundColor: '#ef4444',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
         repeatIncorrectButtonText: {
       color: '#ffffff',
       fontSize: 16,
       fontWeight: '600',
       marginLeft: 8,
     },
     
     // Enhanced Create Flashcard Styles
     inputContainer: {
       marginBottom: 20,
     },
     inputLabel: {
       fontSize: 16,
       fontWeight: '600',
    color: '#1e293b',
       marginBottom: 8,
     },
     readOnlyInput: {
       backgroundColor: '#f8fafc',
       color: '#64748b',
     },
       createFormTopicSelectionContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
       createFormTopicDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
     topicDropdownText: {
       fontSize: 16,
       color: '#1e293b',
     },
     newTopicButton: {
       flexDirection: 'row',
       alignItems: 'center',
       paddingHorizontal: 16,
       paddingVertical: 12,
       borderWidth: 2,
       borderColor: '#6366f1',
       borderRadius: 8,
       backgroundColor: '#f8fafc',
     },
     newTopicButtonText: {
       color: '#6366f1',
    fontSize: 14,
       fontWeight: '600',
       marginLeft: 4,
     },
     newTopicInputContainer: {
       gap: 12,
     },
     newTopicActions: {
       flexDirection: 'row',
       gap: 12,
     },
     cancelNewTopicButton: {
       flex: 1,
       paddingVertical: 12,
       paddingHorizontal: 20,
       borderRadius: 8,
       backgroundColor: '#f1f5f9',
       alignItems: 'center',
     },
     cancelNewTopicButtonText: {
    color: '#64748b',
       fontSize: 14,
       fontWeight: '500',
     },
     confirmNewTopicButton: {
       flex: 1,
       paddingVertical: 12,
       paddingHorizontal: 20,
       borderRadius: 8,
       backgroundColor: '#10b981',
       alignItems: 'center',
     },
     confirmNewTopicButtonText: {
       color: '#ffffff',
       fontSize: 14,
       fontWeight: '500',
     },
     topicOptionsContainer: {
       marginTop: 8,
       gap: 8,
     },
     topicOption: {
       padding: 12,
       borderWidth: 1,
       borderColor: '#e2e8f0',
       borderRadius: 8,
       backgroundColor: '#f8fafc',
     },
     topicOptionText: {
       fontSize: 14,
       color: '#1e293b',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  mainTopicSelectionContainer: {
    gap: 16,
  },
  dropdownContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontWeight: '500',
    backgroundColor: '#f8fafc',
  },
  topicDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  selectedTopicDropdown: {
    backgroundColor: '#f8fafc',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedTopicIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    marginLeft: 12,
  },
  dropdownCountText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
  },
  dropdownOptions: {
    maxHeight: 300,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  selectedDropdownOption: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  dropdownOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dropdownOptionContent: {
    flex: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  dropdownOptionCount: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  unifiedSelectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  reviewFlashcardsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  reviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  reviewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  reviewButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  browseButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  browseButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
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
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  browseContent: {
    maxHeight: 400,
  },
  topicSection: {
    marginBottom: 20,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  browseCard: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  browseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  browseCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  browseAudioButton: {
    padding: 4,
  },
  browseDeleteButton: {
    padding: 4,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  browseCardContent: {
    marginBottom: 8,
  },
  browseCardSide: {
    marginBottom: 8,
  },
  browseCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  browseCardText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  browseExample: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  selectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    flexShrink: 0,
  },
  selectionLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  selectionContent: {
    flex: 1,
    marginLeft: 20,
    alignItems: 'stretch',
    width: 200,
  },
  compactDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    width: '100%',
  },
  selectedCompactDropdown: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  compactDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactDropdownText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    marginLeft: 6,
  },
  compactPlaceholder: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
  },
  compactLanguageOptions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  compactLanguageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  selectedCompactLanguageOption: {
    backgroundColor: '#f0f9ff',
    borderColor: '#6366f1',
  },
  compactLanguageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
    textAlign: 'center',
    flex: 1,
  },

  compactIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  compactDropdownOptions: {
    maxHeight: 300,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  compactDropdownScroll: {
    maxHeight: 300,
  },
  compactDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  selectedCompactDropdownOption: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  compactDropdownOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactDropdownOptionContent: {
    flex: 1,
  },
  compactDropdownOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  compactDropdownOptionCount: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  compactDropdownDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    marginVertical: 8,
  },


});

