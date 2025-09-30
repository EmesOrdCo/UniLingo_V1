import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { getBackendUrl } from '../config/backendConfig';
import { LessonService } from '../lib/lessonService';
import BackendAIService from '../lib/backendAIService';

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ImageUploadService, ImageUploadProgress, ImageProcessingResult } from '../lib/imageUploadService';
import ImagePreviewModal from '../components/ImagePreviewModal';

import { supabase } from '../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function CreateLessonScreen() {
  const { triggerRefresh } = useRefresh();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    stage: 'ready',
    progress: 0,
    message: 'Ready to create lesson',
  });
  
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Get user's subject and native language from profile
  const userSubject = profile?.subjects?.[0] || 'General';
  const userNativeLanguage = profile?.native_language || 'English';
  
  // Use user's subject automatically
  const selectedSubject = userSubject;

  const handleFilePick = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create lessons');
      return;
    }

    try {
      // Reset cancellation state
      setIsCancelled(false);
      
      // Create new AbortController for this upload session
      abortControllerRef.current = new AbortController();
      
      setIsProcessing(true);
      setProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Selecting PDF file...',
      });

      // Pick PDF file
      const fileResult = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      // Handle user cancellation gracefully
      if (!fileResult || !fileResult.assets || fileResult.assets.length === 0) {
        console.log('📄 User cancelled PDF selection');
        
        // Set cancellation flag to stop all background processes
        setIsCancelled(true);
        console.log('🔍 Set cancellation flag to true');
        
        // Abort any ongoing requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log('🔍 Aborted ongoing requests');
        }
        
        // Clear any timeouts
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setIsProcessing(false);
        setProgress({
          stage: 'ready',
          progress: 0,
          message: 'Ready to create lesson',
        });
        return; // Exit gracefully without error
      }

      const file = fileResult.assets[0];
      if (!file.uri) {
        throw new Error('File URI not available');
      }

              setProgress({
          stage: 'processing',
          progress: 40,
          message: 'Uploading PDF for processing...',
        });

      // Send PDF to Zapier webhook for text extraction
      const formData = new FormData();
      formData.append('pdf', {
        uri: file.uri,
        type: 'application/pdf',
        name: file.name,
      } as any);

      const webhookResponse = await fetch(getBackendUrl('/api/process-pdf'), {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current?.signal,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!webhookResponse.ok) {
        throw new Error('Failed to send PDF to webhook for processing');
      }

      const webhookResult = await webhookResponse.json();
      console.log('✅ PDF sent to backend API successfully:', webhookResult);

      setProgress({
        stage: 'processing',
        progress: 60,
        message: 'PDF uploaded successfully, analyzing content...',
      });

      // Extract text from the backend API response
      const extractedText = webhookResult.result?.text || 'Text extraction failed';
      const pages = webhookResult.result?.pages || [];

      // Check if cancelled before starting AI processing
      if (isCancelled) {
        console.log('🚫 Upload cancelled, stopping AI processing');
        return;
      }
      
      // Generate lesson using backend AI service
      setProgress({
        stage: 'processing',
        progress: 85,
        message: 'Generating lesson with AI...',
      });

      let createdLessons: any[] = [];

      try {
        console.log('📚 Generating lesson using backend AI service...');
        
        // Use backend AI service for rate limiting
        const backendResult = await BackendAIService.generateLesson(
          extractedText,
          selectedSubject,
          'AI Selection', // Use AI Selection mode for automatic topic detection
          user?.id || '',
          userNativeLanguage || 'English'
        );
        
        if (!backendResult.success || !backendResult.lessons) {
          throw new Error(backendResult.error || 'Failed to generate lesson');
        }
        
        const lessons = backendResult.lessons;
        
        // Handle both single lesson (legacy) and multiple lessons (new)
        if (Array.isArray(lessons)) {
          createdLessons = lessons;
          console.log(`✅ Created ${lessons.length} lessons`);
        } else {
          createdLessons.push(lessons);
          console.log(`✅ Created lesson: ${lessons?.title || 'Unknown'}`);
        }
        
        setProgress({
          stage: 'completed',
          progress: 100,
          message: `Generated ${createdLessons.length} lesson${createdLessons.length > 1 ? 's' : ''}`,
        });
      } catch (lessonError) {
        console.error('❌ Lesson creation failed:', lessonError);
        throw new Error('Failed to create lesson with AI content');
      }

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Lesson created successfully!',
      });

      // Trigger global refresh to update lesson counts everywhere
      triggerRefresh();

      // Show success message
      Alert.alert(
        'Success! 🎓',
        `Created ${createdLessons?.length || 1} lesson${createdLessons?.length > 1 ? 's' : ''} from your PDF!`,
        [
          {
            text: 'View Lessons',
            onPress: () => {
              navigation.navigate('Dashboard' as never);
            }
          },
          {
            text: 'Create Another',
            onPress: () => {
              setProgress({
                stage: 'ready',
                progress: 0,
                message: 'Ready to create lesson',
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating lesson:', error);
      
      let errorMessage = 'An unexpected error occurred';
      let suggestion = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add specific suggestions based on error type
        if (error.message.includes('File too large')) {
          suggestion = 'Please try with a smaller file (under 25MB) or compress your PDF.';
        } else if (error.message.includes('timeout')) {
          suggestion = 'Try with a smaller file or split large documents into smaller parts.';
        } else if (error.message.includes('out of memory')) {
          suggestion = 'Please try with a smaller file or compress your images.';
        } else if (error.message.includes('Network request failed')) {
          suggestion = 'Please check your internet connection and try again.';
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setProgress({
        stage: 'error',
        progress: 0,
        message: suggestion ? `${errorMessage}\n\n${suggestion}` : errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Image handling functions
  const handleImagePick = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create lessons');
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
    if (!user) {
      Alert.alert('Error', 'Please log in to create lessons');
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
      setShowImagePreview(false);
      
      // Add safety timeout
      timeoutRef.current = setTimeout(() => {
        console.log('⚠️ Safety timeout triggered - image processing taking longer than expected');
        
        setIsProcessing(false);
        setProgress({
          stage: 'error',
          progress: 0,
          message: 'Image processing timed out. The process has been stopped.',
        });
        
        Alert.alert(
          'Processing Timeout',
          'The image processing has been stopped due to timeout. Please try with fewer or smaller images.',
          [{ text: 'OK', style: 'default' }]
        );
      }, 300000); // 5 minute timeout for image processing
      
      // Update progress for image processing
      setProgress({
        stage: 'uploading',
        progress: 10,
        message: `Processing ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}...`,
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
          
          setProgress({
            stage: 'processing',
            progress: 30 + (progressUpdate.progress * 0.4), // Map to 30-70% range
            message: progressUpdate.message,
          });
        }
      );

      // Check if cancelled after image processing
      if (isCancelled) {
        console.log('🚫 Image processing cancelled, stopping lesson creation');
        return;
      }

      setProgress({
        stage: 'processing',
        progress: 70,
        message: 'Images processed successfully, analyzing content...',
      });

      // Extract text from images for lesson creation
      const extractedText = imageResult.text?.trim() || '';
      const pages = imageResult.pages;

      // Validate that text was extracted before calling AI
      if (!extractedText || extractedText.length === 0) {
        console.log('❌ No text extracted from images - preventing AI call');
        throw new Error('No text could be extracted from the images. Please ensure the images contain clear, readable text.');
      }

      console.log(`✅ Text validation passed: ${extractedText.length} characters extracted`);

      // Check if cancelled before starting AI processing
      if (isCancelled) {
        console.log('🚫 Upload cancelled, stopping AI processing');
        return;
      }
      
      // Generate lesson using backend AI service
      setProgress({
        stage: 'processing',
        progress: 85,
        message: 'Generating lesson with AI...',
      });

      let createdLessons: any[] = [];

      try {
        console.log('📚 Generating lesson using backend AI service...');
        
        // Use backend AI service for rate limiting
        const backendResult = await BackendAIService.generateLesson(
          extractedText,
          selectedSubject,
          'AI Selection', // Use AI Selection mode for automatic topic detection
          user?.id || '',
          userNativeLanguage || 'English'
        );
        
        if (!backendResult.success || !backendResult.lessons) {
          throw new Error(backendResult.error || 'Failed to generate lesson');
        }
        
        const lessons = backendResult.lessons;
        
        // Handle both single lesson (legacy) and multiple lessons (new)
        if (Array.isArray(lessons)) {
          createdLessons = lessons;
          console.log(`✅ Created ${lessons.length} lessons`);
        } else {
          createdLessons.push(lessons);
          console.log(`✅ Created lesson: ${lessons?.title || 'Unknown'}`);
        }
        
        setProgress({
          stage: 'completed',
          progress: 100,
          message: `Generated ${createdLessons.length} lesson${createdLessons.length > 1 ? 's' : ''}`,
        });
      } catch (lessonError) {
        console.error('❌ Lesson creation failed:', lessonError);
        throw new Error('Failed to create lesson with AI content');
      }

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Lesson created successfully!',
      });

      // Trigger global refresh to update lesson counts everywhere
      triggerRefresh();

      // Clear selected images
      setSelectedImages([]);

      // Show success message
      Alert.alert(
        'Success! 🎓',
        `Created ${createdLessons?.length || 1} lesson${createdLessons?.length > 1 ? 's' : ''} from your images!`,
        [
          {
            text: 'View Lessons',
            onPress: () => {
              navigation.navigate('Dashboard' as never);
            }
          },
          {
            text: 'Create Another',
            onPress: () => {
              setProgress({
                stage: 'ready',
                progress: 0,
                message: 'Ready to create lesson',
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error processing images:', error);
      
      // Clear all timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
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
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage,
      });
      
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Lesson</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>AI-Powered Vocabulary Lessons</Text>
          <Text style={styles.descriptionText}>
            Upload your course notes and let AI create an interactive vocabulary lesson 
            tailored to your subject area.
          </Text>
        </View>

        {/* Subject Display */}
        <View style={styles.subjectSection}>
          <View style={styles.subjectDisplay}>
            <Ionicons name="school" size={18} color="#6366f1" />
            <Text style={styles.subjectDisplayText}>{selectedSubject}</Text>
          </View>
        </View>

        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIcon}>
            <Ionicons name="document-text" size={48} color="#6366f1" />
          </View>
          <Text style={styles.uploadTitle}>Upload Course Notes</Text>
          <Text style={styles.uploadSubtitle}>
            Select a PDF file or take photos to create your lesson
          </Text>
          
          {/* Upload Options */}
          <View style={styles.uploadOptions}>
            {/* PDF Upload */}
            <TouchableOpacity
              style={[
                styles.uploadButton,
                styles.pdfButton,
                (!selectedSubject || isProcessing) && styles.disabledButton
              ]}
              onPress={handleFilePick}
              disabled={!selectedSubject || isProcessing}
            >
              <Ionicons name="cloud-upload" size={20} color="#ffffff" />
              <Text style={styles.uploadButtonText}>
                {isProcessing ? 'Creating Lesson...' : 'Choose PDF File'}
              </Text>
            </TouchableOpacity>

            {/* Camera Options */}
            <View style={styles.cameraOptions}>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  styles.cameraButton,
                  (!selectedSubject || isProcessing) && styles.disabledButton
                ]}
                onPress={handleTakePhoto}
                disabled={!selectedSubject || isProcessing}
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
                  (!selectedSubject || isProcessing) && styles.disabledButton
                ]}
                onPress={handleImagePick}
                disabled={!selectedSubject || isProcessing}
              >
                <Ionicons name="images" size={20} color="#ffffff" />
                <Text style={styles.uploadButtonText}>
                  {isProcessing ? 'Processing...' : 'Choose Photos'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        {isProcessing && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress.message}</Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What you'll get</Text>
          <View style={styles.infoSteps}>
            <View style={styles.infoStep}>
              <Ionicons name="flash" size={20} color="#6366f1" />
              <Text style={styles.stepText}>AI extracts key vocabulary terms</Text>
            </View>
            <View style={styles.infoStep}>
              <Ionicons name="book" size={20} color="#6366f1" />
              <Text style={styles.stepText}>Creates structured lesson content</Text>
            </View>
            <View style={styles.infoStep}>
              <Ionicons name="school" size={20} color="#6366f1" />
              <Text style={styles.stepText}>Interactive learning exercises</Text>
            </View>
            <View style={styles.infoStep}>
              <Ionicons name="trending-up" size={20} color="#6366f1" />
              <Text style={styles.stepText}>Track progress and earn XP</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  descriptionContainer: {
    backgroundColor: '#f8fafc',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    textAlign: 'center',
  },
  subjectSection: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  subjectDisplay: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subjectDisplayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginLeft: 8,
  },
  uploadArea: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadIcon: {
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
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
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  galleryButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  progressContainer: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoSteps: {
    gap: 10,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    marginLeft: 8,
  },
});
