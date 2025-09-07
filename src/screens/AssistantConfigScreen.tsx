import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssistantService } from '../lib/assistantService';

const ASSISTANT_ID_KEY = 'custom_assistant_id';

export default function AssistantConfigScreen() {
  const navigation = useNavigation();
  const [assistantId, setAssistantId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [assistantInfo, setAssistantInfo] = useState<any>(null);

  useEffect(() => {
    loadSavedAssistantId();
  }, []);

  const loadSavedAssistantId = async () => {
    try {
      const savedId = await AsyncStorage.getItem(ASSISTANT_ID_KEY);
      if (savedId) {
        setAssistantId(savedId);
        checkAssistantStatus(savedId);
      }
    } catch (error) {
      console.error('Error loading saved assistant ID:', error);
    }
  };

  const checkAssistantStatus = async (id: string) => {
    try {
      const success = await AssistantService.initializeAssistant(id);
      if (success) {
        setIsInitialized(true);
        const info = await AssistantService.getAssistantInfo();
        setAssistantInfo(info);
      }
    } catch (error) {
      console.error('Error checking assistant status:', error);
    }
  };

  const handleSaveAssistant = async () => {
    if (!assistantId.trim()) {
      Alert.alert('Error', 'Please enter a valid Assistant ID');
      return;
    }

    setIsLoading(true);
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(ASSISTANT_ID_KEY, assistantId.trim());
      
      // Initialize the assistant
      const success = await AssistantService.initializeAssistant(assistantId.trim());
      
      if (success) {
        setIsInitialized(true);
        const info = await AssistantService.getAssistantInfo();
        setAssistantInfo(info);
        
        Alert.alert(
          'Success!',
          'Your custom assistant has been configured successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to initialize assistant. Please check your Assistant ID.');
      }
    } catch (error) {
      console.error('Error saving assistant:', error);
      Alert.alert('Error', 'Failed to configure assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAssistant = async () => {
    if (!AssistantService.isReady()) {
      Alert.alert('Error', 'Assistant not configured. Please save your Assistant ID first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await AssistantService.sendMessage(
        'Hello! This is a test message to verify the assistant is working correctly.',
        (status) => console.log('Assistant status:', status)
      );
      
      Alert.alert(
        'Test Successful!',
        `Assistant responded: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Test Failed', 'Failed to test assistant. Please check your configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAssistant = async () => {
    Alert.alert(
      'Clear Assistant',
      'Are you sure you want to clear the current assistant configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(ASSISTANT_ID_KEY);
              setAssistantId('');
              setIsInitialized(false);
              setAssistantInfo(null);
              Alert.alert('Cleared', 'Assistant configuration has been cleared.');
            } catch (error) {
              console.error('Error clearing assistant:', error);
            }
          },
        },
      ]
    );
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Custom Assistant</Text>
          <Text style={styles.headerSubtitle}>Configure your OpenAI Assistant</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={32} color="#6366f1" />
            <Text style={styles.infoTitle}>How to Get Your Assistant ID</Text>
            <Text style={styles.infoText}>
              1. Go to platform.openai.com{'\n'}
              2. Navigate to Assistants{'\n'}
              3. Create or select your assistant{'\n'}
              4. Copy the Assistant ID from the URL or settings{'\n'}
              5. Paste it below
            </Text>
          </View>
        </View>

        {/* Configuration Section */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Assistant Configuration</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Assistant ID</Text>
            <TextInput
              style={styles.input}
              value={assistantId}
              onChangeText={setAssistantId}
              placeholder="asst_xxxxxxxxxxxxxxxxxxxxx"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveAssistant}
              disabled={isLoading || !assistantId.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Save Assistant</Text>
              )}
            </TouchableOpacity>

            {isInitialized && (
              <TouchableOpacity
                style={[styles.button, styles.testButton]}
                onPress={handleTestAssistant}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Test Assistant</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Section */}
        {isInitialized && assistantInfo && (
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Assistant Status</Text>
            
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.statusTitle}>Connected</Text>
              </View>
              
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Name:</Text>
                <Text style={styles.statusValue}>{assistantInfo.name}</Text>
              </View>
              
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Model:</Text>
                <Text style={styles.statusValue}>{assistantInfo.model}</Text>
              </View>
              
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Instructions:</Text>
                <Text style={styles.statusValue} numberOfLines={3}>
                  {assistantInfo.instructions || 'No instructions set'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearAssistant}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.buttonText, styles.clearButtonText]}>Clear Configuration</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
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
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  configSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  testButton: {
    backgroundColor: '#10b981',
  },
  clearButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  clearButtonText: {
    color: '#ef4444',
  },
  statusSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statusCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    width: 80,
  },
  statusValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
