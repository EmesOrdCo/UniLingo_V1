import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function SubjectsScreen() {
  const [selectedSubject, setSelectedSubject] = useState('');
  const navigation = useNavigation();

  const subjects = [
    { name: 'Medicine', icon: 'medical', color: '#ef4444', progress: 75 },
    { name: 'Engineering', icon: 'construct', color: '#3b82f6', progress: 45 },
    { name: 'Physics', icon: 'flash', color: '#8b5cf6', progress: 60 },
    { name: 'Biology', icon: 'leaf', color: '#10b981', progress: 30 },
    { name: 'Chemistry', icon: 'flask', color: '#f59e0b', progress: 55 },
    { name: 'Business', icon: 'business', color: '#6b7280', progress: 40 },
    { name: 'Humanities', icon: 'library', color: '#f59e0b', progress: 65 },
    { name: 'Sciences', icon: 'school', color: '#14b8a6', progress: 50 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subjects</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Choose Your Subject</Text>
          <Text style={styles.introSubtitle}>
            Select your field of study to access relevant vocabulary and learning materials
          </Text>
        </View>

        <View style={styles.subjectsGrid}>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.name}
              style={[
                styles.subjectCard,
                selectedSubject === subject.name && styles.selectedSubjectCard
              ]}
              onPress={() => setSelectedSubject(subject.name)}
            >
              <View style={[styles.subjectIcon, { backgroundColor: subject.color }]}>
                <Ionicons name={subject.icon as any} size={24} color="#ffffff" />
              </View>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${subject.progress}%`, backgroundColor: subject.color }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{subject.progress}%</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedSubject && (
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="book" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Study {selectedSubject}</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  subjectCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSubjectCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  actionSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
