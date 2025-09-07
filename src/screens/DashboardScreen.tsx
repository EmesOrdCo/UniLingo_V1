import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import FlashcardsScreen from './FlashcardsScreen';
import GamesScreen from './GamesScreen';
import ProgressScreen from './StudyScreen';

// Import components
import ConsistentHeader from '../components/ConsistentHeader';
import DashboardContent from '../components/DashboardContent';
import LessonsContent from '../components/LessonsContent';

// Import services
import { HolisticProgressService, ProgressInsights } from '../lib/holisticProgressService';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

// Overview tab component
function OverviewTab() {
  const [progressData, setProgressData] = useState<ProgressInsights | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const { user } = useAuth();

  // Load progress data
  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user?.id]);

  const loadProgressData = async () => {
    try {
      setLoadingProgress(true);
      const data = await HolisticProgressService.getProgressInsights(user!.id);
      setProgressData(data);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Consistent Header */}
      <ConsistentHeader 
        pageName="Dashboard"
        isOverview={true}
      />

      {/* Dashboard Content */}
      <DashboardContent 
        progressData={progressData}
        loadingProgress={loadingProgress}
      />
    </SafeAreaView>
  );
}

// Lessons tab component - placeholder for new lesson system
function LessonsTab() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ConsistentHeader 
        pageName="My Lessons"
      />
      
      <LessonsContent />
    </SafeAreaView>
  );
}

// Main tab navigator component
function TabNavigator() {
  console.log('📱 TabNavigator rendering...');
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'grid';

          if (route.name === 'Overview') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Flashcards') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Games') {
            iconName = focused ? 'game-controller' : 'game-controller-outline'; 
          } else if (route.name === 'Lessons') {
            iconName = focused ? 'school' : 'school-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;        
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          marginTop: -4,
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: '#f8fafc',
          paddingBottom: 16,
          paddingTop: -4,
          height: 70,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Overview" component={OverviewTab} />
      <Tab.Screen name="Flashcards" component={FlashcardsScreen} />
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen name="Lessons" component={LessonsTab} />
    </Tab.Navigator>
  );
}

// Main DashboardScreen component
export default function DashboardScreen() {
  console.log('🏠 DashboardScreen rendering...');
  return <TabNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
});
