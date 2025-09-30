/**
 * Pronunciation Assessment Service
 * Handles audio recording and pronunciation checking
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { logger } from './logger';
import { BACKEND_CONFIG } from '../config/backendConfig';

export interface PronunciationAssessment {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  recognizedText: string;
  referenceText: string;
  passed: boolean;
  words: Array<{
    word: string;
    accuracyScore: number;
    errorType: string;
    phonemes: Array<{
      phoneme: string;
      accuracyScore: number;
    }>;
  }>;
}

export interface PronunciationFeedback {
  overall: string;
  accuracy: string;
  fluency: string;
  wordIssues: Array<{
    word: string;
    issue: string;
    score: number;
    suggestion: string;
  }>;
}

export interface PronunciationResult {
  success: boolean;
  assessment?: PronunciationAssessment;
  feedback?: PronunciationFeedback;
  error?: string;
}

export class PronunciationService {
  private static recording: Audio.Recording | null = null;
  private static isRecording = false;

  /**
   * Request microphone permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        logger.warn('Microphone permission denied');
        return false;
      }
      
      logger.info('Microphone permission granted');
      return true;
    } catch (error) {
      logger.error('Error requesting microphone permission:', error);
      return false;
    }
  }

  /**
   * Start recording audio for pronunciation assessment
   */
  static async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        logger.warn('Already recording');
        return;
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission required');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      logger.info('🎤 Starting audio recording...');

      // Create recording with optimized settings for speech
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      this.recording = recording;
      this.isRecording = true;

      logger.info('✅ Recording started');
    } catch (error) {
      logger.error('Failed to start recording:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  /**
   * Stop recording and return the audio file URI
   */
  static async stopRecording(): Promise<string | null> {
    try {
      if (!this.isRecording || !this.recording) {
        logger.warn('Not currently recording');
        return null;
      }

      logger.info('🛑 Stopping recording...');

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.isRecording = false;
      this.recording = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      logger.info('✅ Recording stopped. URI:', uri);
      return uri;
    } catch (error) {
      logger.error('Failed to stop recording:', error);
      this.isRecording = false;
      this.recording = null;
      return null;
    }
  }

  /**
   * Cancel recording without saving
   */
  static async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
      }
      this.isRecording = false;
      this.recording = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      logger.info('Recording cancelled');
    } catch (error) {
      logger.error('Error cancelling recording:', error);
    }
  }

  /**
   * Check if currently recording
   */
  static getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Assess pronunciation by sending audio to backend
   */
  static async assessPronunciation(
    audioUri: string,
    referenceText: string
  ): Promise<PronunciationResult> {
    try {
      logger.info('📤 Sending audio for pronunciation assessment...');
      logger.info('Reference text:', referenceText);

      // Prepare form data
      const formData = new FormData();
      
      // Add audio file
      const audioFile: any = {
        uri: Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri,
        type: 'audio/wav',
        name: 'pronunciation.wav',
      };
      
      formData.append('audio', audioFile);
      formData.append('referenceText', referenceText);

      // Send to backend
      const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/api/pronunciation-assess`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Pronunciation assessment failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Assessment unsuccessful');
      }

      logger.info('✅ Pronunciation assessment complete');
      logger.info('Score:', data.assessment.pronunciationScore);

      return {
        success: true,
        assessment: data.assessment,
        feedback: data.feedback,
      };
    } catch (error) {
      logger.error('Pronunciation assessment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Record and assess pronunciation in one step
   * @param referenceText - The text the user should pronounce
   * @param maxDuration - Maximum recording duration in milliseconds (default: 10000ms)
   */
  static async recordAndAssess(
    referenceText: string,
    maxDuration: number = 10000
  ): Promise<PronunciationResult> {
    try {
      // Start recording
      await this.startRecording();

      // Wait for user to speak (or max duration)
      await new Promise(resolve => setTimeout(resolve, maxDuration));

      // Stop recording
      const audioUri = await this.stopRecording();

      if (!audioUri) {
        throw new Error('Failed to record audio');
      }

      // Assess pronunciation
      const result = await this.assessPronunciation(audioUri, referenceText);

      // Clean up audio file
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (cleanupError) {
        logger.warn('Failed to clean up audio file:', cleanupError);
      }

      return result;
    } catch (error) {
      logger.error('Record and assess error:', error);
      
      // Make sure to cancel recording if there was an error
      await this.cancelRecording();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
