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
import { useTranslation } from '../lib/i18n';

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
  const { t } = useTranslation();
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
          <Text style={styles.headerTitle}>{t('aiFlashcards.editAIDetectedTopics')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <Ionicons name="information-circle" size={20} color="#8b5cf6" />
            <Text style={styles.infoText}>
              {t('aiFlashcards.reviewEditTopicsInfo')}
            </Text>
          </View>

          <View style={styles.topicsSection}>
            <Text style={styles.sectionTitle}>{t('aiFlashcards.topicsCount', { count: topics.length })}</Text>
            
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
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveTopic}
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.viewMode}>
                    <Text style={styles.topicText}>{topic}</Text>
                    <TouchableOpacity
                      style={styles.editIcon}
                      onPress={() => handleEditTopic(topic)}
                    >
                      <Ionicons name="pencil" size={16} color="#6366f1" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveAllButton}
            onPress={handleSaveAll}
          >
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.saveAllButtonText}>{t('aiFlashcards.continueToReview')}</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  topicsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  topicItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewMode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  editIcon: {
    padding: 8,
  },
  editMode: {
    gap: 12,
  },
  topicInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
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
