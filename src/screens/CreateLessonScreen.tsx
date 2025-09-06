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

import * as DocumentPicker from 'expo-document-picker';

import { supabase } from '../lib/supabase';
import { ENV } from '../lib/envConfig';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Function to generate specific lesson title based on PDF content
const generateSpecificLessonTitle = async (extractedText: string, subject: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert educator creating lesson titles. Generate a specific, descriptive title for a vocabulary lesson based on the PDF content provided. The title should be:
- Specific to the actual content (not generic)
- Descriptive of the main topic/focus
- Professional and educational
- 3-8 words maximum
- Avoid generic terms like "Vocabulary Lesson" or "Medical Terms"

Examples of good titles:
- "Cardiovascular System Terminology"
- "Pharmacology Drug Interactions"
- "Anatomy of the Nervous System"
- "Clinical Assessment Procedures"

Generate only the title, nothing else.`
        },
        {
          role: 'user',
          content: `Subject: ${subject}\n\nPDF Content (first 2000 characters):\n${extractedText.substring(0, 2000)}`
        }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const title = response.choices[0]?.message?.content?.trim();
    return title || `${subject} Terminology`;
  } catch (error) {
    console.error('Error generating lesson title:', error);
    // Fallback to a more specific default
    return `${subject} Terminology`;
  }
};

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

      if (!fileResult || !fileResult.assets || fileResult.assets.length === 0) {
        throw new Error('No file selected');
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

      const webhookResponse = await fetch('http://192.168.1.146:3001/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!webhookResponse.ok) {
        throw new Error('Failed to send PDF to webhook for processing');
      }

      const webhookResult = await webhookResponse.json();
      console.log('✅ PDF sent to PDF.co API successfully:', webhookResult);

              setProgress({
          stage: 'processing',
          progress: 60,
          message: 'PDF uploaded successfully, creating lesson...',
        });

      // Create lesson with extracted text from PDF.co API
      const estimatedDuration = 45; // Default duration
      
      // Extract text from the PDF.co API response
      const extractedText = webhookResult.result?.text || 'Text extraction failed';
      
      // Generate a specific lesson title based on PDF content
      const lessonTitle = await generateSpecificLessonTitle(extractedText, selectedSubject);
      
      const { data: lesson, error: lessonError } = await supabase
        .from('esp_lessons')
        .insert([{
          user_id: user.id,
          title: lessonTitle,
          subject: selectedSubject,
          source_pdf_name: file.name,
          native_language: userNativeLanguage,
          estimated_duration: estimatedDuration,
          difficulty_level: 'intermediate',
          status: 'ready',
          content: extractedText.substring(0, 5000) // Store first 5000 chars of extracted text
        }])
        .select()
        .single();

      if (lessonError) throw lessonError;

      setProgress({
        stage: 'processing',
        progress: 80,
        message: 'Creating lesson structure...',
      });

      if (!lesson) {
        throw new Error('Failed to create lesson');
      }

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Lesson created successfully!',
      });

      // Show success message
      Alert.alert(
        'Success! 🎓',
        `Your lesson "${lesson.title}" has been created successfully!`,
        [
          {
            text: 'Start Lesson',
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
    <SafeAreaView style={styles.container}>
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
            with flashcards and games. Perfect for learning subject-specific English terminology.
          </Text>
          <Text style={styles.webhookNote}>
            📡 PDFs are processed via Zapier webhook for enhanced text extraction
          </Text>
        </View>

        {/* Subject Display */}
        <View style={styles.subjectSection}>
          <Text style={styles.sectionTitle}>Subject</Text>
          <View style={styles.subjectDisplay}>
            <Ionicons name="school" size={20} color="#6366f1" />
            <Text style={styles.subjectDisplayText}>{selectedSubject}</Text>
          </View>
        </View>

        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIcon}>
            <Ionicons name="document-text" size={64} color="#6366f1" />
          </View>
          <Text style={styles.uploadTitle}>Upload Your Course Notes</Text>
          <Text style={styles.uploadSubtitle}>
            Select a PDF file containing your course material
          </Text>
          
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!selectedSubject || isProcessing) && styles.disabledButton
            ]}
            onPress={handleFilePick}
            disabled={!selectedSubject || isProcessing}
          >
            <Ionicons name="cloud-upload" size={22} color="#ffffff" />
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
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>AI extracts key vocabulary terms</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Creates bilingual flashcards</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Generates 3 interactive games</Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
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
  webhookNote: {
    fontSize: 14,
    color: '#8b5cf6',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  subjectSection: {
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
  subjectDisplay: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subjectDisplayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginLeft: 12,
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
  progressContainer: {
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
