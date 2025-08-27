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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UploadService, UploadProgress, GeneratedFlashcard } from '../lib/uploadService';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import FlashcardReviewModal from '../components/FlashcardReviewModal';
import UploadProgressModal from '../components/UploadProgressModal';
import { TopicEditModal } from '../components/TopicEditModal';

const { width: screenWidth } = Dimensions.get('window');

export default function UploadScreen() {
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTopicEditModal, setShowTopicEditModal] = useState(false);
  const [editableFlashcards, setEditableFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [uniqueTopics, setUniqueTopics] = useState<string[]>([]);

  
  // Use ref to ensure we always have the latest generatedFlashcards value
  const generatedFlashcardsRef = useRef<GeneratedFlashcard[]>([]);
  
  // Debug: Track when generatedFlashcards state changes
  useEffect(() => {
    console.log('🔍 generatedFlashcards state changed:', {
      count: generatedFlashcards.length,
      isEmpty: generatedFlashcards.length === 0,
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n') // Get call stack
    });
  }, [generatedFlashcards]);
  
  // Debug: Track when review modal visibility changes
  useEffect(() => {
    if (showReviewModal) {
      console.log('🔍 showReviewModal changed to true, current flashcards count:', generatedFlashcards.length);
    }
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
      
      const generalFlashcards = await FlashcardService.getAllFlashcards();
      const generalTopics = Array.from(new Set(generalFlashcards.map((card: any) => card.topic)));
      
      const allTopics = Array.from(new Set([...userTopics, ...generalTopics])) as string[];
      
      if (allTopics.length === 0) {
        // Fallback to some default topics if none exist
        setTopics([
          { id: 'medicine', name: 'Medicine', icon: 'medical-outline', color: '#ef4444', count: 0 },
          { id: 'engineering', name: 'Engineering', icon: 'construct-outline', color: '#3b82f6', count: 0 },
          { id: 'physics', name: 'Physics', icon: 'nuclear-outline', color: '#8b5cf6', count: 0 },
        ]);
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
      // Fallback to default topics on error
      setTopics([
        { id: 'medicine', name: 'Medicine', icon: 'medical-outline', color: '#ef4444', count: 0 },
        { id: 'engineering', name: 'Engineering', icon: 'construct-outline', color: '#3b82f6', count: 0 },
        { id: 'physics', name: 'Physics', icon: 'nuclear-outline', color: '#8b5cf6', count: 0 },
      ]);
    }
  };

  const handleFilePick = async () => {
    // SECTION 1: handleFilePick - Main PDF upload function
    if (!selectedTopic) {
      Alert.alert('Error', 'Please select or create a topic first');
      return;
    }

    try {

      setIsProcessing(true);
      setShowProgressModal(true);
      
      // Add safety timeout to prevent indefinite freezing
      const safetyTimeout = setTimeout(() => {
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
      }, 600000); // 10 minute timeout to allow for AI processing
      
      // Update progress for file picking
      setProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Selecting PDF file...',
      });

      // Pick PDF file with enhanced error handling
      let result;
      try {
  
        result = await UploadService.pickPDF();
  
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
        
        // Close progress modal and reset state
        setShowProgressModal(false);
        setIsProcessing(false);
        return;
      }
      
      if (result.canceled) {
        setIsProcessing(false);
        setShowProgressModal(false);
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error('No file selected');
      }

      const file = result.assets[0];
      

      
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
        message: 'AI is now analyzing your content and creating terminology flashcards...',
        cardsGenerated: 0,
      });
      
      const flashcards = await UploadService.generateFlashcards(
        extractedText,
        userSubject,
        topic,
        userNativeLanguage,
        (progressUpdate: UploadProgress) => {
          console.log('🔍 Progress update from AI:', progressUpdate);
          console.log('🔍 Progress cardsGenerated:', progressUpdate.cardsGenerated);
          setProgress(progressUpdate);
        }
      );
      console.log('🔍 AI flashcard generation completed, count:', flashcards.length);
      console.log('🔍 Generated flashcards:', flashcards.slice(0, 3)); // Log first 3 cards
      
      // SECTION 1: handleFilePick - Flashcards generated count

      setProgress({
        stage: 'generating',
        progress: 80,
        message: `Generated ${flashcards.length} terminology flashcards!`,
        cardsGenerated: flashcards.length,
      });

      // Save to database
      setProgress({
        stage: 'processing',
        progress: 85,
        message: 'Saving flashcards to database...',
      });
      
      if (user) {
        await UploadService.saveFlashcardsToDatabase(
          flashcards,
          user.id,
          userSubject,
          userNativeLanguage,
          (progressUpdate: UploadProgress) => setProgress(progressUpdate)
        );
      }

      setProgress({
        stage: 'complete',
        progress: 100,
        message: `Successfully created ${flashcards.length} terminology flashcards!`,
        cardsGenerated: flashcards.length,
      });
      
      console.log('🔍 Progress set to complete, waiting for user to click Continue...');
      
      setGeneratedFlashcards(flashcards);
      generatedFlashcardsRef.current = flashcards; // Update ref immediately
      
      // For AI Selection mode, also set the unique topics
      if (selectedTopic === 'AI Selection') {
        const topics = [...new Set(flashcards.map((card: GeneratedFlashcard) => card.topic))];
        setUniqueTopics(topics as string[]);
        setEditableFlashcards([...flashcards]);
      }


      
      // Debug: Log the generated flashcards state
      console.log('🔍 Setting generatedFlashcards:', {
        count: flashcards.length,
        flashcards: flashcards.slice(0, 2), // Log first 2 cards for debugging
        stateAfterSet: 'About to show modal'
      });
      
      // Clear safety timeout on success
      clearTimeout(safetyTimeout);
      
      // Keep progress modal open so user can click Continue
      // The handleContinue function will close it and show the review modal

    } catch (error) {
      console.error('Error processing PDF:', error);
      
      // Show user-friendly error message
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
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
      } else if (errorMessage.includes('No file selected')) {
        errorMessage = 'No file was selected. Please choose a PDF file to upload.';
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
        await UploadService.saveFlashcardsToDatabase(
          flashcards,
          user.id,
          userSubject,
          userNativeLanguage,
          (progressUpdate: UploadProgress) => setProgress(progressUpdate)
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
    // Extract unique topics from generated flashcards
    const topics = [...new Set(generatedFlashcards.map(card => card.topic))];
    setUniqueTopics(topics);
    setEditableFlashcards([...generatedFlashcards]);
    setShowTopicEditModal(true);
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

  const handleContinue = () => {
    // Close progress modal and show appropriate review modal
    setShowProgressModal(false);
    
    if (generatedFlashcards.length > 0) {
      if (selectedTopic === 'AI Selection') {
        setShowTopicEditModal(true);
      } else {
        setShowReviewModal(true);
      }
    }
  };

  const handleRetryUpload = () => {
    // Reset error state and try again
    setProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Ready to upload',
    });
    setShowProgressModal(false);
    // User can try uploading again
  };

  const handleUseAlternative = () => {
    // Close progress modal and show alternative options
    setShowProgressModal(false);
    setIsProcessing(false);
    // The fallback buttons (Test with Sample Content, Enter Text Manually) are already visible
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
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.headerTitle}>Upload Notes</Text>
        <TouchableOpacity 
          style={styles.emergencyButton} 
          onPress={emergencyReset}
        >
          <Ionicons name="refresh-circle" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Subject Display */}
        <View style={styles.subjectCard}>
          <View style={styles.subjectIcon}>
            <Ionicons name="school" size={24} color="#6366f1" />
          </View>
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectLabel}>Subject</Text>
            <Text style={styles.subjectValue}>{userSubject}</Text>
          </View>
        </View>

        {/* Topic Selection */}
        <View style={styles.topicSection}>
          <Text style={styles.sectionTitle}>Select Topic</Text>
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

        {/* AI Selection Info */}
        {selectedTopic === 'AI Selection' && (
          <View style={styles.aiSelectionInfo}>
            <View style={styles.aiSelectionInfoHeader}>
              <Ionicons name="information-circle" size={20} color="#8b5cf6" />
              <Text style={styles.aiSelectionInfoTitle}>AI Topic Detection</Text>
            </View>
            <Text style={styles.aiSelectionInfoText}>
              AI will analyze your content and automatically create flashcards organized by natural topic divisions found in your notes. This includes:
            </Text>
            <View style={styles.aiSelectionFeatures}>
              <View style={styles.aiFeature}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.aiFeatureText}>Header-based topic separation</Text>
              </View>
              <View style={styles.aiFeature}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.aiFeatureText}>Content theme analysis</Text>
              </View>
              <View style={styles.aiFeature}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.aiFeatureText}>Automatic topic naming</Text>
              </View>
            </View>
          </View>
        )}



        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIcon}>
            <Ionicons name="cloud-upload" size={56} color="#6366f1" />
          </View>
          <Text style={styles.uploadTitle}>Upload Your Course Notes</Text>
          <Text style={styles.uploadSubtitle}>
            Upload PDFs to automatically generate flashcards using AI
          </Text>
          
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!selectedTopic || isProcessing) && styles.disabledButton
            ]}
            onPress={handleFilePick}
            disabled={!selectedTopic || isProcessing}
          >
            <Ionicons name="document" size={22} color="#ffffff" />
            <Text style={styles.uploadButtonText}>
              {isProcessing ? 'Processing...' : selectedTopic === 'AI Selection' ? 'Choose PDF for AI Topic Detection' : 'Choose PDF File'}
                </Text>
              </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoSteps}>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Upload your PDF course notes</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>AI analyzes content and extracts key concepts</Text>
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
        onRetry={progress.stage === 'error' ? handleRetryUpload : undefined}
        onUseAlternative={progress.stage === 'error' ? handleUseAlternative : undefined}
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  emergencyButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectLabel: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  subjectValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  topicSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  topicSelectionContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  topicDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topicDropdownText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  newTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newTopicButtonText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topicOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topicOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  uploadArea: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  uploadIcon: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
  },
  uploadTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  uploadSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoSteps: {
    gap: 20,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 16,
    color: '#64748b',
    flex: 1,
    lineHeight: 24,
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
  aiSelectionInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  aiSelectionInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiSelectionInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8b5cf6',
    marginLeft: 10,
  },
  aiSelectionInfoText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 20,
  },
  aiSelectionFeatures: {
    gap: 12,
  },
  aiFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiFeatureText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },

});
