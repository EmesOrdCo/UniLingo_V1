import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ENV } from '../lib/envConfig';
import OpenAIWithRateLimit from '../lib/openAIWithRateLimit';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import { VoiceService } from '../lib/voiceService';
import { AssistantService } from '../lib/assistantService';
import VoiceSettingsModal from '../components/VoiceSettingsModal';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ConversationParams {
  mode?: 'conversation-practice' | 'general';
  topic?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    vocabularyCount: number;
    description: string;
  };
  vocabulary?: any[];
}

export default function AIChatPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as ConversationParams;
  
  const isConversationPractice = params?.mode === 'conversation-practice';
  const selectedTopic = params?.topic;
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [loadingVocabulary, setLoadingVocabulary] = useState(false);
  
  // Voice capabilities
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechPermission, setSpeechPermission] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  // Assistant capabilities
  const [usingCustomAssistant, setUsingCustomAssistant] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: isConversationPractice 
        ? `Hi! I'm your UniLingo conversation partner for ${selectedTopic?.name || 'this topic'}. Let's practice using vocabulary in natural conversations! I'll help you use the terms you've learned in context. What would you like to talk about?`
        : 'Hi! I\'m your UniLingo AI assistant. I can help you with language learning, answer questions about the app, or just chat! How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    // Load vocabulary for conversation practice
    if (isConversationPractice && selectedTopic) {
      loadVocabularyForTopic();
    }
  }, [isConversationPractice, selectedTopic]);

  useEffect(() => {
    // Initialize voice capabilities
    initializeVoice();
    
    // Check for custom assistant
    checkCustomAssistant();
    
    // Cleanup function
    return () => {
      VoiceService.stopRecording();
      VoiceService.stopSpeaking();
    };
  }, []);

  const initializeVoice = async () => {
    try {
      // For OpenAI-based voice, we don't need special permissions
      // Just check if API key is available
      const apiKey = ENV.OPENAI_API_KEY;
      if (apiKey && apiKey !== 'b214f483e4c5441a980832bf84db4501') {
        setVoiceEnabled(true);
        setSpeechPermission(true);
        console.log('✅ OpenAI voice capabilities initialized');
      } else {
        console.log('❌ OpenAI API key not configured for voice features');
      }
    } catch (error) {
      console.error('❌ Voice initialization error:', error);
    }
  };

  const checkCustomAssistant = async () => {
    try {
      // Always try to initialize the assistant automatically
      const success = await AssistantService.initializeAssistant();
      if (success) {
        setUsingCustomAssistant(true);
        console.log('✅ Custom assistant initialized successfully');
        
        // Load conversation history if available
        const history = await AssistantService.getConversationHistory();
        if (history.length > 0) {
          const historyMessages: Message[] = history.map(msg => ({
            id: msg.id,
            text: msg.content,
            isUser: msg.role === 'user',
            timestamp: msg.timestamp,
          }));
          setMessages(prev => [...prev, ...historyMessages]);
        }
      } else {
        console.log('⚠️ Custom assistant initialization failed, will use default GPT');
        setUsingCustomAssistant(false);
      }
    } catch (error) {
      console.error('❌ Custom assistant check error:', error);
      console.log('⚠️ Falling back to default GPT due to assistant error');
      setUsingCustomAssistant(false);
    }
  };

  const loadVocabularyForTopic = async () => {
    try {
      setLoadingVocabulary(true);
      
      // Fetch vocabulary from both user flashcards and general flashcards
      const userFlashcards = await UserFlashcardService.getUserFlashcards();
      const generalFlashcards = await FlashcardService.getAllFlashcards();
      
      // Filter by topic
      const allFlashcards = [...userFlashcards, ...generalFlashcards];
      const topicVocabulary = allFlashcards.filter((card: any) => 
        card.topic === selectedTopic?.name
      );
      
      setVocabulary(topicVocabulary);
      console.log(`📚 Loaded ${topicVocabulary.length} vocabulary terms for ${selectedTopic?.name}`);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    } finally {
      setLoadingVocabulary(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      let aiResponse: string;

      if (usingCustomAssistant) {
        // Use custom assistant
        setAssistantStatus('Sending to custom assistant...');
        aiResponse = await AssistantService.sendMessage(
          inputText.trim(),
          (status) => setAssistantStatus(status)
        );
      } else {
        // Use default GPT
        // Check if API key is configured
        const apiKey = ENV.OPENAI_API_KEY;
        console.log('🔍 AI Chat - API Key check:', {
          hasApiKey: !!apiKey,
          apiKeyLength: apiKey?.length,
          apiKeyStartsWith: apiKey?.substring(0, 10) + '...',
          isOldKey: apiKey === 'b214f483e4c5441a980832bf84db4501'
        });
        
        if (!apiKey || apiKey === 'b214f483e4c5441a980832bf84db4501') {
          throw new Error('OpenAI API key not properly configured. Please check your environment variables.');
        }

        // Use OpenAI with rate limiting
        const openai = new OpenAIWithRateLimit({
          apiKey: ENV.OPENAI_API_KEY,
        });

        const response = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: isConversationPractice 
                ? `You are a conversation partner for UniLingo, a language learning app. The user is practicing vocabulary from the topic: "${selectedTopic?.name}". 

IMPORTANT: Use the following vocabulary terms naturally in your responses to help the user practice:
${vocabulary.map((term: any) => `- ${term.term || term.english_term}: ${term.definition || term.translation}`).join('\n')}

Your role:
1. Engage in natural, contextual conversations about ${selectedTopic?.name}
2. Naturally incorporate the vocabulary terms above in your responses
3. Ask questions that encourage the user to use these terms
4. Provide gentle corrections and suggestions when appropriate
5. Keep responses conversational and encouraging
6. Focus on practical usage of the vocabulary in real-world scenarios

Be friendly, encouraging, and help the user practice using their vocabulary in context.`
                : 'You are a helpful AI assistant for UniLingo, a language learning app. You can help users with language learning questions, app features, study tips, and general conversation. Be friendly, encouraging, and helpful. Keep responses concise but informative.',
            },
            ...messages.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.text,
            })),
            {
              role: 'user',
              content: inputText.trim(),
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
          priority: 2
        });

        aiResponse = response.content;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak the AI response if voice is enabled
      if (voiceEnabled && isConversationPractice) {
        setIsSpeaking(true);
        await VoiceService.textToSpeech(aiResponse, {
          rate: 0.85,
          pitch: 1.0,
          volume: 0.9,
        });
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      let errorMessage = 'Sorry, I\'m having trouble connecting right now. Please try again later.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key not properly configured')) {
          errorMessage = 'OpenAI API key not configured. Please check your environment variables and ensure you have a valid API key starting with "sk-".';
        } else if (error.message.includes('401')) {
          errorMessage = 'Invalid OpenAI API key. Please check your API key in the environment variables.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'OpenAI service temporarily unavailable. Please try again later.';
        }
      }
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleVoiceInput = async () => {
    if (!voiceEnabled || !speechPermission) {
      Alert.alert(
        'Voice Not Available',
        'Please configure OpenAI API key to use voice features.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isListening) {
      // Stop recording
      await VoiceService.stopRecording();
      setIsListening(false);
      return;
    }

    // Start recording
    setIsListening(true);
    await VoiceService.startRecording(
      (text) => {
        setInputText(text);
        setIsListening(false);
      },
      (error) => {
        console.error('Voice input error:', error);
        setIsListening(false);
        Alert.alert('Voice Input Error', error);
      }
    );
  };

  const handleSendVoice = async () => {
    if (isListening) {
      await VoiceService.stopRecording();
      setIsListening(false);
    }
    
    if (inputText.trim()) {
      await sendMessage();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isConversationPractice ? 'Conversation Practice' : 'AI Assistant'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {usingCustomAssistant 
              ? 'Enhanced AI'
              : isConversationPractice 
                ? `Topic: ${selectedTopic?.name} (${vocabulary.length} terms)`
                : 'Powered by GPT'
            }
          </Text>
        </View>
        <View style={styles.headerButtons}>
          {voiceEnabled && (
            <TouchableOpacity 
              style={styles.voiceToggleButton}
              onPress={() => setShowVoiceSettings(true)}
            >
              <Ionicons 
                name={voiceEnabled ? "volume-high" : "volume-mute"} 
                size={20} 
                color={voiceEnabled ? "#6366f1" : "#9ca3af"} 
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser ? styles.userText : styles.aiText,
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.isUser ? styles.userTime : styles.aiTime,
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.typingText}>AI is typing...</Text>
                </View>
              </View>
            </View>
          )}
          
          {isSpeaking && (
            <View style={styles.loadingContainer}>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.typingText}>AI is speaking...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          {voiceEnabled && (
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isListening && styles.voiceButtonListening
              ]}
              onPress={handleVoiceInput}
              disabled={isLoading}
            >
              <Ionicons 
                name={isListening ? "mic" : "mic-outline"} 
                size={20} 
                color={isListening ? "#ffffff" : "#6366f1"} 
              />
            </TouchableOpacity>
          )}
          
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={voiceEnabled && isListening ? handleSendVoice : sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons 
              name={voiceEnabled && isListening ? "send" : "send"} 
              size={20} 
              color={inputText.trim() ? "white" : "#9ca3af"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        visible={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        voiceEnabled={voiceEnabled}
        onVoiceToggle={setVoiceEnabled}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceToggleButton: {
    padding: 8,
    marginRight: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTime: {
    color: '#9ca3af',
  },
  loadingContainer: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  voiceButton: {
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  voiceButtonListening: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  },
});
