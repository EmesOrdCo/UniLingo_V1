import React, { useState, useEffect } from 'react';
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
import { getPdfProcessingUrl } from '../config/backendConfig';
import { LessonService } from '../lib/lessonService';

import * as DocumentPicker from 'expo-document-picker';

import { supabase } from '../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function CreateLessonScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    stage: 'ready',
    progress: 0,
    message: 'Ready to create lesson',
  });
  
  const navigation = useNavigation();
  const { user, profile } = useAuth();

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

      const webhookResponse = await fetch(getPdfProcessingUrl(), {
        method: 'POST',
        body: formData,
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

      // Generate vocabulary for the lesson
      setProgress({
        stage: 'processing',
        progress: 85,
        message: 'Processing PDF pages...',
      });

      let createdLessons: any[] = [];

      try {
        let keywords: string[] = [];
        
        // Use page-by-page processing for large PDFs, fallback to single extraction for small PDFs
        if (pages.length > 1) {
          console.log(`📄 Large PDF detected: ${pages.length} pages, using page-by-page processing`);
          setProgress({
            stage: 'processing',
            progress: 85,
            message: `Processing ${pages.length} pages...`,
          });
          
          keywords = await LessonService.extractKeywordsFromPages(
            pages,
            selectedSubject,
            userNativeLanguage
          );
        } else {
          console.log('📄 Small PDF detected, using single extraction');
          setProgress({
            stage: 'processing',
            progress: 85,
            message: 'Extracting keywords...',
          });
          
          keywords = await LessonService.extractKeywordsFromPDF(
            extractedText,
            selectedSubject,
            userNativeLanguage
          );
        }
        
        console.log('📚 Grouping keywords into topics...');
        setProgress({
          stage: 'processing',
          progress: 90,
          message: 'Grouping keywords into topics...',
        });
        
        const topics = await LessonService.groupKeywordsIntoTopic(
          keywords,
          selectedSubject
        );
        
        console.log('📚 Generating vocabulary from topics...');
        setProgress({
          stage: 'processing',
          progress: 92,
          message: 'Generating vocabulary...',
        });
        
        const topicVocabulary = await LessonService.generateVocabularyFromTopics(
          topics,
          selectedSubject,
          userNativeLanguage
        );

        // Create multiple lessons (one per topic)
        console.log('💾 Creating lessons and storing vocabulary...');
        setProgress({
          stage: 'processing',
          progress: 95,
          message: 'Creating lessons...',
        });
        
        for (let i = 0; i < topics.length; i++) {
          const topic = topics[i];
          const topicVocab = topicVocabulary.find(tv => tv.topicName === topic.topicName);
          
          if (!topicVocab) {
            console.warn(`⚠️ No vocabulary found for topic: ${topic.topicName}`);
            continue;
          }

          setProgress({
            stage: 'processing',
            progress: 95 + (i * 4 / topics.length),
            message: `Creating lesson ${i + 1} of ${topics.length}: ${topic.topicName}...`,
          });

          // Create lesson for this topic
          const lessonTitle = `${selectedSubject} - ${topic.topicName}`;
          
          // Calculate difficulty based on vocabulary count
          const vocabCount = topicVocab.vocabulary.length;
          const difficultyLevel = LessonService.determineDifficultyByVocabCount(vocabCount);
          
          const { data: lesson, error: lessonError } = await supabase
            .from('esp_lessons')
            .insert([{
              user_id: user.id,
              title: lessonTitle,
              subject: selectedSubject,
              source_pdf_name: file.name,
              native_language: userNativeLanguage,
              estimated_duration: 45,
              difficulty_level: difficultyLevel,
              status: 'ready'
            }])
            .select()
            .single();

          if (lessonError) {
            console.error(`❌ Error creating lesson for topic ${topic.topicName}:`, lessonError);
            continue;
          }

          // Store vocabulary for this lesson
          const vocabularyWithLessonId = topicVocab.vocabulary.map(vocab => ({
            lesson_id: lesson.id,
            keywords: vocab.english_term,
            definition: vocab.definition,
            native_translation: vocab.native_translation,
            example_sentence_en: vocab.example_sentence_en,
            example_sentence_native: vocab.example_sentence_native,
            difficulty_rank: vocab.difficulty_rank
          }));

          const { error: vocabError } = await supabase
            .from('lesson_vocabulary')
            .insert(vocabularyWithLessonId);

          if (vocabError) {
            console.error(`❌ Error storing vocabulary for lesson ${lessonTitle}:`, vocabError);
            continue;
          }

          createdLessons.push(lesson);
          console.log(`✅ Created lesson: ${lessonTitle} with ${vocabularyWithLessonId.length} vocabulary items (${difficultyLevel} difficulty)`);
        }

        if (createdLessons.length === 0) {
          throw new Error('Failed to create any lessons');
        }

        console.log(`✅ Successfully created ${createdLessons.length} lessons`);
      } catch (vocabError) {
        console.error('❌ Error generating vocabulary:', vocabError);
        // Don't fail the entire lesson creation if vocabulary generation fails
        console.log('⚠️ Continuing without vocabulary - lesson created but no exercises available');
      }

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Lesson created successfully!',
      });

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
            Select a PDF file to create your lesson
          </Text>
          
          <TouchableOpacity
            style={[
              styles.uploadButton,
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
  uploadButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
