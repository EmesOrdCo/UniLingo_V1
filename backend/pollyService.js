/**
 * AWS Polly Text-to-Speech Service
 * Converts lesson text to audio using AWS Polly and uploads to S3
 */

const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const { supabase } = require('./supabaseClient');
const hybridAudioLessonUsageService = require('./hybridAudioLessonUsageService'); // Added for hybrid usage tracking

class PollyService {
  constructor() {
    // Initialize AWS Polly client
    this.pollyClient = new PollyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Initialize AWS S3 client
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    this.s3Bucket = process.env.AWS_S3_BUCKET || 'unilingo-audio-lessons';
    
    console.log('🎙️ PollyService initialized:', {
      region: process.env.AWS_REGION,
      bucket: this.s3Bucket,
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    });
  }

  /**
   * Format lesson vocabulary into a natural-sounding script
   * This is what AWS Polly will read aloud
   */
  formatLessonScript(lesson, vocabulary) {
    let script = '';
    
    // Introduction
    script += `Welcome to your audio lesson on ${lesson.title}. `;
    script += `This lesson covers ${lesson.subject || 'important vocabulary'}. `;
    script += `You will learn ${vocabulary.length} key term${vocabulary.length !== 1 ? 's' : ''}. `;
    script += `Listen carefully, and feel free to pause and replay as needed. `;
    script += `Let's begin.\n\n`;

    // Add a small pause
    script += '<break time="1s"/>\n\n';

    // Process each vocabulary item
    vocabulary.forEach((item, index) => {
      const term = item.keywords || item.english_term || 'Unknown term';
      const definition = item.definition || 'No definition available';
      const example = item.example_sentence_target;
      const translation = item.native_translation;

      script += `Term ${index + 1}: ${term}. `;
      script += '<break time="500ms"/>\n';
      script += `Definition: ${definition}. `;
      script += '<break time="500ms"/>\n';
      
      if (example) {
        script += `Here's an example: ${example}. `;
        script += '<break time="500ms"/>\n';
      }
      
      if (translation) {
        script += `Translation: ${translation}. `;
      }
      
      script += '<break time="1s"/>\n\n';
    });

    // Conclusion
    script += '<break time="1s"/>\n';
    script += `That concludes your lesson on ${lesson.title}. `;
    script += `You have learned ${vocabulary.length} important term${vocabulary.length !== 1 ? 's' : ''}. `;
    script += `Great work! Feel free to replay this lesson anytime. `;
    script += `Goodbye!\n`;

    return script;
  }

