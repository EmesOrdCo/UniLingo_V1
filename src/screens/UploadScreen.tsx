import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  TextInput,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { UploadService, UploadProgress, GeneratedFlashcard } from '../lib/uploadService';
import { ImageUploadService, ImageUploadProgress, ImageProcessingResult } from '../lib/imageUploadService';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import FlashcardReviewModal from '../components/FlashcardReviewModal';
import UploadProgressModal from '../components/UploadProgressModal';
import ImageProcessingModal from '../components/ImageProcessingModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { TopicEditModal } from '../components/TopicEditModal';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { getBackendUrl, BACKEND_CONFIG } from '../config/backendConfig';

const { width: screenWidth } = Dimensions.get('window');

export default function UploadScreen() {
  const { triggerRefresh } = useRefresh();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [topics, setTopics] = useState<Array<{ id: string; name: string; icon: string; color: string; count: number }>>([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    stage: 'uploading',
    progress: 0,
    message: 'Ready to upload',
  });
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showImageProcessingModal, setShowImageProcessingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTopicEditModal, setShowTopicEditModal] = useState(false);
  const [editableFlashcards, setEditableFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [uniqueTopics, setUniqueTopics] = useState<string[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Image-related state
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageProgress, setImageProgress] = useState<ImageUploadProgress>({
    stage: 'selecting',
    progress: 0,
    message: 'Ready to select images',
  });
  

  
  // Use ref to ensure we always have the latest generatedFlashcards value
  const generatedFlashcardsRef = useRef<GeneratedFlashcard[]>([]);
  
  // Debug: Track when generatedFlashcards state changes
  useEffect(() => {
    console.log('🔍 generatedFlashcards state changed:', {
      count: generatedFlashcards.length,
      isEmpty: generatedFlashcards.length === 0
    });
    console.log('🔍 generatedFlashcards useEffect completed');
  }, [generatedFlashcards]);
  
  // Debug: Track when review modal visibility changes
  useEffect(() => {
    console.log('🔍 showReviewModal useEffect triggered:', { showReviewModal, flashcardsCount: generatedFlashcards.length });
    if (showReviewModal) {
      console.log('🔍 showReviewModal changed to true, current flashcards count:', generatedFlashcards.length);
    }
    console.log('🔍 showReviewModal useEffect completed');
  }, [showReviewModal, generatedFlashcards]);

  // Debug: Track when topic edit modal visibility changes
  useEffect(() => {
    if (showTopicEditModal) {
      console.log('🔍 showTopicEditModal changed to true, current topics count:', uniqueTopics.length);
    }
  }, [showTopicEditModal, uniqueTopics]);

  // Note: Removed automatic modal display - user must click Continue button

  const navigation = useNavigation();
  const { user, profile } = useAuth();

  // Get user's subject and native language from profile
  const userSubject = profile?.subjects?.[0] || 'General';
  const userNativeLanguage = profile?.native_language || 'English';
  
  // Ensure we have a valid native language - this is critical for database operations
  if (!userNativeLanguage || userNativeLanguage === 'English') {
    console.warn('⚠️ Warning: userNativeLanguage is not properly set:', userNativeLanguage);
  }
  
  // Debug: Log the user's profile information (only when profile changes)
  useEffect(() => {
    if (profile) {
      console.log('🔍 User profile debug:', {
        profile,
        userSubject,
        userNativeLanguage,
        native_language: profile?.native_language,
        subjects: profile?.subjects
      });
    }
  }, [profile, userSubject, userNativeLanguage]);

  useEffect(() => {
    fetchTopics();
    
    // Set up periodic cleanup to prevent picker from getting stuck
    // Increased frequency to every 2 minutes to reduce overhead and allow longer processing
    const cleanupInterval = setInterval(() => {
      if (!isProcessing) {
        // Only cleanup when not actively processing
        try {
          // @ts-ignore - accessing private method for emergency reset
          if (UploadService.forceResetPicker) {
            UploadService.forceResetPicker();
          }
        } catch (e) {
          // Silent cleanup failure
        }
      }
    }, 120000); // Every 2 minutes instead of 30 seconds
    
    // Cleanup function to reset any stuck picker state
    return () => {
      clearInterval(cleanupInterval);
      
      // Reset processing state when component unmounts
      setIsProcessing(false);
      setShowProgressModal(false);
      
      // Also reset the picker service state
      try {
        // @ts-ignore - accessing private method for emergency reset
        if (UploadService.forceResetPicker) {
          UploadService.forceResetPicker();
        }
      } catch (e) {
        // Silent cleanup failure
      }
    };
  }, [isProcessing]);

  // Emergency cleanup effect - ensures component can always be unmounted
  useEffect(() => {
    const emergencyCleanup = () => {
      setIsProcessing(false);
      setShowProgressModal(false);
      setShowReviewModal(false);
      setShowTopicEditModal(false);
    };

    // For React Native, we'll use a simpler approach
    // The error boundary in App.tsx should catch most errors
  }, []);

  const fetchTopics = async () => {
    try {
      if (!user) return;
      
      // Fetch topics from both user_flashcards and flashcards databases
      const userFlashcards = await UserFlashcardService.getUserFlashcards();
      const userTopics = Array.from(new Set(userFlashcards.map((card: any) => card.topic)));
      
      // Only use user topics - general flashcards table no longer exists
      const allTopics = userTopics;
      
      if (allTopics.length === 0) {
        // No topics available - user needs to create flashcards first
        setTopics([]);
        return;
      }
      
      const topicObjects = allTopics.map((topic: string, index: number) => {
        const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];
        const icons = ['medical-outline', 'construct-outline', 'nuclear-outline', 'leaf-outline', 'flask-outline', 'calculator-outline', 'book-outline', 'bulb-outline'];
        
        return {
          id: topic.toLowerCase().replace(/\s+/g, '-'),
          name: topic,
          icon: icons[index % icons.length],
          color: colors[index % colors.length],
          count: 0
        };
      });
      
      setTopics(topicObjects);
    } catch (error) {
      console.error('Error fetching topics:', error);
      // No fallback topics - show empty list
      setTopics([]);
    }
  };


  const handleFilePick = async () => {
    // SECTION 1: handleFilePick - Main PDF upload function
    if (!selectedTopic) {
      return;
    }

    try {
      // Reset cancellation state
      setIsCancelled(false);
      
      // Create new AbortController for this upload session
      abortControllerRef.current = new AbortController();
      
      setIsProcessing(true);
      setShowProgressModal(true);
      
      // Add safety timeout to prevent indefinite freezing
      safetyTimeoutRef.current = setTimeout(() => {
        console.log('⚠️ Safety timeout triggered - upload taking longer than expected');
        
        // Stop the entire process
        setIsProcessing(false);
        setShowProgressModal(false);
        setProgress({
          stage: 'error',
          progress: 0,
          message: 'Upload timed out. The process has been stopped.',
        });
        
        Alert.alert(
          'Upload Timeout',
          'The upload process has been stopped due to timeout. This may happen with very large files or complex content. Please try with a smaller file or try again.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }, 180000); // 3 minute timeout - more reasonable for users
      
      // Update progress for file picking
      setProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Selecting PDF file...',
      });

      // Pick PDF file (same simple approach as lesson creation)
      const fileResult = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      // Handle user cancellation gracefully
      if (!fileResult || !fileResult.assets || fileResult.assets.length === 0) {
        console.log('📄 User cancelled PDF selection');
        console.log('🔍 Starting cancellation cleanup...');
        
        // Set cancellation flag to stop all background processes
        setIsCancelled(true);
        console.log('🔍 Set cancellation flag to true');
        
        // Abort any ongoing requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log('🔍 Aborted ongoing requests');
        }
        
        // Clear all timeouts
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
          console.log('🔍 Cleared safety timeout');
        }
        if (backendTimeoutRef.current) {
          clearTimeout(backendTimeoutRef.current);
          backendTimeoutRef.current = null;
          console.log('🔍 Cleared backend timeout');
        }
        if (aiTimeoutRef.current) {
          clearTimeout(aiTimeoutRef.current);
          aiTimeoutRef.current = null;
          console.log('🔍 Cleared AI timeout');
        }
        
        // Clear any progress interval that might be running
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
          console.log('🔍 Cleared progress interval');
        }
        
        console.log('🔍 About to update processing state...');
        
        // Use setTimeout to defer state updates and prevent blocking
        setTimeout(() => {
          console.log('🔍 Deferred state updates starting...');
          
          // Batch state updates to prevent conflicts
          setIsProcessing(false);
          console.log('🔍 Set isProcessing to false');
          
          setShowProgressModal(false);
          console.log('🔍 Set showProgressModal to false');
          
          setShowReviewModal(false);
          console.log('🔍 Set showReviewModal to false');
          
          setShowTopicEditModal(false);
          console.log('🔍 Set showTopicEditModal to false');
          
          // Clear flashcards data
          setGeneratedFlashcards([]);
          console.log('🔍 Set generatedFlashcards to empty array');
          
          generatedFlashcardsRef.current = [];
          console.log('🔍 Cleared generatedFlashcardsRef');
          
          // Reset progress
          setProgress({
            stage: 'uploading',
            progress: 0,
            message: 'Ready to upload',
          });
          console.log('🔍 Reset progress state');
          
          console.log('🔍 Deferred state updates completed');
          
          // Use InteractionManager to ensure UI is ready
          InteractionManager.runAfterInteractions(() => {
            console.log('🔍 InteractionManager: UI interactions completed');
            
            // Force a small delay to ensure everything is settled
            setTimeout(() => {
              console.log('🔍 Final UI settlement delay completed');
              console.log('🔍 UI should now be fully responsive');
              
              // Force a UI refresh to break any stuck state
              console.log('🔍 Triggering force refresh...');
              setForceRefresh(prev => prev + 1);
              console.log('🔍 Force refresh triggered');
            }, 100);
          });
        }, 0);
        
        console.log('🔍 Cancellation cleanup complete, returning...');
        
        // Force reset the document picker to prevent any stuck state
        try {
          console.log('🔍 Attempting to force reset document picker...');
          // @ts-ignore - accessing private method for emergency reset
          if (UploadService.forceResetPicker) {
            UploadService.forceResetPicker();
            console.log('🔍 Document picker force reset completed');
          }
        } catch (e) {
          console.log('🔍 Document picker force reset failed:', e);
        }
        
        return; // Exit gracefully without error
      }

      const file = fileResult.assets[0];
      if (!file.uri) {
        throw new Error('File URI not available');
      }
      

      
      setProgress({
        stage: 'uploading',
        progress: 30,
        message: `File selected: ${file.name}, processing PDF...`,
      });

      // Send PDF to backend for text extraction (same as lesson creation)
              setProgress({
          stage: 'processing',
          progress: 40,
          message: 'Uploading PDF for processing...',
        });
      
      console.log('Starting backend-based text extraction...');
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        uri: file.uri,
        type: file.mimeType
      });
      
      const formData = new FormData();
      formData.append('pdf', {
        uri: file.uri,
        type: 'application/pdf',
        name: file.name,
      } as any);

      console.log('📤 Sending request to backend...');
      console.log('🌐 Backend URL:', getBackendUrl('/api/process-pdf'));
      
      // Test backend connectivity first
      try {
        console.log('🔍 Testing backend connectivity...');
        const healthController = new AbortController();
        const healthTimeout = setTimeout(() => healthController.abort(), 10000);
        backendTimeoutRef.current = healthTimeout;
        
        const healthResponse = await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.HEALTH), {
          method: 'GET',
          signal: healthController.signal,
        });
        
        if (backendTimeoutRef.current) {
          clearTimeout(backendTimeoutRef.current);
          backendTimeoutRef.current = null;
        }
        console.log('✅ Backend health check passed:', healthResponse.status);
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError);
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }
        
        // Clear any progress interval that might be running
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        setIsProcessing(false);
        setShowProgressModal(false);
        
        Alert.alert(
          'Backend Server Not Available',
          `The backend server is not running or not accessible. Please make sure the backend server is started on ${BACKEND_CONFIG.BASE_URL}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Add timeout to prevent hanging on backend request
      backendTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Backend request timeout triggered');
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 60000); // 60 second timeout for backend
      
      let extractedText = '';
      
      try {
        console.log('🔄 Fetch request starting...');
        const webhookResponse = await fetch(getBackendUrl('/api/process-pdf'), {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current?.signal,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (backendTimeoutRef.current) {
          clearTimeout(backendTimeoutRef.current);
          backendTimeoutRef.current = null;
        }
        console.log('✅ Backend response received:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          ok: webhookResponse.ok
        });
        
        if (!webhookResponse.ok) {
          throw new Error(`Backend request failed with status ${webhookResponse.status}`);
        }

        const webhookResult = await webhookResponse.json();
        console.log('✅ PDF sent to backend successfully:', webhookResult);
        
        // Extract text from backend response (same as lesson creation)
        extractedText = webhookResult.result?.text || '';
        
        if (!extractedText) {
          throw new Error('No text extracted from PDF. The file might be corrupted or empty.');
        }
        
        console.log(`📄 Extracted ${extractedText.length} characters from ${webhookResult.result?.pageCount || 'unknown'} pages`);
        
      } catch (fetchError) {
        if (backendTimeoutRef.current) {
          clearTimeout(backendTimeoutRef.current);
          backendTimeoutRef.current = null;
        }
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }
        
        // Clear any progress interval that might be running
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        console.error('❌ Backend fetch error:', fetchError);
        
        setIsProcessing(false);
        setShowProgressModal(false);
        
        let errorMessage = 'An error occurred while processing the PDF.';
        let suggestion = '';
        
        if ((fetchError as any).name === 'AbortError') {
          errorMessage = 'Backend request timed out after 60 seconds.';
          suggestion = 'Please try again with a smaller file or split large documents into smaller parts.';
        } else if ((fetchError as any).message?.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if ((fetchError as any).message?.includes('Cannot connect')) {
          errorMessage = 'Cannot connect to backend server. Please make sure the backend is running.';
        } else if ((fetchError as any).message?.includes('File too large')) {
          errorMessage = 'File is too large for processing.';
          suggestion = 'Please try with a smaller file (under 25MB) or compress your PDF.';
        } else if ((fetchError as any).message?.includes('timeout')) {
          errorMessage = 'Processing is taking too long.';
          suggestion = 'Try with a smaller file or split large documents into smaller parts.';
        } else if ((fetchError as any).message?.includes('out of memory')) {
          errorMessage = 'File is too large for processing.';
          suggestion = 'Please try with a smaller file or compress your images.';
        } else {
          errorMessage = `Backend error: ${(fetchError as any).message || 'Unknown error'}`;
        }
        
        Alert.alert(
          'Upload Failed',
          suggestion ? `${errorMessage}\n\n${suggestion}` : errorMessage,
          [{ text: 'OK' }]
        );
        return;
      }
      
              setProgress({
          stage: 'processing',
          progress: 50,
          message: 'PDF uploaded successfully, preparing for AI analysis...',
        });

      // Check if cancelled before starting AI processing
      if (isCancelled) {
        console.log('🚫 Upload cancelled, stopping AI processing');
        return;
      }
      
      // Generate flashcards with AI - SECTION 1: handleFilePick
      const topic = selectedTopic;
      
      console.log('Starting AI flashcard generation...');
      setProgress({
        stage: 'generating',
        progress: 60,
        message: 'Connecting to AI service...',
      });
      
      setProgress({
        stage: 'generating',
        progress: 65,
        message: 'Analyzing content and creating terminology flashcards...',
      });
      
      // Ensure progress modal stays visible during AI generation
      setShowProgressModal(true);
      
      setProgress({
        stage: 'generating',
        progress: 70,
        message: 'AI is analyzing your content... AI is analyzing your content.',
        cardsGenerated: 0,
      });
      
      // Add progress updates during AI processing
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        // Check if cancelled before updating progress
        if (isCancelled) {
          console.log('🚫 Upload cancelled, stopping progress updates');
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return;
        }
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setProgress(prev => ({
          ...prev,
          message: `AI is analyzing your content... AI is analyzing your content. (${elapsed}s elapsed)`
        }));
      }, 5000); // Update every 5 seconds
      
      const flashcards = await UploadService.generateFlashcards(
        extractedText,
        userSubject,
        topic,
        userNativeLanguage,
        false,
        (progressUpdate) => {
          // Check if cancelled before updating progress
          if (isCancelled) {
            console.log('🚫 Upload cancelled during AI processing');
            return;
          }
          console.log('🔍 Progress update from AI:', progressUpdate);
          console.log('🔍 Progress cardsGenerated:', progressUpdate.cardsGenerated);
          setProgress(progressUpdate);
        },
        abortControllerRef.current?.signal, // Pass abort signal to AI service
        () => isCancelled, // Pass cancellation check function
        user?.id // Pass user ID for backend AI service
      );
      
      clearInterval(progressIntervalRef.current); // Clear progress updates when done
      progressIntervalRef.current = null;
      
      // Check if cancelled after AI processing
      if (isCancelled) {
        console.log('🚫 Upload cancelled after AI processing, not saving flashcards');
        return;
      }
      
      console.log('🔍 AI flashcard generation completed, count:', flashcards.length);
      console.log('🔍 Generated flashcards:', flashcards.slice(0, 3)); // Log first 3 cards
      
      // SECTION 1: handleFilePick - Flashcards generated count

      setProgress({
        stage: 'generating',
        progress: 80,
        message: `Generated ${flashcards.length} terminology flashcards!`,
        cardsGenerated: flashcards.length,
      });

      // Don't save to database automatically - let user review first
      console.log('🔍 Flashcards generated, waiting for user to review and save manually');

      setProgress({
        stage: 'complete',
        progress: 100,
        message: `Successfully created ${flashcards.length} terminology flashcards!`,
        cardsGenerated: flashcards.length,
      });
      
      // Trigger global refresh to update card counts everywhere
      triggerRefresh();
      
      console.log('🔍 Progress set to complete, waiting for user to click Continue...');
      
      setGeneratedFlashcards(flashcards);
      generatedFlashcardsRef.current = flashcards; // Update ref immediately
      
      // For AI Selection mode, also set the unique topics
      if (selectedTopic === 'AI Selection') {
        const topics = [...new Set(flashcards.map(card => card.topic))];
        setUniqueTopics(topics);
        setEditableFlashcards([...flashcards]);
      }


      
      // Debug: Log the generated flashcards state
      console.log('🔍 Setting generatedFlashcards:', {
        count: flashcards.length,
        flashcards: flashcards.slice(0, 2), // Log first 2 cards for debugging
        stateAfterSet: 'About to show modal'
      });
      
      // Clear safety timeout on success
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      
      // Keep progress modal open so user can click Continue
      // The handleContinue function will close it and show the review modal

    } catch (error) {
      console.error('Error processing PDF:', error);
      
      // Clear all timeouts
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      if (backendTimeoutRef.current) {
        clearTimeout(backendTimeoutRef.current);
        backendTimeoutRef.current = null;
      }
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      
      // Clear any progress interval that might be running
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Check if this was a cancellation error
      if (error instanceof Error && (error.message.includes('cancelled') || error.message.includes('Request cancelled'))) {
        console.log('🚫 Upload was cancelled - no error alert needed');
        return;
      }
      
      // Show user-friendly error message
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Backend request timed out. Please try again with a smaller file.';
        } else if (error.message.includes('timed out')) {
          errorMessage = 'AI processing timed out. Please try again with a smaller file.';
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Enhance error message for better user guidance - SECTION 1: handleFilePick - UNIQUE COMMENT
      if (errorMessage.includes('Document picker is busy')) {
        errorMessage = 'Document picker is busy. Please close any open file dialogs and try again.';
      } else if (errorMessage.includes('Different document picking in progress')) {
        errorMessage = 'Document picker is busy. Please wait for any other file operations to complete.';
      } else if (errorMessage.includes('Please select a PDF file')) {
        errorMessage = 'Please select a valid PDF file (.pdf extension).';
      } else if (errorMessage.includes('PDF file not found')) {
        errorMessage = 'The selected PDF file could not be accessed. Please select it again.';
      } else if (errorMessage.includes('Failed to extract text from PDF')) {
        errorMessage = 'Unable to read the content from the PDF. The file may be corrupted or password-protected.';
      } else if (errorMessage.includes('OpenAI API key not configured')) {
        errorMessage = 'AI service is not configured. Please check your OpenAI API key.';
      } else if (errorMessage.includes('Failed to generate flashcards with AI')) {
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

  const handleSaveFlashcards = async (flashcards: GeneratedFlashcard[]) => {
    try {
      if (user) {
        // Check if upload was cancelled before saving
        if (isCancelled) {
          console.log('🚫 Upload was cancelled - not saving flashcards to database');
          return;
        }
        
        await UploadService.saveFlashcardsToDatabase(
          flashcards,
          user.id,
          userSubject,
          userNativeLanguage,
          false,
          (progressUpdate) => {
            // Check cancellation during save progress updates
            if (isCancelled) {
              console.log('🚫 Upload cancelled during save - stopping save process');
              return;
            }
            setProgress(progressUpdate);
          },
          () => isCancelled // Pass cancellation check function
        );
        
        const message = `${flashcards.length} flashcards have been saved to your collection.`;

        Alert.alert(
          'Success!', 
          message,
          [
            {
              text: 'Continue',
              onPress: () => {
                setShowReviewModal(false);
                // Navigate back if possible, otherwise go to dashboard
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Dashboard' as never);
                }
              }
            },

          ]
        );
      }
    } catch (error) {
      console.error('Error saving flashcards:', error);
      Alert.alert('Error', 'Failed to save flashcards to database');
    }
  };

  const handleEditFlashcard = (index: number, flashcard: GeneratedFlashcard) => {
    const updatedFlashcards = [...generatedFlashcards];
    updatedFlashcards[index] = flashcard;
    setGeneratedFlashcards(updatedFlashcards);
    generatedFlashcardsRef.current = updatedFlashcards; // Update ref immediately
  };

  const handleEditTopics = () => {
    console.log('🔍 Edit Topics button clicked');
    console.log('🔍 Generated flashcards count:', generatedFlashcards.length);
    
    // Extract unique topics from generated flashcards
    const topics = [...new Set(generatedFlashcards.map(card => card.topic))];
    console.log('🔍 Extracted topics:', topics);
    
    setUniqueTopics(topics);
    setEditableFlashcards([...generatedFlashcards]);
    setShowTopicEditModal(true);
    
    console.log('🔍 Topic edit modal should now be visible');
  };

  const handleTopicNameChange = (oldTopicName: string, newTopicName: string) => {
    // Update all flashcards with the old topic name to use the new name
    const updatedFlashcards = editableFlashcards.map(card => 
      card.topic === oldTopicName ? { ...card, topic: newTopicName } : card
    );
    setEditableFlashcards(updatedFlashcards);
    
    // Update unique topics list
    setUniqueTopics(prev => 
      prev.map(topic => topic === oldTopicName ? newTopicName : topic)
    );
  };

  const handleSaveEditedTopics = () => {
    setGeneratedFlashcards(editableFlashcards);
    generatedFlashcardsRef.current = editableFlashcards; // Update ref immediately
    setShowTopicEditModal(false);
    setShowReviewModal(true);
  };

  const handleCloseProgress = () => {
    setShowProgressModal(false);
    // Always reset processing state when closing progress modal
    setIsProcessing(false);
    
    if (progress.stage === 'error') {
      // Reset progress for retry
      setProgress({
        stage: 'uploading',
        progress: 0,
        message: 'Ready to upload',
      });
    }
  };

  const handleCloseImageProcessing = () => {
    setShowImageProcessingModal(false);
    // Always reset processing state when closing image processing modal
    setIsProcessing(false);
    
    if (imageProgress.stage === 'error') {
      // Reset progress for retry
      setImageProgress({
        stage: 'selecting',
        progress: 0,
        message: 'Ready to select images',
      });
    }
  };

  const handleCancelUpload = () => {
    console.log('🚫 User cancelled upload - stopping all processes');
    
    // Set cancellation flag to stop all background processes
    setIsCancelled(true);
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear all timeouts
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    if (backendTimeoutRef.current) {
      clearTimeout(backendTimeoutRef.current);
      backendTimeoutRef.current = null;
    }
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Reset all state
    setIsProcessing(false);
    setShowProgressModal(false);
    setShowReviewModal(false);
    setShowTopicEditModal(false);
    setGeneratedFlashcards([]);
    generatedFlashcardsRef.current = [];
    
    // Reset progress
    setProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Ready to upload',
    });
    
    console.log('✅ Upload cancellation complete - no flashcards will be saved');
  };

  const handleContinue = () => {
    // Close progress modal and show appropriate review modal
    setShowProgressModal(false);
    
    // Safety check: only proceed if we have flashcards and are not processing
    if (generatedFlashcards.length > 0 && !isProcessing) {
      if (selectedTopic === 'AI Selection') {
        setShowTopicEditModal(true);
      } else {
        setShowReviewModal(true);
      }
    } else {
      console.log('🔍 handleContinue called but no flashcards or still processing, ignoring');
    }
  };

  const handleRetryUpload = () => {
    // Reset error state and try again
    setProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Ready to upload',
    });
    setImageProgress({
      stage: 'selecting',
      progress: 0,
      message: 'Ready to select images',
    });
    setShowProgressModal(false);
    setShowImageProcessingModal(false);
    // User can try uploading again
  };

  const handleUseAlternative = () => {
    // Close progress modal and show alternative options
    setShowProgressModal(false);
    setShowImageProcessingModal(false);
    setIsProcessing(false);
    // The fallback buttons (Test with Sample Content, Enter Text Manually) are already visible
  };

  // Image handling functions
  const handleImagePick = async () => {
    if (!selectedTopic) {
      Alert.alert('Select Topic', 'Please select a topic before uploading images.');
      return;
    }

    try {
      const images = await ImageUploadService.pickImages();
      setSelectedImages(images);
      setShowImagePreview(true);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('cancelled')) {
        // Don't log cancellation errors - they're normal user actions
        Alert.alert('Error', error.message);
      }
      // Don't log cancellation errors - they're normal user actions
    }
  };

  const handleTakePhoto = async () => {
    if (!selectedTopic) {
      Alert.alert('Select Topic', 'Please select a topic before taking photos.');
      return;
    }

    try {
      const images = await ImageUploadService.takePhoto();
      setSelectedImages(images);
      setShowImagePreview(true);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('cancelled')) {
        // Don't log cancellation errors - they're normal user actions
        Alert.alert('Error', error.message);
      }
      // Don't log cancellation errors - they're normal user actions
    }
  };

  const handleImageRetake = () => {
    setShowImagePreview(false);
    setSelectedImages([]);
  };

  const handleAddMoreImages = async () => {
    try {
      const newImages = await ImageUploadService.pickImages();
      const combinedImages = [...selectedImages, ...newImages];
      
      if (combinedImages.length > 5) {
        Alert.alert('Too Many Images', 'Maximum 5 images allowed. Please select fewer images.');
        return;
      }
      
      setSelectedImages(combinedImages);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('cancelled')) {
        // Don't log cancellation errors - they're normal user actions
        Alert.alert('Error', error.message);
      }
      // Don't log cancellation errors - they're normal user actions
    }
  };

  const handleProcessImages = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select images to process.');
      return;
    }

    try {
      // Reset cancellation state
      setIsCancelled(false);
      
      // Create new AbortController for this upload session
      abortControllerRef.current = new AbortController();
      
      setIsProcessing(true);
      setShowImageProcessingModal(true);
      setShowImagePreview(false);
      
      // Add safety timeout
      safetyTimeoutRef.current = setTimeout(() => {
        console.log('⚠️ Safety timeout triggered - image processing taking longer than expected');
        
        setIsProcessing(false);
        setImageProgress({
          stage: 'error',
          progress: 0,
          message: 'Image processing timed out. The process has been stopped.',
        });
        
        // Keep the image processing modal visible to show the error
        setShowImageProcessingModal(true);
      }, 300000); // 5 minute timeout for image processing
      
      // Update progress for image processing
      setImageProgress({
        stage: 'uploading',
        progress: 10,
        message: `Processing ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}...`,
        totalImages: selectedImages.length,
      });

      // Process images with OCR
      const imageResult = await ImageUploadService.processImages(
        selectedImages,
        (progressUpdate) => {
          // Check if cancelled before updating progress
          if (isCancelled) {
            console.log('🚫 Image processing cancelled');
            return;
          }
          
          setImageProgress({
            stage: progressUpdate.stage,
            progress: progressUpdate.progress,
            message: progressUpdate.message,
            imagesProcessed: progressUpdate.imagesProcessed,
            totalImages: progressUpdate.totalImages,
          });
        }
      );

      // Check if cancelled after image processing
      if (isCancelled) {
        console.log('🚫 Image processing cancelled, stopping AI processing');
        return;
      }

      setImageProgress({
        stage: 'complete',
        progress: 100,
        message: `Successfully processed ${imageResult.imagesProcessed}/${imageResult.totalImages} images!`,
        imagesProcessed: imageResult.imagesProcessed,
        totalImages: imageResult.totalImages,
      });

      // Close image processing modal and show AI processing modal
      setShowImageProcessingModal(false);
      setShowProgressModal(true);

      // Generate flashcards with AI using extracted text
      const topic = selectedTopic;
      
      console.log('Starting AI flashcard generation from images...');
      setProgress({
        stage: 'generating',
        progress: 75,
        message: 'Connecting to AI service...',
      });
      
      setProgress({
        stage: 'generating',
        progress: 80,
        message: 'Analyzing extracted text and creating terminology flashcards...',
      });
      
      // Ensure progress modal stays visible during AI generation
      setShowProgressModal(true);
      
      setProgress({
        stage: 'generating',
        progress: 85,
        message: 'AI is analyzing your content... AI is analyzing your content.',
        cardsGenerated: 0,
      });
      
      // Add progress updates during AI processing
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        // Check if cancelled before updating progress
        if (isCancelled) {
          console.log('🚫 Image processing cancelled, stopping progress updates');
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return;
        }
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setProgress(prev => ({
          ...prev,
          message: `AI is analyzing your content... AI is analyzing your content. (${elapsed}s elapsed)`
        }));
      }, 5000); // Update every 5 seconds
      
      // Debug: Check what text we're passing to AI
      console.log('🔍 DEBUG: imageResult structure:', {
        hasText: !!imageResult.text,
        textLength: imageResult.text?.length || 0,
        textPreview: imageResult.text?.substring(0, 200) + '...',
        fullResult: imageResult
      });
      
      // Validate that text was extracted before calling AI
      const extractedText = imageResult.text?.trim() || '';
      if (!extractedText || extractedText.length === 0) {
        console.log('❌ No text extracted from images - preventing AI call');
        throw new Error('No text could be extracted from the images. Please ensure the images contain clear, readable text.');
      }
      
      console.log(`✅ Text validation passed: ${extractedText.length} characters extracted`);
      
      const flashcards = await UploadService.generateFlashcards(
        extractedText,
        userSubject,
        topic,
        userNativeLanguage,
        false,
        (progressUpdate) => {
          // Check if cancelled before updating progress
          if (isCancelled) {
            console.log('🚫 Image processing cancelled during AI processing');
            return;
          }
          console.log('🔍 Progress update from AI:', progressUpdate);
          setProgress(progressUpdate);
        },
        abortControllerRef.current?.signal, // Pass abort signal to AI service
        () => isCancelled, // Pass cancellation check function
        user?.id // Pass user ID for backend AI service
      );
      
      clearInterval(progressIntervalRef.current); // Clear progress updates when done
      progressIntervalRef.current = null;
      
      // Check if cancelled after AI processing
      if (isCancelled) {
        console.log('🚫 Image processing cancelled after AI processing, not saving flashcards');
        return;
      }
      
      console.log('🔍 AI flashcard generation completed, count:', flashcards.length);
      
      setProgress({
        stage: 'generating',
        progress: 90,
        message: `Generated ${flashcards.length} terminology flashcards!`,
        cardsGenerated: flashcards.length,
      });

      // Don't save to database automatically - let user review first
      console.log('🔍 Flashcards generated from images, waiting for user to review and save manually');

      setProgress({
        stage: 'complete',
        progress: 100,
        message: `Successfully created ${flashcards.length} terminology flashcards from images!`,
        cardsGenerated: flashcards.length,
      });
      
      // Trigger global refresh to update card counts everywhere
      triggerRefresh();
      
      console.log('🔍 Progress set to complete, waiting for user to click Continue...');
      
      setGeneratedFlashcards(flashcards);
      generatedFlashcardsRef.current = flashcards; // Update ref immediately
      
      // For AI Selection mode, also set the unique topics
      if (selectedTopic === 'AI Selection') {
        const topics = [...new Set(flashcards.map(card => card.topic))];
        setUniqueTopics(topics);
        setEditableFlashcards([...flashcards]);
      }

      // Clear safety timeout on success
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      
      // Clear selected images
      setSelectedImages([]);

    } catch (error) {
      // Don't console.error here - it creates LogBox notifications
      // The error is already shown in the ImageProcessingModal
      
      // Clear all timeouts
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Check if this was a cancellation error
      if (error instanceof Error && (error.message.includes('cancelled') || error.message.includes('Request cancelled'))) {
        console.log('🚫 Image processing was cancelled - no error alert needed');
        return;
      }
      
      // Show user-friendly error message
      let errorMessage = 'An unexpected error occurred while processing images';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Image processing timed out. Please try again with smaller images.';
        } else if (error.message.includes('timed out')) {
          errorMessage = 'AI processing timed out. Please try again with smaller images.';
        } else if (error.message.includes('No text could be extracted')) {
          errorMessage = 'No text could be extracted from the images. Please ensure the images contain clear, readable text.';
        } else if (error.message.includes('No valid images selected')) {
          errorMessage = error.message; // Use the detailed error message from image validation
        } else if (error.message.includes('Maximum 10 images')) {
          errorMessage = error.message; // Use the detailed error message from image validation
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Backend request failed')) {
          errorMessage = 'Server error. Please try again in a few moments.';
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Update image progress with the user-friendly error message
      setImageProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage,
      });
      
      // Keep the image processing modal visible to show the error
      setShowImageProcessingModal(true);
      
    } finally {
      setIsProcessing(false);
    }
  };

  // Emergency reset function - always available
  const emergencyReset = () => {
    
    setIsProcessing(false);
    setShowProgressModal(false);
    setShowReviewModal(false);
    setShowTopicEditModal(false);
    setProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Ready to upload',
    });
    
    // Navigate back if possible, otherwise go to dashboard
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Navigate to dashboard if no previous screen
      navigation.navigate('Dashboard' as never);
    }
  };



  // For React Native, we'll use a simpler approach
  // The error boundary in App.tsx should catch most errors

  return (
    <SafeAreaView key={forceRefresh} style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (isProcessing) {
              Alert.alert(
                'Upload in Progress',
                'Please wait for the current upload to complete or cancel it before going back.',
                [{ text: 'OK', style: 'default' }]
              );
            } else {
              // Navigate back if possible, otherwise go to dashboard
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Dashboard' as never);
              }
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Flashcard Generation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Topic Selection */}
        <View style={styles.topicSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="folder" size={20} color="#6366f1" />
            <Text style={styles.sectionTitle}>Select Topic</Text>
          </View>
          {!showTopicInput ? (
            <View style={styles.topicSelectionContainer}>
              <TouchableOpacity
                style={styles.topicDropdown}
                onPress={() => setShowTopicPicker(!showTopicPicker)}
              >
                <Text style={styles.topicDropdownText}>
                  {selectedTopic || 'Select a topic'}
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
                      setSelectedTopic(newTopicInput.trim());
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
              {/* AI Selection Option */}
              <TouchableOpacity
                style={[styles.topicOption, styles.aiSelectionOption]}
                onPress={() => {
                  setSelectedTopic('AI Selection');
                  setShowTopicPicker(false);
                }}
              >
                <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                <Text style={[styles.topicOptionText, styles.aiSelectionText]}>AI Selection</Text>
                <Text style={styles.aiSelectionSubtext}>Auto-detect topics</Text>
              </TouchableOpacity>
              
              {/* Existing topics */}
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.topicOption}
                  onPress={() => {
                    setSelectedTopic(topic.name);
                    setShowTopicPicker(false);
                  }}
                >
                  <Text style={styles.topicOptionText}>{topic.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>



        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIcon}>
            <Ionicons name="cloud-upload" size={32} color="#6366f1" />
          </View>
          <Text style={styles.uploadTitle}>Upload Your Course Notes</Text>
          <Text style={styles.uploadSubtitle}>
            Upload PDFs or take photos to automatically generate flashcards using AI
          </Text>
          
          {/* Upload Options */}
          <View style={styles.uploadOptions}>
            {/* PDF Upload */}
            <TouchableOpacity
              style={[
                styles.uploadButton,
                styles.pdfButton,
                (!selectedTopic || isProcessing) && styles.disabledButton
              ]}
              onPress={handleFilePick}
              disabled={!selectedTopic || isProcessing}
            >
              <Ionicons name="document" size={20} color="#ffffff" />
              <Text style={styles.uploadButtonText}>
                {isProcessing ? 'Processing...' : selectedTopic === 'AI Selection' ? 'Choose PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>

            {/* Camera Options */}
            <View style={styles.cameraOptions}>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  styles.cameraButton,
                  (!selectedTopic || isProcessing) && styles.disabledButton
                ]}
                onPress={handleTakePhoto}
                disabled={!selectedTopic || isProcessing}
              >
                <Ionicons name="camera" size={20} color="#ffffff" />
                <Text style={styles.uploadButtonText}>
                  {isProcessing ? 'Processing...' : 'Take Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  styles.galleryButton,
                  (!selectedTopic || isProcessing) && styles.disabledButton
                ]}
                onPress={handleImagePick}
                disabled={!selectedTopic || isProcessing}
              >
                <Ionicons name="images" size={20} color="#ffffff" />
                <Text style={styles.uploadButtonText}>
                  {isProcessing ? 'Processing...' : 'Choose Photos'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* How it works */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoSteps}>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Upload PDFs or take photos of your course notes</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>AI extracts text and analyzes content for key concepts</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Review and edit generated flashcards</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Save to your personal collection</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Progress Modal */}
      <UploadProgressModal
        visible={showProgressModal}
        progress={progress}
        onClose={handleCloseProgress}
        onCancel={handleCancelUpload}
        onRetry={progress.stage === 'error' ? handleRetryUpload : undefined}
        onUseAlternative={progress.stage === 'error' ? handleUseAlternative : undefined}
        onContinue={handleContinue}
      />

      {/* Image Processing Modal */}
      <ImageProcessingModal
        visible={showImageProcessingModal}
        progress={imageProgress}
        onClose={handleCloseImageProcessing}
        onCancel={handleCancelUpload}
        onRetry={imageProgress.stage === 'error' ? handleRetryUpload : undefined}
        onUseAlternative={imageProgress.stage === 'error' ? handleUseAlternative : undefined}
        onContinue={handleContinue}
      />

      {/* Topic Edit Modal */}
      <TopicEditModal
        visible={showTopicEditModal}
        topics={uniqueTopics}
        onTopicChange={handleTopicNameChange}
        onSave={handleSaveEditedTopics}
        onClose={() => setShowTopicEditModal(false)}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={showImagePreview}
        images={selectedImages}
        onClose={() => setShowImagePreview(false)}
        onConfirm={handleProcessImages}
        onRetake={handleImageRetake}
        onAddMore={handleAddMoreImages}
        isProcessing={isProcessing}
      />

      {/* Review Modal */}
      <FlashcardReviewModal
        visible={showReviewModal}
        flashcards={generatedFlashcards}
        onClose={() => setShowReviewModal(false)}
        onSave={handleSaveFlashcards}
        onEdit={handleEditFlashcard}
        onEditTopics={handleEditTopics}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  topicSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  topicSelectionContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  topicDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  topicDropdownText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  newTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  newTopicButtonText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  newTopicInputContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newTopicActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelNewTopicButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelNewTopicButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
  },
  confirmNewTopicButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmNewTopicButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  topicOptionsContainer: {
    maxHeight: 200,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  topicOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  topicOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  uploadArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadIcon: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  uploadOptions: {
    gap: 16,
    width: '100%',
  },
  pdfButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flex: 1,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flex: 1,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoSteps: {
    gap: 12,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
  },
  aiSelectionOption: {
    backgroundColor: '#f3f4f6',
    borderColor: '#8b5cf6',
    borderWidth: 2,
  },
  aiSelectionText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  aiSelectionSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  

});
