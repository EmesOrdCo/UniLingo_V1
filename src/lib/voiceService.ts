import * as Speech from 'expo-speech';
import { ENV } from './envConfig';

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
   * Convert text to speech using OpenAI TTS API
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

      const apiKey = ENV.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
          speed: config.rate || 1.0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`TTS API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio using expo-speech as a fallback
      // In a real implementation, you'd use expo-av to play the audio blob
      await Speech.speak(text, {
        rate: config.rate || 1.0,
        pitch: config.pitch || 1.0,
        volume: config.volume || 1.0,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: (error: any) => {
          console.error('❌ Speech error:', error);
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.error('❌ Text to speech error:', error);
      this.isSpeaking = false;
      throw error;
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
        await Speech.stop();
        this.isSpeaking = false;
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
