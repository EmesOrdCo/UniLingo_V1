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
import { useTranslation } from '../lib/i18n';

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
  const { t } = useTranslation();
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
        return progress.message?.includes('image') ? t('uploadProgress.stages.uploadingImages') : t('uploadProgress.stages.uploadingPDF');
      case 'processing':
        return progress.message?.includes('OCR') ? t('uploadProgress.stages.processingImages') : t('uploadProgress.stages.processingContent');
      case 'generating':
        return t('uploadProgress.stages.generating');
      case 'complete':
        return t('uploadProgress.stages.complete');
      case 'error':
        return t('uploadProgress.stages.error');
      default:
        return t('uploadProgress.stages.processing');
    }
  };

  const getErrorDetails = (message: string) => {
    if (message.includes('Document picker is busy')) {
      return {
        title: t('uploadProgress.errors.documentPickerBusy.title'),
        description: t('uploadProgress.errors.documentPickerBusy.description'),
        solution: t('uploadProgress.errors.documentPickerBusy.solution'),
        icon: 'time-outline'
      };
    } else if (message.includes('Different document picking in progress')) {
      return {
        title: t('uploadProgress.errors.documentPickerConflict.title'),
        description: t('uploadProgress.errors.documentPickerConflict.description'),
        solution: t('uploadProgress.errors.documentPickerConflict.solution'),
        icon: 'sync-outline'
      };
    } else if (message.includes('Please select a PDF file')) {
      return {
        title: t('uploadProgress.errors.invalidFileType.title'),
        description: t('uploadProgress.errors.invalidFileType.description'),
        solution: t('uploadProgress.errors.invalidFileType.solution'),
        icon: 'document-outline'
      };
    } else if (message.includes('No file selected')) {
      return {
        title: t('uploadProgress.errors.noFileSelected.title'),
        description: t('uploadProgress.errors.noFileSelected.description'),
        solution: t('uploadProgress.errors.noFileSelected.solution'),
        icon: 'folder-open-outline'
      };
    } else if (message.includes('PDF file not found')) {
      return {
        title: t('uploadProgress.errors.fileNotFound.title'),
        description: t('uploadProgress.errors.fileNotFound.description'),
        solution: t('uploadProgress.errors.fileNotFound.solution'),
        icon: 'file-tray-outline'
      };
    } else if (message.includes('Failed to extract text from PDF')) {
      return {
        title: t('uploadProgress.errors.textExtractionFailed.title'),
        description: t('uploadProgress.errors.textExtractionFailed.description'),
        solution: t('uploadProgress.errors.textExtractionFailed.solution'),
        icon: 'text-outline'
      };
    } else if (message.includes('OpenAI API key not configured')) {
      return {
        title: t('uploadProgress.errors.aiServiceUnavailable.title'),
        description: t('uploadProgress.errors.aiServiceUnavailable.description'),
        solution: t('uploadProgress.errors.aiServiceUnavailable.solution'),
        icon: 'key-outline'
      };
    } else if (message.includes('timed out')) {
      return {
        title: t('uploadProgress.errors.processingTimeout.title'),
        description: t('uploadProgress.errors.processingTimeout.description'),
        solution: t('uploadProgress.errors.processingTimeout.solution'),
        icon: 'time-outline'
      };
    } else if (message.includes('Backend request timed out')) {
      return {
        title: t('uploadProgress.errors.backendTimeout.title'),
        description: t('uploadProgress.errors.backendTimeout.description'),
        solution: t('uploadProgress.errors.backendTimeout.solution'),
        icon: 'server-outline'
      };
    } else if (message.includes('AI processing timed out')) {
      return {
        title: t('uploadProgress.errors.aiProcessingTimeout.title'),
        description: t('uploadProgress.errors.aiProcessingTimeout.description'),
        solution: t('uploadProgress.errors.aiProcessingTimeout.solution'),
        icon: 'sparkles-outline'
      };
    } else if (message.includes('Backend request failed with status 502')) {
      return {
        title: t('uploadProgress.errors.serverProcessingError.title'),
        description: t('uploadProgress.errors.serverProcessingError.description'),
        solution: t('uploadProgress.errors.serverProcessingError.solution'),
        icon: 'server-outline'
      };
    } else if (message.includes('Network request failed')) {
      return {
        title: t('uploadProgress.errors.connectionError.title'),
        description: t('uploadProgress.errors.connectionError.description'),
        solution: t('uploadProgress.errors.connectionError.solution'),
        icon: 'wifi-outline'
      };
    } else if (message.includes('No text could be extracted')) {
      return {
        title: t('uploadProgress.errors.noTextFound.title'),
        description: t('uploadProgress.errors.noTextFound.description'),
        solution: t('uploadProgress.errors.noTextFound.solution'),
        icon: 'text-outline'
      };
      } else {
        return {
          title: t('uploadProgress.errors.unexpectedError.title'),
          description: t('uploadProgress.errors.unexpectedError.description'),
          solution: t('uploadProgress.errors.unexpectedError.solution'),
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
            
            <Text style={styles.message}>
              {progress.message?.startsWith('aiFlashcards.') 
                ? (progress.message === 'aiFlashcards.successfullyCreatedGeneric' 
                   ? t('aiFlashcards.successfullyCreatedGeneric', { count: progress.cardsGenerated || 0 })
                   : t(progress.message))
                : progress.message}
            </Text>
            
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
                <Text style={styles.progressLabel}>{t('aiFlashcards.complete')}</Text>
              </View>
            </View>
          )}



          {/* Cards Generated Count */}
          {progress.cardsGenerated !== undefined && !isError && (
            <Animated.View style={[styles.cardsInfo, { opacity: fadeAnim }]}>
              <View style={styles.cardsIconContainer}>
                <Ionicons name="document-text" size={24} color="#ffffff" />
              </View>
              <View style={styles.cardsTextContainer}>
                <Text style={styles.cardsText} numberOfLines={1}>
                  {progress.cardsGenerated} {t('aiFlashcards.flashcards')}
                </Text>
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
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={14} color="#ffffff" />
                      ) : isActive ? (
                        <Ionicons 
                          name={
                            stage === 'uploading' ? 'cloud-upload' :
                            stage === 'processing' ? 'document-text' :
                            stage === 'generating' ? 'sparkles' : 'information-circle'
                          } 
                          size={12} 
                          color="#ffffff" 
                        />
                      ) : (
                        <Ionicons 
                          name={
                            stage === 'uploading' ? 'cloud-upload-outline' :
                            stage === 'processing' ? 'document-text-outline' :
                            stage === 'generating' ? 'sparkles-outline' : 'information-circle-outline'
                          } 
                          size={12} 
                          color="#94a3b8" 
                        />
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
                      {stage === 'uploading' ? t('aiFlashcards.uploading') :
                       stage === 'processing' ? t('aiFlashcards.processingStage') :
                       stage === 'generating' ? t('aiFlashcards.generating') : stage}
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
                      <Text style={styles.retryButtonText}>{t('uploadProgress.buttons.tryAgain')}</Text>
                    </TouchableOpacity>
                  )}
                  {onUseAlternative && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.alternativeButton]}
                      onPress={onUseAlternative}
                    >
                      <Ionicons name="options" size={20} color="#8b5cf6" />
                      <Text style={styles.alternativeButtonText}>{t('uploadProgress.buttons.useAlternative')}</Text>
                    </TouchableOpacity>
                  )}
                  {onClose && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.closeButton]}
                      onPress={onClose}
                    >
                      <Ionicons name="close" size={20} color="#64748b" />
                      <Text style={styles.closeButtonText}>{t('uploadProgress.buttons.close')}</Text>
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
                    <Text style={styles.continueButtonText}>{t('uploadProgress.buttons.continue')}</Text>
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
  cardsText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: 20,
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
});
