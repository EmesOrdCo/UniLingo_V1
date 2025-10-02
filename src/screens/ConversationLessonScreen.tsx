import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson, LessonVocabulary } from '../lib/lessonService';
import { XPService } from '../lib/xpService';
import { logger } from '../lib/logger';

const { width } = Dimensions.get('window');

interface ConversationMessage {
  speaker: string;  // "User" or "Person A" 
  message: string;
}

interface ConversationData {
  conversation: ConversationMessage[];
}

interface RouteParams {
  lessonId: string;
  lessonTitle: string;
}

export default function ConversationLessonScreen() {
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [vocabulary, setVocabulary] = useState<LessonVocabulary[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [userMessageCompleted, setUserMessageCompleted] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId, lessonTitle } = route.params as RouteParams;
  
  // Use refs to prevent stale closures and ensure state consistency
  const currentMessageIndexRef = useRef(0);
  const conversationDataRef = useRef<ConversationData | null>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimationRunningRef = useRef(false);
  
  // Update refs when state changes
  useEffect(() => {
    currentMessageIndexRef.current = currentMessageIndex;
  }, [currentMessageIndex]);
  
  useEffect(() => {
    conversationDataRef.current = conversationData;
  }, [conversationData]);
  
  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    loadConversationData();
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (isTypingAnimation && conversationDataRef.current && !isAnimationRunningRef.current) {
      const currentMessage = conversationDataRef.current.conversation[currentMessageIndexRef.current];
      if (currentMessage) {
        // Use requestAnimationFrame to ensure smooth start
        requestAnimationFrame(() => {
          startTypingAnimation(currentMessage.message);
        });
      }
    }
  }, [isTypingAnimation]);

  const startTypingAnimation = (fullText: string) => {
    // Clear any existing timeout to prevent overlapping animations
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Mark animation as running
    isAnimationRunningRef.current = true;
    setTypingText('');
    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setTypingText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, 50); // 50ms per character
      } else {
        // Animation complete - use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
          isAnimationRunningRef.current = false;
          setIsTypingAnimation(false);
          
          // Handle message advancement based on who just finished typing
          if (conversationDataRef.current && conversationDataRef.current.conversation[currentMessageIndexRef.current]) {
            const currentMessage = conversationDataRef.current.conversation[currentMessageIndexRef.current];
            
            if (currentMessage.speaker === 'Person A') {
              // Person A finished typing, advance to next message
              setTimeout(() => {
                handleNextMessage();
              }, 1000); // Wait 1 second after typing completes
            } else if (currentMessage.speaker === 'User') {
              // User finished typing, mark as completed and advance to Person A message
              setUserMessageCompleted(true);
              setTimeout(() => {
                const nextIndex = currentMessageIndexRef.current + 1;
                if (nextIndex < conversationDataRef.current!.conversation.length) {
                  // Batch state updates to prevent jank
                  const nextMessage = conversationDataRef.current!.conversation[nextIndex];
                  
                  if (nextMessage.speaker === 'Person A') {
                    // Update all states together
                    setCurrentMessageIndex(nextIndex);
                    currentMessageIndexRef.current = nextIndex;
                    setIsTyping(true);
                    isTypingRef.current = true;
                    setIsTypingAnimation(true);
                    setUserMessageCompleted(false); // Reset flag
                  } else {
                    setCurrentMessageIndex(nextIndex);
                    currentMessageIndexRef.current = nextIndex;
                    setIsTyping(false);
                    isTypingRef.current = false;
                    setIsTypingAnimation(false);
                    setUserMessageCompleted(false); // Reset flag
                  }
                } else {
                  handleConversationComplete();
                }
              }, 1000); // Wait 1 second after user typing completes
            }
          }
        });
      }
    };
    
    typeNextChar();
  };

  const stopTypingAnimation = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    isAnimationRunningRef.current = false;
    setIsTypingAnimation(false);
  };

  const loadConversationData = async () => {
    try {
      setIsLoading(true);
      
      // Load lesson and vocabulary
      const lessonData = await LessonService.getLesson(lessonId);
      if (!lessonData) {
        Alert.alert('Error', 'Lesson not found');
        navigation.goBack();
        return;
      }

      setLesson(lessonData.lesson);
      setVocabulary(lessonData.vocabulary);

      // Try to get conversation from chat_content
      let conversation: ConversationData | null = null;
      
      if (lessonData.vocabulary.length > 0 && (lessonData.vocabulary[0] as any).chat_content) {
        try {
          conversation = JSON.parse((lessonData.vocabulary[0] as any).chat_content);
          console.log('✅ Loaded conversation from database');
        } catch (error) {
          console.error('❌ Error parsing conversation data:', error);
        }
      }

      // Fallback to test conversation if no data found
      if (!conversation) {
        console.log('⚠️ No conversation data found, using fallback');
        conversation = {
          conversation: [
            {
              speaker: "Person A",
              message: "Hey! I heard you're studying computer science. What are you working on?"
            },
            {
              speaker: "User",
              message: "Yes, I'm learning about algorithms and data structures. It's really interesting!"
            },
            {
              speaker: "Person A",
              message: "That's great! Algorithms are the foundation of programming. Have you covered sorting algorithms yet?"
            },
            {
              speaker: "User",
              message: "I've learned about quicksort and merge sort. The time complexity of quicksort is O(n log n) on average."
            },
            {
              speaker: "Person A",
              message: "Excellent! And what about data structures? Arrays and linked lists are fundamental concepts."
            },
            {
              speaker: "User",
              message: "I understand that arrays have constant time access, but linked lists require O(n) traversal time."
            },
            {
              speaker: "Person A",
              message: "Perfect! You're really getting the concepts. Have you worked with binary trees or hash tables?"
            },
            {
              speaker: "User",
              message: "Binary trees are fascinating - I love how they enable efficient searching with O(log n) complexity."
            },
            {
              speaker: "Person A",
              message: "That's impressive understanding! These data structures and algorithms form the backbone of software engineering."
            },
            {
              speaker: "User",
              message: "I'm excited to apply these concepts in my programming projects. Thanks for the great discussion!"
            }
          ]
        };
      }

      setConversationData(conversation);
      setCurrentMessageIndex(0);
      currentMessageIndexRef.current = 0;
      conversationDataRef.current = conversation;
      
      // Start with Person A message (index 0)
      if (conversation.conversation.length > 0) {
        const firstMessage = conversation.conversation[0];
        if (firstMessage.speaker === 'Person A') {
          setIsTyping(true);
          isTypingRef.current = true;
          setIsTypingAnimation(true);
        }
      }

    } catch (error) {
      console.error('Error loading conversation data:', error);
      Alert.alert('Error', 'Failed to load conversation data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextMessage = useCallback(() => {
    if (!conversationDataRef.current) return;
    
    const currentIndex = currentMessageIndexRef.current;
    const nextIndex = currentIndex + 1;
    
    console.log(`🔄 Advancing from message ${currentIndex} to ${nextIndex}`);
    console.log(`📝 Current speaker: ${conversationDataRef.current.conversation[currentIndex]?.speaker}`);
    console.log(`📝 Next speaker: ${conversationDataRef.current.conversation[nextIndex]?.speaker}`);
    
    if (nextIndex >= conversationDataRef.current.conversation.length) {
      // Conversation completed
      handleConversationComplete();
      return;
    }
    
    // Update state
    setCurrentMessageIndex(nextIndex);
    currentMessageIndexRef.current = nextIndex;
    
    const nextMessage = conversationDataRef.current.conversation[nextIndex];
    
    // Set typing state based on next speaker
    if (nextMessage.speaker === 'Person A') {
      setIsTyping(true);
      isTypingRef.current = true;
      setIsTypingAnimation(true);
    } else {
      setIsTyping(false);
      isTypingRef.current = false;
      setIsTypingAnimation(false);
    }
    
    console.log(`✅ Message advanced. Is typing: ${isTypingRef.current}`);
  }, []);

  const handleSendMessage = useCallback(() => {
    console.log('📤 Send message button pressed');
    // Start typing animation for user message
    if (conversationData) {
      const currentMessage = conversationData.conversation[currentMessageIndex];
      if (currentMessage && currentMessage.speaker === 'User') {
        // Set typing animation state immediately (like Person A's initial message)
        setTypingText(''); // Start with empty text to prevent flash
        setIsTypingAnimation(true);
        // The typing animation will handle advancing to the next message when it completes
      } else {
        handleNextMessage();
      }
    } else {
      handleNextMessage();
    }
  }, [currentMessageIndex, conversationData]);

  const handleConversationComplete = async () => {
    if (!user) return;
    
    console.log('🎉 Conversation completed');
    setIsCompleted(true);
    
    // Award XP for completing the conversation
    try {
      const xpResult = await XPService.awardXP(
        user.id,
        'lesson',
        10, // Base XP for conversation completion
        10,
        100, // 100% accuracy for completing conversation
        lessonTitle || 'Conversation Lesson',
        120 // 2 minutes estimated time
      );
      
      if (xpResult) {
        logger.info(`XP awarded for conversation: ${xpResult.totalXP} XP`);
      }
    } catch (xpError) {
      logger.error('Error awarding XP for conversation:', xpError);
    }
    
    // Show completion alert
    Alert.alert(
      '🎉 Conversation Complete!',
      'Great job! You\'ve completed the conversation lesson.',
      [
        {
          text: 'Back to Lessons',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const renderMessage = React.useCallback((message: ConversationMessage, index: number) => {
    const isUser = message.speaker === 'User';
    const isCurrentMessage = index === currentMessageIndex;
    const isCurrentlyTyping = isCurrentMessage && isTypingAnimation;
    
    // Show Person A messages up to current index
    // Show User messages if they're past messages OR currently typing OR just completed
    const isVisible = isUser 
      ? index < currentMessageIndex || (index === currentMessageIndex && (isTypingAnimation || userMessageCompleted))  // User messages show after sent OR while typing OR just completed
      : index <= currentMessageIndex; // Person A messages show up to current
    
    // Don't render messages that haven't been reached yet
    if (!isVisible) {
      return null;
    }
    
    // Determine what text to show
    let displayText = message.message;
    if (isCurrentlyTyping) {
      displayText = typingText;
    }
    
    return (
      <View
        key={`message-${index}`}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.otherMessageContainer,
          isCurrentMessage ? styles.currentMessage : styles.pastMessage
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.otherMessageBubble
          ]}
        >
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.otherMessageText
          ]}>
            {displayText}
            {isCurrentlyTyping && <Text style={styles.cursor}>|</Text>}
          </Text>
        </View>
        <Text style={[
          styles.speakerLabel,
          isUser ? styles.userSpeakerLabel : styles.otherSpeakerLabel
        ]}>
          {message.speaker}
        </Text>
      </View>
    );
  }, [currentMessageIndex, isTypingAnimation, typingText, userMessageCompleted]);

  const renderActionButton = () => {
    if (!conversationData) return null;
    
    const currentMessage = conversationData.conversation[currentMessageIndex];
    const isUserTurn = currentMessage?.speaker === 'User';
    const isPersonATyping = !isUserTurn && isTypingAnimation;
    
    console.log(`🎯 Rendering action button - Current speaker: ${currentMessage?.speaker}, Is user turn: ${isUserTurn}, Is Person A typing: ${isPersonATyping}`);
    
    if (isUserTurn) {
      return (
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
          <Text style={styles.sendButtonText}>Send Message</Text>
        </TouchableOpacity>
      );
    } else if (isPersonATyping) {
      return (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
          <Text style={styles.typingText}>Other person is typing...</Text>
        </View>
      );
    } else {
      // Person A message is complete, no action needed
      return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversationData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load conversation</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConversationData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentMessageIndex + 1) / conversationData.conversation.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentMessageIndex + 1} of {conversationData.conversation.length}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {conversationData.conversation.map((message, index) => 
          renderMessage(message, index)
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {renderActionButton()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 100, // Space for action button
  },
  messageContainer: {
    marginBottom: 16,
    opacity: 1,
  },
  currentMessage: {
    opacity: 1,
  },
  pastMessage: {
    opacity: 1,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#1e293b',
  },
  speakerLabel: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  userSpeakerLabel: {
    color: '#6366f1',
    textAlign: 'right',
  },
  otherSpeakerLabel: {
    color: '#64748b',
    textAlign: 'left',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginHorizontal: 2,
  },
  typingDot1: {
    // animationDelay: '0s', // Not supported in React Native
  },
  typingDot2: {
    // animationDelay: '0.2s', // Not supported in React Native
  },
  typingDot3: {
    // animationDelay: '0.4s', // Not supported in React Native
  },
  typingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cursor: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
});
