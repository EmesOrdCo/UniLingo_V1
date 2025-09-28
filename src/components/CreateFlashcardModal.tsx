import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateFlashcardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (flashcard: any) => void;
  topics: Array<{ id: string; name: string; icon: string; color: string; count: number }>;
}

export default function CreateFlashcardModal({ 
  visible, 
  onClose, 
  onSubmit, 
  topics 
}: CreateFlashcardModalProps) {
  const [newFlashcard, setNewFlashcard] = useState({
    topic: '',
    front: '',
    back: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'expert',
    example: '',
    pronunciation: '',
    native_language: 'english'
  });
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');

  const handleSubmit = () => {
    if (newFlashcard.topic && newFlashcard.front && newFlashcard.back && newFlashcard.example) {
      onSubmit(newFlashcard);
      onClose();
      // Reset form
      setNewFlashcard({
        topic: '',
        front: '',
        back: '',
        difficulty: 'beginner',
        example: '',
        pronunciation: '',
        native_language: 'english'
      });
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.popupOverlay}>
      <View style={styles.createFlashcardPopup}>
        <View style={styles.popupHeader}>
          <Text style={styles.popupTitle}>Create New Flashcard</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.createFormContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Topic</Text>
            {!showTopicInput ? (
              <View style={styles.topicSelectionContainer}>
                <TouchableOpacity
                  style={styles.topicDropdown}
                  onPress={() => setShowTopicPicker(!showTopicPicker)}
                >
                  <Text style={styles.topicDropdownText}>
                    {newFlashcard.topic || 'Select a topic'}
                  </Text>
                  <Ionicons name={showTopicPicker ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.newTopicButton} 
                  onPress={() => {
                    setShowTopicInput(true);
                    setShowTopicPicker(false);
                  }}
                >
                  <Ionicons name="add" size={16} color="#6366f1" />
                  <Text style={styles.newTopicButtonText}>New Topic</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.newTopicInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new topic name"
                  value={newTopicInput}
                  onChangeText={setNewTopicInput}
                />
                <View style={styles.newTopicActions}>
                  <TouchableOpacity 
                    style={styles.cancelNewTopicButton}
                    onPress={() => {
                      setShowTopicInput(false);
                      setNewTopicInput('');
                    }}
                  >
                    <Text style={styles.cancelNewTopicButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.confirmNewTopicButton}
                    onPress={() => {
                      if (newTopicInput.trim()) {
                        setNewFlashcard(prev => ({ ...prev, topic: newTopicInput.trim() }));
                        setShowTopicInput(false);
                        setNewTopicInput('');
                      }
                    }}
                  >
                    <Text style={styles.confirmNewTopicButtonText}>Use New</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Topic dropdown options */}
            {!showTopicInput && showTopicPicker && (
              <ScrollView style={styles.topicOptionsContainer}>
                {(topics || []).map((topic) => (
                  <TouchableOpacity
                    key={topic.id}
                    style={styles.topicOption}
                    onPress={() => {
                      setNewFlashcard(prev => ({ ...prev, topic: topic.name }));
                      setShowTopicPicker(false);
                    }}
                  >
                    <Text style={styles.topicOptionText}>{topic.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Front of card (question/term)"
            value={newFlashcard.front}
            onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, front: text }))}
            multiline
          />
          
          <TextInput
            style={styles.input}
            placeholder="Back of card (answer/definition)"
            value={newFlashcard.back}
            onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, back: text }))}
            multiline
          />
          
          <TextInput
            style={styles.input}
            placeholder="Example sentence using the front term (required)"
            value={newFlashcard.example}
            onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, example: text }))}
            multiline
          />
          
          <TextInput
            style={styles.input}
            placeholder="Pronunciation (optional)"
            value={newFlashcard.pronunciation}
            onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, pronunciation: text }))}
          />
          
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Create Flashcard</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  createFlashcardPopup: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createFormContent: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  topicSelectionContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  topicDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topicDropdownText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  newTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  newTopicButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  newTopicInputContainer: {
    gap: 12,
  },
  newTopicActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelNewTopicButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelNewTopicButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmNewTopicButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  confirmNewTopicButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  topicOptionsContainer: {
    marginTop: 8,
    maxHeight: 150,
    gap: 8,
  },
  topicOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  topicOptionText: {
    fontSize: 14,
    color: '#1e293b',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
