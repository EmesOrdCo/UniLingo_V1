/**
 * Redis-backed User Tracking Service
 * Replaces in-memory user tracking for horizontal scaling
 * 
 * Features:
 * - Shared state across all instances via Redis
 * - Automatic cleanup of old data
 * - User activity tracking with timestamps
 * - Rate limiting data storage
 * - Performance metrics collection
 */

const { redis } = require('./redisConnection');

class UserTrackingService {
  constructor() {
    this.redis = redis;
    this.defaultTTL = 7 * 24 * 60 * 60; // 7 days in seconds
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Start cleanup process
    this.startCleanupProcess();
  }

  /**
   * Track user activity
   * @param {string} userId - User ID
   * @param {string} endpoint - API endpoint accessed
   * @param {string} ip - User IP address
   * @param {object} metadata - Additional tracking data
   */
  async trackUserActivity(userId, endpoint, ip, metadata = {}) {
    try {
      const timestamp = Date.now();
      const userKey = `user_tracking:${userId}`;
      const sessionKey = `user_session:${userId}:${timestamp}`;
      
      // Store user activity data
      const activityData = {
        userId,
        endpoint,
        ip,
        timestamp,
        metadata,
        lastSeen: timestamp,
        sessionRequestCount: 1,
        peakUsageHour: 0
      };

      // Store in Redis with TTL
      await this.redis.hset(userKey, {
        lastSeen: timestamp,
        lastEndpoint: endpoint,
        lastIP: ip,
        sessionRequestCount: 1,
        peakUsageHour: 0,
        totalRequests: 1,
        ...metadata
      });
      
      await this.redis.expire(userKey, this.defaultTTL);
      
      // Store session data
      await this.redis.setex(sessionKey, 60 * 60, JSON.stringify(activityData)); // 1 hour TTL
      
      // Increment session counter
      await this.incrementSessionCount(userId);
      
      return activityData;
    } catch (error) {
      console.error('Error tracking user activity:', error);
      return null;
    }
  }

  /**
   * Increment session request count for user
   * @param {string} userId - User ID
   */
  async incrementSessionCount(userId) {
    try {
      const userKey = `user_tracking:${userId}`;
      const currentCount = await this.redis.hincrby(userKey, 'sessionRequestCount', 1);
      const totalRequests = await this.redis.hincrby(userKey, 'totalRequests', 1);
      
      // Update peak usage
      const peakUsage = await this.redis.hget(userKey, 'peakUsageHour');
      if (currentCount > (parseInt(peakUsage) || 0)) {
        await this.redis.hset(userKey, 'peakUsageHour', currentCount);
      }
      
      return currentCount;
    } catch (error) {
      console.error('Error incrementing session count:', error);
      return 0;
    }
  }

