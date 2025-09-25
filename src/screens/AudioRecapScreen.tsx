import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

const { width: screenWidth } = Dimensions.get('window');

export default function AudioRecapScreen() {
  const navigation = useNavigation();
  const [isUploading, setIsUploading] = useState(false);
  const [audioLessons, setAudioLessons] = useState<any[]>([]); // TODO: Replace with proper type

  const handleCreateAudioLesson = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Selected PDF for Audio Lesson:', file.name, file.size, file.uri);
        
        // TODO: Add AI processing functionality here
        Alert.alert(
          'PDF Selected',
          `File: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nAI processing functionality will be added next.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error selecting PDF:', error);
      Alert.alert('Error', 'Failed to select PDF file');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayAudioLesson = (lesson: any) => {
    // TODO: Implement audio playback
    Alert.alert('Coming Soon', 'Audio playback functionality will be added next.');
  };

  const handleDeleteAudioLesson = (lessonId: string) => {
    Alert.alert(
      'Delete Audio Lesson',
      'Are you sure you want to delete this audio lesson?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement deletion
            console.log('Delete lesson:', lessonId);
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
                  {isUploading ? 'Selecting PDF...' : 'Upload PDF'}
                </Text>
                <Text style={styles.createButtonSubtitle}>
                  Convert your PDF into an audio lesson
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
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
                      <Ionicons name="play-circle" size={24} color="#3b82f6" />
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <Text style={styles.lessonSubtitle}>
                        Duration: {lesson.duration} • Created: {lesson.createdAt}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAudioLesson(lesson.id)}
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
});
