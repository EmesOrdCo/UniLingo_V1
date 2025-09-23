import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeneratedFlashcard } from '../lib/uploadService';

interface FlashcardReviewModalProps {
  visible: boolean;
  flashcards: GeneratedFlashcard[];
  onClose: () => void;
  onSave: (flashcards: GeneratedFlashcard[]) => void;
  onEdit: (index: number, flashcard: GeneratedFlashcard) => void;
  onEditTopics?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function FlashcardReviewModal({
  visible,
  flashcards,
  onClose,
  onSave,
  onEdit,
  onEditTopics,
}: FlashcardReviewModalProps) {
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedFlashcard, setEditedFlashcard] = useState<GeneratedFlashcard | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [showTopicFilter, setShowTopicFilter] = useState(false);

  // Early return if modal is not visible or no flashcards
  if (!visible || !flashcards || flashcards.length === 0) {
    return null;
  }

  // Debug: Log what the modal receives (only when visible and has flashcards)
  console.log('🔍 FlashcardReviewModal received:', {
    visible,
    flashcardsCount: flashcards.length,
    flashcards: flashcards.slice(0, 2), // Log first 2 cards
    isVisible: visible,
    flashcardsArray: flashcards,
    flashcardsType: typeof flashcards,
    isArray: Array.isArray(flashcards)
  });

  // Get unique topics from flashcards
  const uniqueTopics = ['all', ...Array.from(new Set(flashcards.map(card => card.topic)))];
  
  // Filter flashcards by selected topic
  const filteredFlashcards = selectedTopic === 'all' 
    ? flashcards 
    : flashcards.filter(card => card.topic === selectedTopic);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedFlashcard({ ...filteredFlashcards[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editedFlashcard) {
      onEdit(editingIndex, editedFlashcard);
      setEditingIndex(null);
      setEditedFlashcard(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedFlashcard(null);
  };

  const handleDelete = (index: number) => {
    const updatedFlashcards = flashcards.filter((_, i) => i !== index);
    onSave(updatedFlashcards);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'expert':
        return '#ef4444';
      default:
        return '#64748b';
    }
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Generated Flashcards</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>
              {filteredFlashcards.length} flashcards {selectedTopic !== 'all' ? `in ${selectedTopic}` : 'generated'}
            </Text>
            {selectedTopic !== 'all' && (
              <Text style={styles.summarySubtext}>
                Showing {filteredFlashcards.length} of {flashcards.length} total flashcards
              </Text>
            )}
            <View style={styles.difficultyBreakdown}>
              {['beginner', 'intermediate', 'expert'].map((diff) => {
                const count = filteredFlashcards.filter(f => f.difficulty === diff).length;
                return (
                  <View key={diff} style={styles.difficultyItem}>
                    <View 
                      style={[
                        styles.difficultyDot, 
                        { backgroundColor: getDifficultyColor(diff) }
                      ]} 
                    />
                    <Text style={styles.difficultyText}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}: {count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Topic Filter */}
          <View style={styles.topicFilterSection}>
            <View style={styles.topicFilterHeader}>
              <Text style={styles.topicFilterTitle}>Filter by Topic</Text>
              <TouchableOpacity 
                style={styles.topicFilterToggle}
                onPress={() => setShowTopicFilter(!showTopicFilter)}
              >
                <Ionicons 
                  name={showTopicFilter ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6366f1" 
                />
              </TouchableOpacity>
            </View>
            
            {showTopicFilter && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.topicFilterOptions}
              >
                {uniqueTopics.map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={[
                      styles.topicFilterOption,
                      selectedTopic === topic && styles.topicFilterOptionActive
                    ]}
                    onPress={() => setSelectedTopic(topic)}
                  >
                    <Text style={[
                      styles.topicFilterOptionText,
                      selectedTopic === topic && styles.topicFilterOptionTextActive
                    ]}>
                      {topic === 'all' ? 'All Topics' : topic}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Flashcards List */}
          <View style={styles.flashcardsContainer}>
            <Text style={styles.sectionTitle}>
              Generated Flashcards {selectedTopic !== 'all' && `(${selectedTopic})`}
            </Text>
            {filteredFlashcards.map((flashcard, index) => (
              <View key={index} style={styles.flashcardCard}>
                {editingIndex === index ? (
                  // Edit Mode
                  <View style={styles.editMode}>
                    <TextInput
                      style={styles.editInput}
                      value={editedFlashcard?.front || ''}
                      onChangeText={(text) => setEditedFlashcard(prev => 
                        prev ? { ...prev, front: text } : null
                      )}
                      placeholder="Front of card"
                      multiline
                    />
                    <TextInput
                      style={styles.editInput}
                      value={editedFlashcard?.back || ''}
                      onChangeText={(text) => setEditedFlashcard(prev => 
                        prev ? { ...prev, back: text } : null
                      )}
                      placeholder="Back of card"
                      multiline
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.editSaveButton}
                        onPress={handleSaveEdit}
                      >
                        <Text style={styles.editSaveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // View Mode
                  <View>
                    <View style={styles.flashcardHeader}>
                      <View style={styles.difficultyBadge}>
                        <Text style={[
                          styles.difficultyBadgeText,
                          { color: getDifficultyColor(flashcard.difficulty) }
                        ]}>
                          {flashcard.difficulty.charAt(0).toUpperCase() + flashcard.difficulty.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEdit(index)}
                        >
                          <Ionicons name="create-outline" size={20} color="#6366f1" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDelete(index)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.flashcardContent}>
                      <Text style={styles.flashcardLabel}>Front:</Text>
                      <Text style={styles.flashcardText}>{flashcard.front}</Text>
                      
                      <Text style={styles.flashcardLabel}>Back:</Text>
                      <Text style={styles.flashcardText}>{flashcard.back}</Text>
                      
                      {flashcard.example && (
                        <>
                          <Text style={styles.flashcardLabel}>Example:</Text>
                          <Text style={styles.flashcardText}>{flashcard.example}</Text>
                        </>
                      )}
                      
                      {flashcard.tags && flashcard.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          <Text style={styles.flashcardLabel}>Tags:</Text>
                          <View style={styles.tagsList}>
                            {flashcard.tags.map((tag, tagIndex) => (
                              <View key={tagIndex} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            {onEditTopics && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.editTopicsButton]}
                onPress={onEditTopics}
              >
                <Ionicons name="create-outline" size={20} color="#8b5cf6" />
                <Text style={styles.editTopicsButtonText}>Edit Topics</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={() => {
                onSave(filteredFlashcards);
                onClose(); // Close the modal after saving
              }}
            >
              <Ionicons name="save-outline" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save All ({filteredFlashcards.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    backgroundColor: '#ffffff',
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
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  difficultyBreakdown: {
    gap: 8,
  },
  difficultyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 14,
    color: '#64748b',
  },
  flashcardsContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  flashcardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  flashcardContent: {
    gap: 12,
  },
  flashcardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  flashcardText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
  },
  tagText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  editMode: {
    gap: 16,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  editSaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  editTopicsButton: {
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  editTopicsButtonText: {
    color: '#8b5cf6',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doneButtonText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '600',
  },
  topicFilterSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  topicFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicFilterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  topicFilterToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  topicFilterOptions: {
    paddingVertical: 8,
  },
  topicFilterOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topicFilterOptionActive: {
    backgroundColor: '#e0e7ff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  topicFilterOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  topicFilterOptionTextActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
});
