import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UploadProgress } from '../lib/uploadService';

interface UploadProgressModalProps {
  visible: boolean;
  progress: UploadProgress;
  onClose?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onUseAlternative?: () => void;
  onContinue?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function UploadProgressModal({
  visible,
  progress,
  onClose,
  onCancel,
  onRetry,
  onUseAlternative,
  onContinue,
}: UploadProgressModalProps) {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Pulse animation for generating stage
  useEffect(() => {
    if (progress.stage === 'generating') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [progress.stage, pulseAnim]);

  // Rotation animation for processing stages
  useEffect(() => {
    if (['uploading', 'processing', 'generating'].includes(progress.stage)) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [progress.stage, rotateAnim]);

  // Modal entrance animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
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
        return '#6366f1';
      case 'processing':
        return '#8b5cf6';
      case 'generating':
        return '#a855f7';
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
    } else if (message.includes('timed out')) {
      return {
        title: 'Processing Timeout',
        description: 'The upload process timed out. This can happen with large files or slow connections.',
        solution: 'Try uploading a smaller PDF file or check your internet connection.',
        icon: 'time-outline'
      };
    } else if (message.includes('Backend request timed out')) {
      return {
        title: 'Backend Timeout',
        description: 'The backend server took too long to process your PDF.',
        solution: 'Try uploading a smaller PDF file or try again in a few minutes.',
        icon: 'server-outline'
      };
    } else if (message.includes('AI processing timed out')) {
      return {
        title: 'AI Processing Timeout',
        description: 'The AI service took too long to generate flashcards.',
        solution: 'Try uploading a smaller PDF file or try again in a few minutes.',
        icon: 'sparkles-outline'
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
      animationType="none"
      transparent={true}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.modal, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Animated.View style={[
              styles.iconContainer,
              { 
                backgroundColor: getStageColor(progress.stage) + '15',
                transform: [
                  { scale: progress.stage === 'generating' ? pulseAnim : 1 },
                  { rotate: ['uploading', 'processing', 'generating'].includes(progress.stage) ? rotateInterpolate : '0deg' }
                ]
              }
            ]}>
              <Ionicons 
                name={getStageIcon(progress.stage) as any} 
                size={36} 
                color={getStageColor(progress.stage)} 
              />
            </Animated.View>
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{getStageTitle(progress.stage)}</Text>
              <View style={styles.titleUnderline} />
            </View>
            
            <Text style={styles.message}>{progress.message}</Text>
            
            {/* Animated dots for generating stage */}
            {progress.stage === 'generating' && (
              <View style={styles.dotsContainer}>
                <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
              </View>
            )}
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
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progress.progress}%`,
                      backgroundColor: getStageColor(progress.stage)
                    }
                  ]} 
                />
                <View style={styles.progressGlow} />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>{progress.progress}%</Text>
                <Text style={styles.progressLabel}>Complete</Text>
              </View>
            </View>
          )}

          {/* Cancel Button for Processing */}
          {!isComplete && !isError && onClose && (
            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelProcessingButton]}
                onPress={onCancel || onClose}
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
            <Animated.View style={[styles.cardsInfo, { opacity: fadeAnim }]}>
              <View style={styles.cardsIconContainer}>
                <Ionicons name="document-text" size={24} color="#6366f1" />
              </View>
              <View style={styles.cardsTextContainer}>
                <Text style={styles.cardsNumber}>{progress.cardsGenerated}</Text>
                <Text style={styles.cardsLabel}>flashcards generated</Text>
              </View>
              <View style={styles.cardsBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              </View>
            </Animated.View>
          )}

          {/* Stage Indicators */}
          {!isError && (
            <View style={styles.stagesContainer}>
              {['uploading', 'processing', 'generating'].map((stage, index) => {
                const isActive = progress.stage === stage;
                const isCompleted = progress.stage === 'complete' || 
                  (progress.stage === 'generating' && ['uploading', 'processing'].includes(stage)) ||
                  (progress.stage === 'processing' && stage === 'uploading');
                
                return (
                  <View key={stage} style={styles.stageItem}>
                    <Animated.View style={[
                      styles.stageDot,
                      {
                        backgroundColor: isActive 
                          ? getStageColor(stage)
                          : isCompleted
                            ? '#10b981'
                            : '#e2e8f0',
                        transform: [{ scale: isActive ? pulseAnim : 1 }]
                      }
                    ]}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={14} color="#ffffff" />
                      )}
                    </Animated.View>
                    <Text style={[
                      styles.stageText,
                      {
                        color: isActive 
                          ? getStageColor(stage)
                          : isCompleted
                            ? '#10b981'
                            : '#94a3b8',
                        fontWeight: isActive ? '700' : '500'
                      }
                    ]}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </Text>
                    
                    {/* Connecting line - only show between stages */}
                    {index < 2 && (
                      <View style={[
                        styles.stageLine,
                        { 
                          backgroundColor: isCompleted ? '#10b981' : '#e2e8f0',
                        }
                      ]} />
                    )}
                  </View>
                );
              })}
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
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
    marginTop: 8,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
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
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  cardsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardsTextContainer: {
    flex: 1,
  },
  cardsNumber: {
    fontSize: 24,
    color: '#1e293b',
    fontWeight: '800',
    lineHeight: 28,
  },
  cardsLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  cardsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
    position: 'relative',
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  stageLine: {
    position: 'absolute',
    top: 15,
    left: 50,
    right: -50,
    height: 2,
    zIndex: 1,
  },
  stageDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 2,
  },
  stageText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    flex: 1,
    marginRight: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#10b981',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
    fontWeight: '700',
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
