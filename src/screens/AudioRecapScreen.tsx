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
  Animated,
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
import HybridAudioLessonUsageService, { AudioLessonUsage } from '../lib/hybridAudioLessonUsageService';
import { useI18n } from '../lib/i18n';

const { width: screenWidth } = Dimensions.get('window');

export default function AudioRecapScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const { t, currentLanguage } = useI18n();
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

  // Audio lesson usage tracking
  const [usage, setUsage] = useState<AudioLessonUsage | null>(null);
  
  // Duration fix state
  const [isFixingDurations, setIsFixingDurations] = useState(false);
  
  // Actual durations for lessons (loaded from audio files)
  const [actualDurations, setActualDurations] = useState<Record<string, number>>({});
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageExpanded, setUsageExpanded] = useState(false);
  const [usageAnimation] = useState(new Animated.Value(0));

  // Get user's language preferences from profile
  const nativeLanguage = profile?.native_language || 'en-GB';
  const targetLanguage = profile?.target_language || 'en-GB';

  // Function to translate usage status text
  const getTranslatedUsageStatusText = (usage: AudioLessonUsage | null): string => {
    if (!usage) return t('audioRecap.lowUsage');
    
    const percentage = HybridAudioLessonUsageService.getUsagePercentage(usage);
    
    if (percentage < 50) return t('audioRecap.lowUsage');
    if (percentage < 75) return t('audioRecap.moderateUsage');
    if (percentage < 90) return t('audioRecap.nearLimit');
    if (percentage < 100) return t('audioRecap.almostFull');
    return t('audioRecap.limitReached');
  };

  // Function to translate month display
  const getTranslatedMonthYear = (monthYear: string): string => {
    if (!monthYear) return 'Unknown';
    
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    
    return date.toLocaleDateString(currentLanguage === 'de' ? 'de-DE' : 'en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Load user's audio lessons and usage when user changes
  useEffect(() => {
    if (user?.id) {
      loadAudioLessons(user.id);
      loadUsageData(user.id);
    }
  }, [user?.id]);

  // Load usage data
  const loadUsageData = async (userId: string) => {
    try {
      setLoadingUsage(true);
      const usageData = await HybridAudioLessonUsageService.getUserUsage(userId);
      setUsage(usageData);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  // Handle usage box expansion
  const toggleUsageExpansion = () => {
    const newExpanded = !usageExpanded;
    setUsageExpanded(newExpanded);
    
    Animated.timing(usageAnimation, {
      toValue: newExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Load user's audio lessons
  const loadAudioLessons = async (userId: string) => {
    try {
      const lessons = await SimpleAudioLessonService.getUserAudioLessons(userId);
      setAudioLessons(lessons);
      
      // Load actual durations for each lesson
      await loadActualDurations(lessons);
    } catch (error) {
      console.error('Error loading audio lessons:', error);
    }
  };

  const loadActualDurations = async (lessons: SimpleAudioLesson[]) => {
    const durations: Record<string, number> = {};
    
    for (const lesson of lessons) {
      try {
        const actualDuration = await SimpleAudioLessonService.getActualAudioDuration(lesson.audio_url);
        durations[lesson.id] = actualDuration;
      } catch (error) {
        console.error(`Error loading duration for lesson ${lesson.id}:`, error);
        // Fallback to database duration if loading fails
        durations[lesson.id] = lesson.audio_duration;
      }
    }
    
    setActualDurations(durations);
  };

  const handleCreateAudioLesson = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('audioRecap.pleaseLogin'));
      return;
    }

    // Check usage limits before allowing file selection
    try {
      const { canCreate, usage: currentUsage } = await HybridAudioLessonUsageService.canCreateAudioLesson(user.id);
      
      if (!canCreate) {
        Alert.alert(
          'Monthly Limit Reached',
          `You have reached your monthly limit of ${HybridAudioLessonUsageService.getMonthlyLimit()} audio lessons.\n\n` +
          `Current usage: ${currentUsage.current_usage}/${HybridAudioLessonUsageService.getMonthlyLimit()}\n` +
          `Month: ${HybridAudioLessonUsageService.formatMonthYear(HybridAudioLessonUsageService.getCurrentMonth())}\n\n` +
          `Your limit will reset next month.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Update usage display
      setUsage(currentUsage);
    } catch (error) {
      console.error('Error checking usage limits:', error);
      Alert.alert(t('common.error'), t('audioRecap.failedToProcessImages'));
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
        Alert.alert(t('common.error'), t('audioRecap.failedToProcessImages'));
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
      Alert.alert(t('common.error'), error.message || t('audioRecap.failedToProcessImages'));
    }
  };

  const handleConfirmLessonName = async () => {
    if (!lessonName.trim()) {
      Alert.alert(t('common.error'), t('audioRecap.pleaseEnterName'));
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
      setProgressMessage(t('audioRecap.uploadingPDF'));

      const file = selectedFile;
      let extractedText: string;

      // Check if this is from images or PDF
      if (file.isFromImages) {
        // Text already extracted from images
        console.log('📸 Using text extracted from images...');
        setProgressStage('extracting');
        setProgressPercent(30);
        setProgressMessage(t('audioRecap.processingText'));
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
        setProgressMessage(t('audioRecap.extractingText'));
        
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
      setProgressMessage(t('audioRecap.generatingContent'));
      
      console.log('🎵 Creating audio lesson...');
      console.log('🎵 Creating audio lesson with:');
      console.log('   Native Language:', nativeLanguage);
      console.log('   Target Language:', targetLanguage);
      console.log('   Lesson Name:', lessonName);

      // Step 3: Create audio
      setProgressStage('creating-audio');
      setProgressPercent(70);
      setProgressMessage(t('audioRecap.creatingAudio'));
      
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
      setProgressMessage(t('audioRecap.finalizing'));

      if (audioResult.success && audioResult.audioLesson) {
        setProgressPercent(100);
        setProgressMessage(t('audioRecap.lessonCreated'));
        
        // Wait a moment to show 100%
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh the lessons list
        await loadAudioLessons(user.id);
        
        setShowProgressModal(false);
        
        Alert.alert(
          t('audioRecap.success'),
          t('audioRecap.lessonCreatedSuccess', { lessonTitle: audioResult.audioLesson.title }),
          [{ text: t('common.ok') }]
        );
      } else {
        throw new Error(audioResult.error || 'Failed to create audio lesson');
      }
    } catch (error: any) {
      console.error('Error creating audio lesson:', error);
      setShowProgressModal(false);
      Alert.alert(t('common.error'), error.message || t('audioRecap.failedToProcessImages'));
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setLessonName('');
    }
  };

  // Image handling functions
  const handleImagePick = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('audioRecap.pleaseLogin'));
      return;
    }

    try {
      const images = await ImageUploadService.pickImages();
      setSelectedImages(images);
      setShowImagePreview(true);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('cancelled')) {
        Alert.alert(t('common.error'), error.message);
      }
    }
  };

  const handleTakePhoto = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('audioRecap.pleaseLogin'));
      return;
    }

    try {
      const images = await ImageUploadService.takePhoto();
      setSelectedImages(images);
      setShowImagePreview(true);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('cancelled')) {
        Alert.alert(t('common.error'), error.message);
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
        Alert.alert(t('audioRecap.tooManyImages'), t('audioRecap.maxImagesMessage'));
        return;
      }
      
      setSelectedImages(combinedImages);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('cancelled')) {
        Alert.alert(t('common.error'), error.message);
      }
    }
  };

  const handleProcessImages = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('audioRecap.pleaseLogin'));
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert(t('common.error'), t('audioRecap.pleaseSelectImage'));
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
      Alert.alert(t('common.error'), error.message || t('audioRecap.failedToProcessImages'));
    } finally {
      setIsUploading(false);
      setSelectedImages([]);
    }
  };

  const handlePlayAudioLesson = (lesson: SimpleAudioLesson) => {
    if (!user) {
      Alert.alert(t('common.error'), t('audioRecap.pleaseLoginToPlay'));
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
      t('audioRecap.deleteLesson'),
      t('audioRecap.deleteConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
                  const success = await SimpleAudioLessonService.deleteAudioLesson(lessonId, user.id);
              if (success) {
                await loadAudioLessons(user.id);
                Alert.alert(t('common.success'), t('audioRecap.deleteSuccess'));
              } else {
                Alert.alert(t('common.error'), t('audioRecap.deleteError'));
              }
            } catch (error) {
              console.error('Error deleting audio lesson:', error);
              Alert.alert(t('common.error'), t('audioRecap.deleteError'));
            }
          }
        }
      ]
    );
  };

  const handleFixDurations = async () => {
    if (!user) return;
    
    Alert.alert(
      t('audioRecap.fixDurations'),
      t('audioRecap.fixDurationsConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('audioRecap.fixDurationsButton'),
          onPress: async () => {
            try {
              setIsFixingDurations(true);
              
              // Skip health check for now since endpoint might not be deployed yet
              console.log('🔧 Proceeding directly with duration fix...');
              
              const result = await SimpleAudioLessonService.fixAudioDurations(user.id);
              
              if (result.success) {
                Alert.alert(
                  t('audioRecap.durationFixComplete'),
                  t('audioRecap.durationFixSuccess', { count: result.updatedCount }),
                  [{ text: t('common.ok') }]
                );
                // Refresh the list to show updated durations
                await loadAudioLessons(user.id);
              } else {
                Alert.alert(t('common.error'), result.error || t('audioRecap.failedToFixDurations'));
              }
            } catch (error) {
              console.error('Error fixing durations:', error);
              Alert.alert(t('common.error'), t('audioRecap.failedToFixDurations'));
            } finally {
              setIsFixingDurations(false);
            }
          },
        },
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
        <Text style={styles.headerTitle}>{t('audioRecap.title')}</Text>
        {audioLessons.length > 0 && (
          <TouchableOpacity
            style={styles.fixButton}
            onPress={handleFixDurations}
            disabled={isFixingDurations}
          >
            <Ionicons 
              name={isFixingDurations ? "hourglass" : "refresh"} 
              size={20} 
              color={isFixingDurations ? "#6b7280" : "#8b5cf6"} 
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create New Audio Lesson Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle-outline" size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>{t('audioRecap.createNewAudioLesson')}</Text>
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
                  {isUploading ? t('audioRecap.processing') : t('audioRecap.uploadPDF')}
                </Text>
                <Text style={styles.createButtonSubtitle}>
                  {t('audioRecap.uploadPDFDescription')}
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
              <Text style={styles.cameraButtonText}>{t('audioRecap.takePhoto')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cameraButton, isUploading && styles.createButtonDisabled]}
              onPress={handleImagePick}
              disabled={isUploading}
            >
              <View style={styles.cameraButtonIcon}>
                <Ionicons name="images" size={24} color="#ffffff" />
              </View>
              <Text style={styles.cameraButtonText}>{t('audioRecap.choosePhotos')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Audio Lessons Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset-outline" size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>{t('audioRecap.myAudioLessons')}</Text>
            <Text style={styles.lessonCount}>{audioLessons.length}</Text>
          </View>

          {audioLessons.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="headset" size={48} color="#6b7280" />
              </View>
              <Text style={styles.emptyStateTitle}>{t('audioRecap.noAudioLessonsYet')}</Text>
              <Text style={styles.emptyStateSubtitle}>
                {t('audioRecap.noAudioLessonsDescription')}
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
                        {t('audioRecap.duration')} {SimpleAudioLessonService.formatDuration(actualDurations[lesson.id] || lesson.audio_duration)} • {t('audioRecap.status')} {SimpleAudioLessonService.getStatusText(lesson.status)}
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
            <Text style={styles.sectionTitle}>{t('audioRecap.howItWorks')}</Text>
          </View>
          
          <View style={styles.helpCard}>
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>1</Text>
              </View>
              <Text style={styles.helpStepText}>{t('audioRecap.helpStep1')}</Text>
            </View>
            
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>2</Text>
              </View>
              <Text style={styles.helpStepText}>{t('audioRecap.helpStep2')}</Text>
            </View>
            
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>3</Text>
              </View>
              <Text style={styles.helpStepText}>{t('audioRecap.helpStep3')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.bottomSpacing, { paddingBottom: usage ? 60 : 20 }]} />
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
            <Text style={styles.nameModalTitle}>{t('audioRecap.nameYourLesson')}</Text>
            <Text style={styles.nameModalSubtitle}>
              {t('audioRecap.nameYourLessonDescription')}
            </Text>
            
            <TextInput
              style={styles.nameInput}
              value={lessonName}
              onChangeText={setLessonName}
              placeholder={t('audioRecap.enterLessonName')}
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
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.nameModalButton, styles.confirmButton]}
                onPress={handleConfirmLessonName}
              >
                <Text style={styles.confirmButtonText}>{t('audioRecap.createLesson')}</Text>
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

      {/* Expandable Usage Box */}
      {usage && (
        <View style={styles.usageBoxContainer}>
          <TouchableOpacity
            style={styles.usageBoxHeader}
            onPress={toggleUsageExpansion}
          >
            <View style={styles.usageBoxHeaderContent}>
              <Ionicons name="analytics-outline" size={16} color="#8b5cf6" />
              <Text style={styles.usageBoxTitle}>{t('audioRecap.monthlyUsage')}</Text>
              <Text style={styles.usageBoxSummary}>
                {usage.total_usage || 0}/{HybridAudioLessonUsageService.getMonthlyLimit()}
              </Text>
            </View>
            <Ionicons 
              name={usageExpanded ? "chevron-down" : "chevron-up"} 
              size={16} 
              color="#9ca3af" 
            />
          </TouchableOpacity>
          
          <Animated.View 
            style={[
              styles.usageBoxContent,
              {
                maxHeight: usageAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
                opacity: usageAnimation,
              }
            ]}
          >
              <View style={styles.usageBoxStats}>
                <View style={styles.usageBoxStat}>
                  <Text style={styles.usageBoxNumber}>{usage.total_usage || 0}</Text>
                  <Text style={styles.usageBoxLabel}>{t('audioRecap.used')}</Text>
                </View>
                <View style={styles.usageBoxDivider} />
                <View style={styles.usageBoxStat}>
                  <Text style={styles.usageBoxNumber}>{usage.remaining_lessons || 0}</Text>
                  <Text style={styles.usageBoxLabel}>{t('audioRecap.remaining')}</Text>
                </View>
                <View style={styles.usageBoxDivider} />
                <View style={styles.usageBoxStat}>
                  <Text style={styles.usageBoxNumber}>{HybridAudioLessonUsageService.getMonthlyLimit()}</Text>
                  <Text style={styles.usageBoxLabel}>{t('audioRecap.limit')}</Text>
                </View>
              </View>
              
              <View style={styles.usageBoxProgress}>
                <View style={styles.usageBoxProgressBar}>
                  <View 
                    style={[
                      styles.usageBoxProgressFill, 
                      { 
                        width: `${HybridAudioLessonUsageService.getUsagePercentage(usage)}%`,
                        backgroundColor: HybridAudioLessonUsageService.getUsageStatusColor(usage)
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.usageBoxStatus,
                  { color: HybridAudioLessonUsageService.getUsageStatusColor(usage) }
                ]}>
                  {getTranslatedUsageStatusText(usage)}
                </Text>
              </View>
              
              <Text style={styles.usageBoxMonth}>
                {getTranslatedMonthYear(HybridAudioLessonUsageService.getCurrentMonth())}
              </Text>
          </Animated.View>
        </View>
      )}
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
  fixButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Usage Display Styles
  usageSection: {
    marginBottom: 24,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 8,
  },
  usageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  usageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  usageStat: {
    alignItems: 'center',
    flex: 1,
  },
  usageNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  usageDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  usageProgress: {
    marginBottom: 12,
  },
  usageProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  usageProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageStatus: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  usageMonth: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  
  // Expandable Usage Box Styles
  usageBoxContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  usageBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  usageBoxHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  usageBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  usageBoxSummary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    marginRight: 8,
  },
  usageBoxContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  usageBoxStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  usageBoxStat: {
    alignItems: 'center',
  },
  usageBoxNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  usageBoxLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  usageBoxDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  usageBoxProgress: {
    marginBottom: 8,
  },
  usageBoxProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  usageBoxProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageBoxStatus: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  usageBoxMonth: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
