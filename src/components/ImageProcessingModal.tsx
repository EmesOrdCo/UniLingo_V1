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
import { ImageUploadProgress } from '../lib/imageUploadService';

interface ImageProcessingModalProps {
  visible: boolean;
  progress: ImageUploadProgress;
  onClose?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onUseAlternative?: () => void;
  onContinue?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ImageProcessingModal({
  visible,
  progress,
  onClose,
  onCancel,
  onRetry,
  onUseAlternative,
  onContinue,
}: ImageProcessingModalProps) {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Pulse animation for processing stage
  useEffect(() => {
    if (progress.stage === 'processing') {
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
    if (['uploading', 'processing'].includes(progress.stage)) {
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
      case 'selecting':
        return 'images';
      case 'uploading':
        return 'cloud-upload';
      case 'processing':
        return 'scan';
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
      case 'selecting':
        return '#6366f1';
      case 'uploading':
        return '#8b5cf6';
      case 'processing':
        return '#a855f7';
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
      case 'selecting':
        return 'Selecting Images';
      case 'uploading':
        return 'Uploading Images';
      case 'processing':
        return 'Processing with OCR';
      case 'generating':
        return 'Generating Flashcards';
      case 'complete':
        return 'Complete!';
      case 'error':
        return 'Processing Failed';
      default:
        return 'Processing';
    }
  };

  const getErrorDetails = (message: string) => {
    if (message.includes('permissions')) {
      return {
        title: 'Permission Required',
        description: 'Camera and photo library permissions are required to process images.',
        solution: 'Please enable camera and photo library permissions in your device settings.',
        icon: 'camera-outline'
      };
    } else if (message.includes('No text could be extracted')) {
      return {
        title: 'No Text Found',
        description: 'Unable to extract text from your images.',
        solution: 'Ensure your images contain clear, readable text. Try taking photos with better lighting or higher resolution.',
        icon: 'text-outline'
      };
    } else if (message.includes('timed out')) {
      return {
        title: 'Processing Timeout',
        description: 'The image processing took too long to complete.',
        solution: 'Try uploading smaller images or fewer images at once.',
        icon: 'time-outline'
      };
    } else if (message.includes('Network request failed')) {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the image processing server.',
        solution: 'Check your internet connection and try again.',
        icon: 'wifi-outline'
      };
    } else if (message.includes('Backend request failed with status 502')) {
      return {
        title: 'Server Processing Error',
        description: 'The server encountered an error while processing your images.',
        solution: 'Try uploading smaller images or fewer images at once. The server may be temporarily overloaded.',
        icon: 'server-outline'
      };
    } else if (message.includes('Azure Computer Vision credentials not configured')) {
      return {
        title: 'OCR Service Unavailable',
        description: 'The OCR service is not properly configured.',
        solution: 'Please contact support to set up the image processing service.',
        icon: 'key-outline'
      };
    } else {
      return {
        title: 'Unexpected Error',
        description: 'An unexpected error occurred during image processing.',
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
                  { scale: progress.stage === 'processing' ? pulseAnim : 1 },
                  { rotate: ['uploading', 'processing'].includes(progress.stage) ? rotateInterpolate : '0deg' }
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
            
            {/* Animated dots for processing stage */}
            {progress.stage === 'processing' && (
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

          {/* Images Processed Count */}
          {progress.imagesProcessed !== undefined && !isError && (
            <Animated.View style={[styles.imagesInfo, { opacity: fadeAnim }]}>
              <View style={styles.imagesIconContainer}>
                <Ionicons name="images" size={24} color="#ffffff" />
              </View>
              <View style={styles.imagesTextContainer}>
                <Text style={styles.imagesText} numberOfLines={1}>
                  {progress.imagesProcessed}/{progress.totalImages} images processed
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
                            stage === 'processing' ? 'scan' :
                            stage === 'generating' ? 'sparkles' : 'information-circle'
                          } 
                          size={12} 
                          color="#ffffff" 
                        />
                      ) : (
                        <Ionicons 
                          name={
                            stage === 'uploading' ? 'cloud-upload-outline' :
                            stage === 'processing' ? 'scan-outline' :
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
    maxHeight: 200, // Limit height to prevent overflow
  },
  errorCard: {
    backgroundColor: '#fef3f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
    marginLeft: 8,
    flex: 1,
  },
  errorDescription: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 12,
    lineHeight: 20,
  },
  solutionContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  solutionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  solutionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
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
  imagesInfo: {
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
  imagesIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imagesTextContainer: {
    flex: 1,
  },
  imagesText: {
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
