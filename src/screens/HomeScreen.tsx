import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DailyChallengeSection from '../components/DailyChallengeSection';

export default function HomeScreen() {
  const navigation = useNavigation();

  const units = [
    { id: 1, title: 'add unit name here' },
    { id: 2, title: 'add unit name here' },
    { id: 3, title: 'add unit name here' },
    { id: 4, title: 'add unit name here' },
    { id: 5, title: 'add unit name here' },
    { id: 6, title: 'add unit name here' },
    { id: 7, title: 'add unit name here' },
    { id: 8, title: 'add unit name here' },
    { id: 9, title: 'add unit name here' },
    { id: 10, title: 'add unit name here' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Current course</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Challenge */}
        <DailyChallengeSection onPlay={(gameType) => {
          navigation.navigate('Games' as never);
        }} />

        {/* Course Overview Section */}
        <View style={styles.courseOverview}>
          <Text style={styles.courseLevel}>A1.1</Text>
          <Text style={styles.courseTitle}>Newcomer I (A1.1)</Text>
          <Text style={styles.courseDescription}>
            Learn how to introduce yourself and answer simple questions about your basic needs.
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressText}>2%</Text>
          </View>
          
          {/* Change Button */}
          <TouchableOpacity style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Course Units Section */}
        <View style={styles.unitsSection}>
          {units.map((unit) => (
            <TouchableOpacity key={unit.id} style={styles.unitCard}>
              <View style={styles.unitHeader}>
                <Text style={styles.unitNumber}>Unit {unit.id}</Text>
                <View style={styles.unitProgressBar}>
                  <View style={styles.unitProgressFill} />
                </View>
              </View>
              
              <Text style={styles.unitTitle}>{unit.title}</Text>
              
              <View style={styles.unitFooter}>
                <Ionicons name="download-outline" size={20} color="#6b7280" />
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Unlock Courses Button */}
        <TouchableOpacity style={styles.unlockButton}>
          <Ionicons name="lock-closed" size={20} color="#ffffff" />
          <Text style={styles.unlockButtonText}>Unlock all Spanish courses</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  courseOverview: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  courseLevel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    width: '2%',
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  changeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  unitsSection: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  unitCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 12,
  },
  unitProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  unitProgressFill: {
    width: '0%',
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 2,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  unitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlockButton: {
    margin: 20,
    backgroundColor: '#6466E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 20,
  },
});