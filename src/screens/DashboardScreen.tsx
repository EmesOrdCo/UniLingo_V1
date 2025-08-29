import React, { useState, useEffect, useMemo } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FlashcardsScreen from './FlashcardsScreen';
import GamesScreen from './GamesScreen';
import ProgressScreen from './ProgressScreen';

import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfileService } from '../lib/userProfileService';
import { supabase } from '../lib/supabase';
import UploadProgressModal from '../components/UploadProgressModal';
import DailyGoalsWidget from '../components/DailyGoalsWidget';

const Tab = createBottomTabNavigator();

// Lesson styles
const lessonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '400',
  },
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 8,
    fontWeight: '500',
  },
  subjectOptions: {
    marginTop: 12,
    gap: 8,
  },
  subjectOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  selectedSubjectOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  subjectOptionText: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedSubjectOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  lessonIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mainCreateButton: {
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
  // NEW: Lesson display styles - ADDED WITHOUT BREAKING EXISTING FUNCTIONALITY
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  lessonsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lessonInfo: {
    flex: 1,
    marginRight: 16,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 24,
  },
  lessonSubject: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  lessonActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  lessonDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
    flex: 1,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  lessonDate: {
    fontSize: 12,
    color: '#64748b',
  },
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});

// Main tab navigator component
function TabNavigator() {
  console.log('📱 TabNavigator rendering...');
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'grid';

          if (route.name === 'Overview') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Flashcards') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Games') {
            iconName = focused ? 'game-controller' : 'game-controller-outline'; 
          } else if (route.name === 'Lessons') {
            iconName = focused ? 'school' : 'school-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;        
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Overview" component={DashboardContent} />
      <Tab.Screen name="Flashcards" component={FlashcardsScreen} />
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen name="Lessons" component={LessonsTabWrapper} />
    </Tab.Navigator>
  );
}

