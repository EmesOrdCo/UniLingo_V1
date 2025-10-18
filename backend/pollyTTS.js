/**
 * AWS Polly Text-to-Speech Service for Real-time TTS
 * Handles TTS requests from frontend with caching and rate limiting
 */

const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { Readable } = require('stream');

class PollyTTSService {
  constructor() {
    // Initialize AWS Polly client
    this.pollyClient = new PollyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Simple in-memory cache for TTS requests (LRU-style)
    this.cache = new Map();
    this.maxCacheSize = 1000; // Maximum number of cached audio files
    this.cacheTimeout = 3600000; // 1 hour cache timeout

    // Rate limiting
    this.requestCounts = new Map();
    this.rateLimitWindow = 60000; // 1 minute window
    this.maxRequestsPerWindow = 2000; // Max 2000 requests per minute per IP (increased from 500)

    console.log('🎙️ PollyTTSService initialized:', {
      region: process.env.AWS_REGION,
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      cacheSize: this.maxCacheSize,
      rateLimit: `${this.maxRequestsPerWindow} requests per ${this.rateLimitWindow / 1000}s`
    });
  }

  /**
   * Generate cache key for TTS request
   */
  generateCacheKey(text, voiceId, languageCode, rate, pitch) {
    return `${text}-${voiceId}-${languageCode}-${rate}-${pitch}`.replace(/[^a-zA-Z0-9-]/g, '');
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(clientIP) {
    const now = Date.now();
    const windowStart = now - this.rateLimitWindow;

    // Clean old entries
    if (this.requestCounts.has(clientIP)) {
      const requests = this.requestCounts.get(clientIP).filter(timestamp => timestamp > windowStart);
      this.requestCounts.set(clientIP, requests);
    }

    // Get current request count
    const currentRequests = this.requestCounts.get(clientIP) || [];
    
    if (currentRequests.length >= this.maxRequestsPerWindow) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Add current request
    currentRequests.push(now);
    this.requestCounts.set(clientIP, currentRequests);

    return true;
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Synthesize speech using AWS Polly
   */
  async synthesizeSpeech(requestData) {
    const {
      text,
      voiceId = 'Joanna',
      languageCode = 'en-US',
      engine = 'standard',
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0
    } = requestData;

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('Text is required for speech synthesis');
      }

      if (text.length > 3000) {
        throw new Error('Text too long. Maximum 3000 characters allowed.');
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(text, voiceId, languageCode, rate, pitch);

      // Check cache first
      this.cleanCache();
      if (this.cache.has(cacheKey)) {
        console.log('🎵 Cache hit for TTS request');
        const cachedEntry = this.cache.get(cacheKey);
        return {
          audioBuffer: cachedEntry.audioBuffer,
          contentType: 'audio/mpeg',
          fromCache: true
        };
      }

      console.log('🔊 Generating new TTS audio:', {
        textLength: text.length,
        voiceId,
        languageCode,
        engine,
        rate,
        pitch
      });

      // Prepare SSML with prosody controls
      const ssmlText = `<speak>
        <prosody rate="${rate}" pitch="${pitch}%">
          ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </prosody>
      </speak>`;

      // AWS Polly parameters
      const params = {
        Text: ssmlText,
        OutputFormat: 'mp3',
        VoiceId: voiceId,
        Engine: engine,
        LanguageCode: languageCode,
        TextType: 'ssml',
        SampleRate: '22050' // Good quality, reasonable file size
      };

      // Generate speech
      const command = new SynthesizeSpeechCommand(params);
      const response = await this.pollyClient.send(command);

      // Convert stream to buffer
      const audioBuffer = await this.streamToBuffer(response.AudioStream);

      console.log('✅ TTS generation successful:', {
        audioSize: `${(audioBuffer.length / 1024).toFixed(2)} KB`,
        duration: `${Math.ceil(audioBuffer.length / 22050)}s (estimated)`
      });

      // Cache the result
      this.cache.set(cacheKey, {
        audioBuffer,
        timestamp: Date.now()
      });

      return {
        audioBuffer,
        contentType: 'audio/mpeg',
        fromCache: false
      };

    } catch (error) {
      console.error('❌ TTS generation failed:', error);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }

  /**
   * Convert stream to buffer
   */
  async streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      rateLimitWindow: this.rateLimitWindow,
      maxRequestsPerWindow: this.maxRequestsPerWindow,
      activeClients: this.requestCounts.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ TTS cache cleared');
  }
}

// Export singleton instance
module.exports = new PollyTTSService();
