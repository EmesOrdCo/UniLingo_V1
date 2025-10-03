import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { PronunciationService, PronunciationResult } from '../lib/pronunciationService';

interface PronunciationCheckProps {
  word: string;
  sentence?: string;
  onComplete?: (result: PronunciationResult) => void;
  onResult?: (result: any) => void; // For compatibility with SpeakingGame
  maxRecordingDuration?: number;
  disabled?: boolean;
  showAlerts?: boolean; // Control whether to show alert modals
  translation?: string; // Translation to show instead of tips
  hideScoreRing?: boolean; // Hide the score circle, only show metrics
  hideWordDisplay?: boolean; // Hide the "Say this:" section entirely
}

const PronunciationCheck: React.FC<PronunciationCheckProps> = ({
  word,
  sentence,
  onComplete,
  onResult,
  maxRecordingDuration = 5000, // 5 seconds default
  disabled = false,
  showAlerts = true, // Default to true for backward compatibility
  translation,
  hideScoreRing = false,
  hideWordDisplay = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isPlayingHint, setIsPlayingHint] = useState(false);

  // Pulse animation for recording
  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    if (disabled) return;
    
    try {
      setResult(null);
      setIsRecording(true);

      // Start recording with timeout and callback for UI updates
      await PronunciationService.startRecording(maxRecordingDuration, async () => {
        // This callback is called when recording stops automatically
        // We need to process the audio as if the user pressed stop
        try {
          setIsRecording(false);
          setIsProcessing(true);

          // Stop recording and get URI
          const audioUri = await PronunciationService.stopRecording();

          if (!audioUri) {
            throw new Error('No audio recorded');
          }

          // Assess pronunciation
          const referenceText = sentence || word;
          
          if (!referenceText || referenceText.trim() === '') {
            throw new Error('No reference text provided for pronunciation assessment');
          }

          const assessmentResult = await PronunciationService.assessPronunciation(
            audioUri,
            referenceText
          );

          setResult(assessmentResult);
          setIsProcessing(false);

          // Call both callbacks for compatibility
          if (onComplete) {
            onComplete(assessmentResult);
          }
          if (onResult) {
            onResult(assessmentResult);
          }

          // Show feedback (only if showAlerts is true)
          if (showAlerts) {
            if (assessmentResult.success && assessmentResult.feedback) {
              const score = assessmentResult.assessment?.pronunciationScore || 0;
              if (score >= 75) {
                // Good pronunciation - brief success message
                Alert.alert(
                  '🌟 Great Job!',
                  assessmentResult.feedback.overall,
                  [{ text: 'Continue' }]
                );
              } else {
                // Needs improvement - show detailed feedback
                Alert.alert(
                  '📚 Keep Practicing',
                  `${assessmentResult.feedback.overall}\n\n${assessmentResult.feedback.accuracy}`,
                  [{ text: 'OK' }]
                );
              }
            } else if (!assessmentResult.success) {
              Alert.alert(
                'Assessment Failed',
                assessmentResult.error || 'Could not assess pronunciation. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        } catch (error: any) {
          console.error('Assessment error:', error);
          setIsRecording(false);
          setIsProcessing(false);
          
          // Provide more specific error messages
          let errorMessage = 'Failed to assess pronunciation. Please try again.';
          
          if (error.message?.includes('No speech recognized')) {
            errorMessage = 'No speech detected. Please speak clearly and try again.';
          } else if (error.message?.includes('No reference text')) {
            errorMessage = 'Missing word to pronounce. Please restart the game.';
          } else if (error.message?.includes('No audio recorded')) {
            errorMessage = 'No audio was recorded. Please check your microphone and try again.';
          } else if (error.message?.includes('permission')) {
            errorMessage = 'Microphone permission required. Please enable microphone access in settings.';
          }
          
          Alert.alert(
            'Pronunciation Assessment Error',
            errorMessage,
            [{ text: 'OK' }]
          );
        }
      });
    } catch (error: any) {
      console.error('Recording error:', error);
      setIsRecording(false);
      
      let errorMessage = 'Could not start recording. Please check microphone permissions.';
      
      if (error.message?.includes('permission')) {
        errorMessage = 'Microphone permission required. Please enable microphone access in settings.';
      } else if (error.message?.includes('busy')) {
        errorMessage = 'Microphone is busy. Please try again in a moment.';
      }
      
      Alert.alert(
        'Recording Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      if (disabled) return;

      // Only check isRecording if we're manually stopping
      // If called from timeout callback, isRecording might already be false
      if (isRecording) {
        setIsRecording(false);
      }
      setIsProcessing(true);

      // Stop recording and get URI
      const audioUri = await PronunciationService.stopRecording();

      if (!audioUri) {
        throw new Error('No audio recorded');
      }

      // Assess pronunciation
      const referenceText = sentence || word;
      
      if (!referenceText || referenceText.trim() === '') {
        throw new Error('No reference text provided for pronunciation assessment');
      }

      const assessmentResult = await PronunciationService.assessPronunciation(
        audioUri,
        referenceText
      );

      setResult(assessmentResult);
      setIsProcessing(false);

      // Call both callbacks for compatibility
      if (onComplete) {
        onComplete(assessmentResult);
      }
      if (onResult) {
        onResult(assessmentResult);
      }

      // Show feedback (only if showAlerts is true)
      if (showAlerts) {
        if (assessmentResult.success && assessmentResult.feedback) {
          const score = assessmentResult.assessment?.pronunciationScore || 0;
          if (score >= 75) {
            // Good pronunciation - brief success message
            Alert.alert(
              '🌟 Great Job!',
              assessmentResult.feedback.overall,
              [{ text: 'Continue' }]
            );
          } else {
            // Needs improvement - show detailed feedback
            Alert.alert(
              '📚 Keep Practicing',
              `${assessmentResult.feedback.overall}\n\n${assessmentResult.feedback.accuracy}`,
              [{ text: 'OK' }]
            );
          }
        } else if (!assessmentResult.success) {
          Alert.alert(
            'Assessment Failed',
            assessmentResult.error || 'Could not assess pronunciation. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error: any) {
      console.error('Assessment error:', error);
      setIsRecording(false);
      setIsProcessing(false);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to assess pronunciation. Please try again.';
      
      if (error.message?.includes('No speech recognized')) {
        errorMessage = 'No speech detected. Please speak clearly and try again.';
      } else if (error.message?.includes('No reference text')) {
        errorMessage = 'Missing word to pronounce. Please restart the game.';
      } else if (error.message?.includes('No audio recorded')) {
        errorMessage = 'No audio was recorded. Please check your microphone and try again.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Microphone permission required. Please enable microphone access in settings.';
      }
      
      Alert.alert(
        'Pronunciation Assessment Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = async () => {
    await PronunciationService.cancelRecording();
    setIsRecording(false);
  };

  const handlePlayHint = async () => {
    if (isPlayingHint) return;
    
    try {
      setIsPlayingHint(true);
      
      // Use expo-speech for text-to-speech
      await Speech.speak(word, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        volume: 1.0,
        onDone: () => {
          setIsPlayingHint(false);
        },
        onError: () => {
          setIsPlayingHint(false);
          Alert.alert('Hint Error', 'Could not play audio hint. Please try again.');
        },
      });
    } catch (error) {
      console.error('Hint playback error:', error);
      setIsPlayingHint(false);
      Alert.alert('Hint Error', 'Could not play audio hint. Please try again.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 75) return '#3b82f6'; // blue
    if (score >= 60) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟';
    if (score >= 75) return '👍';
    if (score >= 60) return '💪';
    return '📚';
  };

  return (
    <View style={styles.container}>
      {/* Word/Sentence to pronounce */}
      {!hideWordDisplay && (
        <View style={styles.textContainer}>
          <View style={styles.wordHeader}>
            <Text style={styles.label}>Say this:</Text>
            <TouchableOpacity
              style={[styles.hintButton, isPlayingHint && styles.hintButtonActive]}
              onPress={handlePlayHint}
              disabled={isPlayingHint}
            >
              <Ionicons 
                name={isPlayingHint ? "volume-high" : "volume-medium"} 
                size={20} 
                color={isPlayingHint ? "#ffffff" : "#6366f1"} 
              />
              <Text style={[styles.hintButtonText, isPlayingHint && styles.hintButtonTextActive]}>
                {isPlayingHint ? "Playing..." : "Hint"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.word}>{word}</Text>
          {sentence && <Text style={styles.sentence}>"{sentence}"</Text>}
        </View>
      )}

      {/* Hint button for when word display is hidden */}
      {hideWordDisplay && (
        <View style={styles.hintOnlyContainer}>
          <TouchableOpacity
            style={[styles.hintButton, isPlayingHint && styles.hintButtonActive]}
            onPress={handlePlayHint}
            disabled={isPlayingHint}
          >
            <Ionicons 
              name={isPlayingHint ? "volume-high" : "volume-medium"} 
              size={20} 
              color={isPlayingHint ? "#ffffff" : "#6366f1"} 
            />
            <Text style={[styles.hintButtonText, isPlayingHint && styles.hintButtonTextActive]}>
              {isPlayingHint ? "Playing..." : "Hint"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recording Button */}
      {!isProcessing && !result && (
        <View style={styles.buttonContainer}>
          {!isRecording ? (
            <TouchableOpacity
              style={[
                styles.recordButton,
                disabled && styles.recordButtonDisabled,
              ]}
              onPress={handleStartRecording}
              activeOpacity={0.8}
              disabled={disabled}
            >
              <Ionicons name="mic" size={32} color="#ffffff" />
              <Text style={styles.recordButtonText}>Tap to Record</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View
              style={[
                styles.recordingButton,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.recordingIndicator}>
                <Ionicons name="mic" size={32} color="#ef4444" />
                <View style={styles.recordingDot} />
              </View>
              <Text style={styles.recordingText}>Recording...</Text>
              <TouchableOpacity
                style={styles.stopButton}
                onPress={handleStopRecording}
              >
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.processingText}>Analyzing pronunciation...</Text>
        </View>
      )}

      {/* Results */}
      {result && result.success && result.assessment && (
        <View style={styles.resultsContainer}>
          {!hideScoreRing && (
            <View
              style={[
                styles.scoreCircle,
                { borderColor: getScoreColor(result.assessment.pronunciationScore) },
              ]}
            >
              <Text style={styles.scoreEmoji}>
                {getScoreEmoji(result.assessment.pronunciationScore)}
              </Text>
              <Text
                style={[
                  styles.scoreText,
                  { color: getScoreColor(result.assessment.pronunciationScore) },
                ]}
              >
                {Math.round(result.assessment.pronunciationScore)}
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          )}

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Accuracy:</Text>
              <Text style={styles.detailValue}>
                {Math.round(result.assessment.accuracyScore)}/100
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fluency:</Text>
              <Text style={styles.detailValue}>
                {Math.round(result.assessment.fluencyScore)}/100
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>You said:</Text>
              <Text style={styles.recognizedText}>"{result.assessment.recognizedText}"</Text>
            </View>
          </View>

        </View>
      )}

      {/* Tips or Translation */}
      {!isRecording && !isProcessing && !result && (
        <View style={translation ? styles.translationContainer : styles.tipsContainer}>
          {translation ? (
            <>
              <Text style={styles.translationLabel}>TRANSLATION:</Text>
              <Text style={styles.translationText}>{translation}</Text>
            </>
          ) : (
            <>
              <Ionicons name="information-circle" size={16} color="#64748b" />
              <Text style={styles.tipsText}>
                Speak clearly and naturally. Recording will stop automatically after {maxRecordingDuration / 1000} seconds.
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  hintButtonActive: {
    backgroundColor: '#6366f1',
  },
  hintOnlyContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  hintButtonText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  hintButtonTextActive: {
    color: '#ffffff',
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  sentence: {
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  recordButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  recordingButton: {
    alignItems: 'center',
    gap: 16,
  },
  recordingIndicator: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    color: '#64748b',
  },
  resultsContainer: {
    alignItems: 'center',
    gap: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  scoreEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  detailsContainer: {
    width: '100%',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  recognizedText: {
    fontSize: 14,
    color: '#1e293b',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  translationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  translationText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  recordButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
});

export default PronunciationCheck;
