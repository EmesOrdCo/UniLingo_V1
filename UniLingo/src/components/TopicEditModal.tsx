import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TopicEditModalProps {
  visible: boolean;
  topics: string[];
  onTopicChange: (oldTopic: string, newTopic: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const TopicEditModal: React.FC<TopicEditModalProps> = ({
  visible,
  topics,
  onTopicChange,
  onSave,
  onClose,
}) => {
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEditTopic = (topic: string) => {
    setEditingTopic(topic);
    setEditValue(topic);
  };

  const handleSaveTopic = () => {
    if (!editingTopic) return;
    
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      Alert.alert('Error', 'Topic name cannot be empty');
      return;
    }
    
    if (trimmedValue !== editingTopic) {
      onTopicChange(editingTopic, trimmedValue);
    }
    
    setEditingTopic(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingTopic(null);
    setEditValue('');
  };

  const handleSaveAll = () => {
    if (editingTopic) {
      Alert.alert('Error', 'Please finish editing the current topic before saving');
      return;
    }
    onSave();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit AI-Detected Topics</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <Ionicons name="information-circle" size={20} color="#8b5cf6" />
            <Text style={styles.infoText}>
              Review and edit the topics that AI detected from your content. You can modify topic names to better reflect your preferences.
            </Text>
          </View>

          <View style={styles.topicsSection}>
            <Text style={styles.sectionTitle}>Topics ({topics.length})</Text>
            
            {(topics || []).map((topic, index) => (
              <View key={index} style={styles.topicItem}>
                {editingTopic === topic ? (
                  <View style={styles.editMode}>
                    <TextInput
                      style={styles.topicInput}
                      value={editValue}
                      onChangeText={setEditValue}
                      placeholder="Enter topic name"
                      autoFocus
                      onSubmitEditing={handleSaveTopic}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.saveButton]} 
                        onPress={handleSaveTopic}
                      >
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.cancelButton]} 
                        onPress={handleCancelEdit}
                      >
                        <Ionicons name="close" size={16} color="#64748b" />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.viewMode}>
                    <Text style={styles.topicText}>{topic}</Text>
                    <TouchableOpacity 
                      style={styles.editButton} 
                      onPress={() => handleEditTopic(topic)}
                    >
                      <Ionicons name="create" size={20} color="#8b5cf6" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveAllButton} onPress={handleSaveAll}>
            <Ionicons name="save" size={20} color="#ffffff" />
            <Text style={styles.saveAllButtonText}>Save All Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  topicsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  topicItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  viewMode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  editMode: {
    gap: 12,
  },
  topicInput: {
    borderWidth: 1,
    borderColor: '#8b5cf6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  saveAllButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});









