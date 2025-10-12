import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface AudioLessonProgressModalProps {
  visible: boolean;
  stage: 'uploading' | 'extracting' | 'generating' | 'creating-audio' | 'finalizing';
  progress: number;
  message: string;
}

export default function AudioLessonProgressModal({
  visible,
  stage,
  progress,
  message,
}: AudioLessonProgressModalProps) {
  
  const getStageIcon = () => {
    switch (stage) {
      case 'uploading':
        return 'cloud-upload';
      case 'extracting':
        return 'document-text';
      case 'generating':
        return 'sparkles';
      case 'creating-audio':
        return 'musical-notes';
      case 'finalizing':
        return 'checkmark-circle';
      default:
        return 'hourglass';
    }
  };

  const getStageTitle = () => {
    switch (stage) {
      case 'uploading':
        return 'Uploading PDF';
      case 'extracting':
        return 'Extracting Text';
      case 'generating':
        return 'Generating Content';
      case 'creating-audio':
        return 'Creating Audio';
      case 'finalizing':
        return 'Finalizing Lesson';
      default:
        return 'Processing';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={getStageIcon()} size={48} color="#6366f1" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Creating Audio Lesson</Text>
          <Text style={styles.stage}>{getStageTitle()}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Activity Indicator */}
          <ActivityIndicator size="large" color="#6366f1" style={styles.spinner} />

          {/* Info Text */}
          <Text style={styles.infoText}>
            This may take a minute. Please don't close the app.
          </Text>
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
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    width: screenWidth * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