// Lessons tab wrapper component
function LessonsTabWrapper() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('Medicine');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<any>({
    stage: 'uploading',
    progress: 0,
    message: 'Ready to create lesson',
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  
  // NEW: Lesson display state - ADDED WITHOUT BREAKING EXISTING FUNCTIONALITY
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonProgress, setLessonProgress] = useState<{ [key: string]: any }>({});
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const subjects = ['Medicine', 'Engineering', 'Law', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science'];
  
  // Get user's subject and native language from profile
  const userSubject = profile?.subjects?.[0] || selectedSubject;
  const userNativeLanguage = profile?.native_language || 'English';
  
  // NEW: Load lessons on component mount - ADDED WITHOUT BREAKING EXISTING FUNCTIONALITY
  useEffect(() => {
    if (user?.id) {
      loadLessons();
    }
  }, [user?.id]);
  
  // NEW: Load lessons function - ADDED WITHOUT BREAKING EXISTING FUNCTIONALITY
  const loadLessons = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingLessons(true);
      const { LessonService } = await import('../lib/lessonService');
      const userLessons = await LessonService.getUserLessons(user.id);
      setLessons(userLessons);

      // Load progress for each lesson
      const progressData: { [key: string]: any } = {};
      for (const lesson of userLessons) {
        const progress = await LessonService.getLessonProgress(user.id, lesson.id);
        if (progress) {
          progressData[lesson.id] = progress;
        }
      }
      setLessonProgress(progressData);

    } catch (err) {
      setError('Failed to load lessons');
      console.error('Error loading lessons:', err);
    } finally {
      setLoadingLessons(false);
    }
  };
  
  // NEW: Refresh lessons function - ADDED WITHOUT BREAKING EXISTING FUNCTIONALITY
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLessons();
    setRefreshing(false);
  };
  
  // NEW: Handle lesson press - ADDED WITHOUT BREAKING EXISTING FUNCTIONALITY
  const handleLessonPress = (lesson: any) => {
    (navigation as any).navigate('NewLessonViewer', { lessonId: lesson.id });
  };
  
  // NEW: Handle delete lesson - ADDED WITHOUT BREAKING EXISTING FUNCTIONALITY
  const handleDeleteLesson = (lesson: any) => {
    Alert.alert(
      'Delete Lesson',
      `Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { LessonService } = await import('../lib/lessonService');
              await LessonService.deleteLesson(lesson.id);
              // Remove from local state
              setLessons(prev => prev.filter(l => l.id !== lesson.id));
              setLessonProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[lesson.id];
                return newProgress;
              });
              Alert.alert('Success', 'Lesson deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete lesson');
              console.error('Error deleting lesson:', err);
            }
          }
        }
      ]
    );
  };
  
  // NEW: Progress helper functions - ADDED WITHOUT BREAKING EXISTING FUNCTIONALITY
  const getProgressPercentage = (lessonId: string): number => {
    const progress = lessonProgress[lessonId];
    if (!progress) return 0;
    
    if (progress.max_possible_score === 0) return 0;
    return Math.round((progress.total_score / progress.max_possible_score) * 100);
  };

  const getProgressStatus = (lessonId: string): string => {
    const progress = lessonProgress[lessonId];
    if (!progress) return 'Not Started';
    
    if (progress.status === 'completed') return 'Completed';
    if (progress.status === 'in_progress') return 'In Progress';
    return 'Not Started';
  };

  const getProgressColor = (lessonId: string): string => {
    const progress = lessonProgress[lessonId];
    if (!progress) return '#64748b';
    
    if (progress.status === 'completed') return '#10b981';
    if (progress.status === 'in_progress') return '#f59e0b';
    return '#64748b';
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'expert': return '#ef4444';
      default: return '#64748b';
    }
  };
  
  const handleCreateLesson = async () => {
    // EXACT COPY FROM UPLOADSCREEN handleFilePick - NO TOPIC REQUIREMENT
    console.log('🚀 handleCreateLesson called!');
    
    if (!user) {
      console.log('❌ No user found');
      Alert.alert('Error', 'You must be logged in to create lessons.');
      return;
    }

    console.log('✅ User found:', user.id);
    console.log('✅ Profile:', profile);

    try {
      // Import services first
      console.log('📦 Importing services...');
      const { UploadService } = await import('../lib/uploadService');
      const { LessonService } = await import('../lib/lessonService');
      console.log('✅ Services imported successfully');

      // FORCE RESET THE STUCK PICKER FIRST
      console.log('🔄 Force resetting picker state...');
      try {
        (UploadService as any).forceResetPicker();
        console.log('✅ Picker state reset');
      } catch (e) {
        console.log('⚠️ Reset failed, continuing anyway');
      }

      // PICK PDF FILE FIRST - NO PROGRESS MODAL YET
      console.log('📄 Using direct DocumentPicker...');
      let result: any;
      try {
        console.log('📄 DocumentPicker imported:', typeof DocumentPicker);
        console.log('📄 DocumentPicker.getDocumentAsync:', typeof DocumentPicker.getDocumentAsync);
        
        // Add timeout to prevent hanging
        const pickerPromise = DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
          multiple: false,
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Document picker timeout')), 30000)
        );
        
        result = await Promise.race([pickerPromise, timeoutPromise]);
        console.log('📄 Direct DocumentPicker result:', result);
      } catch (pickerError) {
        console.error('PDF picker failed:', pickerError);
        
        // Show specific error message for picker failures
        let pickerErrorMessage = 'Failed to select PDF file';
        let showAlternatives = false;
        
        if (pickerError instanceof Error) {
          if (pickerError.message.includes('already in use') || 
              pickerError.message.includes('Different document picking in progress')) {
            pickerErrorMessage = 'Document picker is busy. Please close any open file dialogs and try again.';
            showAlternatives = true;
          } else if (pickerError.message.includes('permission')) {
            pickerErrorMessage = 'Permission denied. Please ensure the app has access to your files.';
            showAlternatives = true;
          } else {
            pickerErrorMessage = pickerError.message;
            showAlternatives = true;
          }
        }
        
        Alert.alert(
          'PDF Selection Failed',
          pickerErrorMessage,
          [
            { text: 'Try Again', style: 'default' },
            { text: showAlternatives ? 'Use Alternative' : 'OK', style: 'cancel' }
          ]
        );
        return;
      }
      
      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error('No file selected');
      }

      const file = result.assets[0];
      console.log('📄 Selected file:', file);
      
      // Validate the selected file (since we bypassed UploadService validation)
      if (!file.name || !file.name.toLowerCase().endsWith('.pdf')) {
        console.log('❌ Invalid file type:', file.name);
        Alert.alert('Invalid File', 'Please select a PDF file (.pdf extension).');
        return;
      }
      console.log('✅ File validation passed');
      
      // NOW show progress modal AFTER file is successfully picked
      setIsProcessing(true);
      setShowProgressModal(true);
      
      // Add safety timeout to prevent indefinite freezing
      const safetyTimeout = setTimeout(() => {
        console.log('⚠️ Safety timeout triggered - lesson creation taking longer than expected');
        
        // Stop the entire process
        setIsProcessing(false);
        setShowProgressModal(false);
        setProgress({
          stage: 'error',
          progress: 0,
          message: 'Lesson creation timed out. The process has been stopped.',
        });
        
        Alert.alert(
          'Creation Timeout',
          'The lesson creation process has been stopped due to timeout. This may happen with very large files or complex content. Please try with a smaller file or try again.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }, 600000); // 10 minute timeout to allow for AI processing
      
      setProgress({
        stage: 'uploading',
        progress: 30,
        message: `File selected: ${file.name}, processing PDF...`,
      });

      // Extract text from PDF
      setProgress({
        stage: 'processing',
        progress: 40,
        message: 'Extracting text from PDF...',
      });
      
      console.log('Starting text extraction...');
      const extractedText = await UploadService.extractTextFromPDF(file.uri);
      console.log('Text extraction completed, length:', extractedText.length);
      
      setProgress({
        stage: 'processing',
        progress: 50,
        message: 'Text extracted, preparing for AI analysis...',
      });

      // Generate lesson with AI
      console.log('Starting AI lesson generation...');
      setProgress({
        stage: 'generating',
        progress: 60,
        message: 'Connecting to AI service...',
      });
      
      setProgress({
        stage: 'generating',
        progress: 65,
        message: 'Analyzing content and creating interactive lesson...',
      });
      
      // Ensure progress modal stays visible during AI generation
      setShowProgressModal(true);
      
      setProgress({
        stage: 'generating',
        progress: 70,
        message: 'AI is now analyzing your content and creating lesson...',
      });
      
      const lesson = await LessonService.generateLessonFromPDF(
        extractedText,
        file.name,
        user.id,
        userNativeLanguage,
        userSubject
      );
      
      if (!lesson) {
        throw new Error('Failed to generate lesson');
      }
      
      console.log('AI lesson generation completed:', lesson.id);
      
      setProgress({
        stage: 'generating',
        progress: 80,
        message: `Generated interactive lesson!`,
      });

      // Save lesson data is handled by LessonService
      setProgress({
        stage: 'processing',
        progress: 85,
        message: 'Saving lesson to database...',
      });

      setProgress({
        stage: 'complete',
        progress: 100,
        message: `Successfully created interactive lesson!`,
      });
      
      console.log('Lesson creation complete, waiting for user action...');
      
      setGeneratedLesson(lesson);
      
      // Clear safety timeout on success
      clearTimeout(safetyTimeout);
      
      // Show success alert after a brief delay
      setTimeout(() => {
        setShowProgressModal(false);
        setIsProcessing(false);
        
        Alert.alert(
          'Lesson Created!',
          'Your interactive lesson has been generated successfully.',
          [
            {
              text: 'View Lesson',
              onPress: () => (navigation as any).navigate('NewLessonViewer', { lessonId: lesson.id }),
            },
            {
              text: 'Create Another',
              style: 'cancel',
              onPress: () => {
                setGeneratedLesson(null);
                setProgress({ stage: 'uploading', progress: 0, message: 'Ready to create lesson' });
              },
            },
          ]
        );
      }, 1000);

    } catch (error) {
      console.error('Error creating lesson:', error);
      
      // Show user-friendly error message
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Enhance error message for better user guidance
      if (errorMessage.includes('Document picker is busy')) {
        errorMessage = 'Document picker is busy. Please close any open file dialogs and try again.';
      } else if (errorMessage.includes('Different document picking in progress')) {
        errorMessage = 'Document picker is busy. Please wait for any other file operations to complete.';
      } else if (errorMessage.includes('Please select a PDF file')) {
        errorMessage = 'Please select a valid PDF file (.pdf extension).';
      } else if (errorMessage.includes('No file selected')) {
        errorMessage = 'No file was selected. Please choose a PDF file to upload.';
      } else if (errorMessage.includes('PDF file not found')) {
        errorMessage = 'The selected PDF file could not be accessed. Please select it again.';
      } else if (errorMessage.includes('Failed to extract text from PDF')) {
        errorMessage = 'Unable to read the content from the PDF. The file may be corrupted or password-protected.';
      } else if (errorMessage.includes('OpenAI API key not configured')) {
        errorMessage = 'AI service is not configured. Please check your OpenAI API key.';
      } else if (errorMessage.includes('Failed to generate')) {
        errorMessage = 'AI service encountered an error. Please check your internet connection and try again.';
      }
      
      setProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage,
      });
      
      // Don't show alert - let the enhanced progress modal handle it
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={lessonStyles.container}>
      <View style={lessonStyles.header}>
        <Text style={lessonStyles.headerTitle}>My Lessons</Text>
        <TouchableOpacity 
          style={lessonStyles.createButton}
          onPress={() => {
            console.log('🔘 + Button pressed!');
            handleCreateLesson();
          }}
          disabled={isProcessing}
        >
          <Ionicons name="add" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={lessonStyles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loadingLessons ? (
          <View style={lessonStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={lessonStyles.loadingText}>Loading lessons...</Text>
          </View>
        ) : error ? (
          <View style={lessonStyles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
            <Text style={lessonStyles.errorText}>{error}</Text>
            <TouchableOpacity style={lessonStyles.retryButton} onPress={loadLessons}>
              <Text style={lessonStyles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (lessons || []).length === 0 ? (
          <View style={lessonStyles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#cbd5e1" />
            <Text style={lessonStyles.emptyTitle}>No Lessons Yet</Text>
            <Text style={lessonStyles.emptyText}>
              Upload a PDF to create your first lesson and start learning English terminology!
            </Text>
            
            {/* AI-Powered English Lessons Section */}
            <View style={lessonStyles.card}>
              <Text style={lessonStyles.cardTitle}>AI-Powered English Lessons</Text>
              <Text style={lessonStyles.cardDescription}>
                Upload your course notes and let AI create an interactive, Duolingo-style lesson that teaches English terminology from your subject. Perfect for non-native speakers learning subject-specific English vocabulary.
              </Text>
            </View>

            {/* Select Subject/Topic Section */}
            <View style={lessonStyles.card}>
              <Text style={lessonStyles.cardTitle}>Select Subject/Topic</Text>
              <TouchableOpacity 
                style={lessonStyles.subjectSelector}
                onPress={() => setShowSubjectPicker(!showSubjectPicker)}
              >
                <View style={lessonStyles.subjectContent}>
                  <Ionicons name="school" size={20} color="#6366f1" />
                  <Text style={lessonStyles.subjectText}>{selectedSubject}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>
              
              {showSubjectPicker && (
                <View style={lessonStyles.subjectOptions}>
                  {(subjects || []).map((subject) => (
                    <TouchableOpacity
                      key={subject}
                      style={[
                        lessonStyles.subjectOption,
                        selectedSubject === subject && lessonStyles.selectedSubjectOption
                      ]}
                      onPress={() => {
                        setSelectedSubject(subject);
                        setShowSubjectPicker(false);
                      }}
                    >
                      <Text style={[
                        lessonStyles.subjectOptionText,
                        selectedSubject === subject && lessonStyles.selectedSubjectOptionText
                      ]}>
                        {subject}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Create Your Lesson Section */}
            <View style={lessonStyles.card}>
              <View style={lessonStyles.lessonIconContainer}>
                <Ionicons name="school" size={64} color="#6366f1" />
              </View>
              <Text style={lessonStyles.cardTitle}>Create Your Lesson</Text>
              <Text style={lessonStyles.cardDescription}>
                Upload PDF course notes to generate an interactive English lesson
              </Text>
              <TouchableOpacity 
                style={[
                  lessonStyles.mainCreateButton,
                  isProcessing && { opacity: 0.6 }
                ]} 
                onPress={() => {
                  console.log('🔘 Button pressed!');
                  handleCreateLesson();
                }}
                disabled={isProcessing}
              >
                <Ionicons name="document" size={20} color="#ffffff" />
                <Text style={lessonStyles.createButtonText}>
                  {isProcessing ? 'Processing...' : 'Choose PDF File'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={lessonStyles.lessonsContainer}>
            {(lessons || []).map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={lessonStyles.lessonCard}
                onPress={() => handleLessonPress(lesson)}
              >
                {/* Lesson Header */}
                <View style={lessonStyles.lessonHeader}>
                  <View style={lessonStyles.lessonInfo}>
                    <Text style={lessonStyles.lessonTitle} numberOfLines={2}>
                      {lesson.title}
                    </Text>
                    <Text style={lessonStyles.lessonSubject}>{lesson.subject}</Text>
                  </View>
                  <View style={lessonStyles.lessonActions}>
                    <TouchableOpacity
                      style={lessonStyles.deleteButton}
                      onPress={() => handleDeleteLesson(lesson)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Lesson Details */}
                <View style={lessonStyles.lessonDetails}>
                  <View style={lessonStyles.detailRow}>
                    <View style={lessonStyles.detailItem}>
                      <Ionicons name="time-outline" size={16} color="#64748b" />
                      <Text style={lessonStyles.detailText}>
                        {formatDuration(lesson.estimated_duration)}
                      </Text>
                    </View>
                    <View style={lessonStyles.detailItem}>
                      <Ionicons name="trending-up-outline" size={16} color="#64748b" />
                      <Text style={[
                        lessonStyles.detailText,
                        { color: getDifficultyColor(lesson.difficulty_level) }
                      ]}>
                        {lesson.difficulty_level.charAt(0).toUpperCase() + lesson.difficulty_level.slice(1)}
                      </Text>
                    </View>
                    <View style={lessonStyles.detailItem}>
                      <Ionicons name="document-outline" size={16} color="#64748b" />
                      <Text style={lessonStyles.detailText} numberOfLines={1}>
                        {lesson.source_pdf_name}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Section */}
                <View style={lessonStyles.progressSection}>
                  <View style={lessonStyles.progressHeader}>
                    <Text style={lessonStyles.progressLabel}>Progress</Text>
                    <Text style={[
                      lessonStyles.progressStatus,
                      { color: getProgressColor(lesson.id) }
                    ]}>
                      {getProgressStatus(lesson.id)}
                    </Text>
                  </View>
                  
                  <View style={lessonStyles.progressBar}>
                    <View 
                      style={[
                        lessonStyles.progressFill, 
                        { 
                          width: `${getProgressPercentage(lesson.id)}%`,
                          backgroundColor: getProgressColor(lesson.id)
                        }
                      ]} 
                    />
                  </View>
                  
                  <Text style={lessonStyles.progressText}>
                    {getProgressPercentage(lesson.id)}% Complete
                  </Text>
                </View>

                {/* Lesson Footer */}
                <View style={lessonStyles.lessonFooter}>
                  <Text style={lessonStyles.lessonDate}>
                    Created {new Date(lesson.created_at).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity 
                    style={lessonStyles.startButton}
                    onPress={() => handleLessonPress(lesson)}
                  >
                    <Text style={lessonStyles.startButtonText}>
                      {getProgressStatus(lesson.id) === 'Not Started' ? 'Start' : 'Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload Progress Modal */}
      <UploadProgressModal
        visible={showProgressModal}
        progress={progress}
        onClose={() => {
          setShowProgressModal(false);
          setIsProcessing(false);
        }}
      />
    </SafeAreaView>
  );
}

// Dashboard content component (the actual dashboard view)
function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [screenWidth, setScreenWidth] = useState(400);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({
    topic: '',
    front: '',
    back: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'expert',
    example: '',
    pronunciation: '',
    tags: [] as string[],
    native_language: 'english'
  });
  const [topics, setTopics] = useState<Array<{ id: string; name: string; icon: string; color: string; count: number }>>([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  
  // Settings state
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFAQsModal, setShowFAQsModal] = useState(false);
  
  // Edit Profile and Change Password state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    native_language: '',
    subject: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'expert'
  });
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const navigation = useNavigation();
  const { user, signOut, profile, refreshProfile } = useAuth();

  useEffect(() => {
    const { width } = Dimensions.get('window');
    setScreenWidth(width || 400);
  }, []);

  // Fetch topics filtered by user's subject with proper card counting
  useEffect(() => {
    const fetchTopics = async () => {
      if (!user || !profile?.subjects?.[0]) return;
      
      try {
        const userSubject = profile.subjects[0];
        console.log('🔍 Fetching topics for subject:', userSubject);
        
        // Get user's topics from user_flashcards filtered by subject
        const userFlashcards = await UserFlashcardService.getUserFlashcards() || [];
        console.log('👤 User flashcards found:', userFlashcards.length);
        
        // Get general flashcards topics filtered by subject
        const generalFlashcards = await FlashcardService.getAllFlashcards() || [];
        console.log('📚 General flashcards found:', generalFlashcards.length);
        
        // Filter flashcards by subject
        const userFlashcardsFiltered = (userFlashcards || []).filter(card => 
          card.subject && card.subject.toLowerCase() === userSubject.toLowerCase()
        );
        const generalFlashcardsFiltered = (generalFlashcards || []).filter(card => 
          card.subject && card.subject.toLowerCase() === userSubject.toLowerCase()
        );
        
        console.log('🔍 Filtered user flashcards:', userFlashcardsFiltered.length);
        console.log('🔍 Filtered general flashcards:', generalFlashcardsFiltered.length);
        
        // Get unique topics from both sources
        const userTopics = Array.from(new Set((userFlashcardsFiltered || []).map(card => card.topic)));
        const generalTopics = Array.from(new Set((generalFlashcardsFiltered || []).map(card => card.topic)));
        const allTopics = Array.from(new Set([...userTopics, ...generalTopics]));
        
        console.log('🎯 Found topics for subject:', userSubject, ':', allTopics);
        
        if (allTopics.length === 0) {
          console.log('⚠️ No topics found for subject:', userSubject);
          setTopics([]);
          return;
        }
        
        // Count flashcards for each topic
        const topicCounts = new Map<string, number>();
        
        // Count user flashcards
        userFlashcardsFiltered.forEach(card => {
          const currentCount = topicCounts.get(card.topic) || 0;
          topicCounts.set(card.topic, currentCount + 1);
        });
        
        // Count general flashcards
        generalFlashcardsFiltered.forEach(card => {
          const currentCount = topicCounts.get(card.topic) || 0;
          topicCounts.set(card.topic, currentCount + 1);
        });
        
        // Create topic objects with icons and colors
        const topicObjects = (allTopics || []).map((topic, index) => {
          const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];
          const icons = ['medical-outline', 'construct-outline', 'nuclear-outline', 'leaf-outline', 'flask-outline', 'calculator-outline', 'book-outline', 'bulb-outline'];
          
          return {
            id: topic.toLowerCase().replace(/\s+/g, '-'),
            name: topic,
            icon: icons[index % icons.length],
            color: colors[index % icons.length],
            count: topicCounts.get(topic) || 0
          };
        });
        
        console.log('✅ Topics processed:', topicObjects.length);
        setTopics(topicObjects);
        
      } catch (error) {
        console.error('❌ Error fetching topics:', error);
        setTopics([]);
      }
    };
    
    fetchTopics();
  }, [user, profile]);
  
  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load dark theme setting
        const darkTheme = await AsyncStorage.getItem('isDarkTheme');
        if (darkTheme !== null) {
          setIsDarkTheme(JSON.parse(darkTheme));
        }
      } catch (error) {
        console.error('❌ Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Remove dummy subjects - we now use real topics from the database

  // Create styles after screenWidth is set
  const styles = useMemo(() => {
    // Ensure screenWidth is always a number and handle edge cases
    const safeScreenWidth = typeof screenWidth === 'number' && !isNaN(screenWidth) ? screenWidth : 400;
    
    // Validate the width calculation to prevent crashes
    const calculateWidth = (baseWidth: number) => {
      try {
        const result = Math.max((baseWidth - 52) / 2, 150);
        return isNaN(result) ? 150 : result;
      } catch (error) {
        console.warn('Width calculation error:', error);
        return 150;
      }
    };

    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#f8fafc',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
      },
      headerLeft: {
        flex: 1,
      },
      headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
      },
      headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
      },
      profileButton: {
        padding: 4,
      },
      tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
      },
      tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
      },
      activeTab: {
        borderBottomColor: '#6366f1',
      },
      tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#64748b',
      },
      activeTabText: {
        color: '#6366f1',
        fontWeight: '600',
      },
      content: {
        flex: 1,
        padding: 20,
      },
      searchContainer: {
        marginBottom: 24,
      },
      searchInput: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 16,
      },
      statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
      },
      statCard: {
        width: (safeScreenWidth - 60) / 2,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
      },
      statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
      },
      statLabel: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
      },
      navigationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
      },
      navigationItem: {
        width: (safeScreenWidth - 60) / 2,
        backgroundColor: '#6366f1',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
      navigationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
      },
      navigationText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
      },
      // Create Flashcard Button Styles
      createButton: {
        backgroundColor: '#f1f5f9',
        borderWidth: 2,
        borderColor: '#6366f1',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      },
      createButtonText: {
        color: '#6366f1',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
      },
      // Create Form Styles
      createForm: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
      createFormTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
        textAlign: 'center',
      },
      input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#ffffff',
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
      },
      selectedDifficultyButton: {
        backgroundColor: '#6366f1',
      },
      difficultyButtonText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500',
      },
      selectedDifficultyButtonText: {
        color: '#ffffff',
      },
      formButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
      },
      cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
      },
      cancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500',
      },
      saveButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#6366f1',
        alignItems: 'center',
      },
      saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
      },
      
      // Primary Button Styles for Forms
      primaryButton: {
        backgroundColor: '#6366f1',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
      primaryButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0.1,
      },
      primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
      },
      
      subjectsSection: {
        marginBottom: 24,
      },
      sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
      },
      subjectCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      },
      subjectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
      },
      subjectProgress: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366f1',
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
      
      // Learning Insights Section Styles
      learningInsightsSection: {
        marginBottom: 24,
      },
      insightCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
      insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      insightIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
      },
      insightContent: {
        flex: 1,
      },
      insightTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
        marginBottom: 4,
      },
      insightValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
      },
      insightSubtext: {
        fontSize: 12,
        color: '#64748b',
      },
      goalProgressBar: {
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        marginTop: 8,
      },
      goalProgressFill: {
        height: '100%',
        backgroundColor: '#8b5cf6',
        borderRadius: 3,
      },
      dailyGoalsSection: {
        marginBottom: 24,
      },

      signOutButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
      signOutText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
      },
      // Settings Page Styles
      settingsSection: {
        marginBottom: 24,
      },
      settingsSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
        marginLeft: 4,
      },
      settingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
      },
      settingIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
      },
      settingContent: {
        flex: 1,
      },
      settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
      },
      settingDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
      },
      settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      themeIndicator: {
        fontSize: 18,
      },
      // Profile Popup Styles
      popupOverlay: {
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
      profilePopup: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
      },
      popupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      },
      popupTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
      },
      closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
      },
      profileInfo: {
        alignItems: 'center',
        marginBottom: 24,
      },
      profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
      },
      profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
      },
      profileEmail: {
        fontSize: 16,
        color: '#64748b',
      },
      profileStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        paddingVertical: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
      },
      profileStat: {
        alignItems: 'center',
      },
      profileStatNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
      },
      profileStatLabel: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
      },
      profileActions: {
        gap: 12,
      },
      profileActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 18,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      profileActionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6366f1',
        marginLeft: 8,
        letterSpacing: -0.2,
      },
      // Create Flashcard Popup Styles
      createFlashcardPopup: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 28,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
      },
      createFormContent: {
        maxHeight: 400,
      },
      // Topic Dropdown Styles
      inputContainer: {
        marginBottom: 20,
      },
      inputLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 10,
        letterSpacing: -0.2,
      },
      topicDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      topicDropdownText: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
        letterSpacing: -0.2,
      },
      topicOptionsContainer: {
        marginTop: 8,
        maxHeight: 150,
        gap: 8,
      },
      topicOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        backgroundColor: '#ffffff',
      },
      topicOptionText: {
        fontSize: 14,
        color: '#1e293b',
      },
      // New Topic Styles
      topicSelectionContainer: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
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
      // Additional topic styles for the topics tab
      topicsHeader: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
      },
      topicsSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
      },
      emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
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
        paddingHorizontal: 40,
        lineHeight: 24,
      },
      topicsGrid: {
        padding: 20,
      },
      topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      topicIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
      },
      topicContent: {
        flex: 1,
      },
      topicName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
      },
      topicCount: {
        fontSize: 14,
        color: '#64748b',
      },
      // Settings Modal Styles
      modalContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
      },
      modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
      },
      placeholder: {
        width: 40,
      },
      modalContent: {
        flex: 1,
        padding: 20,
      },
      settingsContent: {
        marginBottom: 20,
      },
      settingsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        textAlign: 'center',
      },
      themeToggleButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
      },
      themeToggleContent: {
        flex: 1,
        marginRight: 10,
      },
      themeToggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 4,
      },
      themeToggleSubtext: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
      },
      themeToggleSwitch: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
      },
      themeToggleSwitchActive: {
        backgroundColor: '#6366f1',
      },
      themeToggleSwitchText: {
        fontSize: 14,
        color: '#ffffff',
      },
      themeInfo: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
      },
      themeInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
      },
      themeInfoText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
      },
      // Policy Modal Styles
      policyContent: {
        marginBottom: 20,
      },
      policyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        textAlign: 'center',
      },
      policyDate: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
        textAlign: 'center',
      },
      policySection: {
        marginBottom: 16,
      },
      policySectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
      },
      policyText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
      },
      // Help & Support Modal Styles
      helpContent: {
        marginBottom: 20,
      },
      helpTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        textAlign: 'center',
      },
      helpOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
      },
      helpOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
      },
      helpOptionContent: {
        flex: 1,
      },
      helpOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
      },
      helpOptionDescription: {
        fontSize: 14,
        color: '#64748b',
      },
      helpInfo: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
      },
      helpInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
      },
      helpInfoText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
      },
      // FAQs Modal Styles
      faqsContent: {
        marginBottom: 20,
      },
      faqItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
      },
      faqQuestion: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
      },
      faqAnswer: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
      },
      // Contact Support Modal Styles
      contactContent: {
        marginBottom: 20,
      },
      contactTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        textAlign: 'center',
      },
      contactSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
        textAlign: 'center',
      },
      contactInfo: {
        marginBottom: 16,
      },
      contactMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      },
      contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
      },
      contactMethodContent: {
        flex: 1,
      },
      contactMethodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
      },
      contactMethodDescription: {
        fontSize: 14,
        color: '#64748b',
      },
      emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        borderRadius: 12,
        paddingVertical: 14,
      },
      emailButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
      },
      contactTips: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
      },
      contactTipsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
      },
      contactTipsText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
      },
      contactResponse: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
      },
      contactResponseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
      },
      contactResponseText: {
        fontSize: 14,
        color: '#64748b',
      },
      // About Modal Styles
      aboutContent: {
        alignItems: 'center',
        marginBottom: 20,
      },
      appLogo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
      },
      appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
      },
      appVersion: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
      },
      appTagline: {
        fontSize: 16,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 20,
      },
      aboutSection: {
        marginBottom: 16,
      },
      aboutSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
      },
      aboutSectionText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
      },
      aboutFooter: {
        marginTop: 20,
        paddingVertical: 16,
        backgroundColor: '#f1f5f9',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
      },
      aboutFooterText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
      },
      
      // Form Input Styles
      inputGroup: {
        marginBottom: 20,
      },
      textInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1e293b',
      },
      textInputDisabled: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#9ca3af',
      },
      inputHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        fontStyle: 'italic',
      },
      
      // Radio Button Styles
      radioGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
      },
      radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        minWidth: 100,
        justifyContent: 'center',
      },
      radioButtonActive: {
        borderColor: '#6366f1',
        backgroundColor: '#f0f4ff',
      },
      radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#d1d5db',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
      },
      radioCircleActive: {
        borderColor: '#6366f1',
      },
      radioCircleInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6366f1',
      },
      radioText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
      },
      radioTextActive: {
        color: '#6366f1',
        fontWeight: '600',
      },
    });
  }, [screenWidth]);



  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
  };
  
  // Settings functions
  const toggleDarkTheme = async () => {
    try {
      const newTheme = !isDarkTheme;
      setIsDarkTheme(newTheme);
      await AsyncStorage.setItem('isDarkTheme', JSON.stringify(newTheme));
    } catch (error) {
      console.error('❌ Error saving dark theme setting:', error);
    }
  };

  // Profile and Password functions
  const handleEditProfile = () => {
    if (profile) {
      setEditProfileData({
        name: profile.name || '',
        native_language: profile.native_language || '',
        subject: profile.subjects?.[0] || '',
        level: profile.level || 'beginner'
      });
      setShowEditProfileModal(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;
    
    if (!editProfileData.name) {
      Alert.alert('Error', 'Please fill in your name.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      console.log('📝 Updating profile with data:', {
        name: editProfileData.name,
        level: editProfileData.level
      });

      // Update both name and proficiency level in a single call
      const updatedProfile = await UserProfileService.updateUserProfile(user.id, {
        name: editProfileData.name,
        level: editProfileData.level
      });

      console.log('✅ Profile updated successfully:', updatedProfile);
      
      // Refresh the profile data in AuthContext to update the UI immediately
      await refreshProfile();
      
      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditProfileModal(false);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = () => {
    setChangePasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowChangePasswordModal(true);
  };

  const handleUpdatePassword = async () => {
    if (!changePasswordData.currentPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (changePasswordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: changePasswordData.currentPassword
      });

      if (signInError) {
        Alert.alert('Error', 'Current password is incorrect.');
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: changePasswordData.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert('Success', 'Password updated successfully!');
      setShowChangePasswordModal(false);
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('❌ Error updating password:', error);
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const createFlashcard = async () => {
    if (!user || !newFlashcard.topic || !newFlashcard.front || !newFlashcard.back) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    
    try {
      await UserFlashcardService.createUserFlashcard({
        ...newFlashcard,
        user_id: user.id,
        subject: profile?.subjects?.[0] || '',
        topic: newFlashcard.topic,
        tags: newFlashcard.tags
      });
      
      Alert.alert('Success', 'Flashcard created successfully!');
      setShowCreateForm(false);
      setShowTopicPicker(false);
      setShowTopicInput(false);
      setNewTopicInput('');
      setNewFlashcard({
        topic: '',
        front: '',
        back: '',
        difficulty: 'beginner',
        example: '',
        pronunciation: '',
        tags: [],
        native_language: 'english'
      });
    } catch (error) {
      console.error('Error creating flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search flashcards, subjects..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="document-text" size={24} color="#6366f1" />
                </View>
                <Text style={styles.statValue}>127</Text>
                <Text style={styles.statLabel}>Total Cards</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>89</Text>
                <Text style={styles.statLabel}>Mastered</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="school" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.statValue}>38</Text>
                <Text style={styles.statLabel}>Learning</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="library" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>
            </View>

            <View style={styles.navigationGrid}>
              <TouchableOpacity
                style={styles.navigationItem}
                onPress={() => setShowCreateForm(true)}
              >
                <View style={styles.navigationIcon}>
                  <Ionicons name="add" size={24} color="#ffffff" />
                </View>
                <Text style={styles.navigationText}>Create Card</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigationItem}
                onPress={() => navigation.navigate('Lessons' as never)}
              >
                <View style={styles.navigationIcon}>
                  <Ionicons name="school" size={24} color="#ffffff" />
                </View>
                <Text style={styles.navigationText}>My Lessons</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigationItem}
                onPress={() => navigation.navigate('Upload' as never)}
              >
                <View style={styles.navigationIcon}>
                  <Ionicons name="cloud-upload" size={24} color="#ffffff" />
                </View>
                <Text style={styles.navigationText}>Upload Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigationItem}
                onPress={() => navigation.navigate('ProgressDashboard' as never)}
              >
                <View style={styles.navigationIcon}>
                  <Ionicons name="trending-up" size={24} color="#ffffff" />
                </View>
                <Text style={styles.navigationText}>Progress</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.learningInsightsSection}>
              <Text style={styles.sectionTitle}>Learning Insights</Text>
              
              {/* Study Streak Card */}
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <View style={styles.insightIconContainer}>
                    <Ionicons name="flame" size={24} color="#ff6b35" />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>Study Streak</Text>
                    <Text style={styles.insightValue}>7 days</Text>
                    <Text style={styles.insightSubtext}>Keep it up! 🔥</Text>
                  </View>
                </View>
              </View>

              {/* Learning Progress Card */}
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <View style={styles.insightIconContainer}>
                    <Ionicons name="trending-up" size={24} color="#10b981" />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>This Week</Text>
                    <Text style={styles.insightValue}>23 cards studied</Text>
                    <Text style={styles.insightSubtext}>+15% from last week</Text>
                  </View>
                </View>
              </View>

              {/* Study Goal Card */}
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <View style={styles.insightIconContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>Daily Goal</Text>
                    <Text style={styles.insightValue}>12/15 cards</Text>
                    <View style={styles.goalProgressBar}>
                      <View style={[styles.goalProgressFill, { width: '80%' }]} />
                    </View>
                  </View>
                </View>
              </View>


            </View>

            {/* Daily Goals Widget */}
            <View style={styles.dailyGoalsSection}>
              <Text style={styles.sectionTitle}>🎯 Daily Goals</Text>
              <DailyGoalsWidget />
            </View>
          </ScrollView>
        );
      case 'settings':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            {/* Account Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Account</Text>
              <TouchableOpacity style={styles.settingButton} onPress={handleEditProfile}>
                <View style={styles.settingIcon}>
                  <Ionicons name="person" size={24} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Edit Profile</Text>
                  <Text style={styles.settingDescription}>Update your personal information</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingButton} onPress={handleChangePassword}>
                <View style={styles.settingIcon}>
                  <Ionicons name="lock-closed" size={24} color="#ef4444" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Change Password</Text>
                  <Text style={styles.settingDescription}>Update your account security</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingButton}>
                <View style={styles.settingIcon}>
                  <Ionicons name="mail" size={24} color="#10b981" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Email Preferences</Text>
                  <Text style={styles.settingDescription}>Manage notifications and updates</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Study Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Study Preferences</Text>
              <TouchableOpacity style={styles.settingButton}>
                <View style={styles.settingIcon}>
                  <Ionicons name="notifications" size={24} color="#f59e0b" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Study Reminders</Text>
                  <Text style={styles.settingDescription}>Set daily study goals and alerts</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingButton} onPress={() => setShowThemeModal(true)}>
                <View style={styles.settingIcon}>
                  <Ionicons name="color-palette" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>App Theme</Text>
                  <Text style={styles.settingDescription}>Choose light or dark mode</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.themeIndicator}>
                    {isDarkTheme ? '🌙' : '☀️'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Data & Privacy */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Data & Privacy</Text>
              <TouchableOpacity style={styles.settingButton} onPress={() => setShowPrivacyModal(true)}>
                <View style={styles.settingIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Privacy Policy</Text>
                  <Text style={styles.settingDescription}>View our privacy policy and data practices</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>

            </View>

            {/* Support */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Support</Text>
              <TouchableOpacity style={styles.settingButton} onPress={() => setShowFAQsModal(true)}>
                <View style={styles.settingIcon}>
                  <Ionicons name="help-circle" size={24} color="#f59e0b" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>FAQs</Text>
                  <Text style={styles.settingDescription}>Frequently asked questions</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingButton} onPress={() => setShowContactModal(true)}>
                <View style={styles.settingIcon}>
                  <Ionicons name="chatbubble" size={24} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Contact Support</Text>
                  <Text style={styles.settingDescription}>Reach out to our team</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingButton} onPress={() => setShowAboutModal(true)}>
                <View style={styles.settingIcon}>
                  <Ionicons name="information-circle" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>About</Text>
                  <Text style={styles.settingDescription}>App version and information</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Sign Out */}
            <View style={styles.settingsSection}>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out" size={20} color="#ffffff" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      case 'topics':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.topicsHeader}>
              <Text style={styles.sectionTitle}>Topics for {profile?.subjects?.[0] || 'Your Subject'}</Text>
              <Text style={styles.topicsSubtitle}>
                {topics.length > 0 
                  ? `Found ${topics.length} topics with ${topics.reduce((sum, topic) => sum + topic.count, 0)} total cards`
                  : 'No topics found for your subject'
                }
              </Text>
            </View>

            {topics.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyStateTitle}>No Topics Found</Text>
                <Text style={styles.emptyStateText}>
                  Start creating flashcards or upload notes to see topics appear here.
                </Text>
              </View>
                          ) : (
                <View style={styles.topicsGrid}>
                  {(topics || []).map((topic) => (
                  <TouchableOpacity
                    key={topic.id}
                    style={styles.topicCard}
                    onPress={() => {
                      // Navigate to flashcards screen with this topic pre-selected
                      navigation.navigate('Flashcards' as never);
                    }}
                  >
                    <View style={styles.topicIcon}>
                      <Ionicons name={topic.icon as any} size={32} color={topic.color} />
                    </View>
                    <View style={styles.topicContent}>
                      <Text style={styles.topicName}>{topic.name}</Text>
                      <Text style={styles.topicCount}>{topic.count} cards</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {profile?.name || user?.email || 'User'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => setShowProfilePopup(true)}
        >
          <Ionicons name="person-circle" size={32} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Profile Popup */}
      {showProfilePopup && (
        <View style={styles.popupOverlay}>
          <View style={styles.profilePopup}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Profile</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowProfilePopup(false)}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={48} color="#ffffff" />
              </View>
              <Text style={styles.profileName}>{profile?.name || 'User Name'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
            
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>1,247</Text>
                <Text style={styles.profileStatLabel}>Total Cards</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>892</Text>
                <Text style={styles.profileStatLabel}>Mastered</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>18</Text>
                <Text style={styles.profileStatLabel}>Day Streak</Text>
              </View>
            </View>
            
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={styles.profileActionButton}
                onPress={() => {
                  setShowProfilePopup(false);
                  handleEditProfile();
                }}
              >
                <Ionicons name="person" size={20} color="#6366f1" />
                <Text style={styles.profileActionText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileActionButton}
                onPress={() => {
                  setShowProfilePopup(false);
                  setActiveTab('settings');
                }}
              >
                <Ionicons name="settings" size={20} color="#6366f1" />
                <Text style={styles.profileActionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => handleTabPress('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => handleTabPress('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Create Flashcard Modal */}
      {showCreateForm && (
        <View style={styles.popupOverlay}>
          <View style={styles.createFlashcardPopup}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Create New Flashcard</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowCreateForm(false);
                  setShowTopicPicker(false);
                  setShowTopicInput(false);
                  setNewTopicInput('');
                  setNewFlashcard({
                    topic: '',
                    front: '',
                    back: '',
                    difficulty: 'beginner',
                    example: '',
                    pronunciation: '',
                    tags: [],
                    native_language: 'english'
                  });
                }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.createFormContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Topic</Text>
                {!showTopicInput ? (
                  <View style={styles.topicSelectionContainer}>
                    <TouchableOpacity
                      style={styles.topicDropdown}
                      onPress={() => setShowTopicPicker(!showTopicPicker)}
                    >
                      <Text style={styles.topicDropdownText}>
                        {newFlashcard.topic || 'Select a topic'}
                      </Text>
                      <Ionicons name={showTopicPicker ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.newTopicButton} 
                      onPress={() => {
                        setShowTopicInput(true);
                        setShowTopicPicker(false);
                      }}
                    >
                      <Ionicons name="add" size={16} color="#6366f1" />
                      <Text style={styles.newTopicButtonText}>New Topic</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.newTopicInputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new topic name"
                      value={newTopicInput}
                      onChangeText={setNewTopicInput}
                    />
                    <View style={styles.newTopicActions}>
                      <TouchableOpacity 
                        style={styles.cancelNewTopicButton}
                        onPress={() => {
                          setShowTopicInput(false);
                          setNewTopicInput('');
                        }}
                      >
                        <Text style={styles.cancelNewTopicButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.confirmNewTopicButton}
                        onPress={() => {
                          if (newTopicInput.trim()) {
                            setNewFlashcard(prev => ({ ...prev, topic: newTopicInput.trim() }));
                            setShowTopicInput(false);
                            setNewTopicInput('');
                          }
                        }}
                      >
                        <Text style={styles.confirmNewTopicButtonText}>Use New</Text>
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
              <TextInput
                style={styles.input}
                placeholder="Front of card (question/term)"
                value={newFlashcard.front}
                onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, front: text }))}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Back of card (answer/definition)"
                value={newFlashcard.back}
                onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, back: text }))}
                multiline
              />
              <View style={styles.difficultyRow}>
                {['beginner', 'intermediate', 'expert'].map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.difficultyButton,
                      newFlashcard.difficulty === diff && styles.selectedDifficultyButton
                    ]}
                    onPress={() => setNewFlashcard(prev => ({ ...prev, difficulty: diff as any }))}
                  >
                    <Text style={[
                      styles.difficultyButtonText,
                      newFlashcard.difficulty === diff && styles.selectedDifficultyButtonText
                    ]}>
                      {diff === 'intermediate' ? 'Int.' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Example sentence (optional)"
                value={newFlashcard.example}
                onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, example: text }))}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Pronunciation (optional)"
                value={newFlashcard.pronunciation}
                onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, pronunciation: text }))}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.cancelButton}                 onPress={() => {
                  setShowCreateForm(false);
                  setShowTopicPicker(false);
                  setShowTopicInput(false);
                  setNewTopicInput('');
                  setNewFlashcard({
                    topic: '',
                    front: '',
                    back: '',
                    difficulty: 'beginner',
                    example: '',
                    pronunciation: '',
                    tags: [],
                    native_language: 'english'
                  });
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={createFlashcard}>
                  <Text style={styles.saveButtonText}>Create Flashcard</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
      
      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowThemeModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Theme Settings</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsTitle}>Choose Your Theme</Text>
              
              <TouchableOpacity 
                style={styles.themeToggleButton} 
                onPress={toggleDarkTheme}
              >
                <View style={styles.themeToggleContent}>
                  <Ionicons 
                    name={isDarkTheme ? "moon" : "sunny"} 
                    size={24} 
                    color={isDarkTheme ? "#6366f1" : "#f59e0b"} 
                  />
                  <Text style={styles.themeToggleText}>
                    {isDarkTheme ? 'Dark Theme' : 'Light Theme'}
                  </Text>
                  <Text style={styles.themeToggleSubtext}>
                    {isDarkTheme ? 'Currently using dark theme' : 'Currently using light theme'}
                  </Text>
                </View>
                <View style={[
                  styles.themeToggleSwitch,
                  isDarkTheme && styles.themeToggleSwitchActive
                ]}>
                  <Text style={styles.themeToggleSwitchText}>
                    {isDarkTheme ? '🌙' : '☀️'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.themeInfo}>
                <Text style={styles.themeInfoTitle}>Theme Changes</Text>
                <Text style={styles.themeInfoText}>
                  Changing the theme will affect the appearance of all pages in the app. 
                  Your preference will be saved and remembered for future sessions.
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.policyContent}>
              <Text style={styles.policyTitle}>UniLingo Privacy Policy</Text>
              <Text style={styles.policyDate}>Last updated: {new Date().toLocaleDateString()}</Text>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>1. Information We Collect</Text>
                <Text style={styles.policyText}>
                  We collect information you provide directly to us, such as when you create an account, 
                  use our language learning features, or contact us for support.
                </Text>
                <Text style={styles.policyText}>
                  • Account information (email, name, native language, learning subjects){'\n'}
                  • Learning progress and study data (flashcard interactions, lesson completion){'\n'}
                  • User-generated content (flashcards, notes, uploaded documents){'\n'}
                  • Device information (device type, operating system, app version){'\n'}
                  • Usage analytics (features used, time spent, performance metrics){'\n'}
                  • AI-generated content based on your uploaded materials
                </Text>
              </View>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>2. How We Use Your Information</Text>
                <Text style={styles.policyText}>
                  We use the information we collect to:
                </Text>
                <Text style={styles.policyText}>
                  • Provide and improve our language learning services{'\n'}
                  • Generate AI-powered flashcards and lessons from your uploaded materials{'\n'}
                  • Personalize your learning experience based on your progress{'\n'}
                  • Track your progress and provide learning analytics{'\n'}
                  • Send important app updates and study reminders{'\n'}
                  • Provide customer support and respond to inquiries{'\n'}
                  • Analyze usage patterns to improve app performance{'\n'}
                  • Ensure app security and prevent misuse
                </Text>
              </View>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>3. Data Security</Text>
                <Text style={styles.policyText}>
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. We use 
                  industry-standard security practices powered by Supabase infrastructure.
                </Text>
                <Text style={styles.policyText}>
                  • All data is encrypted in transit and at rest using AES-256 encryption{'\n'}
                  • Row-level security policies ensure data isolation{'\n'}
                  • Access to personal data is strictly controlled and logged{'\n'}
                  • Regular security audits and vulnerability assessments{'\n'}
                  • Compliance with SOC 2 Type II and ISO 27001 standards{'\n'}
                  • AI processing through secure OpenAI API integration
                </Text>
              </View>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>4. Data Sharing and Third Parties</Text>
                <Text style={styles.policyText}>
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  without your consent, except as described in this policy. We work with trusted service 
                  providers to deliver our services.
                </Text>
                <Text style={styles.policyText}>
                  • Supabase (database and authentication services){'\n'}
                  • OpenAI (AI content generation - data not used for training){'\n'}
                  • Cloud infrastructure providers (for app hosting){'\n'}
                  • Analytics services (anonymized usage data only){'\n'}
                  • Legal requirements and law enforcement requests{'\n'}
                  • Business transfers (with appropriate user notification and safeguards)
                </Text>
              </View>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>5. Your Rights and Data Control</Text>
                <Text style={styles.policyText}>
                  Under applicable privacy laws (including GDPR and CCPA), you have the right to:
                </Text>
                <Text style={styles.policyText}>
                  • Access and review your personal data stored in our systems{'\n'}
                  • Request correction of inaccurate or incomplete information{'\n'}
                  • Request deletion of your data (right to be forgotten){'\n'}
                  • Restrict or object to certain data processing activities{'\n'}
                  • Data portability - export your data in a machine-readable format{'\n'}
                  • Withdraw consent for data processing where applicable{'\n'}
                  • File complaints with relevant data protection authorities
                </Text>
              </View>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>6. Data Retention</Text>
                <Text style={styles.policyText}>
                  We retain your personal information only as long as necessary to provide our services 
                  and fulfill the purposes outlined in this policy:
                </Text>
                <Text style={styles.policyText}>
                  • Account data - retained while your account is active{'\n'}
                  • Learning progress - retained to maintain your study history{'\n'}
                  • User-generated content - retained until you delete it or close your account{'\n'}
                  • Analytics data - anonymized and retained for up to 2 years{'\n'}
                  • Upon account deletion, personal data is permanently removed within 30 days
                </Text>
              </View>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>7. Children's Privacy</Text>
                <Text style={styles.policyText}>
                  UniLingo is designed for users 13 years of age and older. We do not knowingly 
                  collect personal information from children under 13. If we learn that we have 
                  collected personal information from a child under 13, we will delete it immediately.
                </Text>
              </View>
              
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>8. Changes to This Policy</Text>
                <Text style={styles.policyText}>
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  material changes by posting the new policy in the app and updating the "Last updated" 
                  date. Your continued use of the app after changes constitutes acceptance of the updated policy.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>9. Contact Us</Text>
                <Text style={styles.policyText}>
                  If you have any questions about this Privacy Policy or our data practices, 
                  please contact us through the Help & Support section of the app or reach out 
                  to our data protection team for privacy-specific inquiries.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      

      
      {/* FAQs Modal */}
      <Modal
        visible={showFAQsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFAQsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFAQsModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Frequently Asked Questions</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.faqsContent}>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I create flashcards?</Text>
                <Text style={styles.faqAnswer}>
                  There are two ways to create flashcards: {'\n'}
                  1. Upload a PDF document in the "Upload Notes" section and AI will automatically generate flashcards{'\n'}
                  2. Manually create flashcards using the "Create Card" button on the Overview tab{'\n'}
                  You can customize difficulty, add examples, and organize cards by topic.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>What games are available?</Text>
                <Text style={styles.faqAnswer}>
                  We offer several games: Flashcard Quiz (multiple choice), Memory Match, 
                  Word Scramble, Speed Challenge, and Hangman. Each game helps reinforce 
                  vocabulary in different ways.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I change the language mode?</Text>
                <Text style={styles.faqAnswer}>
                  In the Speed Challenge game, you can long-press the game button to toggle 
                  between "Questions in English" and "Answers in English" modes.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I study specific topics?</Text>
                <Text style={styles.faqAnswer}>
                  Yes! Use the topic selector above the games to focus on specific subjects. 
                  You can also select "All Topics" to study from your entire flashcard collection.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I track my progress?</Text>
                <Text style={styles.faqAnswer}>
                  Your study stats are displayed at the bottom of the Games page, showing 
                  total cards, topics, and subject information.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>What if I don't have enough cards?</Text>
                <Text style={styles.faqAnswer}>
                  Games require a minimum number of cards (usually 5-6). If you don't have 
                  enough, create more flashcards first or select a different topic with more cards.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I change the theme?</Text>
                <Text style={styles.faqAnswer}>
                  Go to Settings → Appearance and toggle between light and dark themes. 
                  Your preference will be saved automatically.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Is my data secure?</Text>
                <Text style={styles.faqAnswer}>
                  Yes, we take data security seriously. All data is encrypted using AES-256 encryption, 
                  stored securely with Supabase, and we follow industry best practices including SOC 2 
                  compliance. See our Privacy Policy for complete details.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I edit my profile?</Text>
                <Text style={styles.faqAnswer}>
                  Click the profile button (person icon) in the top right corner of the dashboard, 
                  then select "Edit Profile". You can update your name and proficiency level. 
                  Native language and subject are locked for data consistency.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I change my password?</Text>
                <Text style={styles.faqAnswer}>
                  Yes! Go to Settings → Account → Change Password. You'll need to enter your 
                  current password and confirm your new password. Make sure it's at least 6 characters long.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How does AI flashcard generation work?</Text>
                <Text style={styles.faqAnswer}>
                  Upload a PDF document and our AI (powered by OpenAI) analyzes the content to extract 
                  key terms, concepts, and definitions. It then creates flashcards with questions and 
                  answers tailored to your learning subject and proficiency level.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>What file types can I upload?</Text>
                <Text style={styles.faqAnswer}>
                  Currently, UniLingo supports PDF files for lesson and flashcard generation. 
                  Make sure your PDFs contain readable text (not just images) for best AI processing results.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I access my lessons?</Text>
                <Text style={styles.faqAnswer}>
                  Navigate to the "Lessons" tab in the bottom navigation. Here you can view lessons 
                  generated from your uploaded documents, create new lessons, or access the lesson viewer 
                  for interactive learning experiences.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>What subjects are supported?</Text>
                <Text style={styles.faqAnswer}>
                  UniLingo supports a wide range of academic subjects including Medicine, Engineering, 
                  Physics, Biology, Chemistry, Business, Law, Psychology, Mathematics, Computer Science, 
                  and many more. The AI adapts content generation to your chosen subject.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I delete my account?</Text>
                <Text style={styles.faqAnswer}>
                  Yes, you can delete your account by contacting our support team through the 
                  "Contact Support" option. All your data will be permanently removed within 30 days 
                  as outlined in our Privacy Policy.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>The app is running slowly. What should I do?</Text>
                <Text style={styles.faqAnswer}>
                  Try these steps: {'\n'}
                  1. Close and restart the app{'\n'}
                  2. Check your internet connection{'\n'}
                  3. Update to the latest version{'\n'}
                  4. Restart your device{'\n'}
                  If issues persist, contact our support team.
                </Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I contact support?</Text>
                <Text style={styles.faqAnswer}>
                  You can reach our support team through Settings → Support → Contact Support. 
                  We typically respond within 24-48 hours during business days. For urgent issues, 
                  include "URGENT" in your message subject.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* Contact Support Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContactModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowContactModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Contact Support</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Get in Touch</Text>
              <Text style={styles.contactSubtitle}>
                We're here to help! Send us an email and we'll get back to you as soon as possible.
              </Text>
              
              <View style={styles.contactInfo}>
                <View style={styles.contactMethod}>
                  <View style={styles.contactIcon}>
                    <Ionicons name="mail" size={24} color="#6366f1" />
                  </View>
                  <View style={styles.contactMethodContent}>
                    <Text style={styles.contactMethodTitle}>Email Support</Text>
                    <Text style={styles.contactMethodDescription}>
                      Send us a detailed message about your issue or question
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.emailButton}
                  onPress={() => {
                    // This will be replaced with your actual email address
                    Alert.alert(
                      'Email Support',
                      'Email functionality will be added with your email address. For now, please note that support requests will be handled through the app.',
                      [{ text: 'OK', style: 'default' }]
                    );
                  }}
                >
                  <Ionicons name="mail-outline" size={20} color="#ffffff" />
                  <Text style={styles.emailButtonText}>Send Email</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.contactTips}>
                <Text style={styles.contactTipsTitle}>Before contacting support:</Text>
                <Text style={styles.contactTipsText}>
                  • Check the FAQs section for common solutions{'\n'}
                  • Make sure you're using the latest version of the app{'\n'}
                  • Include specific details about your issue{'\n'}
                  • Mention your device type and app version
                </Text>
              </View>
              
              <View style={styles.contactResponse}>
                <Text style={styles.contactResponseTitle}>Response Time</Text>
                <Text style={styles.contactResponseText}>
                  We typically respond to support requests within 24-48 hours during business days.
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAboutModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>About UniLingo</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.aboutContent}>
              <View style={styles.appLogo}>
                <Ionicons name="school" size={64} color="#6366f1" />
              </View>
              
              <Text style={styles.appName}>UniLingo</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appTagline}>
                Revolutionizing language learning through AI-powered flashcards and interactive games
              </Text>
              
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>Our Mission</Text>
                <Text style={styles.aboutSectionText}>
                  UniLingo is designed to make language learning accessible, engaging, and effective 
                  for university students and lifelong learners. We combine cutting-edge AI technology 
                  with proven learning methodologies to create a personalized educational experience.
                </Text>
              </View>
              
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>Key Features</Text>
                <Text style={styles.aboutSectionText}>
                  • AI-powered flashcard generation from PDF notes{'\n'}
                  • Interactive learning games (Quiz, Memory, Scramble, Speed Challenge, Hangman){'\n'}
                  • Personalized study paths based on your subjects{'\n'}
                  • Progress tracking and performance analytics{'\n'}
                  • Customizable learning experience with theme options
                </Text>
              </View>
              
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>Technology</Text>
                <Text style={styles.aboutSectionText}>
                  Built with React Native and powered by OpenAI's GPT-4 technology, UniLingo 
                  represents the future of educational apps. Our platform leverages machine learning 
                  to adapt to your learning style and provide targeted content.
                </Text>
              </View>
              
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>Privacy & Security</Text>
                <Text style={styles.aboutSectionText}>
                  Your privacy is our priority. All data is encrypted and stored securely. 
                  We never share your personal information with third parties without your consent. 
                  See our Privacy Policy for complete details.
                </Text>
              </View>
              
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>Support</Text>
                <Text style={styles.aboutSectionText}>
                  Need help? Our support team is here to assist you. Check the FAQs section 
                  for quick answers, or contact us directly through the Help & Support section.
                </Text>
              </View>
              
              <View style={styles.aboutFooter}>
                <Text style={styles.aboutFooterText}>
                  © 2024 UniLingo. All rights reserved.
                </Text>
                <Text style={styles.aboutFooterText}>
                  Made with ❤️ for language learners worldwide
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditProfileModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsTitle}>Update Your Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editProfileData.name}
                  onChangeText={(text) => setEditProfileData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Native Language</Text>
                <TextInput
                  style={styles.textInputDisabled}
                  value={editProfileData.native_language}
                  placeholder="e.g., English, Spanish, French"
                  placeholderTextColor="#d1d5db"
                  editable={false}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.textInputDisabled}
                  value={editProfileData.subject}
                  placeholder="e.g., Medicine, Engineering, Physics"
                  placeholderTextColor="#d1d5db"
                  editable={false}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Proficiency Level</Text>
                <View style={styles.radioGroup}>
                  {(['beginner', 'intermediate', 'expert'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.radioButton,
                        editProfileData.level === level && styles.radioButtonActive
                      ]}
                      onPress={() => setEditProfileData(prev => ({ ...prev, level: level }))}
                    >
                      <View style={[
                        styles.radioCircle,
                        editProfileData.level === level && styles.radioCircleActive
                      ]}>
                        {editProfileData.level === level && (
                          <View style={styles.radioCircleInner} />
                        )}
                      </View>
                      <Text style={[
                        styles.radioText,
                        editProfileData.level === level && styles.radioTextActive
                      ]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.primaryButton, isUpdatingProfile && styles.primaryButtonDisabled]}
                onPress={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                <Text style={styles.primaryButtonText}>
                  {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChangePasswordModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsTitle}>Update Your Password</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={changePasswordData.currentPassword}
                  onChangeText={(text) => setChangePasswordData(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Enter your current password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={changePasswordData.newPassword}
                  onChangeText={(text) => setChangePasswordData(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Enter your new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
                <Text style={styles.inputHint}>Must be at least 6 characters long</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={changePasswordData.confirmPassword}
                  onChangeText={(text) => setChangePasswordData(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirm your new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>
              
              <TouchableOpacity
                style={[styles.primaryButton, isChangingPassword && styles.primaryButtonDisabled]}
                onPress={handleUpdatePassword}
                disabled={isChangingPassword}
              >
                <Text style={styles.primaryButtonText}>
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Main DashboardScreen component that renders the tab navigator
export default function DashboardScreen() {
  console.log('🏠 DashboardScreen rendering...');
  return <TabNavigator />;
}
