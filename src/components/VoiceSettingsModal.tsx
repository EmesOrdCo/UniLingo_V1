import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceService } from '../lib/voiceService';
import { ENV } from '../lib/envConfig';

interface VoiceSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  voiceEnabled: boolean;
  onVoiceToggle: (enabled: boolean) => void;
}

export default function VoiceSettingsModal({
  visible,
  onClose,
  voiceEnabled,
  onVoiceToggle,
}: VoiceSettingsModalProps) {
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [availableVoices, setAvailableVoices] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('alloy');

  useEffect(() => {
    if (visible) {
      loadVoiceSettings();
    }
  }, [visible]);

  const loadVoiceSettings = async () => {
    try {
      const languages = VoiceService.getAvailableLanguages();
      const voices = VoiceService.getAvailableVoices();
      setAvailableLanguages(languages);
      setAvailableVoices(voices);
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
  };

  const testVoice = async () => {
    try {
      await VoiceService.textToSpeech(
        "Hello! This is a test of the OpenAI TTS capabilities. How does this sound?",
        {
          language: selectedLanguage,
          rate: speechRate,
          pitch: 1.0,
          volume: 0.9,
        }
      );
    } catch (error) {
      Alert.alert('Voice Test Error', 'Failed to test voice. Please try again.');
    }
  };

  const handlePermissionRequest = async () => {
    try {
      // For OpenAI-based voice, we just need to check API key
      const apiKey = ENV.OPENAI_API_KEY;
      if (apiKey && apiKey.startsWith('sk-') && apiKey.length > 20) {
        onVoiceToggle(true);
        Alert.alert('Success', 'OpenAI API key configured! Voice features enabled.');
      } else {
        Alert.alert('API Key Required', 'Please configure your OpenAI API key in the environment variables.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to configure voice features.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Voice Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Voice Enable/Disable */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Voice Features</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="mic-outline" size={24} color="#374151" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Voice Input</Text>
                    <Text style={styles.settingDescription}>
                      Speak to send messages
                    </Text>
                  </View>
                </View>
                <Switch
                  value={voiceEnabled}
                  onValueChange={onVoiceToggle}
                  trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                  thumbColor={voiceEnabled ? '#ffffff' : '#ffffff'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="volume-high-outline" size={24} color="#374151" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Auto-Speak AI Responses</Text>
                    <Text style={styles.settingDescription}>
                      AI speaks its responses aloud
                    </Text>
                  </View>
                </View>
                <Switch
                  value={autoSpeak}
                  onValueChange={setAutoSpeak}
                  trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                  thumbColor={autoSpeak ? '#ffffff' : '#ffffff'}
                />
              </View>
            </View>

            {/* Speech Settings */}
            {voiceEnabled && (
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Speech Settings</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="speedometer-outline" size={24} color="#374151" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>Speech Rate</Text>
                      <Text style={styles.settingDescription}>
                        {Math.round(speechRate * 100)}% speed
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={testVoice}
                  >
                    <Text style={styles.testButtonText}>Test</Text>
                  </TouchableOpacity>
                </View>

                {/* Rate Slider would go here */}
                <View style={styles.rateSlider}>
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={() => setSpeechRate(Math.max(0.5, speechRate - 0.1))}
                  >
                    <Ionicons name="remove" size={20} color="#6366f1" />
                  </TouchableOpacity>
                  <Text style={styles.rateText}>{Math.round(speechRate * 100)}%</Text>
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={() => setSpeechRate(Math.min(1.5, speechRate + 0.1))}
                  >
                    <Ionicons name="add" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </View>

                {/* Voice Selection */}
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="person-outline" size={24} color="#374151" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>AI Voice</Text>
                      <Text style={styles.settingDescription}>
                        {selectedVoice.charAt(0).toUpperCase() + selectedVoice.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Voice Options */}
                <View style={styles.voiceOptions}>
                  {availableVoices.map((voice) => (
                    <TouchableOpacity
                      key={voice}
                      style={[
                        styles.voiceOption,
                        selectedVoice === voice && styles.voiceOptionSelected
                      ]}
                      onPress={() => setSelectedVoice(voice)}
                    >
                      <Text style={[
                        styles.voiceOptionText,
                        selectedVoice === voice && styles.voiceOptionTextSelected
                      ]}>
                        {voice.charAt(0).toUpperCase() + voice.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Permission Section */}
            {!voiceEnabled && (
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Configuration</Text>
                
                <View style={styles.permissionCard}>
                  <Ionicons name="key-outline" size={24} color="#f59e0b" />
                  <Text style={styles.permissionText}>
                    Voice features require OpenAI API key configuration
                  </Text>
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={handlePermissionRequest}
                  >
                    <Text style={styles.permissionButtonText}>Check Configuration</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Tips */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Tips</Text>
              
              <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
                <Text style={styles.tipText}>
                  • Tap the microphone button to start voice recording{'\n'}
                  • Speak clearly and at a normal pace{'\n'}
                  • OpenAI Whisper will transcribe your speech{'\n'}
                  • AI responses will be spoken using OpenAI TTS{'\n'}
                  • Voice features work best in quiet environments
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  settingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  rateSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  rateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  rateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 50,
    textAlign: 'center',
  },
  permissionCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  tipCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  voiceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  voiceOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  voiceOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  voiceOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  voiceOptionTextSelected: {
    color: '#ffffff',
  },
});
