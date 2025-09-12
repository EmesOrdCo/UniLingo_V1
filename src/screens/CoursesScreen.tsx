import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ConsistentHeader from '../components/ConsistentHeader';

export default function CoursesScreen() {
  const [activeTab, setActiveTab] = useState<'levels'>('levels');
  const navigation = useNavigation();

  const courses = [
    {
      id: 1,
      level: 'A1.1',
      title: 'Beginner 1 (A1.1)',
      units: 14,
      progress: 2,
      badge: 'A1',
      status: 'active'
    },
    {
      id: 2,
      level: 'A1.2',
      title: 'Beginner 2 (A1.2)',
      units: 14,
      progress: 0,
      badge: 'A1',
      status: 'locked'
    },
    {
      id: 3,
      level: 'A2.1',
      title: 'Beginner 3 (A2.1)',
      units: 8,
      progress: 0,
      badge: 'A2',
      status: 'locked'
    },
    {
      id: 4,
      level: 'B1.1',
      title: 'Intermediate 1 (B1.1)',
      units: 10,
      progress: 0,
      badge: 'B1',
      status: 'locked'
    },
    {
      id: 5,
      level: 'B1.2',
      title: 'Intermediate 2 (B1.2)',
      units: 11,
      progress: 0,
      badge: 'B1',
      status: 'locked'
    },
    {
      id: 6,
      level: 'B2.1',
      title: 'Intermediate 3 (B2.1)',
      units: 13,
      progress: 0,
      badge: 'B2',
      status: 'locked'
    },
    {
      id: 7,
      level: 'C1.1',
      title: 'Advanced (C1)',
      units: 4,
      progress: 0,
      badge: 'C1',
      status: 'locked'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Courses</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, styles.activeTab]}
            >
              <Text style={[styles.tabText, styles.activeTabText]}>
                Levels
              </Text>
            </TouchableOpacity>
          </View>

          {/* Course Cards */}
          <View style={styles.coursesContainer}>
            {courses.map((course) => (
              <TouchableOpacity key={course.id} style={styles.courseCard}>
                <View style={styles.courseContent}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseLevel}>{course.level}</Text>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    {course.status === 'active' && course.progress > 0 ? (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{course.progress}%</Text>
                      </View>
                    ) : (
                      <Text style={styles.unitsText}>{course.units} units</Text>
                    )}
                  </View>
                  <View style={styles.badgeContainer}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{course.badge}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Placement Quiz Section */}
          <View style={styles.placementSection}>
            <Text style={styles.placementTitle}>Want to check your level?</Text>
            <TouchableOpacity style={styles.placementButton}>
              <Text style={styles.placementButtonText}>Take the placement quiz</Text>
            </TouchableOpacity>
          </View>

          {/* Unlock All Courses Button */}
          <TouchableOpacity style={styles.unlockButton}>
            <Ionicons name="lock-closed" size={20} color="#ffffff" />
            <Text style={styles.unlockButtonText}>Unlock all Spanish courses</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  coursesContainer: {
    marginBottom: 32,
  },
  courseCard: {
    backgroundColor: '#fef7ed',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseLevel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  unitsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  badgeContainer: {
    marginLeft: 16,
  },
  badge: {
    width: 60,
    height: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  placementSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  placementTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
  },
  placementButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  placementButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  unlockButton: {
    backgroundColor: '#6466E9', // Purple color
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});
