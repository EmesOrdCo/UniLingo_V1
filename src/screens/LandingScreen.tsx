import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const SUBJECTS = [
  'Medicine',
  'Engineering', 
  'Physics',
  'Biology',
  'Chemistry',
  'Mathematics',
  'Computer Science',
  'Psychology',
  'Economics',
  'Law'
];

export default function LandingScreen() {
  const navigation = useNavigation();
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change subject
        setCurrentSubjectIndex((prev) => (prev + 1) % SUBJECTS.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      {/* Background Image Placeholder */}
      <ImageBackground
        source={{ uri: 'https://via.placeholder.com/400x800/f5f5f5/cccccc?text=Put+Image+Here+Later' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >

        {/* Content Overlay Card */}
        <View style={styles.overlayCard}>
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Master academic English</Text>
            <View style={styles.taglineContainer}>
              <Text style={styles.forText}>for</Text>
              <Animated.Text style={[styles.flickerText, { opacity: fadeAnim }]}>
                {SUBJECTS[currentSubjectIndex]}
              </Animated.Text>
            </View>
          </View>
          
          <Text style={styles.description}>
            Transform your university notes into interactive learning experiences. 
            Learn subject-specific vocabulary with AI-powered flashcards and exercises.
          </Text>
          
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Register' as never)}
          >
            <Text style={styles.ctaButtonText}>Start Learning Today</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressDots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 4,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  forText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: 'serif',
    marginRight: 8,
  },
  flickerText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1',
    fontFamily: 'serif',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#64748b',
  },
  loginLinkBold: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.5,
  },
  dotActive: {
    backgroundColor: '#f97316',
    opacity: 1,
  },
});
