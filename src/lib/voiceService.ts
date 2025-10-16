import * as Speech from 'expo-speech';
import { ENV } from './envConfig';
import { AWSPollyService } from './awsPollyService';

export interface VoiceServiceConfig {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface WhisperResponse {
  text: string;
  language?: string;
}

export class VoiceService {
  private static isListening = false;
  private static isSpeaking = false;
  private static mediaRecorder: any = null;
  private static audioChunks: Blob[] = [];

  /**
   * Convert speech to text using OpenAI Whisper API
   */
  static async speechToText(audioBlob: Blob): Promise<WhisperResponse> {
    try {
      const apiKey = ENV.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Whisper API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        language: data.language,
      };
    } catch (error) {
      console.error('❌ Speech to text error:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using Expo Speech directly (for dashboard exercises)
   */
  static async textToSpeechExpo(
    text: string,
    config: VoiceServiceConfig = {}
  ): Promise<void> {
    try {
      if (this.isSpeaking) {
        await this.stopSpeaking();
      }

      this.isSpeaking = true;

      console.log('🔊 VoiceService: Starting Expo Speech TTS');
      
      await Speech.speak(text, {
        language: config.language || 'en-US',
        rate: config.rate || 1.0,
        pitch: config.pitch || 1.0,
        volume: config.volume || 1.0,
        onDone: () => {
          this.isSpeaking = false;
          console.log('✅ VoiceService: Expo Speech TTS completed');
        },
        onError: (speechError: any) => {
          console.error('❌ Expo Speech error:', speechError);
          this.isSpeaking = false;
          throw speechError;
        },
      });

    } catch (error) {
      console.error('❌ VoiceService: Expo Speech TTS failed:', error);
      this.isSpeaking = false;
      throw error;
    }
  }

  /**
   * Convert text to speech using AWS Polly
   */
  static async textToSpeech(
    text: string,
    config: VoiceServiceConfig = {}
  ): Promise<void> {
    try {
      if (this.isSpeaking) {
        await this.stopSpeaking();
      }

      this.isSpeaking = true;

      console.log('🔊 VoiceService: Starting AWS Polly TTS');
      
      // Use AWS Polly service
      await AWSPollyService.playSpeech(text, {
        languageCode: config.language,
        rate: config.rate,
        pitch: config.pitch,
        volume: config.volume,
      });

      this.isSpeaking = false;
      console.log('✅ VoiceService: AWS Polly TTS completed');

    } catch (error) {
      console.error('❌ VoiceService: AWS Polly TTS failed, falling back to Expo Speech:', error);
      
      // Fallback to Expo Speech
      try {
        await Speech.speak(text, {
          language: config.language || 'en-US',
          rate: config.rate || 1.0,
          pitch: config.pitch || 1.0,
          volume: config.volume || 1.0,
          onDone: () => {
            this.isSpeaking = false;
          },
          onError: (speechError: any) => {
            console.error('❌ Expo Speech fallback error:', speechError);
            this.isSpeaking = false;
          },
        });
      } catch (fallbackError) {
        console.error('❌ Both AWS Polly and Expo Speech failed:', fallbackError);
        this.isSpeaking = false;
        throw fallbackError;
      }
    }
  }

  /**
   * Start recording audio for speech recognition
   */
  static async startRecording(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      if (this.isListening) {
        console.log('⚠️ Already recording');
        return;
      }

      this.isListening = true;
      this.audioChunks = [];

      // In a real implementation, you'd use expo-av to record audio
      // For now, we'll simulate the recording process
      console.log('🎤 Started recording...');
      
      // Simulate recording for 5 seconds
      setTimeout(async () => {
        try {
          await this.stopRecording();
          
          // Simulate audio processing
          const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
          const result = await this.speechToText(mockAudioBlob);
          onResult(result.text);
        } catch (error) {
          onError?.(error instanceof Error ? error.message : 'Recording failed');
        }
      }, 5000);

    } catch (error) {
      console.error('❌ Start recording error:', error);
      this.isListening = false;
      onError?.('Failed to start recording');
    }
  }

  /**
   * Stop recording audio
   */
  static async stopRecording(): Promise<void> {
    try {
      if (!this.isListening) {
        return;
      }

      this.isListening = false;
      console.log('🛑 Stopped recording');
      
      // In a real implementation, you'd stop the actual recording here
    } catch (error) {
      console.error('❌ Stop recording error:', error);
    }
  }

  /**
   * Stop speaking
   */
  static async stopSpeaking(): Promise<void> {
    try {
      if (this.isSpeaking) {
        // Stop AWS Polly speech
        await AWSPollyService.stopSpeaking();
        
        // Stop Expo Speech as fallback
        Speech.stop();
        
        this.isSpeaking = false;
        console.log('🛑 Speech stopped');
      }
    } catch (error) {
      console.error('❌ Stop speaking error:', error);
    }
  }

  /**
   * Check if currently recording
   */
  static getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if currently speaking
   */
  static getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get available voices for TTS
   */
  static getAvailableVoices(): string[] {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }

  /**
   * Get available languages for Whisper
   */
  static getAvailableLanguages(): string[] {
    return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];
  }
}
