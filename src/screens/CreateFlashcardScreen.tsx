import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardService, CreateFlashcardData } from '../lib/flashcardService';

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: '#10b981' },
  { value: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
  { value: 'expert', label: 'Expert', color: '#ef4444' },
];

export default function CreateFlashcardScreen() {
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');
  const [example, setExample] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = useNavigation();
  const { user, profile } = useAuth();

  const handleSave = async () => {
    if (!frontText.trim() || !backText.trim() || !subject.trim() || !topic.trim() || !example.trim()) {
      Alert.alert('Error', 'Please fill in all required fields including the example.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      const flashcardData: CreateFlashcardData = {
        front: frontText.trim(),
        back: backText.trim(),
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        userId: user.id,
        example: example.trim() || undefined,
        pronunciation: pronunciation.trim() || undefined,
        tags: tags.trim() ? tags.split(',').map(tag => tag.trim()) : undefined,
        native_language: profile?.native_language || 'English',
      };

      await FlashcardService.createFlashcard(flashcardData);
      
      Alert.alert('Success', 'Flashcard created successfully!', [
        {
          text: 'Create Another',
          onPress: () => {
            // Reset form
            setFrontText('');
            setBackText('');
            setSubject('');
            setTopic('');
            setDifficulty('beginner');
            setExample('');
            setPronunciation('');
            setTags('');
          },
        },
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = frontText.trim() && backText.trim() && subject.trim() && topic.trim() && example.trim();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Flashcard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Subject Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g., Medicine, Engineering, Physics"
            />
          </View>

          {/* Topic Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Topic *</Text>
            <TextInput
              style={styles.input}
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g., Cardiology, Thermodynamics, Quantum Mechanics"
            />
          </View>

          {/* Difficulty Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Difficulty Level *</Text>
            <View style={styles.difficultyContainer}>
              {DIFFICULTY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.difficultyButton,
                    difficulty === level.value && styles.selectedDifficulty,
                    { borderColor: level.color }
                  ]}
                  onPress={() => setDifficulty(level.value as 'beginner' | 'intermediate' | 'expert')}
                >
                  <Text style={[
                    styles.difficultyText,
                    difficulty === level.value && styles.selectedDifficultyText,
                    { color: difficulty === level.value ? '#ffffff' : level.color }
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Front Text Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Front (Question/Term) *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={frontText}
              onChangeText={setFrontText}
              placeholder="Enter the question or term"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Back Text Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Back (Answer/Definition) *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={backText}
              onChangeText={setBackText}
              placeholder="Enter the answer or definition"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Example Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Example *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={example}
              onChangeText={setExample}
              placeholder="Provide an example sentence using the front term"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Pronunciation Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pronunciation (Optional)</Text>
            <TextInput
              style={styles.input}
              value={pronunciation}
              onChangeText={setPronunciation}
              placeholder="e.g., /kɑːrˈdiːə/ for 'cardiac'"
            />
          </View>

          {/* Tags Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags (Optional)</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="e.g., anatomy, heart, medical (comma separated)"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, !isFormValid && styles.disabledButton]} 
            onPress={handleSave}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Create Flashcard</Text>
              </>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: -0.3,
  },
  difficultyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  difficultyButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginHorizontal: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  difficultyText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  selectedDifficulty: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  selectedDifficultyText: {
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