  /**
   * Generate audio using AWS Polly
   * @param {string} text - The text to convert to speech (can include SSML tags)
   * @param {string} voiceId - Polly voice (Joanna, Matthew, Amy, etc.)
   * @param {string} engine - 'neural' (higher quality) or 'standard'
   * @returns {Promise<Buffer>} - Audio data as buffer
   */
  async generateAudio(text, voiceId = 'Joanna', engine = 'neural') {
    try {
      console.log('🔊 Generating audio with AWS Polly...');
      console.log(`   Voice: ${voiceId}`);
      console.log(`   Engine: ${engine}`);
      console.log(`   Text length: ${text.length} characters`);

      // Wrap text in SSML tags if it contains SSML markup
      const textType = text.includes('<break') || text.includes('<prosody') ? 'ssml' : 'text';
      const ssmlText = textType === 'ssml' && !text.startsWith('<speak>')
        ? `<speak>${text}</speak>`
        : text;

      const params = {
        Text: ssmlText,
        OutputFormat: 'mp3',
        VoiceId: voiceId,
        Engine: engine,
        LanguageCode: 'en-US',
        TextType: textType,
        SampleRate: '24000' // High quality audio
      };

      const command = new SynthesizeSpeechCommand(params);
      const response = await this.pollyClient.send(command);

      console.log('✅ Audio generated successfully');

      // Convert audio stream to buffer
      const audioBuffer = await this.streamToBuffer(response.AudioStream);
      
      console.log(`📊 Audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);

      return audioBuffer;
    } catch (error) {
      console.error('❌ Error generating audio:', error);
      throw new Error(`Polly generation failed: ${error.message}`);
    }
  }

  /**
   * Upload audio file to S3
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} userId - User ID for folder organization
   * @param {string} lessonId - Lesson ID for file naming
   * @returns {Promise<{url: string, key: string}>} - S3 URL and key
   */
  async uploadToS3(audioBuffer, userId, lessonId) {
    try {
      const timestamp = Date.now();
      const key = `audio-lessons/${userId}/${lessonId}-${timestamp}.mp3`;
      
      console.log(`📤 Uploading to S3...`);
      console.log(`   Bucket: ${this.s3Bucket}`);
      console.log(`   Key: ${key}`);

      const params = {
        Bucket: this.s3Bucket,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
        ACL: 'public-read', // Make it publicly accessible
        CacheControl: 'max-age=31536000', // Cache for 1 year
        Metadata: {
          userId: userId,
          lessonId: lessonId,
          generatedAt: new Date().toISOString()
        }
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      const url = `https://${this.s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
      console.log('✅ Upload successful');
      console.log(`   URL: ${url}`);

      return { url, key };
    } catch (error) {
      console.error('❌ Error uploading to S3:', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Delete audio file from S3
   * @param {string} key - S3 object key
   */
  async deleteFromS3(key) {
    try {
      console.log(`🗑️ Deleting from S3: ${key}`);

      const params = {
        Bucket: this.s3Bucket,
        Key: key
      };

      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);

      console.log('✅ Deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting from S3:', error);
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
   * Average speaking rate: ~150 words per minute for neural voices
   * @param {string} text - The text to be spoken
   * @returns {number} - Estimated duration in seconds
   */
  estimateDuration(text) {
    // Remove SSML tags for word count
    const cleanText = text.replace(/<[^>]*>/g, '');
    const words = cleanText.trim().split(/\s+/).length;
    const minutes = words / 150;
    const seconds = Math.ceil(minutes * 60);
    
    console.log(`⏱️ Estimated duration: ${seconds} seconds (${words} words)`);
    
    return seconds;
  }

  /**
   * Complete workflow: Generate audio lesson from existing lesson
   * @param {string} lessonId - ID of the lesson in esp_lessons table
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Audio lesson data
   */
  async generateAudioLesson(lessonId, userId) {
    const startTime = Date.now();
    
    try {
      console.log('\n' + '🎵'.repeat(30));
      console.log('🎵 AUDIO LESSON GENERATION STARTED');
      console.log('🎵'.repeat(30));
      console.log(`📚 Lesson ID: ${lessonId}`);
      console.log(`👤 User ID: ${userId}`);

      // Check usage limits before proceeding
      console.log('\n🔍 Checking usage limits...');
      await hybridAudioLessonUsageService.validateLessonCreation(userId);
      console.log('✅ Usage limit check passed');

      // 1. Fetch lesson data from database
      console.log('\n📥 Fetching lesson data...');
      const { data: lesson, error: lessonError } = await supabase
        .from('esp_lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('user_id', userId)
        .single();

      if (lessonError || !lesson) {
        throw new Error(`Lesson not found: ${lessonError?.message || 'Unknown error'}`);
      }

      console.log(`✅ Lesson found: "${lesson.title}"`);

      // 2. Fetch vocabulary
      console.log('\n📖 Fetching vocabulary...');
      const { data: vocabulary, error: vocabError } = await supabase
        .from('lesson_vocabulary')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (vocabError || !vocabulary || vocabulary.length === 0) {
        throw new Error(`No vocabulary found: ${vocabError?.message || 'No vocabulary items'}`);
      }

      console.log(`✅ Found ${vocabulary.length} vocabulary items`);

      // 3. Format script
      console.log('\n📝 Formatting script...');
      const script = this.formatLessonScript(lesson, vocabulary);
      const estimatedDuration = this.estimateDuration(script);
      console.log(`✅ Script formatted (${script.length} characters)`);

      // 4. Generate audio with Polly
      console.log('\n🎙️ Generating audio with AWS Polly...');
      const audioBuffer = await this.generateAudio(script, 'Joanna', 'neural');

      // 5. Upload to S3
      console.log('\n☁️ Uploading to S3...');
      const { url, key } = await this.uploadToS3(audioBuffer, userId, lessonId);

      // 6. Save to audio_lessons table
      console.log('\n💾 Saving to database...');
      const generationTime = Math.floor((Date.now() - startTime) / 1000);

      const { data: audioLesson, error: insertError } = await supabase
        .from('audio_lessons')
        .insert([{
          user_id: userId,
          lesson_id: lessonId,
          title: lesson.title,
          subject: lesson.subject,
          source_pdf_name: lesson.source_pdf_name,
          audio_url: url,
          audio_s3_key: key,
          audio_duration: estimatedDuration,
          audio_size_bytes: audioBuffer.length,
          voice_id: 'Joanna',
          language_code: 'en-US',
          polly_engine: 'neural',
          original_script: script,
          vocabulary_count: vocabulary.length,
          status: 'completed',
          generation_time_seconds: generationTime
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log('✅ Audio lesson saved to database');

      console.log('\n' + '✅'.repeat(30));
      console.log('✅ AUDIO LESSON GENERATION COMPLETED');
      console.log('✅'.repeat(30));
      console.log(`⏱️ Total time: ${generationTime} seconds`);
      console.log(`🎵 Audio ID: ${audioLesson.id}`);
      console.log(`🔗 URL: ${url}`);
      console.log('✅'.repeat(30) + '\n');

      return audioLesson;

    } catch (error) {
      const errorTime = Math.floor((Date.now() - startTime) / 1000);
      
      console.error('\n' + '❌'.repeat(30));
      console.error('❌ AUDIO LESSON GENERATION FAILED');
      console.error('❌'.repeat(30));
      console.error(`⏱️ Failed after: ${errorTime} seconds`);
      console.error(`❌ Error: ${error.message}`);
      console.error('❌'.repeat(30) + '\n');

      // Try to save error to database
      try {
        await supabase
          .from('audio_lessons')
          .insert([{
            user_id: userId,
            lesson_id: lessonId,
            title: 'Failed Generation',
            status: 'failed',
            error_message: error.message,
            generation_time_seconds: errorTime
          }]);
      } catch (dbError) {
        console.error('Failed to save error to database:', dbError);
      }

      throw error;
    }
  }

  /**
   * Delete audio lesson (with usage tracking)
   * @param {string} audioLessonId - ID of audio lesson
   * @param {string} userId - User ID (for security)
   */
  async deleteAudioLesson(audioLessonId, userId) {
    try {
      console.log(`🗑️ Deleting audio lesson: ${audioLessonId}`);

      // 1. Get audio lesson details
      const { data: audioLesson, error: fetchError } = await supabase
        .from('audio_lessons')
        .select('audio_s3_key, created_at')
        .eq('id', audioLessonId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !audioLesson) {
        throw new Error('Audio lesson not found');
      }

      // 2. Check if lesson was created this month (prevent deletion abuse)
      const lessonDate = new Date(audioLesson.created_at);
      const currentDate = new Date();
      const isCurrentMonth = lessonDate.getFullYear() === currentDate.getFullYear() && 
                            lessonDate.getMonth() === currentDate.getMonth();

      if (isCurrentMonth) {
        console.log('⚠️ Lesson was created this month - deletion will be tracked');
      } else {
        console.log('ℹ️ Lesson was created in a previous month - deletion will not affect current usage');
      }

      // 3. Delete from S3
      if (audioLesson.audio_s3_key) {
        await this.deleteFromS3(audioLesson.audio_s3_key);
      }

      // 4. Delete from database (triggers will handle usage tracking)
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
module.exports = new PollyService();

