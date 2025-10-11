/**
 * Simple AWS Polly Text-to-Speech Service
 * Converts text directly to audio (no lesson dependencies)
 */

const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { supabase } = require('./supabaseClient');

class SimplePollyService {
  constructor() {
    // Initialize AWS Polly client
    this.pollyClient = new PollyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    this.bucketName = 'Audio_Lessons'; // Supabase Storage bucket name
    
    // Voice mapping for consistent voice selection by language
    this.voiceMap = {
      // English voices
      'English': 'Joanna', // Female, natural
      'english': 'Joanna',
      'en': 'Joanna',
      'en-US': 'Joanna',
      'en-GB': 'Emma', // British English
      
      // Spanish voices
      'Spanish': 'Lupe', // Female, natural
      'spanish': 'Lupe',
      'es': 'Lupe',
      'es-ES': 'Lucia', // European Spanish
      'es-MX': 'Lupe', // Mexican Spanish
      
      // Chinese voices
      'Chinese': 'Zhiyu', // Female, Mandarin
      'chinese': 'Zhiyu',
      'zh': 'Zhiyu',
      'zh-CN': 'Zhiyu',
      
      // French voices
      'French': 'Lea', // Female, natural
      'french': 'Lea',
      'fr': 'Lea',
      'fr-FR': 'Lea',
      
      // German voices
      'German': 'Vicki', // Female, natural
      'german': 'Vicki',
      'de': 'Vicki',
      'de-DE': 'Vicki',
      
      // Italian voices
      'Italian': 'Bianca', // Female, natural
      'italian': 'Bianca',
      'it': 'Bianca',
      'it-IT': 'Bianca',
      
      // Portuguese voices
      'Portuguese': 'Camila', // Female, natural
      'portuguese': 'Camila',
      'pt': 'Camila',
      'pt-BR': 'Camila',
      
      // Japanese voices
      'Japanese': 'Mizuki', // Female, natural
      'japanese': 'Mizuki',
      'ja': 'Mizuki',
      'ja-JP': 'Mizuki',
      
      // Korean voices
      'Korean': 'Seoyeon', // Female, natural
      'korean': 'Seoyeon',
      'ko': 'ko',
      'ko-KR': 'Seoyeon',
      
      // Russian voices
      'Russian': 'Tatyana', // Female, natural
      'russian': 'Tatyana',
      'ru': 'Tatyana',
      'ru-RU': 'Tatyana',
      
      // Arabic voices
      'Arabic': 'Zeina', // Female, natural
      'arabic': 'Zeina',
      'ar': 'Zeina',
      'ar-SA': 'Zeina',
      
      // Hindi voices
      'Hindi': 'Aditi', // Female, natural
      'hindi': 'Aditi',
      'hi': 'Aditi',
      'hi-IN': 'Aditi',
      
      // Latin (use Italian as closest)
      'Latin': 'Bianca',
      'latin': 'Bianca',
      'la': 'Bianca'
    };
    
    console.log('🎙️ SimplePollyService initialized:', {
      region: process.env.AWS_REGION,
      bucket: this.bucketName,
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      supportedLanguages: Object.keys(this.voiceMap).length
    });
  }

  /**
   * Get appropriate voice ID for a language
   * @param {string} language - Language name or code
   * @returns {string} - Voice ID for Polly
   */
  getVoiceForLanguage(language) {
    const normalizedLanguage = language?.toString().trim();
    
    // Try exact match first
    if (this.voiceMap[normalizedLanguage]) {
      return this.voiceMap[normalizedLanguage];
    }
    
    // Try case-insensitive match
    const lowerLanguage = normalizedLanguage?.toLowerCase();
    if (this.voiceMap[lowerLanguage]) {
      return this.voiceMap[lowerLanguage];
    }
    
    // Default to English if no match found
    console.log(`⚠️ No voice found for language "${language}", defaulting to English`);
    return 'Joanna';
  }

