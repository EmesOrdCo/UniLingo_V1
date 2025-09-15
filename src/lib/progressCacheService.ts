import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressInsights } from './holisticProgressService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ProgressCacheService {
  private static readonly CACHE_PREFIX = 'progress_cache_';
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private static readonly STREAK_TTL = 2 * 60 * 1000; // 2 minutes for streaks (more dynamic)
  private static readonly ACTIVITIES_TTL = 1 * 60 * 1000; // 1 minute for activities (most dynamic)

  // Cache keys
  private static readonly KEYS = {
    PROGRESS_INSIGHTS: 'progress_insights',
    STUDY_DATES: 'study_dates',
    RECENT_ACTIVITIES: 'recent_activities',
    TODAY_GOALS: 'today_goals',
  };

  /**
   * Get cached data if it exists and hasn't expired
   */
  private static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheEntry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache has expired
      if (now > cacheEntry.expiresAt) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheEntry.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Store data in cache with TTL
   */
  private static async setCachedData<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      const now = Date.now();
      
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  /**
   * Get cached progress insights
   */
  static async getProgressInsights(userId: string): Promise<ProgressInsights | null> {
    return this.getCachedData<ProgressInsights>(`${this.KEYS.PROGRESS_INSIGHTS}_${userId}`);
  }

  /**
   * Cache progress insights
   */
  static async setProgressInsights(userId: string, data: ProgressInsights): Promise<void> {
    await this.setCachedData(`${this.KEYS.PROGRESS_INSIGHTS}_${userId}`, data, this.DEFAULT_TTL);
  }

  /**
   * Get cached study dates
   */
  static async getStudyDates(userId: string): Promise<string[] | null> {
    return this.getCachedData<string[]>(`${this.KEYS.STUDY_DATES}_${userId}`);
  }

  /**
   * Cache study dates
   */
  static async setStudyDates(userId: string, data: string[]): Promise<void> {
    await this.setCachedData(`${this.KEYS.STUDY_DATES}_${userId}`, data, this.DEFAULT_TTL);
  }


  /**
   * Get cached recent activities
   */
  static async getRecentActivities(userId: string): Promise<any[] | null> {
    return this.getCachedData<any[]>(`${this.KEYS.RECENT_ACTIVITIES}_${userId}`);
  }

  /**
   * Cache recent activities
   */
  static async setRecentActivities(userId: string, data: any[]): Promise<void> {
    await this.setCachedData(`${this.KEYS.RECENT_ACTIVITIES}_${userId}`, data, this.ACTIVITIES_TTL);
  }

  /**
   * Get cached today's goals
   */
  static async getTodayGoals(userId: string): Promise<any[] | null> {
    return this.getCachedData<any[]>(`${this.KEYS.TODAY_GOALS}_${userId}`);
  }

  /**
   * Cache today's goals
   */
  static async setTodayGoals(userId: string, data: any[]): Promise<void> {
    await this.setCachedData(`${this.KEYS.TODAY_GOALS}_${userId}`, data, this.DEFAULT_TTL);
  }

  /**
   * Clear all cache for a user
   */
  static async clearUserCache(userId: string): Promise<void> {
    try {
      const keys = [
        `${this.CACHE_PREFIX}${this.KEYS.PROGRESS_INSIGHTS}_${userId}`,
        `${this.CACHE_PREFIX}${this.KEYS.STUDY_DATES}_${userId}`,
        `${this.CACHE_PREFIX}${this.KEYS.RECENT_ACTIVITIES}_${userId}`,
        `${this.CACHE_PREFIX}${this.KEYS.TODAY_GOALS}_${userId}`,
      ];
      
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }

  /**
   * Clear all progress cache
   */
  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(progressKeys);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * Check if cache is fresh (less than 1 minute old)
   */
  static async isCacheFresh(key: string): Promise<boolean> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return false;
      
      const cacheEntry: CacheEntry<any> = JSON.parse(cached);
      const now = Date.now();
      const age = now - cacheEntry.timestamp;
      
      // Consider cache fresh if less than 1 minute old
      return age < 60 * 1000;
    } catch (error) {
      console.error('Error checking cache freshness:', error);
      return false;
    }
  }
}

export default ProgressCacheService;
