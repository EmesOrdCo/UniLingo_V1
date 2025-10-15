/**
 * AWS Polly Text-to-Speech Service for Frontend
 * Replaces Expo Speech with AWS Polly for better voice quality and language support
 */

import { ENV } from './envConfig';

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
  private static currentAudio: HTMLAudioElement | null = null;

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

      console.log('🔊 Requesting TTS from backend:', {
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

      // Get audio data
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      await this.playAudio(audioUrl);

      // Clean up URL after playing
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 10000); // Clean up after 10 seconds

    } catch (error) {
      console.error('❌ AWS Polly TTS error:', error);
      this.isSpeaking = false;
      
      // Fallback to browser speech synthesis if available
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        console.log('🔄 Falling back to browser speech synthesis');
        await this.fallbackToBrowserTTS(text, config);
      } else {
        throw error;
      }
    }
  }

  /**
   * Play audio from URL
   */
  private static async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        console.log('✅ Audio playback completed');
        this.isSpeaking = false;
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        this.isSpeaking = false;
        this.currentAudio = null;
        reject(error);
      };

      audio.oncanplaythrough = () => {
        console.log('🎵 Starting audio playback');
        audio.play().catch(reject);
      };

      // Timeout fallback
      setTimeout(() => {
        if (this.isSpeaking) {
          console.warn('⚠️ Audio playback timeout');
          this.isSpeaking = false;
          this.currentAudio = null;
          resolve();
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Fallback to browser speech synthesis
   */
  private static async fallbackToBrowserTTS(
    text: string,
    config: PollyServiceConfig = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language
        const voiceConfig = this.getVoiceConfig(config.language);
        utterance.lang = voiceConfig.languageCode;
        
        // Set speech parameters
        utterance.rate = config.rate || 1.0;
        utterance.pitch = config.pitch || 1.0;
        utterance.volume = config.volume || 1.0;

        utterance.onend = () => {
          console.log('✅ Browser TTS completed');
          this.isSpeaking = false;
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('❌ Browser TTS error:', event);
          this.isSpeaking = false;
          reject(new Error('Browser TTS failed'));
        };

        console.log('🎤 Starting browser TTS fallback');
        speechSynthesis.speak(utterance);

      } catch (error) {
        console.error('❌ Browser TTS setup error:', error);
        this.isSpeaking = false;
        reject(error);
      }
    });
  }

  /**
   * Stop current speech
   */
  static async stopSpeaking(): Promise<void> {
    try {
      // Stop current audio if playing
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }

      // Stop browser speech synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }

      this.isSpeaking = false;
      console.log('🛑 Speech stopped');
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
