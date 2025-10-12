/**
 * Profile Controller
 * Consolidated endpoint for client profile data
 * 
 * Features:
 * - Single endpoint instead of multiple calls
 * - Redis caching for expensive queries
 * - Manifest caching with invalidation
 * 
 * Issue #12: Request batching / consolidated profile endpoint
 */

const { supabase } = require('./supabaseClient');
const { redis } = require('./queueClient');

/**
 * Get user profile data (consolidated)
 * Returns: user info, lessons, flashcards, progress, manifest
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Consolidated profile data
 */
async function getUserProfile(userId) {
  console.log(`📋 Fetching profile for user: ${userId}`);
  
  try {
    // Check cache first
    const cacheKey = `profile:${userId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Profile cache hit for user ${userId}`);
      return {
        ...JSON.parse(cached),
        fromCache: true,
        cachedAt: new Date(JSON.parse(cached).timestamp),
      };
    }
    
    console.log(`📥 Profile cache miss - fetching from database`);
    
    // Fetch all data in parallel
    const [
      userResult,
      lessonsResult,
      progressResult,
    ] = await Promise.all([
      // User basic info
      supabase
        .from('users')
        .select('id, email, created_at, native_language, input_tokens, output_tokens')
        .eq('id', userId)
        .single(),
      
      // User lessons
      supabase
        .from('esp_lessons')
        .select('id, title, subject, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // User progress
      supabase
        .from('general_lesson_progress')
        .select('lesson_id, unit_id, completed_exercises, total_exercises, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(50),
    ]);
    
    // Check for errors
    if (userResult.error) throw new Error(`User fetch failed: ${userResult.error.message}`);
    if (lessonsResult.error) throw new Error(`Lessons fetch failed: ${lessonsResult.error.message}`);
    if (progressResult.error) console.warn(`Progress fetch failed: ${progressResult.error.message}`);
    
    // Get manifest URL (cached separately with longer TTL)
    const manifestUrl = await getManifestUrl(userId);
    
    // Build consolidated response
    const profile = {
      user: userResult.data,
      lessons: lessonsResult.data || [],
      progress: progressResult.data || [],
      manifestUrl: manifestUrl,
      stats: {
        totalLessons: lessonsResult.data?.length || 0,
        completedUnits: progressResult.data?.filter(p => p.total_exercises === p.completed_exercises).length || 0,
        tokensUsed: (userResult.data?.input_tokens || 0) + (userResult.data?.output_tokens || 0),
      },
      timestamp: Date.now(),
      fromCache: false,
    };
    
    // Cache profile for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(profile));
    console.log(`💾 Profile cached for user ${userId} (TTL: 5min)`);
    
    return profile;
    
  } catch (error) {
    console.error(`❌ Failed to fetch profile for ${userId}:`, error);
    throw error;
  }
}

/**
 * Get manifest URL with caching
 * Manifest changes infrequently, so cache for 1 hour
 * 
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Manifest URL or null
 */
async function getManifestUrl(userId) {
  const cacheKey = `manifest:${userId}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`✅ Manifest cache hit for user ${userId}`);
    return cached;
  }
  
  // Fetch from database or storage
  // This is a placeholder - adjust based on your actual manifest storage
  const manifestUrl = `https://storage.example.com/manifests/${userId}/manifest.json`;
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, manifestUrl);
  console.log(`💾 Manifest URL cached for user ${userId} (TTL: 1h)`);
  
  return manifestUrl;
}

/**
 * Invalidate profile cache
 * Call this when user data changes
 * 
 * @param {string} userId - User ID
 */
async function invalidateProfileCache(userId) {
  const cacheKey = `profile:${userId}`;
  await redis.del(cacheKey);
  console.log(`🗑️ Profile cache invalidated for user ${userId}`);
}

/**
 * Invalidate manifest cache
 * Call this when manifest is updated
 * 
 * @param {string} userId - User ID
 */
async function invalidateManifestCache(userId) {
  const cacheKey = `manifest:${userId}`;
  await redis.del(cacheKey);
  console.log(`🗑️ Manifest cache invalidated for user ${userId}`);
}

/**
 * Invalidate all caches for a user
 * 
 * @param {string} userId - User ID
 */
async function invalidateAllCaches(userId) {
  await Promise.all([
    invalidateProfileCache(userId),
    invalidateManifestCache(userId),
  ]);
  console.log(`🗑️ All caches invalidated for user ${userId}`);
}

module.exports = {
  getUserProfile,
  getManifestUrl,
  invalidateProfileCache,
  invalidateManifestCache,
  invalidateAllCaches,
};

