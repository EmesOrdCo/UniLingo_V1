import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Comprehensive list of university degree subjects
const UNIVERSITY_SUBJECTS = [
  // Business & Management
  'Business Administration',
  'Accounting',
  'Finance',
  'Marketing',
  'Economics',
  'Management',
  'International Business',
  'Human Resources',
  'Entrepreneurship',
  'Supply Chain Management',
  
  // Engineering
  'Computer Science',
  'Software Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biomedical Engineering',
  'Aerospace Engineering',
  'Industrial Engineering',
  'Environmental Engineering',
  
  // Medicine & Health
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Dentistry',
  'Physical Therapy',
  'Occupational Therapy',
  'Public Health',
  'Biomedical Sciences',
  'Psychology',
  'Neuroscience',
  
  // Sciences
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Statistics',
  'Environmental Science',
  'Geology',
  'Astronomy',
  'Biochemistry',
  'Microbiology',
  
  // Arts & Humanities
  'English Literature',
  'History',
  'Philosophy',
  'Art History',
  'Music',
  'Theater',
  'Creative Writing',
  'Linguistics',
  'Anthropology',
  'Sociology',
  
  // Social Sciences
  'Political Science',
  'International Relations',
  'Criminology',
  'Social Work',
  'Education',
  'Communication',
  'Journalism',
  'Media Studies',
  'Geography',
  'Urban Planning',
  
  // Technology
  'Information Technology',
  'Data Science',
  'Cybersecurity',
  'Artificial Intelligence',
  'Web Development',
  'Mobile App Development',
  'Database Management',
  'Network Administration',
  'Digital Marketing',
  'User Experience Design',
  
  // Law & Legal Studies
  'Law',
  'Criminal Justice',
  'Legal Studies',
  'Paralegal Studies',
  'International Law',
  'Environmental Law',
  'Corporate Law',
  'Intellectual Property Law',
  
  // Architecture & Design
  'Architecture',
  'Interior Design',
  'Graphic Design',
  'Fashion Design',
  'Industrial Design',
  'Landscape Architecture',
  'Urban Design',
  
  // Agriculture & Environment
  'Agriculture',
  'Forestry',
  'Veterinary Science',
  'Food Science',
  'Agricultural Engineering',
  'Environmental Management',
  'Sustainability Studies',
  
  // Other
  'General Studies',
  'Liberal Arts',
  'Multidisciplinary Studies',
  'Other'
];

interface SubjectSelectionScreenProps {
  onSubjectSelect: (subject: string) => void;
  selectedSubject?: string;
}

export default function SubjectSelectionScreen({ onSubjectSelect, selectedSubject }: SubjectSelectionScreenProps) {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(UNIVERSITY_SUBJECTS);
  const [filteredSubjects, setFilteredSubjects] = useState(UNIVERSITY_SUBJECTS);
  const [isLoading, setIsLoading] = useState(true);

  // Use only hardcoded academic subjects (no database loading)
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setIsLoading(true);
        
        // Use only hardcoded university subjects - no database loading
        // The database contains topics, not academic subjects
        setAvailableSubjects(UNIVERSITY_SUBJECTS);
        setFilteredSubjects(UNIVERSITY_SUBJECTS);
        
        console.log(`✅ Loaded ${UNIVERSITY_SUBJECTS.length} academic subjects for selection`);
      } catch (error) {
        console.error('❌ Error loading subjects for selection:', error);
        // Keep using hardcoded subjects as fallback
        setAvailableSubjects(UNIVERSITY_SUBJECTS);
        setFilteredSubjects(UNIVERSITY_SUBJECTS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredSubjects(availableSubjects);
    } else {
      const filtered = availableSubjects.filter(subject =>
        subject.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSubjects(filtered);
    }
  };

  const handleSubjectSelect = (subject: string) => {
    console.log('📚 SubjectSelectionScreen - handleSubjectSelect called with:', subject);
    onSubjectSelect(subject);
    // Don't call navigation.goBack() - let the modal close automatically
  };

  const renderSubjectItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.subjectItem,
        selectedSubject === item && styles.subjectItemSelected
      ]}
      onPress={() => handleSubjectSelect(item)}
    >
      <Text style={[
        styles.subjectText,
        selectedSubject === item && styles.subjectTextSelected
      ]}>
        {item}
      </Text>
      {selectedSubject === item && (
        <Ionicons name="checkmark" size={20} color="#6366f1" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Subject</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What subject are you studying?</Text>
        <Text style={styles.subtitle}>
          Choose the subject area that best matches your studies or interests
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <FlatList
          data={filteredSubjects}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item}
          style={styles.subjectsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  subjectsList: {
    flex: 1,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subjectItemSelected: {
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  subjectText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  subjectTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
});
