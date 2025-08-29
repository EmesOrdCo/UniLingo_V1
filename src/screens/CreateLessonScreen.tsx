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
import { UploadService, UploadProgress } from '../lib/uploadService';
import { ImprovedLessonService } from '../lib/improvedLessonService';
import UploadProgressModal from '../components/UploadProgressModal';

const { width: screenWidth } = Dimensions.get('window');

export default function CreateLessonScreen() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [topics, setTopics] = useState<Array<{ id: string; name: string; icon: string; color: string; count: number }>>([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    stage: 'uploading',
    progress: 0,
    message: 'Ready to create lesson',
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  
  const navigation = useNavigation();
  const { user, profile } = useAuth();

  // Get user's subject and native language from profile
  const userSubject = profile?.subjects?.[0] || 'General';
  const userNativeLanguage = profile?.native_language || 'English';
  
  // Ensure we have a valid native language
  if (!userNativeLanguage || userNativeLanguage === 'English') {
    console.warn('⚠️ Warning: userNativeLanguage is not properly set:', userNativeLanguage);
  }

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      // This would fetch topics from your existing topic system
      // For now, using placeholder data
      const placeholderTopics = [
        { id: '1', name: 'Medicine', icon: 'medical', color: '#ef4444', count: 0 },
        { id: '2', name: 'Engineering', icon: 'construct', color: '#3b82f6', count: 0 },
        { id: '3', name: 'Law', icon: 'library', color: '#8b5cf6', count: 0 },
        { id: '4', name: 'Business', icon: 'business', color: '#10b981', count: 0 },
        { id: '5', name: 'Custom Topic', icon: 'add-circle', color: '#f59e0b', count: 0 },
      ];
      setTopics(placeholderTopics);
    } catch (error) {
      console.error('❌ Error fetching topics:', error);
      setTopics([]);
    }
  };

  const handleTopicSelect = (topic: { id: string; name: string; icon: string; color: string; count: number }) => {
    if (topic.name === 'Custom Topic') {
      setShowTopicInput(true);
      setSelectedTopic('');
    } else {
      setSelectedTopic(topic.name);
      setShowTopicInput(false);
    }
    setShowTopicPicker(false);
  };

  const handleCustomTopicSubmit = () => {
    if (newTopicInput.trim()) {
      setSelectedTopic(newTopicInput.trim());
      setNewTopicInput('');
      setShowTopicInput(false);
    }
  };

  const handleFilePick = async () => {
    if (!selectedTopic) {
      Alert.alert('Error', 'Please select a topic first');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please log in to create lessons');
      return;
    }

    try {
      setIsProcessing(true);
      setShowProgressModal(true);
      setProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Selecting PDF file...',
      });

      // Pick PDF file
      const fileResult = await UploadService.pickPDF();
      if (!fileResult || !fileResult.assets || fileResult.assets.length === 0) {
        throw new Error('No file selected');
      }

      const file = fileResult.assets[0];
      if (!file.uri) {
        throw new Error('File URI not available');
      }

      setProgress({
        stage: 'uploading',
        progress: 20,
        message: 'Extracting text from PDF...',
      });

      // Extract text from PDF
      const extractedText = await UploadService.extractTextFromPDF(file.uri);
      if (!extractedText) {
        throw new Error('Failed to extract text from PDF');
      }

      setProgress({
        stage: 'uploading',
        progress: 50,
        message: 'Analyzing content with improved AI...',
      });

      // Generate improved lesson using AI
      const lesson = await ImprovedLessonService.generateLessonFromPDF(
        extractedText,
        file.name,
        user.id,
        userNativeLanguage,
        userSubject
      );

      if (!lesson) {
        throw new Error('Failed to generate lesson');
      }

      setGeneratedLesson(lesson);
      setProgress({
        stage: 'generating',
        progress: 100,
        message: 'Lesson created successfully!',
      });

      // Show success message
      Alert.alert(
        'Success! 🎓',
        `Your improved interactive lesson "${lesson.title}" has been created successfully!`,
        [
          {
            text: 'View Lesson',
            onPress: () => {
              setShowProgressModal(false);
              (navigation as any).navigate('ImprovedLessonViewer', { lessonId: lesson.id });
            }
          },
          {
            text: 'Create Another',
            onPress: () => {
              setShowProgressModal(false);
              setGeneratedLesson(null);
              setProgress({
                stage: 'uploading',
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
      if (error instanceof Error) {
        errorMessage = error.message;
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

  const handleCloseProgress = () => {
    setShowProgressModal(false);
    setIsProcessing(false);
    
    if (progress.stage === 'error') {
      setProgress({
        stage: 'uploading',
        progress: 0,
        message: 'Ready to create lesson',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Interactive Lesson</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>AI-Powered English Lessons</Text>
          <Text style={styles.descriptionText}>
            Upload your course notes and let AI create an interactive, Duolingo-style lesson 
            that teaches English terminology from your subject. Perfect for non-native speakers 
            learning subject-specific English vocabulary.
          </Text>
        </View>

        {/* Topic Selection */}
        <View style={styles.topicSection}>
          <Text style={styles.sectionTitle}>Select Subject/Topic</Text>
          
          {showTopicInput ? (
            <View style={styles.customTopicContainer}>
              <TextInput
                style={styles.customTopicInput}
                value={newTopicInput}
                onChangeText={setNewTopicInput}
                placeholder="Enter your topic (e.g., Cardiology, Civil Law, Thermodynamics)"
                placeholderTextColor="#9ca3af"
              />
              <View style={styles.customTopicButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowTopicInput(false);
                    setNewTopicInput('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCustomTopicSubmit}
                  disabled={!newTopicInput.trim()}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.topicPicker}
              onPress={() => setShowTopicPicker(!showTopicPicker)}
            >
              <View style={styles.topicPickerContent}>
                <Ionicons name="school" size={20} color="#6366f1" />
                <Text style={styles.topicPickerText}>
                  {selectedTopic || 'Choose a subject or topic'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
          )}

          {showTopicPicker && (
            <View style={styles.topicOptions}>
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.topicOption}
                  onPress={() => handleTopicSelect(topic)}
                >
                  <View style={styles.topicOptionContent}>
                    <View style={[styles.topicIcon, { backgroundColor: topic.color }]}>
                      <Ionicons name={topic.icon as any} size={20} color="#ffffff" />
                    </View>
                    <Text style={styles.topicOptionText}>{topic.name}</Text>
                  </View>
                  {topic.name !== 'Custom Topic' && (
                    <Text style={styles.topicCount}>{topic.count} lessons</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIcon}>
            <Ionicons name="school" size={56} color="#6366f1" />
          </View>
          <Text style={styles.uploadTitle}>Create Your Lesson</Text>
          <Text style={styles.uploadSubtitle}>
            Upload PDF course notes to generate an interactive English lesson
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
              {isProcessing ? 'Creating Lesson...' : 'Choose PDF File'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What you'll get</Text>
          <View style={styles.infoSteps}>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>AI analyzes your course notes</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Creates bilingual vocabulary list</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Generates 5+ interactive exercises</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Track progress and master terminology</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Progress Modal */}
      <UploadProgressModal
        visible={showProgressModal}
        progress={progress}
        onClose={handleCloseProgress}
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  descriptionContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
  },
  topicSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
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
  topicPicker: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  topicPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicPickerText: {
    fontSize: 16,
    color: '#64748b',
    flex: 1,
    marginLeft: 12,
  },
  customTopicContainer: {
    gap: 16,
  },
  customTopicInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  customTopicButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  topicOptions: {
    marginTop: 16,
    gap: 12,
  },
  topicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topicOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  topicCount: {
    fontSize: 14,
    color: '#64748b',
  },
  uploadArea: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadIcon: {
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoSteps: {
    gap: 16,
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
    fontSize: 16,
    color: '#64748b',
    flex: 1,
  },
});
