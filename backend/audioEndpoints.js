/**
 * Audio Lesson API Endpoints
 * These endpoints handle audio lesson generation, retrieval, and management
 */

const PollyService = require('./pollyService');
const { supabase } = require('./supabaseClient');

/**
 * Setup audio-related routes
 * @param {Express} app - Express app instance
 * @param {Object} limiters - Rate limiters object
 */
function setupAudioRoutes(app, limiters) {
  const { aiLimiter, generalLimiter } = limiters;

  // ============================================
  // POST /api/audio/generate-lesson
  // Generate audio for an existing lesson
  // ============================================
  app.post('/api/audio/generate-lesson', aiLimiter, async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { lessonId, userId } = req.body;
      
      // Validation
      if (!lessonId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields: lessonId, userId' 
        });
      }

      console.log('\n' + '🎵'.repeat(40));
      console.log('🎵 AUDIO GENERATION REQUEST');
      console.log('🎵'.repeat(40));
      console.log(`📚 Lesson ID: ${lessonId}`);
      console.log(`👤 User ID: ${userId}`);
      console.log(`🌐 IP: ${req.ip}`);
      console.log('🎵'.repeat(40) + '\n');

      // Check if audio already exists for this lesson
      const { data: existing } = await supabase
        .from('audio_lessons')
        .select('id, audio_url, status')
        .eq('lesson_id', lessonId)
        .eq('user_id', userId)
        .single();

      if (existing && existing.status === 'completed') {
        console.log('⚠️ Audio already exists for this lesson');
        return res.json({
          success: true,
          audioLesson: existing,
          message: 'Audio already exists for this lesson'
        });
      }

      // Generate audio
      const audioLesson = await PollyService.generateAudioLesson(lessonId, userId);
      
      const duration = Math.floor((Date.now() - startTime) / 1000);

      console.log('\n' + '✅'.repeat(40));
      console.log('✅ AUDIO GENERATION SUCCESS');
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
      console.error('❌ AUDIO GENERATION ERROR');
      console.error('❌'.repeat(40));
      console.error(`⏱️ Failed after: ${duration} seconds`);
      console.error(`Error: ${error.message}`);
      console.error('❌'.repeat(40) + '\n');
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate audio lesson',
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
      
      if (!userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing userId parameter' 
        });
      }

      console.log(`📥 Fetching audio lessons for user: ${userId}`);

      const { data: audioLessons, error } = await supabase
        .from('audio_lessons')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

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

      await PollyService.deleteAudioLesson(audioLessonId, userId);

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
  // PUT /api/audio/lesson/:audioLessonId/play
  // Track audio lesson playback
  // ============================================
  app.put('/api/audio/lesson/:audioLessonId/play', generalLimiter, async (req, res) => {
    try {
      const { audioLessonId } = req.params;
      const { userId, listenTime } = req.body;
      
      if (!audioLessonId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required parameters' 
        });
      }

      console.log(`▶️ Tracking playback for: ${audioLessonId}`);

      // Update last played time and listen time
      const updates = {
        last_played_at: new Date().toISOString()
      };

      if (listenTime) {
        // Increment total listen time
        const { data: current } = await supabase
          .from('audio_lessons')
          .select('total_listen_time_seconds')
          .eq('id', audioLessonId)
          .eq('user_id', userId)
          .single();

        if (current) {
          updates.total_listen_time_seconds = 
            (current.total_listen_time_seconds || 0) + Math.floor(listenTime);
        }
      }

      const { error } = await supabase
        .from('audio_lessons')
        .update(updates)
        .eq('id', audioLessonId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Playback tracked');

      res.json({
        success: true,
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

      const { data: lessons, error } = await supabase
        .from('audio_lessons')
        .select('audio_duration, play_count, total_listen_time_seconds, status')
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      const stats = {
        totalLessons: lessons?.length || 0,
        completedLessons: lessons?.filter(l => l.status === 'completed').length || 0,
        totalDuration: lessons?.reduce((sum, l) => sum + (l.audio_duration || 0), 0) || 0,
        totalPlays: lessons?.reduce((sum, l) => sum + (l.play_count || 0), 0) || 0,
        totalListenTime: lessons?.reduce((sum, l) => sum + (l.total_listen_time_seconds || 0), 0) || 0
      };

      console.log('✅ Stats calculated:', stats);

      res.json({
        success: true,
        stats
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

  console.log('✅ Audio endpoints registered');
}

module.exports = setupAudioRoutes;

