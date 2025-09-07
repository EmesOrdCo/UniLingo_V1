import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService, CreateProfileData } from '../lib/userProfileService';

interface ProfileSetupData {
  nativeLanguage: string;
  studySubject: string;
  proficiencyLevel: string;
}

const LEARNING_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  'Turkish', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Polish', 'Czech', 'Hungarian', 'Romanian', 'Bulgarian', 'Greek'
];

const LEARNING_AREAS = [
  'Medicine', 'Engineering', 'Physics', 'Biology', 'Chemistry',
  'Business', 'Economics', 'Law', 'Psychology', 'Sociology',
  'History', 'Philosophy', 'Literature', 'Mathematics', 'Computer Science',
  'Architecture', 'Design', 'Education', 'Nursing', 'Pharmacy',
  'Veterinary Medicine', 'Dentistry', 'Agriculture', 'Environmental Science'
];

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting to learn' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience and knowledge' },
  { value: 'expert', label: 'Expert', description: 'Expert knowledge and skills' }
];

export default function ProfileSetupScreen() {
  const [learningLanguage, setLearningLanguage] = useState(''); // Changed from nativeLanguage
  const [learningArea, setLearningArea] = useState(''); // Changed from studySubject
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');
  const [name, setName] = useState(''); // Added name state
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { user, clearNewUserFlag } = useAuth(); // Added clearNewUserFlag

  const handleSaveProfile = async () => {
    if (!name || !learningLanguage || !learningArea || !proficiencyLevel) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      const profileData: CreateProfileData = {
        name: name, // Added name to profile data
        native_language: learningLanguage,
        learning_area: learningArea,
        level: proficiencyLevel,
      };

      // Save profile using the service
      await UserProfileService.createUserProfile(user.id, profileData);

      // Clear the new user flag since profile setup is complete
      clearNewUserFlag();

      Alert.alert(
        'Success!',
        'Your profile has been set up successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to the main dashboard
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' as never }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete = name && learningLanguage && learningArea && proficiencyLevel;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help us personalize your learning experience
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Language & Learning Preferences</Text>
          <Text style={styles.sectionDescription}>
            What language are you learning?
          </Text>
          <View style={styles.optionsGrid}>
            {LEARNING_LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.optionButton,
                  learningLanguage === language && styles.selectedOption
                ]}
                onPress={() => setLearningLanguage(language)}
              >
                <Text style={[
                  styles.optionText,
                  learningLanguage === language && styles.selectedOptionText
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Study Subject Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Area</Text>
          <Text style={styles.sectionDescription}>
            What area are you studying?
          </Text>
          <View style={styles.optionsGrid}>
            {LEARNING_AREAS.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.optionButton,
                  learningArea === subject && styles.selectedOption
                ]}
                onPress={() => setLearningArea(subject)}
              >
                <Text style={[
                  styles.optionText,
                  learningArea === subject && styles.selectedOptionText
                ]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Proficiency Level Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proficiency Level</Text>
          <Text style={styles.sectionDescription}>
            How would you rate your current knowledge?
          </Text>
          <View style={styles.levelOptions}>
            {PROFICIENCY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.levelButton,
                  proficiencyLevel === level.value && styles.selectedLevel
                ]}
                onPress={() => setProficiencyLevel(level.value as 'beginner' | 'intermediate' | 'expert')}
              >
                <View style={styles.levelContent}>
                  <Text style={[
                    styles.levelTitle,
                    proficiencyLevel === level.value && styles.selectedLevelText
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.levelDescription,
                    proficiencyLevel === level.value && styles.selectedLevelDescription
                  ]}>
                    {level.description}
                  </Text>
                </View>
                {proficiencyLevel === level.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !isFormComplete && styles.disabledButton
            ]}
            onPress={handleSaveProfile}
            disabled={!isFormComplete || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Complete Setup</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${((name ? 1 : 0) + (learningLanguage ? 1 : 0) + (learningArea ? 1 : 0) + (proficiencyLevel ? 1 : 0)) / 4 * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {((name ? 1 : 0) + (learningLanguage ? 1 : 0) + (learningArea ? 1 : 0) + (proficiencyLevel ? 1 : 0))} of 4 completed
          </Text>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '48%',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  levelOptions: {
    gap: 12,
  },
  levelButton: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedLevel: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  levelContent: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedLevelText: {
    color: '#ffffff',
  },
  selectedLevelDescription: {
    color: '#e2e8f0',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
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
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b',
  },
});
