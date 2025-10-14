/**
 * Resilient Pronunciation Service
 * Implements circuit breaker pattern, retry logic, and request queuing
 */

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

class ResilientPronunciationService {
  constructor() {
    this.circuitBreaker = {
      failures: 0,
      lastFailure: null,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      threshold: 5,
      timeout: 60000 // 1 minute
    };
    
    // ⚠️ IN-MEMORY QUEUE: Acceptable for short-lived pronunciation requests
    // Purpose: Concurrency control for Azure Speech (max 20 concurrent connections)
    // Behavior: Lost on restart, but pronunciation is fast (2-10s) and can be retried
    // Different from long-running AI jobs which need BullMQ persistence
    // TODO (Optional): Migrate to BullMQ if pronunciation becomes a bottleneck
    this.requestQueue = [];
    this.processing = 0;
    this.maxConcurrent = 20; // Azure Speech Service S0 tier limit
    
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };
  }

  async assessPronunciationWithResilience(audioFilePath, referenceText) {
    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() - this.circuitBreaker.lastFailure > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        console.log('[Pronunciation] Circuit breaker moving to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - Azure Speech Service unavailable');
      }
    }

    // Add to queue if at capacity
    if (this.processing >= this.maxConcurrent) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          audioFilePath,
          referenceText,
          resolve,
          reject,
          timestamp: Date.now(),
          retryCount: 0
        });
        console.log(`[Pronunciation] Request queued. Queue size: ${this.requestQueue.length}`);
      });
    }

    return this.processRequest(audioFilePath, referenceText);
  }

  async processRequest(audioFilePath, referenceText, retryCount = 0) {
    this.processing++;
    
    try {
      const result = await this.assessPronunciation(audioFilePath, referenceText);
      
      // Reset circuit breaker on success
      if (this.circuitBreaker.state === 'HALF_OPEN') {
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failures = 0;
        console.log('[Pronunciation] Circuit breaker reset to CLOSED state');
      }
      
      return result;
    } catch (error) {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailure = Date.now();
      
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.state = 'OPEN';
        console.log('[Pronunciation] Circuit breaker opened due to failures');
      }
      
      // Retry logic
      if (retryCount < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, retryCount),
          this.retryConfig.maxDelay
        );
        
        console.log(`[Pronunciation] Retrying in ${delay}ms (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.processRequest(audioFilePath, referenceText, retryCount + 1);
      }
      
      throw error;
    } finally {
      this.processing--;
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing >= this.maxConcurrent || this.requestQueue.length === 0) {
      return;
    }

    const request = this.requestQueue.shift();
    console.log(`[Pronunciation] Processing queued request. Queue size: ${this.requestQueue.length}`);
    
    try {
      const result = await this.processRequest(request.audioFilePath, request.referenceText, request.retryCount);
      request.resolve(result);
    } catch (error) {
      if (request.retryCount < this.retryConfig.maxRetries) {
        request.retryCount++;
        this.requestQueue.unshift(request); // Put back at front of queue
        console.log(`[Pronunciation] Request will be retried. Queue size: ${this.requestQueue.length}`);
      } else {
        request.reject(error);
      }
    }
  }

  async assessPronunciation(audioFilePath, referenceText) {
    let wavFilePath = audioFilePath;
    
    try {
      console.log(`[Pronunciation] Starting assessment for: "${referenceText}"`);
      console.log(`[Pronunciation] Audio file path: ${audioFilePath}`);
      
      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }
      
      // Get Azure credentials
      const speechKey = process.env.AZURE_SPEECH_KEY;
      const speechRegion = process.env.AZURE_SPEECH_REGION;
      
      if (!speechKey || !speechRegion) {
        throw new Error('Azure Speech Service credentials not configured');
      }
      
      // Check if conversion is needed (optimized for WAV files from frontend)
      const fileExtension = audioFilePath.split('.').pop().toLowerCase();
      
      if (fileExtension !== 'wav') {
        const wavFileName = audioFilePath.replace(/\.[^/.]+$/, '.wav');
        console.log(`[Pronunciation] Converting ${fileExtension.toUpperCase()} to WAV: ${wavFileName}`);
        
        await new Promise((resolve, reject) => {
          ffmpeg(audioFilePath)
            .toFormat('wav')
            .audioChannels(1)
            .audioFrequency(16000)
            .audioBitrate('128k')
            .on('end', () => {
              console.log(`[Pronunciation] Conversion completed: ${wavFileName}`);
              resolve();
            })
            .on('error', (err) => {
              console.error(`[Pronunciation] Conversion error:`, err);
              reject(err);
            })
            .save(wavFileName);
        });
        
        wavFilePath = wavFileName;
      } else {
        console.log(`[Pronunciation] Using WAV file directly (no conversion needed)`);
      }
      
      // Configure speech service
      const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
      speechConfig.speechRecognitionLanguage = 'en-US';
      
      // Configure pronunciation assessment
      const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
        referenceText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true
      );
      
      // Set up audio config
      const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
      const pushStream = sdk.AudioInputStream.createPushStream(audioFormat);
      
      // Read the WAV file and push to stream
      const audioBuffer = fs.readFileSync(wavFilePath);
      pushStream.write(audioBuffer);
      pushStream.close();
      
      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
      
      // Create speech recognizer
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      pronunciationConfig.applyTo(recognizer);
      
      console.log(`[Pronunciation] Processing audio file: ${audioFilePath}`);
      console.log(`[Pronunciation] Starting Azure Speech recognition with 30s timeout...`);
      
      // Perform recognition with pronunciation assessment
      const result = await new Promise((resolve, reject) => {
        // Set up timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.log(`[Pronunciation] ⏰ Timeout reached - Azure Speech Service did not respond within 30 seconds`);
          recognizer.close();
          reject(new Error('Speech recognition timeout - Azure Speech Service did not respond within 30 seconds'));
        }, 30000); // 30 second timeout

        recognizer.recognizeOnceAsync(
          (result) => {
            clearTimeout(timeout);
            console.log(`[Pronunciation] ✅ Azure Speech Service responded with reason: ${result.reason}`);
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve(result);
            } else if (result.reason === sdk.ResultReason.NoMatch) {
              reject(new Error('No speech recognized. Please speak clearly.'));
            } else {
              reject(new Error(`Speech recognition failed: ${result.reason}`));
            }
            recognizer.close();
          },
          (error) => {
            clearTimeout(timeout);
            recognizer.close();
            reject(new Error(`Speech recognition error: ${error}`));
          }
        );
      });
      
      // Parse pronunciation assessment results
      const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);
      
      // Extract detailed results
      const assessmentResult = {
        accuracyScore: pronunciationResult.accuracyScore,
        fluencyScore: pronunciationResult.fluencyScore,
        completenessScore: pronunciationResult.completenessScore,
        pronunciationScore: pronunciationResult.pronunciationScore,
        recognizedText: pronunciationResult.recognizedText,
        referenceText: referenceText,
        passed: pronunciationResult.pronunciationScore >= 60,
        words: []
      };
      
      // Parse detailed JSON results for word and phoneme level feedback
      try {
        const detailResult = JSON.parse(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
        
        if (detailResult.NBest && detailResult.NBest[0] && detailResult.NBest[0].Words) {
          assessmentResult.words = detailResult.NBest[0].Words.map(word => ({
            word: word.Word,
            accuracyScore: word.AccuracyScore,
            errorType: word.ErrorType,
            phonemes: word.Phonemes ? word.Phonemes.map(phoneme => ({
              phoneme: phoneme.Phoneme,
              accuracyScore: phoneme.AccuracyScore
            })) : []
          }));
        }
      } catch (parseError) {
        console.warn('[Pronunciation] Could not parse detailed results:', parseError);
      }
      
      console.log(`[Pronunciation] Assessment complete - Score: ${assessmentResult.pronunciationScore}/100`);
      
      // Clean up converted WAV file if it was created
      if (wavFilePath !== audioFilePath && fs.existsSync(wavFilePath)) {
        fs.unlinkSync(wavFilePath);
        console.log(`[Pronunciation] Cleaned up converted WAV file: ${wavFilePath}`);
      }
      
      return {
        success: true,
        result: assessmentResult
      };
      
    } catch (error) {
      console.error('[Pronunciation] Assessment error:', error);
      
      // Clean up converted WAV file if it was created (in case of error)
      if (wavFilePath !== audioFilePath && fs.existsSync(wavFilePath)) {
        fs.unlinkSync(wavFilePath);
        console.log(`[Pronunciation] Cleaned up converted WAV file after error: ${wavFilePath}`);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  getStatus() {
    return {
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        lastFailure: this.circuitBreaker.lastFailure
      },
      queue: {
        size: this.requestQueue.length,
        processing: this.processing,
        maxConcurrent: this.maxConcurrent
      }
    };
  }
}

module.exports = ResilientPronunciationService;