  /**
   * Get user tracking data
   * @param {string} userId - User ID
   * @returns {object|null} User tracking data
   */
  async getUserData(userId) {
    try {
      const userKey = `user_tracking:${userId}`;
      const data = await this.redis.hgetall(userKey);
      
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      // Convert string values to appropriate types
      return {
        userId,
        lastSeen: parseInt(data.lastSeen) || 0,
        lastEndpoint: data.lastEndpoint || 'unknown',
        lastIP: data.lastIP || 'unknown',
        sessionRequestCount: parseInt(data.sessionRequestCount) || 0,
        peakUsageHour: parseInt(data.peakUsageHour) || 0,
        totalRequests: parseInt(data.totalRequests) || 0,
        status: data.status || 'active',
        ...data
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Update user data
   * @param {string} userId - User ID
   * @param {object} updates - Data to update
   */
  async updateUserData(userId, updates) {
    try {
      const userKey = `user_tracking:${userId}`;
      
      // Update fields
      const fields = {};
      Object.keys(updates).forEach(key => {
        fields[key] = updates[key];
      });
      
      await this.redis.hset(userKey, fields);
      await this.redis.expire(userKey, this.defaultTTL);
      
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  }

  /**
   * Get all active users
   * @param {number} limit - Maximum number of users to return
   * @returns {Array} Array of user data
   */
  async getAllActiveUsers(limit = 1000) {
    try {
      const pattern = 'user_tracking:*';
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return [];
      }

      // Get data for all keys
      const pipeline = this.redis.pipeline();
      keys.forEach(key => {
        pipeline.hgetall(key);
      });
      
      const results = await pipeline.exec();
      const users = [];
      
      results.forEach(([err, data], index) => {
        if (!err && data && Object.keys(data).length > 0) {
          const userId = keys[index].replace('user_tracking:', '');
          users.push({
            userId,
            lastSeen: parseInt(data.lastSeen) || 0,
            lastEndpoint: data.lastEndpoint || 'unknown',
            lastIP: data.lastIP || 'unknown',
            sessionRequestCount: parseInt(data.sessionRequestCount) || 0,
            peakUsageHour: parseInt(data.peakUsageHour) || 0,
            totalRequests: parseInt(data.totalRequests) || 0,
            status: data.status || 'active',
            ...data
          });
        }
      });

      // Sort by last seen (most recent first) and limit
      return users
        .sort((a, b) => b.lastSeen - a.lastSeen)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting all active users:', error);
      return [];
    }
  }

  /**
   * Clean up old user data
   */
  async cleanupOldData() {
    try {
      const now = Date.now();
      const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours
      const deleteThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      const users = await this.getAllActiveUsers();
      let cleanedCount = 0;
      let deletedCount = 0;
      
      for (const user of users) {
        const timeSinceLastSeen = now - user.lastSeen;
        
        if (timeSinceLastSeen > deleteThreshold) {
          // Delete completely old users
          await this.redis.del(`user_tracking:${user.userId}`);
          deletedCount++;
        } else if (timeSinceLastSeen > inactiveThreshold) {
          // Mark as inactive but keep for a while
          await this.updateUserData(user.userId, { status: 'inactive' });
          cleanedCount++;
        }
        
        // Reset hourly counters if needed
        if (user.peakUsageHour > 0 && now % (60 * 60 * 1000) < 1000) {
          await this.updateUserData(user.userId, {
            peakUsageHour: Math.max(user.peakUsageHour, user.sessionRequestCount),
            sessionRequestCount: 0
          });
        }
      }
      
      console.log(`🧹 User tracking cleanup: ${cleanedCount} marked inactive, ${deletedCount} deleted`);
      return { cleaned: cleanedCount, deleted: deletedCount };
    } catch (error) {
      console.error('Error cleaning up old user data:', error);
      return { cleaned: 0, deleted: 0 };
    }
  }

  /**
   * Start cleanup process
   */
  startCleanupProcess() {
    // Run cleanup every hour
    setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        console.error('Error in cleanup process:', error);
      }
    }, this.cleanupInterval);
    
    console.log('🧹 User tracking cleanup process started');
  }

  /**
   * Get tracking statistics
   */
  async getStats() {
    try {
      const users = await this.getAllActiveUsers();
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.lastSeen > oneDayAgo).length,
        recentUsers: users.filter(u => u.lastSeen > oneHourAgo).length,
        inactiveUsers: users.filter(u => u.status === 'inactive').length,
        totalRequests: users.reduce((sum, u) => sum + (u.totalRequests || 0), 0),
        averageRequestsPerUser: users.length > 0 ? 
          users.reduce((sum, u) => sum + (u.totalRequests || 0), 0) / users.length : 0
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting tracking stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        recentUsers: 0,
        inactiveUsers: 0,
        totalRequests: 0,
        averageRequestsPerUser: 0
      };
    }
  }

  /**
   * Reset user data (admin function)
   * @param {string} userId - User ID to reset
   */
  async resetUser(userId) {
    try {
      await this.redis.del(`user_tracking:${userId}`);
      console.log(`🔄 User tracking reset for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error resetting user:', error);
      return false;
    }
  }
}

// Export singleton instance
const userTrackingService = new UserTrackingService();

module.exports = userTrackingService;
