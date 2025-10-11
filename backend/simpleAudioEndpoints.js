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
      console.log(`🔍 SCRIPT GENERATION PARAMETERS:`);
      console.log(`   Native Language: "${nativeLanguage}"`);
      console.log(`   Target Language: "${targetLanguage}"`);
      console.log(`   Keywords count: ${keywords.length}`);
      
      let audioScript;
      try {
        audioScript = await generateAudioScript(keywords, nativeLanguage, targetLanguage, fileName);
        console.log(`✅ Generated script: ${audioScript.length} characters`);
      } catch (scriptError) {
        console.error('❌ Script generation failed:', scriptError);
        throw new Error(`Script generation failed: ${scriptError.message}`);
      }

      // Step 3: Create audio lesson with the generated script
      console.log('\n🎙️ Step 3: Creating audio lesson...');
      let audioLesson;
      try {
        audioLesson = await SimplePollyService.createAudioLesson(
          `Audio Lesson: ${fileName.replace('.pdf', '')}`,
          audioScript,
          userId
        );
        console.log(`✅ Audio lesson created: ${audioLesson.id}`);
      } catch (pollyError) {
        console.error('❌ Audio lesson creation failed:', pollyError);
        throw new Error(`Audio lesson creation failed: ${pollyError.message}`);
      }
      
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
  
  const prompt = `CONTEXT & PURPOSE:
You are creating a comprehensive audio lesson script for a language learning application. This script will be converted to speech using AWS Polly text-to-speech and played back to a user who is learning a new language.

USER INFORMATION:
- User's Native Language (for explanations): ${nativeLanguage}
- Target Language (being learned): ${targetLanguage}
- Source Document: ${fileName}
- Course/Subject: General (extracted from PDF content)

SCRIPT PURPOSE:
Create an educational audio lesson that teaches the user important terminology and concepts from their uploaded PDF document. The lesson should be comprehensive, engaging, and help the user understand and remember key terms in their target language.

CONTENT SOURCE:
Keywords extracted from the PDF: ${keywords.join(', ')}

CRITICAL LANGUAGE RULES (MANDATORY - NO EXCEPTIONS):
1. ALL explanations, definitions, context, instructions, transitions, and summaries MUST be in ${nativeLanguage}
2. ONLY keywords, terms, and example sentences should be in ${targetLanguage}
3. When providing translations of examples, use ${nativeLanguage}
4. The script introduction, conclusion, and all connecting text MUST be in ${nativeLanguage}
5. If your native language is NOT English, do NOT write explanations in English

LANGUAGE VALIDATION CHECK:
- If native language is Spanish: Write explanations in Spanish
- If native language is French: Write explanations in French  
- If native language is German: Write explanations in German
- If native language is Chinese: Write explanations in Chinese
- If native language is ANY language other than English: Write explanations in that language

AUDIO SYSTEM CONTEXT:
- This script will be read aloud by AWS Polly text-to-speech
- Everything you write will be spoken exactly as written
- Do NOT include pronunciation guides, phonetic breakdowns, or pronunciation instructions
- Simply write the ${targetLanguage} terms clearly and naturally

SCRIPT STRUCTURE REQUIREMENTS:
1. Introduction in ${nativeLanguage} explaining what the lesson covers
2. For EACH of the ${keywords.length} keywords, provide:
   - Clear statement of the ${targetLanguage} term
   - Definition/explanation in ${nativeLanguage}
   - Practical example sentence in ${targetLanguage}
   - Brief translation of the example in ${nativeLanguage}
3. Smooth transitions between concepts in ${nativeLanguage}
4. Comprehensive conclusion/summary in ${nativeLanguage}

CONTENT GUIDELINES:
- Make it conversational and engaging in ${nativeLanguage}
- Vary sentence structure to avoid repetition
- Include practical, real-world examples
- Ensure ALL ${keywords.length} keywords are thoroughly covered
- Script length should be proportional to the number of keywords
- Create a natural learning flow that builds understanding progressively

FORMAT: Return ONLY the script text, no explanations, markdown, or additional formatting.`;

  const messages = [
    {
      role: 'system',
      content: `You are an expert language learning content creator and educational script writer specializing in creating comprehensive audio lesson scripts for language learning applications. 

Your expertise includes:
- Creating engaging, educational content that helps users learn new languages
- Understanding the psychology of language acquisition and retention
- Writing scripts that work perfectly with text-to-speech systems
- Balancing comprehensive coverage with engaging, conversational delivery

CRITICAL WORKFLOW:
1. You receive user information (native language, target language, course subject)
2. You receive keywords extracted from their uploaded PDF document
3. You create a comprehensive audio lesson script that teaches these keywords
4. The script will be converted to speech using AWS Polly and played back to the user

LANGUAGE USAGE RULES (NON-NEGOTIABLE - CRITICAL):
- User's native language: Use ONLY for explanations, definitions, context, instructions, transitions, and summaries
- Target language: Use ONLY for keywords, terms, and example sentences
- Translations: Always provide in the user's native language
- INTRODUCTION: Must be in user's native language (NOT English unless native language is English)
- CONCLUSION: Must be in user's native language (NOT English unless native language is English)
- ALL CONNECTING TEXT: Must be in user's native language (NOT English unless native language is English)

CRITICAL WARNING: If the user's native language is NOT English, you MUST write all explanations in their native language. Do NOT default to English.

AUDIO SYSTEM REQUIREMENTS:
- Everything you write will be spoken exactly as written by AWS Polly
- NEVER include pronunciation guides, phonetic breakdowns, or pronunciation instructions
- Write target language terms clearly and naturally - the TTS will handle pronunciation
- Ensure smooth, natural speech flow that sounds conversational when spoken aloud

CONTENT CREATION PRINCIPLES:
- Create content proportional to the number of keywords (more keywords = longer, more detailed lessons)
- Ensure comprehensive coverage of ALL provided keywords
- Build understanding progressively through logical flow
- Use practical, real-world examples that enhance learning
- Make content engaging and memorable

OUTPUT FORMAT: Return ONLY the script text with no explanations, markdown, or additional formatting.`
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

    // VALIDATION CHECK: Ensure script is in native language, not target language
    console.log(`🔍 VALIDATING SCRIPT LANGUAGE USAGE...`);
    console.log(`   Native language: "${nativeLanguage}"`);
    console.log(`   Target language: "${targetLanguage}"`);
    
    // CRITICAL VALIDATION: Check if script is written in the wrong language
    if (nativeLanguage !== 'English' && nativeLanguage !== 'english' && nativeLanguage !== 'ENGLISH') {
      console.log(`🚨 VALIDATION CHECK: Native language is "${nativeLanguage}" - script MUST be in this language`);
      
      // Sample first 300 characters to check language
      const scriptSample = script.substring(0, 300).toLowerCase();
      console.log(`📝 Script sample for validation: "${scriptSample.substring(0, 100)}..."`);
      
      // Common English words that shouldn't appear in non-English explanations
      const englishIndicators = [
        'welcome to', 'today\'s lesson', 'in this lesson', 'in this session', 
        'we will explore', 'let\'s dive into', 'first we have', 'next is', 
        'now let\'s talk', 'moving on to', 'now let\'s discuss', 'let\'s begin',
        'for example', 'an example', 'this can be translated', 'in conclusion'
      ];
      
      const hasEnglishExplanations = englishIndicators.some(phrase => scriptSample.includes(phrase));
      
      if (hasEnglishExplanations) {
        console.error(`❌ VALIDATION FAILED: Script is in English instead of ${nativeLanguage}`);
        console.error(`   Script starts with: "${script.substring(0, 150)}..."`);
        console.error(`   This is WRONG - explanations should be in ${nativeLanguage}`);
        throw new Error(`CRITICAL VALIDATION FAILED: Script is in English but user's native language is ${nativeLanguage}. The AI must write explanations in ${nativeLanguage}, not English.`);
      }
      
      console.log(`✅ Language validation passed: Script appears to be in ${nativeLanguage}`);
    } else {
      console.log(`ℹ️ Native language is English - no validation needed`);
    }

    console.log(`🔍 FINAL VALIDATION: About to validate script language...`);
    console.log(`✅ Generated script: ${script.length} characters`);
    return script;
  } catch (error) {
    console.error('❌ ERROR GENERATING AUDIO SCRIPT:');
    console.error('   Error type:', error.constructor.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    console.error('   Native language:', nativeLanguage);
    console.error('   Target language:', targetLanguage);
    console.error('   Keywords count:', keywords.length);
    
    // Enhanced fallback script that includes more keywords
    const fallbackKeywords = keywords.slice(0, Math.min(10, keywords.length));
    console.log(`⚠️ Using fallback script with ${fallbackKeywords.length} keywords`);
    
    // Create a basic fallback script in the user's native language
    let fallbackScript;
    if (nativeLanguage.toLowerCase().includes('chinese')) {
      fallbackScript = `欢迎来到基于${fileName}的综合音频课程。本课程涵盖${keywords.length}个重要的${targetLanguage}术语和概念。让我们从关键词汇开始：${fallbackKeywords.join('、')}。每个术语都将被清晰地发音、定义，并在实际例子中使用。请注意发音并与我一起练习。这些术语对于深入理解这个主题至关重要。`;
    } else {
      // Default to English if we can't determine the language
      fallbackScript = `Welcome to your comprehensive audio lesson based on ${fileName}. This lesson covers ${keywords.length} important ${targetLanguage} terms and concepts. Let's begin with our key vocabulary: ${fallbackKeywords.join(', ')}. Each term will be clearly pronounced, defined, and used in practical examples. Pay attention to pronunciation and practice along with me. These terms are essential for understanding this subject matter thoroughly.`;
    }
    
    console.log(`⚠️ Fallback script language: ${nativeLanguage.toLowerCase().includes('chinese') ? 'Chinese' : 'English'}`);
    return fallbackScript;
  }
}

module.exports = setupSimpleAudioRoutes;

