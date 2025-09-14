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
import { useNavigation, useRoute } from '@react-navigation/native';
import DashboardContent from '../components/DashboardContent';
import { useAuth } from '../contexts/AuthContext';
import { useProgressData } from '../lib/holisticProgressService';

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { progressData, loadingProgress } = useProgressData(user?.id);

  // Get selected unit from route params (passed from CoursesScreen)
  const selectedUnit = route.params?.selectedUnit;

  const handleChangeCourse = () => {
    navigation.navigate('Courses' as never);
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
        <Text style={styles.headerTitle}>Current course</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Use DashboardContent with selected unit */}
        <DashboardContent 
          progressData={progressData} 
          loadingProgress={loadingProgress}
          selectedUnit={selectedUnit}
        />
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
});