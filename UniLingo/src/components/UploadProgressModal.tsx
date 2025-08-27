import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UploadProgress } from '../lib/uploadService';

interface UploadProgressModalProps {
  visible: boolean;
  progress: UploadProgress;
  onClose?: () => void;
  onRetry?: () => void;
  onUseAlternative?: () => void;
  onContinue?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function UploadProgressModal({
  visible,
  progress,
  onClose,
  onRetry,
  onUseAlternative,
  onContinue,
}: UploadProgressModalProps) {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'uploading':
        return 'cloud-upload';
      case 'processing':
        return 'document-text';
      case 'generating':
        return 'sparkles';
      case 'complete':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'uploading':
        return '#3b82f6';
      case 'processing':
        return '#8b5cf6';
      case 'generating':
        return '#f59e0b';
      case 'complete':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'uploading':
        return 'Uploading PDF';
      case 'processing':
        return 'Processing Content';
      case 'generating':
        return 'Generating Flashcards';
      case 'complete':
        return 'Complete!';
      case 'error':
        return 'Upload Failed';
      default:
        return 'Processing';
    }
  };

  const getErrorDetails = (message: string) => {
    if (message.includes('Document picker is busy')) {
      return {
        title: 'Document Picker Busy',
        description: 'Another file operation is in progress. Please wait a moment and try again.',
        solution: 'Close any open file dialogs and wait a few seconds before retrying.',
        icon: 'time-outline'
      };
    } else if (message.includes('Different document picking in progress')) {
      return {
        title: 'Document Picker Conflict',
        description: 'The document picker is currently busy with another operation.',
        solution: 'Please wait for any other file operations to complete, then try again.',
        icon: 'sync-outline'
      };
    } else if (message.includes('Please select a PDF file')) {
      return {
        title: 'Invalid File Type',
        description: 'The selected file is not a PDF document.',
        solution: 'Please select a valid PDF file (.pdf extension).',
        icon: 'document-outline'
      };
    } else if (message.includes('No file selected')) {
      return {
        title: 'No File Selected',
        description: 'No file was selected from the document picker.',
        solution: 'Please select a PDF file to upload.',
        icon: 'folder-open-outline'
      };
    } else if (message.includes('PDF file not found')) {
      return {
        title: 'File Not Found',
        description: 'The selected PDF file could not be accessed.',
        solution: 'The file may have been moved or deleted. Please select it again.',
        icon: 'file-tray-outline'
      };
    } else if (message.includes('Failed to extract text from PDF')) {
      return {
        title: 'Text Extraction Failed',
        description: 'Unable to read the content from the PDF file.',
        solution: 'The PDF may be corrupted, password-protected, or contain only images. Try a different PDF.',
        icon: 'text-outline'
      };
    } else if (message.includes('OpenAI API key not configured')) {
      return {
        title: 'AI Service Unavailable',
        description: 'The AI service is not properly configured.',
        solution: 'Please check your OpenAI API key configuration and try again.',
        icon: 'key-outline'
      };
    } else if (message.includes('Failed to generate flashcards with AI')) {
      return {
        title: 'AI Generation Failed',
        description: 'The AI service encountered an error while generating flashcards.',
        solution: 'Please check your internet connection and try again. If the problem persists, contact support.',
        icon: 'cloud-offline-outline'
      };
    } else {
      return {
        title: 'Unexpected Error',
        description: 'An unexpected error occurred during the upload process.',
        solution: 'Please try again. If the problem persists, try restarting the app.',
        icon: 'warning-outline'
      };
    }
  };

  const isComplete = progress.stage === 'complete';
  const isError = progress.stage === 'error';
  const errorDetails = isError ? getErrorDetails(progress.message) : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: getStageColor(progress.stage) + '20' }
            ]}>
              <Ionicons 
                name={getStageIcon(progress.stage) as any} 
                size={32} 
                color={getStageColor(progress.stage)} 
              />
            </View>
            <Text style={styles.title}>{getStageTitle(progress.stage)}</Text>
            <Text style={styles.message}>{progress.message}</Text>
          </View>

          {/* Error Details */}
          {isError && errorDetails && (
            <ScrollView style={styles.errorDetails} showsVerticalScrollIndicator={false}>
              <View style={styles.errorCard}>
                <View style={styles.errorHeader}>
                  <Ionicons name={errorDetails.icon as any} size={24} color="#ef4444" />
                  <Text style={styles.errorTitle}>{errorDetails.title}</Text>
                </View>
                <Text style={styles.errorDescription}>{errorDetails.description}</Text>
                <View style={styles.solutionContainer}>
                  <Text style={styles.solutionLabel}>Solution:</Text>
                  <Text style={styles.solutionText}>{errorDetails.solution}</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Progress Bar */}
          {!isComplete && !isError && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progress.progress}%`,
                      backgroundColor: getStageColor(progress.stage)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{progress.progress}%</Text>
            </View>
          )}

          {/* Cancel Button for Processing */}
          {!isComplete && !isError && onClose && (
            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelProcessingButton]}
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color="#ef4444" />
                <Text style={styles.cancelProcessingButtonText}>Cancel Upload</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Force Close Button - Always Available */}
          <View style={styles.forceCloseContainer}>
            <TouchableOpacity 
              style={styles.forceCloseButton}
              onPress={onClose}
            >
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
              <Text style={styles.forceCloseText}>Force Close</Text>
            </TouchableOpacity>
            <Text style={styles.forceCloseHint}>
              Tap to force close if stuck
            </Text>
          </View>

          {/* Cards Generated Count */}
          {progress.cardsGenerated !== undefined && !isError && (
            <View style={styles.cardsInfo}>
              <Ionicons name="document-text" size={20} color="#6366f1" />
              <Text style={styles.cardsText}>
                {progress.cardsGenerated} flashcards generated
              </Text>
            </View>
          )}

          {/* Stage Indicators */}
          {!isError && (
            <View style={styles.stagesContainer}>
              {['uploading', 'processing', 'generating'].map((stage, index) => (
                <View key={stage} style={styles.stageItem}>
                  <View style={[
                    styles.stageDot,
                    {
                      backgroundColor: progress.stage === stage 
                        ? getStageColor(stage)
                        : progress.stage === 'complete' || 
                          ['processing', 'generating'].includes(progress.stage) && ['uploading', 'processing'].includes(stage)
                          ? '#10b981'
                          : '#e2e8f0'
                    }
                  ]} />
                  <Text style={[
                    styles.stageText,
                    {
                      color: progress.stage === stage 
                        ? getStageColor(stage)
                        : progress.stage === 'complete' || 
                          ['processing', 'generating'].includes(progress.stage) && ['uploading', 'processing'].includes(stage)
                          ? '#10b981'
                          : '#94a3b8'
                    }
                  ]}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer Actions */}
          {(isComplete || isError) && (
            <View style={styles.footer}>
              {isError ? (
                // Error Actions
                <View style={styles.errorActions}>
                  {onRetry && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.retryButton]}
                      onPress={onRetry}
                    >
                      <Ionicons name="refresh" size={20} color="#ffffff" />
                      <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  )}
                  {onUseAlternative && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.alternativeButton]}
                      onPress={onUseAlternative}
                    >
                      <Ionicons name="options" size={20} color="#8b5cf6" />
                      <Text style={styles.alternativeButtonText}>Use Alternative</Text>
                    </TouchableOpacity>
                  )}
                  {onClose && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.closeButton]}
                      onPress={onClose}
                    >
                      <Ionicons name="close" size={20} color="#64748b" />
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                // Success Actions
                (onContinue || onClose) && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.continueButton]}
                    onPress={onContinue || onClose}
                  >
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    marginBottom: 24,
  },
  errorCard: {
    backgroundColor: '#fef3f2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#991b1b',
    marginLeft: 12,
  },
  errorDescription: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 16,
    lineHeight: 20,
  },
  solutionContainer: {
    marginTop: 12,
  },
  solutionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  cardsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  cardsText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  stagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    width: '100%',
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    flex: 1,
    marginRight: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  alternativeButton: {
    backgroundColor: '#8b5cf6',
    flex: 1,
    marginLeft: 10,
  },
  alternativeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: '#64748b',
    flex: 1,
    marginLeft: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#10b981',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelProcessingButton: {
    backgroundColor: '#fef3f2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelProcessingButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  forceCloseContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forceCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  forceCloseText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
  },
  forceCloseHint: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});





