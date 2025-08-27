import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [activeSubject, setActiveSubject] = useState(0);
  const [screenWidth, setScreenWidth] = useState(400);
  const navigation = useNavigation();

  console.log('🏠 HomeScreen rendering...');

  useEffect(() => {
    const { width } = Dimensions.get('window');
    setScreenWidth(width || 400);
  }, []);

  // Create styles after screenWidth is set
  const styles = useMemo(() => {
    // Ensure screenWidth is always a number and handle edge cases
    const safeScreenWidth = typeof screenWidth === 'number' && !isNaN(screenWidth) ? screenWidth : 400;
    
    // Validate the width calculation to prevent crashes
    const calculateWidth = (baseWidth: number) => {
      try {
        const result = Math.max((baseWidth - 52) / 2, 150);
        return isNaN(result) ? 150 : result;
      } catch (error) {
        console.warn('Width calculation error:', error);
        return 150;
      }
    };

    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#f8fafc',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
      },
      logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      logo: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
      },
      logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
      },
      headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      signInButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
      },
      signInText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500',
      },
      getStartedButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
      },
      getStartedText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
      },
      scrollView: {
        flex: 1,
      },
      heroSection: {
        padding: 20,
        alignItems: 'center',
        textAlign: 'center',
      },
      heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 16,
      },
      heroTitleHighlight: {
        color: '#6366f1',
      },
      heroSubtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 20,
      },
      ctaButton: {
        backgroundColor: '#6366f1',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 8,
      },
      ctaButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
      },
      section: {
        padding: 20,
        marginBottom: 20,
      },
      sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 8,
      },
      sectionSubtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
      },
      subjectsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      subjectCard: {
        width: calculateWidth(safeScreenWidth),
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      activeSubjectCard: {
        borderColor: '#6366f1',
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
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'center',
      },
      featuresList: {
        marginBottom: 16,
      },
      featureCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
      },
      featureContent: {
        flex: 1,
      },
      featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
      },
      featureDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
      },
      stepsContainer: {
        marginBottom: 24,
      },
      step: {
        alignItems: 'center',
        textAlign: 'center',
      },
      stepNumber: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
      },
      stepNumberText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
      },
      stepTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
      },
      stepDescription: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
      },
      ctaSection: {
        padding: 20,
        marginBottom: 40,
      },
      ctaGradient: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
      },
      ctaTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
      },
      ctaSubtitle: {
        fontSize: 16,
        color: '#e2e8f0',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
      },
      ctaButtonLarge: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
      },
    });
  }, [screenWidth]);

  const handleSubjectPress = (index: number) => {
    setActiveSubject(index);
  };

  const handleGetStarted = () => {
    navigation.navigate('Register' as never);
  };

  const handleSignIn = () => {
    navigation.navigate('Login' as never);
  };

  const subjects = [
    { name: 'Medicine', icon: 'medical', color: '#ef4444' },
    { name: 'Engineering', icon: 'construct', color: '#3b82f6' },
    { name: 'Physics', icon: 'flash', color: '#8b5cf6' },
    { name: 'Biology', icon: 'leaf', color: '#10b981' },
    { name: 'Chemistry', icon: 'flask', color: '#f59e0b' },
    { name: 'Business', icon: 'business', color: '#6b7280' },
    { name: 'Humanities', icon: 'library', color: '#f59e0b' },
    { name: 'Sciences', icon: 'school', color: '#14b8a6' },
  ];

  const features = [
    {
      icon: 'cloud-upload',
      title: 'Upload Course Notes',
      description: 'Upload your lecture notes, PDFs, or documents and let AI extract key terminology for learning.',
      color: '#3b82f6',
    },
    {
      icon: 'bulb',
      title: 'AI-Generated Content',
      description: 'Get personalized learning materials and exercises based on your subject and current level.',
      color: '#8b5cf6',
    },
    {
      icon: 'compass',
      title: 'Subject-Specific Learning',
      description: 'Learn academic English vocabulary and phrases relevant to your field of study.',
      color: '#10b981',
    },
    {
      icon: 'book',
      title: 'Interactive Flashcards',
      description: 'Review key terms with spaced repetition learning for maximum retention.',
      color: '#f59e0b',
    },
    {
      icon: 'people',
      title: 'University-Focused',
      description: 'Designed specifically for university students with academic context in mind.',
      color: '#6366f1',
    },
    {
      icon: 'trophy',
      title: 'Progress Tracking',
      description: 'Monitor your learning progress with detailed analytics and achievements.',
      color: '#ec4899',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: '#6366f1' }]}>
            <Ionicons name="book" size={24} color="#ffffff" />
          </View>
          <Text style={styles.logoText}>UniLingo</Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Master Academic English{'\n'}
            <Text style={styles.heroTitleHighlight}>One Subject at a Time</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Transform your university notes into interactive learning experiences. 
            Learn subject-specific vocabulary with AI-powered flashcards and exercises.
          </Text>
          
          <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted}>
            <Text style={styles.ctaButtonText}>Start Learning Today</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Subjects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Subject</Text>
          <Text style={styles.sectionSubtitle}>
            Select your field of study to get started with relevant vocabulary
          </Text>
          
          <View style={styles.subjectsGrid}>
            {subjects.map((subject, index) => (
              <TouchableOpacity
                key={subject.name}
                style={[
                  styles.subjectCard,
                  activeSubject === index && styles.activeSubjectCard,
                ]}
                onPress={() => handleSubjectPress(index)}
              >
                <View
                  style={[styles.subjectIcon, { backgroundColor: subject.color }]}
                >
                  <Ionicons name={subject.icon as any} size={24} color="#ffffff" />
                </View>
                <Text style={styles.subjectName}>{subject.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose UniLingo?</Text>
          <Text style={styles.sectionSubtitle}>
            Everything you need to excel in academic English
          </Text>
          
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon as any} size={24} color="#ffffff" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Upload Your Notes</Text>
              <Text style={styles.stepDescription}>
                Upload PDFs, documents, or type in your lecture notes
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>AI Extracts Terms</Text>
              <Text style={styles.stepDescription}>
                Our AI identifies key vocabulary and concepts automatically
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Learn & Practice</Text>
              <Text style={styles.stepDescription}>
                Study with flashcards, games, and interactive exercises
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={[styles.ctaGradient, { backgroundColor: '#6366f1' }]}>
            <Text style={styles.ctaTitle}>Ready to Transform Your Learning?</Text>
            <Text style={styles.ctaSubtitle}>
              Join thousands of students already using UniLingo to master academic English
            </Text>
            <TouchableOpacity style={styles.ctaButtonLarge} onPress={handleGetStarted}>
              <Text style={styles.ctaButtonText}>Get Started Free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
