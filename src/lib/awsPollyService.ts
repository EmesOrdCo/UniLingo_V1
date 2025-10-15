/**
 * AWS Polly Text-to-Speech Service for React Native
 * Uses expo-av for audio playback instead of web browser APIs
 */

import { ENV } from './envConfig';
import { Audio } from 'expo-av';
import { logDebug } from './logger';

export interface PollyVoiceConfig {
  voiceId: string;
  languageCode: string;
  engine?: 'standard' | 'neural';
}

export interface PollyServiceConfig {
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export class AWSPollyService {
  private static isSpeaking = false;
  private static currentSound: Audio.Sound | null = null;

  // Voice mapping for different languages (Standard voices for cost efficiency)
  private static readonly VOICE_MAPPING: Record<string, PollyVoiceConfig> = {
    // English variants
    'en': { voiceId: 'Joanna', languageCode: 'en-US' },
    'en-US': { voiceId: 'Joanna', languageCode: 'en-US' },
    'en-GB': { voiceId: 'Amy', languageCode: 'en-GB' },
    'en-AU': { voiceId: 'Nicole', languageCode: 'en-AU' },
    
    // Spanish variants
    'es': { voiceId: 'Lupe', languageCode: 'es-US' },
    'es-US': { voiceId: 'Lupe', languageCode: 'es-US' },
    'es-ES': { voiceId: 'Conchita', languageCode: 'es-ES' },
    'es-MX': { voiceId: 'Mia', languageCode: 'es-MX' },
    
    // French variants
    'fr': { voiceId: 'Celine', languageCode: 'fr-FR' },
    'fr-FR': { voiceId: 'Celine', languageCode: 'fr-FR' },
    'fr-CA': { voiceId: 'Chantal', languageCode: 'fr-CA' },
    
    // German
    'de': { voiceId: 'Marlene', languageCode: 'de-DE' },
    'de-DE': { voiceId: 'Marlene', languageCode: 'de-DE' },
    
    // Italian
    'it': { voiceId: 'Carla', languageCode: 'it-IT' },
    'it-IT': { voiceId: 'Carla', languageCode: 'it-IT' },
    
    // Portuguese
    'pt': { voiceId: 'Camila', languageCode: 'pt-BR' },
    'pt-BR': { voiceId: 'Camila', languageCode: 'pt-BR' },
    'pt-PT': { voiceId: 'Ines', languageCode: 'pt-PT' },
    
    // Japanese
    'ja': { voiceId: 'Mizuki', languageCode: 'ja-JP' },
    'ja-JP': { voiceId: 'Mizuki', languageCode: 'ja-JP' },
    
    // Chinese
    'zh': { voiceId: 'Zhiyu', languageCode: 'zh-CN' },
    'zh-CN': { voiceId: 'Zhiyu', languageCode: 'zh-CN' },
    
    // Korean
    'ko': { voiceId: 'Seoyeon', languageCode: 'ko-KR' },
    'ko-KR': { voiceId: 'Seoyeon', languageCode: 'ko-KR' },
    
    // Russian
    'ru': { voiceId: 'Tatyana', languageCode: 'ru-RU' },
    'ru-RU': { voiceId: 'Tatyana', languageCode: 'ru-RU' },
    
    // Dutch
    'nl': { voiceId: 'Lotte', languageCode: 'nl-NL' },
    'nl-NL': { voiceId: 'Lotte', languageCode: 'nl-NL' },
    
    // Swedish
    'sv': { voiceId: 'Astrid', languageCode: 'sv-SE' },
    'sv-SE': { voiceId: 'Astrid', languageCode: 'sv-SE' },
    
    // Norwegian
    'no': { voiceId: 'Liv', languageCode: 'nb-NO' },
    'nb-NO': { voiceId: 'Liv', languageCode: 'nb-NO' },
    
    // Danish
    'da': { voiceId: 'Naja', languageCode: 'da-DK' },
    'da-DK': { voiceId: 'Naja', languageCode: 'da-DK' },
    
    // Polish
    'pl': { voiceId: 'Ewa', languageCode: 'pl-PL' },
    'pl-PL': { voiceId: 'Ewa', languageCode: 'pl-PL' },
    
    // Turkish
    'tr': { voiceId: 'Filiz', languageCode: 'tr-TR' },
    'tr-TR': { voiceId: 'Filiz', languageCode: 'tr-TR' },
    
    // Arabic
    'ar': { voiceId: 'Zeina', languageCode: 'ar-AE' },
    'ar-AE': { voiceId: 'Zeina', languageCode: 'ar-AE' },
    
    // Hindi
    'hi': { voiceId: 'Aditi', languageCode: 'hi-IN' },
    'hi-IN': { voiceId: 'Aditi', languageCode: 'hi-IN' },
  };

  /**
   * Convert ArrayBuffer to base64 string (React Native compatible)
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Use a simple base64 encoding that works in React Native
    return this.btoa(binary);
  }

  /**
   * Simple base64 encoding for React Native (replaces btoa)
   */
  private static btoa(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }

  /**
   * Get voice configuration for a given language
   */
  private static getVoiceConfig(language?: string): PollyVoiceConfig {
    if (!language) {
      return this.VOICE_MAPPING['en-US']; // Default to English
    }

    // Try exact match first
    if (this.VOICE_MAPPING[language]) {
      return this.VOICE_MAPPING[language];
    }

    // Try language code without region
    const langCode = language.split('-')[0];
    if (this.VOICE_MAPPING[langCode]) {
      return this.VOICE_MAPPING[langCode];
    }

    // Fallback to English
    console.warn(`Voice not found for language: ${language}, falling back to English`);
    return this.VOICE_MAPPING['en-US'];
  }

  /**
   * Convert text to speech using AWS Polly via backend
   */
  static async textToSpeech(
    text: string,
    config: PollyServiceConfig = {}
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stopSpeaking();

      this.isSpeaking = true;

      // Get voice configuration
      const voiceConfig = this.getVoiceConfig(config.language);
      
      // Prepare request payload
      const requestPayload = {
        text: text,
        voiceId: voiceConfig.voiceId,
        languageCode: voiceConfig.languageCode,
        engine: 'standard', // Use standard voices for cost efficiency
        rate: config.rate || 1.0,
        pitch: config.pitch || 1.0,
        volume: config.volume || 1.0,
      };

      logDebug('🔊 Requesting TTS from backend:', {
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        voiceId: voiceConfig.voiceId,
        languageCode: voiceConfig.languageCode,
      });

      // Make request to backend Polly endpoint
      const response = await fetch(`${ENV.BACKEND_URL}/api/polly/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Polly API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      // Get audio data directly from response for React Native
      const audioArrayBuffer = await response.arrayBuffer();
      const audioData = new Uint8Array(audioArrayBuffer);
      
      // Convert to base64 for data URI
      const base64Audio = this.arrayBufferToBase64(audioArrayBuffer);
      const audioUri = `data:audio/mp3;base64,${base64Audio}`;
      
      logDebug('🎵 Audio converted to data URI for playback');
      
      // Play audio directly using expo-av
      await this.playAudio(audioUri);

    } catch (error) {
      console.error('❌ AWS Polly TTS error:', error);
      this.isSpeaking = false;
      throw error;
    }
  }

  /**
   * Play audio from URI using expo-av
   */
  private static async playAudio(audioUri: string): Promise<void> {
    try {
      logDebug('🎵 Starting audio playback with expo-av');
      
      // Create and load the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, volume: 1.0 }
      );
      
      this.currentSound = sound;

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            logDebug('✅ Audio playback completed');
            this.isSpeaking = false;
            this.currentSound = null;
            sound.unloadAsync();
          }
        } else if (status.error) {
          console.error('❌ Audio playback error:', status.error);
          this.isSpeaking = false;
          this.currentSound = null;
          sound.unloadAsync();
        }
      });

      // Wait for playback to complete
      return new Promise((resolve, reject) => {
        const checkStatus = () => {
          if (!this.isSpeaking) {
            resolve();
          } else {
            setTimeout(checkStatus, 100);
          }
        };
        
        // Start checking after a short delay
        setTimeout(checkStatus, 100);
        
        // Timeout fallback
        setTimeout(() => {
          if (this.isSpeaking) {
            console.warn('⚠️ Audio playback timeout');
            this.isSpeaking = false;
            if (this.currentSound) {
              this.currentSound.unloadAsync();
              this.currentSound = null;
            }
            resolve();
          }
        }, 30000); // 30 second timeout
      });

    } catch (error) {
      console.error('❌ Error creating audio sound:', error);
      this.isSpeaking = false;
      this.currentSound = null;
      throw error;
    }
  }


  /**
   * Stop current speech
   */
  static async stopSpeaking(): Promise<void> {
    try {
      // Stop current sound if playing
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }

      this.isSpeaking = false;
      logDebug('🛑 Speech stopped');
    } catch (error) {
      console.error('❌ Error stopping speech:', error);
    }
  }

  /**
   * Check if currently speaking
   */
  static get isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get available voices for a language
   */
  static getAvailableVoices(language?: string): PollyVoiceConfig[] {
    if (!language) {
      return Object.values(this.VOICE_MAPPING);
    }

    const langCode = language.split('-')[0];
    return Object.entries(this.VOICE_MAPPING)
      .filter(([key]) => key.startsWith(langCode))
      .map(([, config]) => config);
  }

  /**
   * Get voice configuration for user's target language
   */
  static getVoiceForUserLanguage(userLanguage?: string): PollyVoiceConfig {
    return this.getVoiceConfig(userLanguage);
  }
}

export default AWSPollyService;
