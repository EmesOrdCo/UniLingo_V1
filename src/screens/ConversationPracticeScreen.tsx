import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';

interface Topic {
  id: string;
  name: string;
  icon: string;
  color: string;
  vocabularyCount: number;
  description: string;
}

export default function ConversationPracticeScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      
      // Fetch topics from user flashcards only
      const userFlashcards = await UserFlashcardService.getUserFlashcards();
      
      // Get unique topics from user cards only
      const topicMap = new Map<string, { count: number; cards: any[] }>();
      
      userFlashcards.forEach((card: any) => {
        const topic = card.topic || 'General';
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { count: 0, cards: [] });
        }
        topicMap.get(topic)!.count++;
        topicMap.get(topic)!.cards.push(card);
      });
      
      // Convert to topic objects
      const topicObjects: Topic[] = Array.from(topicMap.entries()).map(([name, data], index) => {
        const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];
        const icons = ['medical-outline', 'construct-outline', 'nuclear-outline', 'leaf-outline', 'flask-outline', 'calculator-outline', 'book-outline', 'bulb-outline'];
        
        return {
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          icon: icons[index % icons.length],
          color: colors[index % colors.length],
          vocabularyCount: data.count,
          description: `Practice ${data.count} vocabulary terms in conversation`,
        };
      });
      
      // Add some default topics if none exist
      if (topicObjects.length === 0) {
        const defaultTopics: Topic[] = [
          {
            id: 'medicine',
            name: 'Medicine',
            icon: 'medical-outline',
            color: '#ef4444',
            vocabularyCount: 0,
            description: 'Medical terminology and healthcare vocabulary',
          },
          {
            id: 'engineering',
            name: 'Engineering',
            icon: 'construct-outline',
            color: '#3b82f6',
            vocabularyCount: 0,
            description: 'Engineering concepts and technical terms',
          },
          {
            id: 'business',
            name: 'Business',
            icon: 'business-outline',
            color: '#10b981',
            vocabularyCount: 0,
            description: 'Business and professional vocabulary',
          },
          {
            id: 'general',
            name: 'General English',
            icon: 'language-outline',
            color: '#8b5cf6',
            vocabularyCount: 0,
            description: 'General English conversation practice',
          },
        ];
        setTopics(defaultTopics);
      } else {
        setTopics(topicObjects);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      Alert.alert('Error', 'Failed to load topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    // Navigate to the conversation practice with the selected topic
    navigation.navigate('AIChat' as never, { 
      mode: 'conversation-practice',
      topic: topic,
      vocabulary: [] // Will be loaded in the chat screen
    } as never);
  };

  const renderTopicCard = (topic: Topic) => (
    <TouchableOpacity
      key={topic.id}
      style={[styles.topicCard, { borderLeftColor: topic.color }]}
      onPress={() => handleTopicSelect(topic)}
    >
      <View style={styles.topicHeader}>
        <View style={[styles.topicIcon, { backgroundColor: topic.color }]}>
          <Ionicons name={topic.icon as any} size={24} color="white" />
        </View>
        <View style={styles.topicInfo}>
          <Text style={styles.topicName}>{topic.name}</Text>
          <Text style={styles.topicCount}>
            {topic.vocabularyCount} vocabulary terms
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>
      <Text style={styles.topicDescription}>{topic.description}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Conversation Practice</Text>
          <Text style={styles.headerSubtitle}>Practice vocabulary through AI conversations</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <View style={styles.introCard}>
            <Ionicons name="chatbubbles-outline" size={32} color="#6366f1" />
            <Text style={styles.introTitle}>Practice Makes Perfect</Text>
            <Text style={styles.introText}>
              Select a topic to start a conversation with our AI assistant. 
              Practice using your vocabulary in natural, contextual conversations.
            </Text>
          </View>
        </View>

        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Choose Your Topic</Text>
          {topics.map(renderTopicCard)}
        </View>

        <View style={styles.tipSection}>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>
              💡 Tip: The AI will use vocabulary from your selected topic to create 
              natural conversations. Try to use the terms you've learned!
            </Text>
          </View>
        </View>
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
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  introSection: {
    padding: 20,
  },
  introCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  topicsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  topicCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  topicDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  tipSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tipCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});
