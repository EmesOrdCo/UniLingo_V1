/**
 * AWS Polly Text-to-Speech Service for Flashcards
 * Uses the backend /api/polly/synthesize endpoint to generate high-quality speech
 */

import { logger } from './logger';

interface PollyOptions {
  voiceId?: string;
  languageCode?: string;
  engine?: 'standard' | 'neural';
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface PollyResponse {
  audioBuffer: ArrayBuffer;
  contentType: string;
  fromCache: boolean;
}

export class AWSPollyService {
  private static readonly BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  /**
   * Generate speech using AWS Polly via backend endpoint
   */
  static async synthesizeSpeech(text: string, options: PollyOptions = {}): Promise<PollyResponse> {
    try {
      logger.info(`🔊 AWS Polly TTS request for: "${text}"`);
      
      const requestBody = {
        text: text.trim(),
        voiceId: options.voiceId || 'Joanna', // Default to Joanna (US English, Female)
        languageCode: options.languageCode || 'en-US',
        engine: options.engine || 'standard', // Use standard engine for cost efficiency
        rate: options.rate || 0.9, // Slightly slower for clarity
        pitch: options.pitch || 1.0,
        volume: options.volume || 1.0
      };

      logger.info(`🔊 Polly request options:`, requestBody);

      const response = await fetch(`${this.BACKEND_URL}/api/polly/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Polly TTS failed: ${response.status} ${response.statusText}. ${errorData.error || ''}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('Content-Type') || 'audio/mpeg';
      const fromCache = response.headers.get('X-From-Cache') === 'true';

      logger.info(`✅ AWS Polly TTS completed:`, {
        textLength: text.length,
        audioSize: audioBuffer.byteLength,
        contentType,
        fromCache,
        processingTime: response.headers.get('X-Processing-Time')
      });

      return {
        audioBuffer,
        contentType,
        fromCache
      };

    } catch (error) {
      logger.error('❌ AWS Polly TTS error:', error);
      throw error;
    }
  }

  /**
   * Play speech using AWS Polly (for flashcards)
   */
  static async playSpeech(text: string, options: PollyOptions = {}): Promise<void> {
    try {
      // Check if we're in a web environment
      if (typeof window !== 'undefined' && typeof Blob !== 'undefined' && typeof Audio !== 'undefined') {
        // Web environment - use AWS Polly with Blob approach
        const result = await this.synthesizeSpeech(text, options);
        
        let audioData: Uint8Array;
        
        if (result.audioBuffer instanceof ArrayBuffer) {
          audioData = new Uint8Array(result.audioBuffer);
        } else if (result.audioBuffer instanceof Uint8Array) {
          audioData = result.audioBuffer;
        } else {
          // Convert to Uint8Array if it's something else
          audioData = new Uint8Array(result.audioBuffer);
        }
        
        // Create audio blob and play it
        const audioBlob = new Blob([audioData], { type: result.contentType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          
          audio.onerror = (error) => {
            URL.revokeObjectURL(audioUrl);
            reject(new Error(`Audio playback failed: ${error}`));
          };
          
          audio.play().catch(reject);
        });
      } else {
        // React Native environment - fall back to Expo Speech
        logger.info('🌐 React Native environment detected, falling back to Expo Speech');
        
        // Import Expo Speech dynamically
        const { default: Speech } = await import('expo-speech');
        
        // Get language code for Expo Speech
        const languageCode = options.languageCode || 'en-US';
        
        return new Promise((resolve, reject) => {
          Speech.speak(text, {
            language: languageCode,
            rate: options.rate || 0.9,
            pitch: options.pitch || 1.0,
            volume: options.volume || 1.0,
            onDone: () => {
              logger.info('✅ Expo Speech completed');
              resolve();
            },
            onError: (error) => {
              logger.error('❌ Expo Speech error:', error);
              reject(new Error(`Expo Speech failed: ${error}`));
            },
            onStopped: () => {
              logger.info('🛑 Expo Speech stopped');
              resolve();
            }
          });
        });
      }

    } catch (error) {
      logger.error('❌ Speech playback error:', error);
      throw error;
    }
  }

  /**
   * Get voice options for different languages
   */
  static getVoiceOptions(): { [languageCode: string]: { voiceId: string; name: string; gender: string } } {
    return {
      'en-US': { voiceId: 'Joanna', name: 'Joanna', gender: 'Female' },
      'en-GB': { voiceId: 'Amy', name: 'Amy', gender: 'Female' },
      'es-ES': { voiceId: 'Lucia', name: 'Lucia', gender: 'Female' },
      'fr-FR': { voiceId: 'Lea', name: 'Lea', gender: 'Female' },
      'de-DE': { voiceId: 'Marlene', name: 'Marlene', gender: 'Female' },
      'it-IT': { voiceId: 'Bianca', name: 'Bianca', gender: 'Female' },
      'pt-BR': { voiceId: 'Camila', name: 'Camila', gender: 'Female' },
      'ja-JP': { voiceId: 'Mizuki', name: 'Mizuki', gender: 'Female' },
      'ko-KR': { voiceId: 'Seoyeon', name: 'Seoyeon', gender: 'Female' },
      'zh-CN': { voiceId: 'Zhiyu', name: 'Zhiyu', gender: 'Female' },
      'ar-SA': { voiceId: 'Zeina', name: 'Zeina', gender: 'Female' },
      'hi-IN': { voiceId: 'Aditi', name: 'Aditi', gender: 'Female' },
      'ru-RU': { voiceId: 'Tatyana', name: 'Tatyana', gender: 'Female' }
    };
  }

  /**
   * Convert language name to proper language code
   */
  static getLanguageCodeFromName(languageName: string): string {
    const languageMap: { [key: string]: string } = {
      'English': 'en-US',
      'Spanish': 'es-ES', 
      'French': 'fr-FR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Portuguese': 'pt-BR',
      'Japanese': 'ja-JP',
      'Korean': 'ko-KR',
      'Chinese (Simplified)': 'zh-CN',
      'Chinese (Traditional)': 'zh-TW',
      'Arabic': 'ar-SA',
      'Hindi': 'hi-IN',
      'Russian': 'ru-RU',
      'Dutch': 'nl-NL',
      'Swedish': 'sv-SE',
      'Norwegian': 'nb-NO',
      'Danish': 'da-DK',
      'Finnish': 'fi-FI',
      'Polish': 'pl-PL',
      'Turkish': 'tr-TR',
      'Czech': 'cs-CZ',
      'Romanian': 'ro-RO',
      'Hungarian': 'hu-HU',
      'Greek': 'el-GR',
      'Hebrew': 'he-IL',
      'Thai': 'th-TH',
      'Vietnamese': 'vi-VN',
      'Indonesian': 'id-ID',
      'Malay': 'ms-MY',
      'Filipino': 'fil-PH'
    };
    
    return languageMap[languageName] || 'en-US'; // Default to en-US
  }

  /**
   * Get appropriate voice for user's language
   */
  static getVoiceForLanguage(languageCode: string): string {
    const voices = this.getVoiceOptions();
    return voices[languageCode]?.voiceId || 'Joanna'; // Default to Joanna
  }
}