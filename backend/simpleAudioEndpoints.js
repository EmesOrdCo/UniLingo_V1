/**
 * Simple Audio Lesson API Endpoints
 * Standalone system: PDF → Text → Audio
 */

const SimplePollyService = require('./simplePollyService');
const { supabase } = require('./supabaseClient');
const { OpenAI } = require('openai');

/**
 * Setup simple audio routes
 */
function setupSimpleAudioRoutes(app, limiters) {
  const { aiLimiter, generalLimiter } = limiters;

  // ============================================
  // POST /api/audio/create
  // Create audio lesson from text
  // ============================================
  app.post('/api/audio/create', aiLimiter, async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { title, scriptText, userId } = req.body;
      
      // Validation
      if (!title || !scriptText || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields: title, scriptText, userId' 
        });
      }

      if (scriptText.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Script text too short (minimum 10 characters)'
        });
      }

      if (scriptText.length > 100000) {
        return res.status(400).json({
          success: false,
          error: 'Script text too long (maximum 100,000 characters)'
        });
      }

      console.log('\n' + '🎵'.repeat(40));
      console.log('🎵 AUDIO CREATION REQUEST');
      console.log('🎵'.repeat(40));
      console.log(`📝 Title: ${title}`);
      console.log(`👤 User ID: ${userId}`);
      console.log(`📄 Script length: ${scriptText.length} characters`);
      console.log(`🌐 IP: ${req.ip}`);
      console.log('🎵'.repeat(40) + '\n');

      // Create audio lesson
      const audioLesson = await SimplePollyService.createAudioLesson(title, scriptText, userId);
      
      const duration = Math.floor((Date.now() - startTime) / 1000);

      console.log('\n' + '✅'.repeat(40));
      console.log('✅ AUDIO CREATION SUCCESS');
      console.log('✅'.repeat(40));
      console.log(`⏱️ Duration: ${duration} seconds`);
      console.log(`🎵 Audio ID: ${audioLesson.id}`);
      console.log(`🔗 URL: ${audioLesson.audio_url}`);
      console.log('✅'.repeat(40) + '\n');

      res.json({
        success: true,
        audioLesson,
        generationTime: duration
      });

    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      console.error('\n' + '❌'.repeat(40));
      console.error('❌ AUDIO CREATION ERROR');
      console.error('❌'.repeat(40));
      console.error(`⏱️ Failed after: ${duration} seconds`);
      console.error(`Error: ${error.message}`);
      console.error('❌'.repeat(40) + '\n');
      
      res.status(500).json({
        success: false,
        error: 'Failed to create audio lesson',
        details: error.message,
        generationTime: duration
      });
    }
  });

  // ============================================
  // GET /api/audio/lessons/:userId
  // Get all audio lessons for a user
  // ============================================
  app.get('/api/audio/lessons/:userId', generalLimiter, async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.query; // Optional filter: not_started, in_progress, completed
      
      if (!userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing userId parameter' 
        });
      }

      console.log(`📥 Fetching audio lessons for user: ${userId}`);
      if (status) {
        console.log(`   Filtering by status: ${status}`);
      }

      let query = supabase
        .from('audio_lessons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (status && ['not_started', 'in_progress', 'completed'].includes(status)) {
        query = query.eq('status', status);
      }

      const { data: audioLessons, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ Found ${audioLessons?.length || 0} audio lessons`);

      res.json({
        success: true,
        audioLessons: audioLessons || [],
        count: audioLessons?.length || 0
      });

    } catch (error) {
      console.error('❌ Error fetching audio lessons:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audio lessons',
        details: error.message
      });
    }
  });

  // ============================================
  // GET /api/audio/lesson/:audioLessonId
  // Get a specific audio lesson
  // ============================================
  app.get('/api/audio/lesson/:audioLessonId', generalLimiter, async (req, res) => {
    try {
      const { audioLessonId } = req.params;
      const { userId } = req.query;
      
      if (!audioLessonId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing audioLessonId parameter' 
        });
      }

      console.log(`📥 Fetching audio lesson: ${audioLessonId}`);

      const query = supabase
        .from('audio_lessons')
        .select('*')
        .eq('id', audioLessonId);

      if (userId) {
        query.eq('user_id', userId);
      }

      const { data: audioLesson, error } = await query.single();

      if (error || !audioLesson) {
        return res.status(404).json({
          success: false,
          error: 'Audio lesson not found'
        });
      }

      console.log(`✅ Audio lesson found: "${audioLesson.title}"`);

      res.json({
        success: true,
        audioLesson
      });

    } catch (error) {
      console.error('❌ Error fetching audio lesson:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audio lesson',
        details: error.message
      });
    }
  });

  // ============================================
  // PUT /api/audio/lesson/:audioLessonId/play
  // Track audio playback and update status
  // ============================================
  app.put('/api/audio/lesson/:audioLessonId/play', generalLimiter, async (req, res) => {
    try {
      const { audioLessonId } = req.params;
      const { userId } = req.body;
      
      if (!audioLessonId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required parameters' 
        });
      }

      console.log(`▶️ Tracking playback for: ${audioLessonId}`);

      // Update last played time (trigger will auto-update status and play_count)
      const { data, error } = await supabase
        .from('audio_lessons')
        .update({
          last_played_at: new Date().toISOString()
        })
        .eq('id', audioLessonId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ Playback tracked - Status: ${data.status}, Play count: ${data.play_count}`);

      res.json({
        success: true,
        audioLesson: data,
        message: 'Playback tracked successfully'
      });

    } catch (error) {
      console.error('❌ Error tracking playback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track playback',
        details: error.message
      });
    }
  });

  // ============================================
  // PUT /api/audio/lesson/:audioLessonId/complete
  // Mark audio lesson as completed
  // ============================================
  app.put('/api/audio/lesson/:audioLessonId/complete', generalLimiter, async (req, res) => {
    try {
      const { audioLessonId } = req.params;
      const { userId } = req.body;
      
      if (!audioLessonId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required parameters' 
        });
      }

      console.log(`✅ Marking audio lesson as completed: ${audioLessonId}`);

      const { data, error } = await supabase
        .from('audio_lessons')
        .update({
          status: 'completed'
        })
        .eq('id', audioLessonId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ Audio lesson marked as completed`);

      res.json({
        success: true,
        audioLesson: data,
        message: 'Audio lesson marked as completed'
      });

    } catch (error) {
      console.error('❌ Error marking as completed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark as completed',
        details: error.message
      });
    }
  });

  // ============================================
  // DELETE /api/audio/lesson/:audioLessonId
  // Delete an audio lesson
  // ============================================
  app.delete('/api/audio/lesson/:audioLessonId', generalLimiter, async (req, res) => {
    try {
      const { audioLessonId } = req.params;
      const { userId } = req.body;
      
      if (!audioLessonId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required parameters: audioLessonId, userId' 
        });
      }

      console.log(`🗑️ Deleting audio lesson: ${audioLessonId}`);

      await SimplePollyService.deleteAudioLesson(audioLessonId, userId);

      console.log('✅ Audio lesson deleted successfully');

      res.json({
        success: true,
        message: 'Audio lesson deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting audio lesson:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete audio lesson',
        details: error.message
      });
    }
  });

  // ============================================
  // GET /api/audio/stats/:userId
  // Get audio lesson statistics for a user
  // ============================================
  app.get('/api/audio/stats/:userId', generalLimiter, async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing userId parameter' 
        });
      }

      console.log(`📊 Fetching audio stats for user: ${userId}`);

      // Use the helper function from SQL
      const { data, error } = await supabase
        .rpc('get_audio_lesson_stats', { p_user_id: userId });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Stats fetched:', data);

      res.json({
        success: true,
        stats: data
      });

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audio stats',
        details: error.message
      });
    }
  });

  // ============================================
  // POST /api/audio/create-from-pdf
  // Create audio lesson from PDF text (full pipeline)
  // ============================================
  app.post('/api/audio/create-from-pdf', aiLimiter, async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { pdfText, fileName, nativeLanguage, targetLanguage, userId } = req.body;
      
      // Validation
      if (!pdfText || !fileName || !nativeLanguage || !targetLanguage || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields: pdfText, fileName, nativeLanguage, targetLanguage, userId' 
        });
      }

      if (pdfText.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'PDF text too short (minimum 10 characters)'
        });
      }

      if (pdfText.length > 100000) {
        return res.status(400).json({
          success: false,
          error: 'PDF text too long (maximum 100,000 characters)'
        });
      }

      console.log('\n' + '🎵'.repeat(40));
      console.log('🎵 PDF → AUDIO PIPELINE STARTED');
      console.log('🎵'.repeat(40));
      console.log(`📄 File: ${fileName}`);
      console.log(`👤 User ID: ${userId}`);
      console.log(`🌍 Native Language: ${nativeLanguage}`);
      console.log(`🎯 Target Language: ${targetLanguage}`);
      console.log(`📄 PDF Text length: ${pdfText.length} characters`);
      console.log(`🌐 IP: ${req.ip}`);
      console.log('🎵'.repeat(40) + '\n');

      // Step 1: Extract keywords from PDF text
      console.log('\n🔍 Step 1: Extracting keywords from PDF...');
      const AIService = require('./aiService');
      const keywords = await AIService.extractKeywordsFromContent(pdfText, 'General', userId);
      console.log(`✅ Extracted ${keywords.length} keywords`);

      // Step 2: Generate audio script based on keywords, native language, and target language
      console.log('\n📝 Step 2: Generating comprehensive audio script...');
      const audioScript = await generateAudioScript(keywords, nativeLanguage, targetLanguage, fileName);
      console.log(`✅ Generated script: ${audioScript.length} characters`);

      // Step 3: Create audio lesson with the generated script
      console.log('\n🎙️ Step 3: Creating audio lesson...');
      const audioLesson = await SimplePollyService.createAudioLesson(
        `Audio Lesson: ${fileName.replace('.pdf', '')}`,
        audioScript,
        userId
      );
      
      const duration = Math.floor((Date.now() - startTime) / 1000);

      console.log('\n' + '✅'.repeat(40));
      console.log('✅ PDF → AUDIO PIPELINE COMPLETED');
      console.log('✅'.repeat(40));
      console.log(`⏱️ Total Duration: ${duration} seconds`);
      console.log(`🔍 Keywords Extracted: ${keywords.length}`);
      console.log(`📝 Script Generated: ${audioScript.length} chars`);
      console.log(`🎵 Audio Lesson ID: ${audioLesson.id}`);
      console.log(`🔗 Audio URL: ${audioLesson.audio_url}`);
      console.log('✅'.repeat(40) + '\n');

      res.json({
        success: true,
        audioLesson,
        keywords,
        scriptLength: audioScript.length,
        generationTime: duration
      });

    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      console.error('\n' + '❌'.repeat(40));
      console.error('❌ PDF → AUDIO PIPELINE FAILED');
      console.error('❌'.repeat(40));
      console.error(`⏱️ Failed after: ${duration} seconds`);
      console.error(`Error: ${error.message}`);
      console.error('❌'.repeat(40) + '\n');
      
      res.status(500).json({
        success: false,
        error: 'Failed to create audio lesson from PDF',
        details: error.message,
        generationTime: duration
      });
    }
  });

  console.log('✅ Simple audio endpoints registered');
}

/**
 * Generate audio script based on keywords, native language, and target language
 */
async function generateAudioScript(keywords, nativeLanguage, targetLanguage, fileName) {
  const AIService = require('./aiService');
  
  const prompt = `Create an engaging and comprehensive audio lesson script based on the extracted keywords from "${fileName}".

User's Native Language: ${nativeLanguage}
Target Language: ${targetLanguage}

Keywords to include: ${keywords.join(', ')}

REQUIREMENTS:
1. Script length should be PROPORTIONAL to the number of keywords (${keywords.length} keywords found)
2. Write explanations, definitions, and context in ${nativeLanguage}
3. Include ${targetLanguage} terms, definitions, and example sentences naturally in the script
4. For EACH keyword, provide:
   - Clear pronunciation in ${targetLanguage}
   - Definition/explanation in ${nativeLanguage}
   - Practical example sentence in ${targetLanguage}
   - Brief translation of the example in ${nativeLanguage}
5. Structure should flow naturally - not rigid format, but engaging and educational
6. Include pronunciation tips for ${targetLanguage} terms
7. Create smooth transitions between concepts
8. End with a comprehensive summary of all key points

CONTENT GUIDELINES:
- Make it sound conversational and engaging
- Vary sentence structure to avoid repetition
- Include practical, real-world examples
- Ensure all ${keywords.length} keywords are thoroughly covered
- Aim for comprehensive learning experience

FORMAT: Return ONLY the script text, no explanations or formatting.`;

  const messages = [
    {
      role: 'system',
      content: `You are an expert language learning content creator specializing in creating comprehensive audio lesson scripts. Your scripts blend native language explanations with target language examples in a natural, engaging flow. You create content that is proportional to the number of keywords provided - more keywords means longer, more detailed lessons. Return ONLY the script text with no explanations, markdown, or additional formatting.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    console.log(`🤖 Generating AI script for ${keywords.length} keywords...`);
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });

    // Calculate appropriate token limit based on keywords
    const maxTokens = Math.min(4000, 500 + (keywords.length * 50));
    
    console.log(`📊 Request details: ${keywords.length} keywords, max tokens: ${maxTokens}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const script = response.choices[0].message.content.trim();
    
    if (!script) {
      throw new Error('No script generated from OpenAI');
    }

    console.log(`✅ Generated script: ${script.length} characters`);
    return script;
  } catch (error) {
    console.error('❌ Error generating audio script:', error);
    console.error('❌ Error details:', error.message);
    
    // Enhanced fallback script that includes more keywords
    const fallbackKeywords = keywords.slice(0, Math.min(10, keywords.length));
    console.log(`⚠️ Using fallback script with ${fallbackKeywords.length} keywords`);
    
    // Create a basic fallback script - use English for now as fallback
    // TODO: Make this dynamic based on native language
    const fallbackScript = `Welcome to your comprehensive audio lesson based on ${fileName}. This lesson covers ${keywords.length} important ${targetLanguage} terms and concepts. Let's begin with our key vocabulary: ${fallbackKeywords.join(', ')}. Each term will be clearly pronounced, defined, and used in practical examples. Pay attention to pronunciation and practice along with me. These terms are essential for understanding this subject matter thoroughly.`;
    
    return fallbackScript;
  }
}

module.exports = setupSimpleAudioRoutes;

