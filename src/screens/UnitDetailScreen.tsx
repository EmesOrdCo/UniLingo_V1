import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function UnitDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { unitId, unitTitle } = route.params as { unitId: number; unitTitle: string };

  const lessons = [
    {
      id: 1,
      title: '¡Mucho gusto! Part 1',
      status: 'completed', // completed, active, locked
      image: null,
    },
    {
      id: 2,
      title: '¡Mucho gusto! Part 2',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    },
    {
      id: 3,
      title: '¡Mucho gusto! Part 3',
      status: 'locked',
      image: null,
    },
    {
      id: 4,
      title: '¡Mucho gusto! Review',
      status: 'locked',
      image: null,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color="#6b7280" />;
      case 'active':
        return null; // Will show Start button instead
      case 'locked':
        return <Ionicons name="lock-closed" size={24} color="#6b7280" />;
      default:
        return null;
    }
  };

  const getStatusButton = (status: string) => {
    if (status === 'active') {
      return (
        <TouchableOpacity style={styles.startButton}>
          <Ionicons name="lock-closed" size={16} color="#ffffff" />
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

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
        <Text style={styles.headerTitle}>Unit {unitId}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Unit Header */}
        <View style={styles.unitHeader}>
          <View style={styles.unitHeaderTop}>
            <Text style={styles.unitNumber}>Unit {unitId}</Text>
            <View style={styles.unitProgressBar}>
              <View style={styles.unitProgressFill} />
            </View>
          </View>
          
          <View style={styles.unitTitleRow}>
            <Text style={styles.unitTitle}>{unitTitle}</Text>
            <View style={styles.unitHeaderIcons}>
              <Ionicons name="download-outline" size={20} color="#6b7280" />
              <Ionicons name="chevron-up" size={20} color="#6b7280" />
            </View>
          </View>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsSection}>
          {lessons.map((lesson) => (
            <View key={lesson.id} style={styles.lessonCard}>
              <View style={styles.lessonContent}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                
                {lesson.status === 'active' && lesson.image && (
                  <View style={styles.lessonImageContainer}>
                    <Image 
                      source={{ uri: lesson.image }} 
                      style={styles.lessonImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.lessonActions}>
                {getStatusButton(lesson.status)}
                {getStatusIcon(lesson.status)}
              </View>
            </View>
          ))}
        </View>

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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  unitHeader: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  unitHeaderTop: {
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
    width: '25%', // Some progress shown
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 2,
  },
  unitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  unitHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonsSection: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  lessonCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  lessonImageContainer: {
    marginLeft: 12,
  },
  lessonImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#6466E9',
  },
  lessonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 20,
  },
});