  /**
   * Get language code for Polly
   * @param {string} language - Language name or code
   * @returns {string} - Language code for Polly
   */
  getLanguageCode(language) {
    const languageCodeMap = {
      'English': 'en-US',
      'english': 'en-US',
      'en': 'en-US',
      'en-US': 'en-US',
      'en-GB': 'en-GB',
      
      'Spanish': 'es-US',
      'spanish': 'es-US',
      'es': 'es-US',
      'es-ES': 'es-ES',
      'es-MX': 'es-MX',
      
      'Chinese': 'zh-CN',
      'chinese': 'zh-CN',
      'zh': 'zh-CN',
      'zh-CN': 'zh-CN',
      
      'French': 'fr-FR',
      'french': 'fr-FR',
      'fr': 'fr-FR',
      'fr-FR': 'fr-FR',
      
      'German': 'de-DE',
      'german': 'de-DE',
      'de': 'de-DE',
      'de-DE': 'de-DE',
      
      'Italian': 'it-IT',
      'italian': 'it-IT',
      'it': 'it-IT',
      'it-IT': 'it-IT',
      
      'Portuguese': 'pt-BR',
      'portuguese': 'pt-BR',
      'pt': 'pt-BR',
      'pt-BR': 'pt-BR',
      
      'Japanese': 'ja-JP',
      'japanese': 'ja-JP',
      'ja': 'ja-JP',
      'ja-JP': 'ja-JP',
      
      'Korean': 'ko-KR',
      'korean': 'ko-KR',
      'ko': 'ko-KR',
      'ko-KR': 'ko-KR',
      
      'Russian': 'ru-RU',
      'russian': 'ru-RU',
      'ru': 'ru-RU',
      'ru-RU': 'ru-RU',
      
      'Arabic': 'ar-SA',
      'arabic': 'ar-SA',
      'ar': 'ar-SA',
      'ar-SA': 'ar-SA',
      
      'Hindi': 'hi-IN',
      'hindi': 'hi-IN',
      'hi': 'hi-IN',
      'hi-IN': 'hi-IN',
      
      'Latin': 'it-IT', // Use Italian as closest
      'latin': 'it-IT',
      'la': 'it-IT'
    };
    
    const normalizedLanguage = language?.toString().trim();
    
    // Try exact match first
    if (languageCodeMap[normalizedLanguage]) {
      return languageCodeMap[normalizedLanguage];
    }
    
    // Try case-insensitive match
    const lowerLanguage = normalizedLanguage?.toLowerCase();
    if (languageCodeMap[lowerLanguage]) {
      return languageCodeMap[lowerLanguage];
    }
    
    // Default to English if no match found
    console.log(`⚠️ No language code found for language "${language}", defaulting to en-US`);
    return 'en-US';
  }

