import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { SimpleAudioLessonService, SimpleAudioLesson } from '../lib/simpleAudioLessonService';
import { UploadService } from '../lib/uploadService';
import { getBackendUrl } from '../config/backendConfig';
import { useAuth } from '../contexts/AuthContext';
import AudioLessonProgressModal from '../components/AudioLessonProgressModal';
import { ImageUploadService, ImageUploadProgress } from '../lib/imageUploadService';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ImageProcessingModal from '../components/ImageProcessingModal';

const { width: screenWidth } = Dimensions.get('window');

export default function AudioRecapScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [audioLessons, setAudioLessons] = useState<SimpleAudioLesson[]>([]);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStage, setProgressStage] = useState<'uploading' | 'extracting' | 'generating' | 'creating-audio' | 'finalizing'>('uploading');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Lesson name modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [lessonName, setLessonName] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  
  // Image-related state
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showImageProcessingModal, setShowImageProcessingModal] = useState(false);
  const [imageProgress, setImageProgress] = useState<ImageUploadProgress>({
    stage: 'selecting',
    progress: 0,
    message: 'Ready to select images',
  });

  // Get user's language preferences from profile
  const nativeLanguage = profile?.native_language || 'English';
  const targetLanguage = profile?.target_language || 'English';

  // Load user's audio lessons when user changes
  useEffect(() => {
    if (user?.id) {
      loadAudioLessons(user.id);
    }
  }, [user?.id]);

  // Load user's audio lessons
  const loadAudioLessons = async (userId: string) => {
    try {
      const lessons = await SimpleAudioLessonService.getUserAudioLessons(userId);
      setAudioLessons(lessons);
    } catch (error) {
      console.error('Error loading audio lessons:', error);
    }
  };

  const handleCreateAudioLesson = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create audio lessons');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // Check if we have a valid result with assets
      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No file was selected');
        return;
      }

      const file = result.assets[0];
      console.log('Selected PDF for Audio Lesson:', file.name, file.size, file.uri);
      
      // Store file and show name modal
      setSelectedFile(file);
      // Pre-fill with filename without extension
      const defaultName = file.name.replace(/\.pdf$/i, '');
      setLessonName(defaultName);
      setShowNameModal(true);
    } catch (error: any) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', error.message || 'Failed to select file');
    }
  };

  const handleConfirmLessonName = async () => {
    if (!lessonName.trim()) {
      Alert.alert('Error', 'Please enter a lesson name');
      return;
    }

    if (!selectedFile || !user) {
      return;
    }

    try {
      setShowNameModal(false);
      setIsUploading(true);
      setShowProgressModal(true);
      setProgressStage('uploading');
      setProgressPercent(10);
      setProgressMessage('Uploading your PDF file...');

      const file = selectedFile;
      let extractedText: string;

      // Check if this is from images or PDF
      if (file.isFromImages) {
        // Text already extracted from images
        console.log('📸 Using text extracted from images...');
        setProgressStage('extracting');
        setProgressPercent(30);
        setProgressMessage('Processing extracted text...');
        extractedText = file.extractedText;
        console.log(`✅ Using ${extractedText.length} characters from images`);
      } else {
        // Create form data for PDF upload
        const formData = new FormData();
        formData.append('pdf', {
          uri: file.uri,
          type: 'application/pdf',
          name: file.name,
        } as any);

        // Step 1: Extract text from PDF
        console.log('📄 Extracting text from PDF...');
        setProgressStage('extracting');
        setProgressPercent(30);
        setProgressMessage('Extracting text from your PDF...');
        
        const pdfResponse = await fetch(getBackendUrl('/api/process-pdf'), {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!pdfResponse.ok) {
          throw new Error('Failed to process PDF');
        }

        const pdfResult = await pdfResponse.json();
        extractedText = pdfResult.result?.text;

        if (!extractedText) {
          throw new Error('No text extracted from PDF');
        }

        console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
      }

      // Step 2: Generate lesson content
      setProgressStage('generating');
      setProgressPercent(50);
      setProgressMessage('Generating lesson content with AI...');
      
      console.log('🎵 Creating audio lesson...');
      console.log('🎵 Creating audio lesson with:');
      console.log('   Native Language:', nativeLanguage);
      console.log('   Target Language:', targetLanguage);
      console.log('   Lesson Name:', lessonName);

      // Step 3: Create audio
      setProgressStage('creating-audio');
      setProgressPercent(70);
      setProgressMessage('Creating audio files...');
      
      const audioResult = await SimpleAudioLessonService.createAudioLessonFromPDF(
        extractedText,
        lessonName.trim(), // Use custom lesson name
        nativeLanguage,
        targetLanguage,
        user.id
      );

      // Step 4: Finalize
      setProgressStage('finalizing');
      setProgressPercent(90);
      setProgressMessage('Finalizing your lesson...');

      if (audioResult.success && audioResult.audioLesson) {
        setProgressPercent(100);
        setProgressMessage('Lesson created successfully!');
        
        // Wait a moment to show 100%
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh the lessons list
        await loadAudioLessons(user.id);
        
        setShowProgressModal(false);
        
        Alert.alert(
          'Success!',
          `Audio lesson "${audioResult.audioLesson.title}" created successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(audioResult.error || 'Failed to create audio lesson');
      }
    } catch (error: any) {
      console.error('Error creating audio lesson:', error);
      setShowProgressModal(false);
      Alert.alert('Error', error.message || 'Failed to create audio lesson');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setLessonName('');
    }
  };

  // Image handling functions
  const handleImagePick = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create audio lessons');
      return;
    }

    try {
      const images = await ImageUploadService.pickImages();
      setSelectedImages(images);
      setShowImagePreview(true);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('cancelled')) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleTakePhoto = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create audio lessons');
      return;
    }

    try {
      const images = await ImageUploadService.takePhoto();
      setSelectedImages(images);
      setShowImagePreview(true);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('cancelled')) {
        Alert.alert('Error', error.message);
      }
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
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleProcessImages = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create audio lessons');
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert('Error', 'Please select at least one image');
      return;
    }

    try {
      setShowImagePreview(false);
      setShowImageProcessingModal(true);
      setIsUploading(true);

      // Process images with progress tracking
      const result = await ImageUploadService.processImages(
        selectedImages,
        (progress) => {
          setImageProgress(progress);
        }
      );

      if (!result.success || !result.extractedText) {
        throw new Error(result.error || 'Failed to extract text from images');
      }

      console.log(`✅ Extracted ${result.extractedText.length} characters from images`);

      // Close image processing modal and show name modal
      setShowImageProcessingModal(false);
      
      // Pre-fill with default name
      const defaultName = `Image Lesson ${new Date().toLocaleDateString()}`;
      setLessonName(defaultName);
      
      // Store the extracted text as "file"
      setSelectedFile({
        extractedText: result.extractedText,
        name: defaultName,
        isFromImages: true,
      });
      
      setShowNameModal(true);
    } catch (error: any) {
      console.error('Error processing images:', error);
      setShowImageProcessingModal(false);
      Alert.alert('Error', error.message || 'Failed to process images');
    } finally {
      setIsUploading(false);
      setSelectedImages([]);
    }
  };

  const handlePlayAudioLesson = (lesson: SimpleAudioLesson) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to play audio lessons');
      return;
    }

    // Navigate to dedicated audio player screen
    (navigation as any).navigate('AudioPlayer', {
      lesson,
      userId: user.id,
    });
  };

  const handleDeleteAudioLesson = (lessonId: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Audio Lesson',
      'Are you sure you want to delete this audio lesson?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
                  const success = await SimpleAudioLessonService.deleteAudioLesson(lessonId, user.id);
              if (success) {
                await loadAudioLessons(user.id);
                Alert.alert('Success', 'Audio lesson deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete audio lesson');
              }
            } catch (error) {
              console.error('Error deleting audio lesson:', error);
              Alert.alert('Error', 'Failed to delete audio lesson');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audio Recap</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create New Audio Lesson Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle-outline" size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Create New Audio Lesson</Text>
          </View>
          
          {/* PDF Upload Button */}
          <TouchableOpacity
            style={[styles.createButton, isUploading && styles.createButtonDisabled]}
            onPress={handleCreateAudioLesson}
            disabled={isUploading}
          >
            <View style={styles.createButtonContent}>
              <View style={styles.createButtonIcon}>
                <Ionicons 
                  name={isUploading ? "hourglass" : "cloud-upload"} 
                  size={32} 
                  color="#ffffff" 
                />
              </View>
              <View style={styles.createButtonText}>
                <Text style={styles.createButtonTitle}>
                  {isUploading ? 'Processing...' : 'Upload PDF'}
                </Text>
                <Text style={styles.createButtonSubtitle}>
                  Convert your PDF into an audio lesson
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Camera Options */}
          <View style={styles.cameraOptions}>
            <TouchableOpacity
              style={[styles.cameraButton, isUploading && styles.createButtonDisabled]}
              onPress={handleTakePhoto}
              disabled={isUploading}
            >
              <View style={styles.cameraButtonIcon}>
                <Ionicons name="camera" size={24} color="#ffffff" />
              </View>
              <Text style={styles.cameraButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cameraButton, isUploading && styles.createButtonDisabled]}
              onPress={handleImagePick}
              disabled={isUploading}
            >
              <View style={styles.cameraButtonIcon}>
                <Ionicons name="images" size={24} color="#ffffff" />
              </View>
              <Text style={styles.cameraButtonText}>Choose Photos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Audio Lessons Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset-outline" size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>My Audio Lessons</Text>
            <Text style={styles.lessonCount}>{audioLessons.length}</Text>
          </View>

          {audioLessons.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="headset" size={48} color="#6b7280" />
              </View>
              <Text style={styles.emptyStateTitle}>No Audio Lessons Yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Upload your first PDF to create an audio lesson
              </Text>
            </View>
          ) : (
            <View style={styles.lessonsList}>
              {audioLessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.lessonCard}
                  onPress={() => handlePlayAudioLesson(lesson)}
                >
                  <View style={styles.lessonContent}>
                    <View style={styles.lessonIcon}>
                      <Ionicons 
                        name="play-circle" 
                        size={24} 
                        color="#3b82f6" 
                      />
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>{lesson?.title || 'Unknown'}</Text>
                      <Text style={styles.lessonSubtitle}>
                        Duration: {SimpleAudioLessonService.formatDuration(lesson.audio_duration)} • Status: {SimpleAudioLessonService.getStatusText(lesson.status)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteAudioLesson(lesson.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>
          
          <View style={styles.helpCard}>
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>1</Text>
              </View>
              <Text style={styles.helpStepText}>Upload a PDF document</Text>
            </View>
            
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>2</Text>
              </View>
              <Text style={styles.helpStepText}>AI converts it to audio</Text>
            </View>
            
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>3</Text>
              </View>
              <Text style={styles.helpStepText}>Listen hands-free anywhere</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Lesson Name Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNameModal(false);
          setSelectedFile(null);
          setLessonName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.nameModalContainer}>
            <Text style={styles.nameModalTitle}>Name Your Lesson</Text>
            <Text style={styles.nameModalSubtitle}>
              Choose a name for your audio lesson
            </Text>
            
            <TextInput
              style={styles.nameInput}
              value={lessonName}
              onChangeText={setLessonName}
              placeholder="Enter lesson name..."
              placeholderTextColor="#9ca3af"
              autoFocus
              maxLength={100}
            />
            
            <View style={styles.nameModalButtons}>
              <TouchableOpacity
                style={[styles.nameModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNameModal(false);
                  setSelectedFile(null);
                  setLessonName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.nameModalButton, styles.confirmButton]}
                onPress={handleConfirmLessonName}
              >
                <Text style={styles.confirmButtonText}>Create Lesson</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Progress Modal */}
      <AudioLessonProgressModal
        visible={showProgressModal}
        stage={progressStage}
        progress={progressPercent}
        message={progressMessage}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={showImagePreview}
        images={selectedImages}
        onClose={handleImageRetake}
        onConfirm={handleProcessImages}
        onAddMore={handleAddMoreImages}
      />

      {/* Image Processing Modal */}
      <ImageProcessingModal
        visible={showImageProcessingModal}
        progress={imageProgress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  lessonCount: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  createButtonIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createButtonText: {
    flex: 1,
  },
  createButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  createButtonSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  lessonsList: {
    gap: 12,
  },
  lessonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  lessonSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helpStepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  helpStepText: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  bottomSpacing: {
    height: 40,
  },
  // Name Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: screenWidth * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nameModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  nameModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  nameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  nameModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Camera Options Styles
  cameraOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cameraButton: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  cameraButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
  },
});