  /**
   * Generate audio from text using AWS Polly with language support
   * @param {string} text - The text to convert to speech
   * @param {string} language - Language for voice selection (default: English)
   * @returns {Promise<Buffer>} - Audio data as buffer
   */
  async generateAudio(text, language = 'English') {
    try {
      const voiceId = this.getVoiceForLanguage(language);
      const languageCode = this.getLanguageCode(language);
      
      console.log('🔊 Generating audio with AWS Polly...');
      console.log(`   Language: ${language}`);
      console.log(`   Voice: ${voiceId}`);
      console.log(`   Language Code: ${languageCode}`);
      console.log(`   Text length: ${text.length} characters`);

      const params = {
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: voiceId,
        Engine: 'neural',
        LanguageCode: languageCode,
        SampleRate: '24000'
      };

      const command = new SynthesizeSpeechCommand(params);
      const response = await this.pollyClient.send(command);

      console.log('✅ Audio generated successfully');

      const audioBuffer = await this.streamToBuffer(response.AudioStream);
      console.log(`📊 Audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);

      return audioBuffer;
    } catch (error) {
      console.error('❌ Error generating audio:', error);
      throw new Error(`Polly generation failed: ${error.message}`);
    }
  }

  /**
   * Upload audio file to Supabase Storage
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} userId - User ID
   * @param {string} audioLessonId - Audio lesson ID
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadToSupabase(audioBuffer, userId, audioLessonId) {
    try {
      const timestamp = Date.now();
      const fileName = `${audioLessonId}-${timestamp}.mp3`;
      const filePath = `${userId}/${fileName}`;
      
      console.log(`📤 Uploading to Supabase Storage...`);
      console.log(`   Bucket: ${this.bucketName}`);
      console.log(`   Path: ${filePath}`);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, audioBuffer, {
          contentType: 'audio/mpeg',
          cacheControl: 'max-age=31536000',
          upsert: false
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      const url = urlData.publicUrl;
      
      console.log('✅ Upload successful');
      console.log(`   URL: ${url}`);

      return { url, path: filePath };
    } catch (error) {
      console.error('❌ Error uploading to Supabase:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
  }

  /**
   * Delete audio file from Supabase Storage
   * @param {string} path - File path in Supabase Storage
   */
  async deleteFromSupabase(path) {
    try {
      console.log(`🗑️ Deleting from Supabase Storage: ${path}`);

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        throw new Error(`Supabase delete failed: ${error.message}`);
      }

      console.log('✅ Deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting from Supabase:', error);
      throw error;
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
   * Estimate audio duration based on text length
   * @param {string} text - The text to be spoken
   * @returns {number} - Estimated duration in seconds
   */
  estimateDuration(text) {
    const words = text.trim().split(/\s+/).length;
    const minutes = words / 150; // Average speaking rate
    const seconds = Math.ceil(minutes * 60);
    
    console.log(`⏱️ Estimated duration: ${seconds} seconds (${words} words)`);
    return seconds;
  }

  /**
   * Complete workflow: Create audio lesson from text
   * @param {string} title - Lesson title
   * @param {string} scriptText - The text to convert to audio
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Audio lesson data
   */
  async createAudioLesson(title, scriptText, userId) {
    const startTime = Date.now();
    
    try {
      console.log('\n' + '🎵'.repeat(30));
      console.log('🎵 AUDIO LESSON CREATION STARTED');
      console.log('🎵'.repeat(30));
      console.log(`📝 Title: ${title}`);
      console.log(`👤 User ID: ${userId}`);
      console.log(`📄 Script length: ${scriptText.length} characters`);

      // 1. Estimate duration
      const estimatedDuration = this.estimateDuration(scriptText);

      // 2. Create database record first (with placeholder URL)
      console.log('\n💾 Creating database record...');
      const { data: audioLesson, error: insertError } = await supabase
        .from('audio_lessons')
        .insert([{
          user_id: userId,
          title: title,
          script_text: scriptText,
          audio_url: 'pending', // Placeholder
          audio_duration: estimatedDuration,
          status: 'not_started'
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log(`✅ Database record created: ${audioLesson.id}`);

      // 3. Generate audio with Polly
      console.log('\n🎙️ Generating audio with AWS Polly...');
      const audioBuffer = await this.generateAudio(scriptText, 'English'); // Use English voice for mixed content

      // 4. Upload to Supabase Storage
      console.log('\n☁️ Uploading to Supabase Storage...');
      const { url, path } = await this.uploadToSupabase(audioBuffer, userId, audioLesson.id);

      // 5. Update database with audio URL
      console.log('\n💾 Updating database with audio URL...');
      const { data: updatedLesson, error: updateError } = await supabase
        .from('audio_lessons')
        .update({
          audio_url: url,
          audio_file_path: path
        })
        .eq('id', audioLesson.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      const generationTime = Math.floor((Date.now() - startTime) / 1000);

      console.log('\n' + '✅'.repeat(30));
      console.log('✅ AUDIO LESSON CREATION COMPLETED');
      console.log('✅'.repeat(30));
      console.log(`⏱️ Total time: ${generationTime} seconds`);
      console.log(`🎵 Audio ID: ${updatedLesson.id}`);
      console.log(`🔗 URL: ${url}`);
      console.log('✅'.repeat(30) + '\n');

      return updatedLesson;

    } catch (error) {
      const errorTime = Math.floor((Date.now() - startTime) / 1000);
      
      console.error('\n' + '❌'.repeat(30));
      console.error('❌ AUDIO LESSON CREATION FAILED');
      console.error('❌'.repeat(30));
      console.error(`⏱️ Failed after: ${errorTime} seconds`);
      console.error(`❌ Error: ${error.message}`);
      console.error('❌'.repeat(30) + '\n');

      throw error;
    }
  }

  /**
   * Delete audio lesson
   * @param {string} audioLessonId - Audio lesson ID
   * @param {string} userId - User ID (for security)
   */
  async deleteAudioLesson(audioLessonId, userId) {
    try {
      console.log(`🗑️ Deleting audio lesson: ${audioLessonId}`);

      // 1. Get audio lesson details
      const { data: audioLesson, error: fetchError } = await supabase
        .from('audio_lessons')
        .select('audio_file_path')
        .eq('id', audioLessonId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !audioLesson) {
        throw new Error('Audio lesson not found');
      }

      // 2. Delete from Supabase Storage
      if (audioLesson.audio_file_path) {
        await this.deleteFromSupabase(audioLesson.audio_file_path);
      }

      // 3. Delete from database
      const { error: deleteError } = await supabase
        .from('audio_lessons')
        .delete()
        .eq('id', audioLessonId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Database delete failed: ${deleteError.message}`);
      }

      console.log('✅ Audio lesson deleted successfully');
      return true;

    } catch (error) {
      console.error('❌ Error deleting audio lesson:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new SimplePollyService();

